"""
Live Camera Detection Service
==============================
Captures frames from a webcam or RTSP/IP camera, runs YOLOv8 detection,
and feeds vehicle counts into the traffic simulation engine in real-time.

Provides:
- MJPEG stream of annotated frames at /camera/feed
- Start/stop controls at /camera/start and /camera/stop
- Automatic injection of detected counts into intersection state
- Snapshot API at /camera/snapshot with per-type breakdown
"""

import cv2
import time
import threading
import logging
import random
import base64
import numpy as np

logger = logging.getLogger(__name__)

# COCO vehicle classes (extended with person=0 for cyclist detection)
VEHICLE_CLASSES = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}
# Ambulance proxy: treat bus (5) with high conf as ambulance
AMBULANCE_CLASS_ID = 5
AMBULANCE_CONF_THRESHOLD = 0.65

CLASS_COLORS = {
    2: (59, 130, 246),    # car    — blue
    3: (168, 85, 247),    # moto   — purple
    5: (245, 158, 11),    # bus    — amber
    7: (239, 68, 68),     # truck  — red
}
AMBULANCE_COLOR = (16, 185, 129)  # green

LANE_NAMES = ["west", "north", "south", "east"]


def _assign_lane(cx: int, w: int) -> str:
    """Assign detection to one of 4 vertical lane strips based on X position."""
    rel_x = cx / w
    if rel_x < 0.25:
        return "west"
    elif rel_x < 0.5:
        return "north"
    elif rel_x < 0.75:
        return "south"
    else:
        return "east"


def _draw_lane_grid(overlay, w, h):
    """Draw vertical lane boundary lines and labels on the frame."""
    for frac, lbl in [(0.25, "W|N"), (0.5, "N|S"), (0.75, "S|E")]:
        lx = int(w * frac)
        cv2.line(overlay, (lx, 0), (lx, h), (80, 80, 120), 1)
        cv2.putText(overlay, lbl, (lx - 18, 14),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.38, (120, 120, 170), 1)

    for lbl, frac in [("WEST", 0.125), ("NORTH", 0.375), ("SOUTH", 0.625), ("EAST", 0.875)]:
        cv2.putText(overlay, lbl, (int(w * frac) - 18, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (160, 160, 210), 1)


def _draw_hud(frame, fps, frame_count, lane_counts, ambulance, mode):
    """Draw bottom HUD with stats on frame."""
    h, w = frame.shape[:2]
    total = sum(lane_counts.values())

    # Semi-transparent bottom bar
    bar_h = 56
    bar = frame[h - bar_h:, :].copy()
    cv2.rectangle(bar, (0, 0), (w, bar_h), (10, 10, 20), -1)
    cv2.addWeighted(bar, 0.75, frame[h - bar_h:, :], 0.25, 0, frame[h - bar_h:, :])

    mode_label = "YOLOv8 LIVE" if mode == "yolov8" else "SIMULATED"
    mode_color = (16, 185, 129) if mode == "yolov8" else (100, 200, 255)

    cv2.putText(frame, f"● {mode_label}  |  {fps} FPS  |  Frame #{frame_count}",
                (10, h - 38), cv2.FONT_HERSHEY_SIMPLEX, 0.45, mode_color, 1)
    cv2.putText(frame, f"Total: {total} vehicles   W:{lane_counts['west']}  N:{lane_counts['north']}  S:{lane_counts['south']}  E:{lane_counts['east']}",
                (10, h - 16), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 230, 255), 1)

    if ambulance["detected"]:
        cv2.putText(frame, f"🚑 AMBULANCE → {ambulance['lane'].upper()}",
                    (w - 260, h - 38), cv2.FONT_HERSHEY_SIMPLEX, 0.5, AMBULANCE_COLOR, 2)


