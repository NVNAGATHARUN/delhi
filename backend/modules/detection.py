import base64
import os
import random
import threading
import cv2
import numpy as np

# YOLOv8 setup
try:
    from ultralytics import YOLO
    _model = YOLO("yolov8n.pt")
    _yolo_available = True
    print("[Detection] YOLOv8 loaded successfully.")
except Exception as e:
    print(f"[Detection] YOLOv8 not available ({e}). Using simulation mode.")
    _yolo_available = False
    _model = None

VEHICLE_CLASSES = {"car", "motorcycle", "bus", "truck"}
EMERGENCY_CLASSES = {"ambulance", "fire truck"}

# Global state for live camera
_camera_counts = {
    "vehicle_count": 0,
    "lane_counts": [0, 0, 0],
    "emergency_detected": False,
    "source": "camera",
    "density": 0.0
}
_camera_lock = threading.Lock()


def get_latest_camera_stats() -> dict:
    with _camera_lock:
        return _camera_counts.copy()


def _estimate_lane(box_center_x: float, frame_width: int, total_lanes: int = 3) -> int:
    """Estimates lane based on x-coordinate (1-indexed)."""
    lane_width = frame_width / total_lanes
    lane_idx = int(box_center_x // lane_width)
    return min(max(lane_idx + 1, 1), total_lanes)


def process_image(img_bytes: bytes, total_lanes: int = 3) -> dict:
    """Runs YOLOv8 on a raw image file, returns annotated base64 image and counts."""
    # Decode image
    nparr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if not _yolo_available or frame is None:
        return _simulate_detection(total_lanes)

    height, width = frame.shape[:2]
    results = _model(frame, verbose=False)[0]

    vehicle_count = 0
    lane_counts = [0] * total_lanes
    emergency_detected = False
    vehicles = []

    for box in results.boxes:
        cls_name = results.names[int(box.cls)].lower()
        conf = float(box.conf)
        if conf < 0.4:
            continue
            
        is_vehicle = cls_name in VEHICLE_CLASSES
        is_emergency = cls_name in EMERGENCY_CLASSES
        
        if is_vehicle or is_emergency:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            center_x = (x1 + x2) / 2
            lane = _estimate_lane(center_x, width, total_lanes)
            
            if is_vehicle:
                vehicle_count += 1
                lane_counts[lane - 1] += 1
                color = (255, 170, 0) # BGR Neon Blue/Cyan
            
            if is_emergency:
                emergency_detected = True
                lane_counts[min(2, total_lanes - 1)] += 1 # force emergency into rightmost lane roughly
                color = (0, 0, 255) # Red
                
            vehicles.append({"type": cls_name, "lane": lane, "confidence": conf})
            
            # Draw Box
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f"{cls_name} {conf:.2f}", (x1, y1 - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    # Convert back to Base64
    _, buffer = cv2.imencode('.jpg', frame)
    b64_str = base64.b64encode(buffer).decode('utf-8')

    capacity = 30 * total_lanes
    density = round(min(vehicle_count / capacity, 1.0), 3)

    return {
        "vehicle_count": vehicle_count,
        "lane_counts": lane_counts,
        "vehicles": vehicles,
        "emergency_detected": emergency_detected,
        "density": density,
        "image_base64": f"data:image/jpeg;base64,{b64_str}",
        "source": "yolo-image"
    }


def process_video_frame(vid_path: str, total_lanes: int = 1) -> dict:
    """Extracts first valid frame from video and counts vehicles."""
    if not _yolo_available:
        return _simulate_detection(total_lanes)

    cap = cv2.VideoCapture(vid_path)
    ret, frame = cap.read()
    cap.release()

    if not ret or frame is None:
        return _simulate_detection(total_lanes)

    # Encode to bytes and reuse process_image (but we don't need the b64)
    _, buffer = cv2.imencode('.jpg', frame)
    result = process_image(buffer.tobytes(), total_lanes)
    
    # We only care about the total count logic for a single video usually (1 direction = 1 lane)
    return {
        "vehicle_count": result["vehicle_count"],
        "lane_counts": result["lane_counts"],
        "emergency_detected": result["emergency_detected"],
        "density": result["density"]
    }


def generate_camera_stream():
    """Generator for MJPEG routing. Runs YOLO on webcam frames."""
    global _camera_counts
    cap = cv2.VideoCapture(0) # Default webcam

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if _yolo_available:
            results = _model(frame, verbose=False)[0]
            height, width = frame.shape[:2]
            
            v_count = 0
            l_counts = [0, 0, 0]
            emerg = False

            for box in results.boxes:
                cls_name = results.names[int(box.cls)].lower()
                conf = float(box.conf)
                if conf > 0.4 and (cls_name in VEHICLE_CLASSES or cls_name in EMERGENCY_CLASSES):
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    center_x = (x1 + x2) / 2
                    lane = _estimate_lane(center_x, width, 3)
                    
                    if cls_name in EMERGENCY_CLASSES:
                        emerg = True
                        color = (0, 0, 255)
                    else:
                        v_count += 1
                        l_counts[lane - 1] += 1
                        color = (0, 255, 0)
                        
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame, cls_name, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            with _camera_lock:
                _camera_counts["vehicle_count"] = v_count
                _camera_counts["lane_counts"] = l_counts
                _camera_counts["emergency_detected"] = emerg
                _camera_counts["density"] = round(v_count / 90.0, 3)

        else:
            # Simulation overlay
            cv2.putText(frame, "SIMULATION MODE", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)

        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    cap.release()


def _simulate_detection(sim_data_or_lanes=3) -> dict:
    if isinstance(sim_data_or_lanes, dict):
        total_lanes = len(sim_data_or_lanes.get("lane_counts", [0, 0, 0]))
        count = sim_data_or_lanes.get("vehicle_count", 0)
        vehicles = sim_data_or_lanes.get("vehicles", [])
        l_counts = sim_data_or_lanes.get("lane_counts", [0, 0, 0])
        emerg = sim_data_or_lanes.get("emergency_detected", False)
        density = sim_data_or_lanes.get("density", 0.0)
    else:
        total_lanes = sim_data_or_lanes
        types = ["car", "bike", "bus", "truck"]
        weights = [0.5, 0.25, 0.15, 0.10]
        count = random.randint(5, 20)
        vehicles = [
            {"type": random.choices(types, weights=weights, k=1)[0],
             "lane": random.randint(1, total_lanes),
             "confidence": round(random.uniform(0.6, 0.95), 3)}
            for _ in range(count)
        ]
        l_counts = [0] * total_lanes
        for v in vehicles:
            l_counts[v["lane"] - 1] += 1
        capacity = 30 * total_lanes
        emerg = False
        density = round(count / capacity, 3)
    
    return {
        "vehicle_count": count,
        "lane_counts": l_counts,
        "vehicles": vehicles,
        "emergency_detected": emerg,
        "density": density,
        "source": "simulation",
        "image_base64": None
    }
