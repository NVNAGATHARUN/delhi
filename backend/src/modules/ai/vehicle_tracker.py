"""
Vehicle Tracker — YOLOv8 + BoT-SORT tracking + counting line + lane ROI
========================================================================
Professional traffic counting that assigns a UNIQUE ID to each vehicle.
Vehicles are counted ONLY when their centroid crosses the counting line,
preventing double-counting across frames.
"""
import cv2
import numpy as np
import base64
import logging
import time

logger = logging.getLogger(__name__)

# COCO vehicle classes
VEHICLE_CLASSES = {2: "car", 3: "motorcycle", 5: "bus", 7: "truck"}
CLASS_COLORS    = {
    2:  (59, 130, 246),   # car  — blue
    3:  (168, 85, 247),   # motorcycle — purple
    5:  (245, 158, 11),   # bus  — amber
    7:  (239, 68, 68),    # truck — red
}
AMBULANCE_COLOR = (16, 185, 129)
LINE_COLOR      = (0, 0, 255)        # counting line — red
CROSSED_COLOR   = (16, 185, 129)     # after crossing — green


def _assign_lane(cx, w):
    """Assign a detection to a lane based on its X position in the frame."""
    rel_x = cx / w
    if rel_x < 0.25:
        return "west"
    elif rel_x < 0.5:
        return "north"
    elif rel_x < 0.75:
        return "south"
    else:
        return "east"


