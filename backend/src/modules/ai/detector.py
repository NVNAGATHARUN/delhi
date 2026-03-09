import cv2
import json
import logging
from ultralytics import YOLO
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrafficDetector:
    def __init__(self, model_path='assets/ml_models/yolov8n.pt'):
        """
        Initialize the YOLOv8 detector with specific classes and lane ROIs.
        """
        try:
            self.model = YOLO(model_path)
            # COCO classes: 2: car, 3: motorcycle, 5: bus, 7: truck
            self.target_classes = {2: 'car', 3: 'motorcycle', 5: 'bus', 7: 'truck'}
            
            # Map lane names to polygon ROIs (normalized coordinates 0-1)
            # Example ROIs for a standard intersection view
            self.lane_rois = {
                "laneA": np.array([[0.1, 0.5], [0.4, 0.5], [0.4, 0.9], [0.1, 0.9]]),
                "laneB": np.array([[0.4, 0.5], [0.6, 0.5], [0.6, 0.9], [0.4, 0.9]]),
                "laneC": np.array([[0.6, 0.5], [0.9, 0.5], [0.9, 0.9], [0.6, 0.9]])
            }
            logger.info(f"YOLOv8 detector initialized with {len(self.lane_rois)} lanes.")
        except Exception as e:
            logger.error(f"Error initializing detector: {e}")
            raise

    def is_inside(self, point, polygon, frame_shape):
        """Check if a point is inside a polygon ROI."""
        h, w = frame_shape[:2]
        pixel_poly = (polygon * np.array([w, h])).astype(np.int32)
        return cv2.pointPolygonTest(pixel_poly, (int(point[0]), int(point[1])), False) >= 0

    def detect_and_count(self, frame):
        """
        Detect vehicles and return counts per lane and ambulance status.
        """
        results = self.model(frame, verbose=False)
        lane_counts = {lane: 0 for lane in self.lane_rois}
        
        # Track if ambulance is present and in which lane
        ambulance_data = {"detected": False, "lane": None}

        for result in results:
            boxes = result.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                # Centroid of the bounding box
                x1, y1, x2, y2 = box.xyxy[0]
                centroid = ((x1 + x2) / 2, (y1 + y2) / 2)

                # Heuristic: Treat specific class or metadata as ambulance
                # For this prototype, let's say class ID 0 (Person in COCO) 
                # or a specific custom ID is used for ambulance for demo.
                # In real YOLOv8 custom models, it would be a specific 'ambulance' index.
                is_ambulance = (cls_id == 0) # Mocking ambulance detection with class 0

                for lane, roi in self.lane_rois.items():
                    if self.is_inside(centroid, roi, frame.shape):
                        if is_ambulance:
                            ambulance_data = {"detected": True, "lane": lane}
                        else:
                            if cls_id in self.target_classes:
                                lane_counts[lane] += 1
                        break 
        
        return lane_counts, ambulance_data

    def get_json_output(self, lane_counts, ambulance_data):
        """Return the counts and ambulance status in structured JSON format."""
        return json.dumps({
            "counts": lane_counts,
            "emergency": ambulance_data
        }, indent=4)

if __name__ == "__main__":
    # Example usage / Standalone Test
    detector = TrafficDetector()
    
    # Simulate a frame (e.g., from camera)
    cap = cv2.VideoCapture(0) # Use 0 for webcam or 'path/to/video.mp4'
    
    logger.info("Starting detection. Press 'q' to quit.")
    
    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            counts = detector.detect_and_count(frame)
            json_output = detector.get_json_output(counts)
            
            # Print JSON output to console
            print(json_output)
            
            # Visualize (optional)
            cv2.imshow('Traffic Detection', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()
