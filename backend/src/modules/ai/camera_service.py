"""
Live Camera Detection Service
==============================
Captures frames from a webcam or RTSP/IP camera, runs YOLOv8 detection,
and feeds vehicle counts into the traffic simulation engine in real-time.

Provides:
- MJPEG stream of annotated frames at /camera/feed
- Start/stop controls at /camera/start and /camera/stop
- Automatic injection of detected counts into intersection state
"""

import cv2
import time
import threading
import logging
import random
import base64
import numpy as np

logger = logging.getLogger(__name__)

# COCO vehicle classes
VEHICLE_CLASSES = {2: "car", 3: "motorcycle", 5: "bus", 7: "truck"}
CLASS_COLORS = {2: (59, 130, 246), 3: (168, 85, 247), 5: (245, 158, 11), 7: (239, 68, 68)}
AMBULANCE_COLOR = (16, 185, 129)


def _assign_lane(cx, cy, w, h):
    """Assign detection to one of 4 quadrant lanes."""
    rel_x, rel_y = cx / w, cy / h
    if rel_y < 0.5:
        return "north" if rel_x < 0.5 else "east"
    else:
        return "south" if rel_x < 0.5 else "west"


class CameraService:
    """Thread-based live camera capture + YOLOv8 detection."""

    def __init__(self):
        self.running = False
        self.source = 0  # default webcam
        self.model = None
        self.confidence = 0.35
        self.cap = None
        self.thread = None
        self.last_error = None

        # Latest detection results (thread-safe via GIL for reads)
        self.latest_frame = None  # JPEG bytes
        self.latest_frame_raw = None  # numpy array
        self.latest_counts = {"north": 0, "south": 0, "east": 0, "west": 0}
        self.latest_total = 0
        self.latest_ambulance = {"detected": False, "lane": None, "confidence": 0.0}
        self.latest_detections = []
        self.fps = 0.0
        self.frame_count = 0

        # Callback to inject counts into the simulation engine
        self._on_detection = None

    def set_detection_callback(self, callback):
        """Set a function that receives (lane_counts, ambulance) each frame."""
        self._on_detection = callback

    def start(self, source=0, model=None, confidence=0.35):
        """Start camera capture in a background thread."""
        if self.running:
            return {"status": "already_running"}

        self.source = source
        self.model = model
        self.confidence = confidence
        self.running = True
        self.frame_count = 0
        self.last_error = None

        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        logger.info(f"📷 Camera started: source={source}")
        return {"status": "started", "source": str(source)}

    def stop(self):
        """Stop camera capture."""
        self.running = False
        if self.cap and self.cap.isOpened():
            self.cap.release()
        self.cap = None
        self.latest_frame = None
        self.last_error = None
        logger.info("📷 Camera stopped")
        return {"status": "stopped"}

    def _capture_loop(self):
        """Main capture loop running in a background thread."""
        try:
            self.cap = cv2.VideoCapture(self.source)
            if not self.cap.isOpened():
                err = f"Failed to open source: {self.source}"
                logger.error(f"📷 {err}")
                self.last_error = err
                self.running = False
                return
            
            # Try once with DSHOW if on Windows and first attempt fails
            if not self.cap.isOpened() and isinstance(self.source, int):
                import platform
                if platform.system() == "Windows":
                    self.cap = cv2.VideoCapture(self.source + cv2.CAP_DSHOW)

            if not self.cap.isOpened():
                err = f"Camera source {self.source} not accessible."
                self.last_error = err
                self.running = False
                return

            logger.info(f"📷 Camera opened: {int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))}x{int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))}")

            last_time = time.time()
            frame_skip = 0

            while self.running:
                ret, frame = self.cap.read()
                if not ret:
                    logger.warning("Camera frame read failed, retrying...")
                    time.sleep(0.1)
                    continue

                frame_skip += 1
                # Process every 3rd frame for performance
                if frame_skip % 3 != 0:
                    continue

                self.frame_count += 1
                now = time.time()
                dt = now - last_time
                if dt > 0:
                    self.fps = round(1.0 / dt, 1)
                last_time = now

                # Run detection
                annotated, counts, ambulance, detections = self._detect_frame(frame)

                # Store results
                self.latest_counts = counts
                self.latest_total = sum(counts.values())
                self.latest_ambulance = ambulance
                self.latest_detections = detections
                self.latest_frame_raw = annotated

                # Encode to JPEG
                _, buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 70])
                self.latest_frame = buf.tobytes()

                # Fire callback to inject into simulation
                if self._on_detection:
                    try:
                        self._on_detection(counts, ambulance)
                    except Exception as e:
                        logger.error(f"Detection callback error: {e}")

        except Exception as e:
            logger.error(f"Camera capture error: {e}")
        finally:
            if self.cap and self.cap.isOpened():
                self.cap.release()
            self.running = False
            logger.info("📷 Camera capture loop ended")

    def _detect_frame(self, frame):
        """Run YOLOv8 on a single frame and return annotated frame + counts."""
        h, w = frame.shape[:2]
        lane_counts = {"north": 0, "south": 0, "east": 0, "west": 0}
        ambulance = {"detected": False, "lane": None, "confidence": 0.0}
        detections = []

        overlay = frame.copy()

        # Draw quadrant grid
        cv2.line(overlay, (w // 2, 0), (w // 2, h), (60, 60, 80), 1)
        cv2.line(overlay, (0, h // 2), (w, h // 2), (60, 60, 80), 1)
        for label, pos in [("N", (w // 4, 20)), ("E", (3 * w // 4, 20)),
                           ("S", (w // 4, h - 8)), ("W", (3 * w // 4, h - 8))]:
            cv2.putText(overlay, label, pos, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 200), 1)

        if self.model is not None:
            results = self.model(frame, verbose=False, conf=self.confidence)
            for result in results:
                for box in result.boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                    lane = _assign_lane(cx, cy, w, h)

                    is_ambulance = (cls_id == 5 and conf > 0.6)

                    if cls_id in VEHICLE_CLASSES or is_ambulance:
                        color = AMBULANCE_COLOR if is_ambulance else CLASS_COLORS.get(cls_id, (100, 100, 100))
                        label = "AMBULANCE" if is_ambulance else VEHICLE_CLASSES.get(cls_id, "vehicle")

                        cv2.rectangle(overlay, (x1, y1), (x2, y2), color, 2)
                        cv2.putText(overlay, f"{label} {conf:.2f}", (x1, y1 - 4),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
                        cv2.circle(overlay, (cx, cy), 3, color, -1)

                        if is_ambulance:
                            if not ambulance["detected"] or conf > ambulance["confidence"]:
                                ambulance = {"detected": True, "lane": lane, "confidence": round(conf, 3)}
                        else:
                            lane_counts[lane] += 1
                            detections.append({
                                "class": VEHICLE_CLASSES[cls_id], "conf": round(conf, 3), "lane": lane
                            })
        else:
            # Synthetic fallback when YOLO unavailable
            for lane in lane_counts:
                lane_counts[lane] = random.randint(2, 15)
            cv2.putText(overlay, "SIMULATED DETECTION", (10, 25),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 200, 255), 2)

        # Draw HUD overlay
        total = sum(lane_counts.values())
        hud_lines = [f"LIVE | {self.fps} FPS | Frame #{self.frame_count}",
                     f"Total: {total} vehicles"]
        for i, line in enumerate(hud_lines):
            cv2.putText(overlay, line, (10, h - 30 + i * 18),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 230, 255), 1)

        if ambulance["detected"]:
            cv2.putText(overlay, f"AMBULANCE: {ambulance['lane'].upper()}", (10, h - 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (16, 185, 129), 2)

        cv2.addWeighted(overlay, 0.85, frame, 0.15, 0, frame)
        return frame, lane_counts, ambulance, detections

    def get_status(self):
        """Return current camera status."""
        return {
            "running": self.running,
            "source": str(self.source),
            "fps": self.fps,
            "frame_count": self.frame_count,
            "latest_counts": self.latest_counts,
            "total": self.latest_total,
            "ambulance": self.latest_ambulance,
            "error": self.last_error,
        }


# Singleton instance
camera_service = CameraService()