class VehicleTracker:
    """
    Wraps YOLOv8 model.track() for persistent multi-object tracking.
    Maintains a set of counted IDs so no vehicle is counted twice.
    """

    def __init__(self, model, conf=0.35, line_ratio=0.6):
        """
        Args:
            model: A loaded ultralytics YOLO model instance.
            conf:  Minimum confidence threshold for detections.
            line_ratio: Y-position of counting line as a fraction of frame height (0-1).
        """
        self.model = model
        self.conf = conf
        self.line_ratio = line_ratio

        # Persistent state across frames
        self.counted_ids: set[int] = set()
        self.lane_counts = {"north": 0, "south": 0, "east": 0, "west": 0}
        self.tracked_vehicles: list[dict] = []   # list of all unique vehicles
        self.ambulance = {"detected": False, "lane": None, "confidence": 0.0}

    def reset(self):
        """Reset all counters for a new video."""
        self.counted_ids.clear()
        self.lane_counts = {"north": 0, "south": 0, "east": 0, "west": 0}
        self.tracked_vehicles.clear()
        self.ambulance = {"detected": False, "lane": None, "confidence": 0.0}

    def process_frame(self, frame, frame_idx=0):
        """
        Process a single frame with tracking.
        Returns the annotated frame (numpy array).
        """
        h, w = frame.shape[:2]
        line_y = int(h * self.line_ratio)

        # ── Run YOLOv8 tracking ───────────────────────────────────────────
        results = self.model.track(frame, persist=True, verbose=False, conf=self.conf)

        overlay = frame.copy()

        # Draw counting line
        cv2.line(overlay, (0, line_y), (w, line_y), LINE_COLOR, 2)
        cv2.putText(overlay, "COUNTING LINE", (10, line_y - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, LINE_COLOR, 1)

        # Draw lane dividers (subtle)
        for frac in [0.25, 0.5, 0.75]:
            x = int(w * frac)
            cv2.line(overlay, (x, 0), (x, h), (40, 40, 60), 1)

        lane_labels = [("WEST", 0.125), ("NORTH", 0.375), ("SOUTH", 0.625), ("EAST", 0.875)]
        for label, frac in lane_labels:
            cv2.putText(overlay, label, (int(w * frac) - 15, 18),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (100, 100, 150), 1)

        for result in results:
            if result.boxes is None or result.boxes.id is None:
                continue

            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf_val = float(box.conf[0])

                if cls_id not in VEHICLE_CLASSES:
                    continue

                # Track ID
                track_id = int(box.id[0]) if box.id is not None else -1
                if track_id < 0:
                    continue

                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                lane = _assign_lane(cx, w)

                is_ambulance = (cls_id == 5 and conf_val > 0.6)

                # ── Counting line logic ───────────────────────────────
                crossed = False
                if track_id not in self.counted_ids and cy >= line_y:
                    self.counted_ids.add(track_id)
                    crossed = True

                    if is_ambulance:
                        self.ambulance = {
                            "detected": True,
                            "lane": lane,
                            "confidence": round(conf_val, 3),
                        }
                    else:
                        self.lane_counts[lane] += 1
                        self.tracked_vehicles.append({
                            "id": track_id,
                            "class": VEHICLE_CLASSES[cls_id],
                            "lane": lane,
                            "confidence": round(conf_val, 3),
                            "frame": frame_idx,
                        })

                # ── Draw bounding box + ID ────────────────────────────
                already_counted = track_id in self.counted_ids
                box_color = CROSSED_COLOR if already_counted else CLASS_COLORS.get(cls_id, (100, 100, 100))
                if is_ambulance:
                    box_color = AMBULANCE_COLOR
                lbl = VEHICLE_CLASSES.get(cls_id, "?")
                tag = f"ID:{track_id} {lbl} {conf_val:.2f}"

                cv2.rectangle(overlay, (x1, y1), (x2, y2), box_color, 2)
                (tw, th), _ = cv2.getTextSize(tag, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1)
                cv2.rectangle(overlay, (x1, y1 - th - 6), (x1 + tw + 4, y1), box_color, -1)
                cv2.putText(overlay, tag, (x1 + 2, y1 - 4),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1)

                # Centroid dot
                cv2.circle(overlay, (cx, cy), 4, box_color, -1)

                # Flash effect when crossing counting line
                if crossed:
                    cv2.circle(overlay, (cx, cy), 18, (0, 255, 0), 2)

        # Blend overlay
        cv2.addWeighted(overlay, 0.85, frame, 0.15, 0, frame)

        # Stats HUD top-left
        total = sum(self.lane_counts.values())
        lines = [f"Unique Vehicles: {total}"]
        lines += [f"  {k.upper()}: {v}" for k, v in self.lane_counts.items()]
        if self.ambulance["detected"]:
            lines.append(f"  AMBULANCE: {self.ambulance['lane']}")

        for i, line in enumerate(lines):
            c = AMBULANCE_COLOR if "AMBULANCE" in line else (220, 230, 255)
            cv2.putText(frame, line, (10, 22 + i * 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, c, 2)

        return frame

    def get_summary(self):
        """Return the cumulative tracking summary."""
        return {
            "lanes": dict(self.lane_counts),
            "total": sum(self.lane_counts.values()),
            "unique_ids": len(self.counted_ids),
            "ambulance": dict(self.ambulance),
            "tracked_vehicles": list(self.tracked_vehicles),
        }


def process_video(model, video_bytes: bytes, conf=0.35, line_ratio=0.6,
                  max_frames=300, sample_every=1):
    """
    Process a video file with tracking and counting line.
    Returns: (annotated_last_frame_b64, summary_dict, stats_dict)
    """
    arr = np.frombuffer(video_bytes, np.uint8)

    # Write to a temp file because cv2.VideoCapture needs a path or buffer
    import tempfile, os
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    tmp.write(video_bytes)
    tmp.close()

    cap = cv2.VideoCapture(tmp.name)
    if not cap.isOpened():
        os.unlink(tmp.name)
        raise ValueError("Could not open video file")

    fps_src = cap.get(cv2.CAP_PROP_FPS) or 30
    total_frames_in_video = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    tracker = VehicleTracker(model, conf=conf, line_ratio=line_ratio)
    tracker.reset()

    t0 = time.time()
    frame_idx = 0
    processed = 0
    last_frame = None

    while cap.isOpened() and processed < max_frames:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % sample_every == 0:
            last_frame = tracker.process_frame(frame, frame_idx)
            processed += 1

        frame_idx += 1

    cap.release()
    os.unlink(tmp.name)
    elapsed = time.time() - t0

    # Encode final annotated frame
    img_b64 = ""
    if last_frame is not None:
        _, buf = cv2.imencode(".jpg", last_frame, [cv2.IMWRITE_JPEG_QUALITY, 88])
        img_b64 = base64.b64encode(buf).decode()

    summary = tracker.get_summary()
    stats = {
        "frames_total": total_frames_in_video,
        "frames_processed": processed,
        "sample_every": sample_every,
        "source_fps": round(fps_src, 1),
        "processing_fps": round(processed / elapsed, 1) if elapsed > 0 else 0,
        "elapsed_seconds": round(elapsed, 2),
    }

    return img_b64, summary, stats