class CameraService:
    """Thread-based live camera capture + YOLOv8 detection."""

    def __init__(self):
        self.running = False
        self.source = 0
        self.model = None
        self.confidence = 0.25
        self.cap = None
        self.last_error = None
        self.mode = "simulated"

        # Threading
        self.reader_thread = None
        self.processor_thread = None
        self._lock = threading.Lock()

        # Buffers
        self.raw_frame: np.ndarray | None = None
        self.latest_frame: bytes | None = None

        # Statistics
        self.fps = 0.0
        self.frame_count = 0
        self.latency_ms = 0.0

        # Latest detection results
        self.latest_counts = {l: 0 for l in LANE_NAMES}
        self.latest_total = 0
        self.latest_ambulance = {"detected": False, "lane": None, "confidence": 0.0}
        self.latest_detections: list[dict] = []
        self.latest_by_type: dict[str, int] = {v: 0 for v in VEHICLE_CLASSES.values()}

        # Callback to inject counts into simulation engine
        self._on_detection = None

    def set_detection_callback(self, callback):
        self._on_detection = callback

    def start(self, source=0, model=None, confidence=0.25):
        if self.running:
            return {"status": "already_running"}

        self.source = source
        self.model = model
        self.confidence = max(0.1, min(confidence, 0.9))
        self.mode = "yolov8" if model is not None else "simulated"
        self.running = True
        self.frame_count = 0
        self.last_error = None
        self.raw_frame = None
        self.latest_frame = None
        self.latest_counts = {l: 0 for l in LANE_NAMES}
        self.latest_total = 0
        self.latest_detections = []
        self.latest_by_type = {v: 0 for v in VEHICLE_CLASSES.values()}

        # Start capture thread
        self.reader_thread = threading.Thread(target=self._reader_loop, daemon=True)
        self.reader_thread.start()

        # Start processing thread
        self.processor_thread = threading.Thread(target=self._processor_loop, daemon=True)
        self.processor_thread.start()

        logger.info(f"📷 Camera system started: source={source}, mode={self.mode}")
        return {"status": "started", "source": str(source), "mode": self.mode}

    def stop(self):
        self.running = False
        if self.cap and self.cap.isOpened():
            self.cap.release()
        self.cap = None
        self.latest_frame = None
        self.last_error = None
        logger.info("📷 Camera system stopped")
        return {"status": "stopped"}

    def _reader_loop(self):
        """Thread 1: Constant capture from source at full FPS."""
        try:
            is_file = isinstance(self.source, str)
            if not is_file:
                import platform
                backend = cv2.CAP_DSHOW if platform.system() == "Windows" else cv2.CAP_ANY
                self.cap = cv2.VideoCapture(self.source, backend)
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            else:
                self.cap = cv2.VideoCapture(self.source)

            if not self.cap.isOpened():
                self.last_error = f"Failed to open source: {self.source}"
                self.running = False
                return

            src_fps = self.cap.get(cv2.CAP_PROP_FPS) or 30
            file_interval = 1.0 / src_fps if is_file else 0

            while self.running:
                ret, frame = self.cap.read()
                if not ret:
                    if is_file:
                        self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        continue
                    else:
                        time.sleep(0.1)
                        continue

                with self._lock:
                    self.raw_frame = frame

                if is_file:
                    time.sleep(file_interval)
                else:
                    time.sleep(0.001)  # Minimal yield

        except Exception as e:
            logger.error(f"Reader error: {e}")
            self.last_error = str(e)
            self.running = False

    def _processor_loop(self):
        """Thread 2: Process the LATEST available raw_frame at max CPU capacity."""
        last_time = time.time()
        while self.running:
            frame = None
            with self._lock:
                if self.raw_frame is not None:
                    frame = self.raw_frame.copy()

            if frame is None:
                time.sleep(0.01)
                continue

            start_proc = time.time()
            self.frame_count += 1

            # Run detection
            annotated, counts, ambulance, detections, by_type = self._detect_frame(frame)

            # Store results
            self.latest_counts = counts
            self.latest_total = sum(counts.values())
            self.latest_ambulance = ambulance
            self.latest_detections = detections
            
            # Ensure all standard types exist in by_type
            full_by_type = {v: 0 for v in VEHICLE_CLASSES.values()}
            full_by_type.update(by_type)
            self.latest_by_type = full_by_type

            # Metrics
            now = time.time()
            self.latency_ms = round((now - start_proc) * 1000, 1)
            dt = now - last_time
            self.fps = round(1.0 / dt, 1) if dt > 0 else 0.0
            last_time = now

            # MJPEG Encode
            _, buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
            self.latest_frame = buf.tobytes()

            # Callback
            if self._on_detection:
                try:
                    self._on_detection(counts, ambulance)
                except Exception as cb_err:
                    logger.error(f"Callback error: {cb_err}")

            # If simulation mode, artificial sleep to simulate "real-time" processing
            if self.mode == "simulated":
                time.sleep(0.1)

    def _detect_frame(self, frame):
        """Run YOLOv8 on a single frame and return annotated frame + counts."""
        h, w = frame.shape[:2]
        lane_counts = {l: 0 for l in LANE_NAMES}
        ambulance = {"detected": False, "lane": None, "confidence": 0.0}
        detections = []
        by_type: dict[str, int] = {}

        overlay = frame.copy()
        _draw_lane_grid(overlay, w, h)

        if self.model is not None:
            results = self.model(frame, verbose=False, conf=self.confidence)
            for result in results:
                for box in result.boxes:
                    cls_id = int(box.cls[0])
                    conf_val = float(box.conf[0])

                    if cls_id not in VEHICLE_CLASSES:
                        continue

                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    cx = (x1 + x2) // 2
                    cy = (y1 + y2) // 2
                    lane = _assign_lane(cx, w)
                    veh_name = VEHICLE_CLASSES[cls_id]

                    is_ambulance = (cls_id == AMBULANCE_CLASS_ID and conf_val > AMBULANCE_CONF_THRESHOLD)

                    if is_ambulance:
                        color = AMBULANCE_COLOR
                        label = "🚑 AMBULANCE"
                        if not ambulance["detected"] or conf_val > ambulance["confidence"]:
                            ambulance = {"detected": True, "lane": lane, "confidence": round(conf_val, 3)}
                    else:
                        color = CLASS_COLORS.get(cls_id, (120, 120, 120))
                        label = veh_name.upper()
                        lane_counts[lane] += 1
                        by_type[veh_name] = by_type.get(veh_name, 0) + 1
                        detections.append({
                            "class": veh_name,
                            "conf": round(conf_val, 3),
                            "lane": lane,
                            "bbox": [x1, y1, x2, y2],
                        })

                    # Draw bounding box
                    cv2.rectangle(overlay, (x1, y1), (x2, y2), color, 2)
                    label_text = f"{label} {conf_val:.0%}"
                    (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                    cv2.rectangle(overlay, (x1, y1 - th - 8), (x1 + tw + 6, y1), color, -1)
                    cv2.putText(overlay, label_text, (x1 + 3, y1 - 4),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
                    cv2.circle(overlay, (cx, cy), 4, color, -1)
        else:
            # Synthetic mode
            for veh in ["car", "car", "car", "motorcycle", "truck", "bus"]:
                for l in LANE_NAMES:
                    if random.random() < 0.2:
                        lane_counts[l] += 1
                        by_type[veh] = by_type.get(veh, 0) + 1
                        detections.append({"class": veh, "conf": 0.9, "lane": l, "bbox": []})

            cv2.rectangle(overlay, (0, 0), (w, 36), (10, 30, 60), -1)
            cv2.putText(overlay, "⚠ SIMULATED DETECTION", (10, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 200, 255), 1)

        cv2.addWeighted(overlay, 0.85, frame, 0.15, 0, frame)
        _draw_hud(frame, self.fps, self.frame_count, lane_counts, ambulance, self.mode)
        return frame, lane_counts, ambulance, detections, by_type

    def get_status(self):
        """Return current camera status including per-type vehicle breakdown."""
        return {
            "running": self.running,
            "source": str(self.source),
            "mode": self.mode,
            "fps": self.fps,
            "latency_ms": self.latency_ms,
            "frame_count": self.frame_count,
            "latest_counts": self.latest_counts,
            "total": self.latest_total,
            "by_type": self.latest_by_type,
            "ambulance": self.latest_ambulance,
            "detections": self.latest_detections[:20],
            "error": self.last_error,
        }

    def get_snapshot_b64(self) -> str | None:
        """Return latest annotated frame as base64-encoded JPEG string."""
        if self.latest_frame is None:
            return None
        return base64.b64encode(self.latest_frame).decode()


# Singleton instance
camera_service = CameraService()
