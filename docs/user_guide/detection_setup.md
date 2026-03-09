# Traffic Detection Module Instructions

## Setup
Ensure you have the required dependencies installed:
```bash
pip install ultralytics opencv-python numpy
```

## Running the Module
You can run the detection module as a standalone script to test with your webcam or a video file.

1. **Standalone Test**:
   ```bash
   cd backend/src/modules/ai
   python detector.py
   ```

2. **Integration**:
   Import the `TrafficDetector` class in your service:
   ```python
   from modules.ai.detector import TrafficDetector
   detector = TrafficDetector()
   counts = detector.detect_and_count(frame)
   print(detector.get_json_output(counts))
   ```

## Configuration
- **Models**: The default model is `assets/ml_models/yolov8n.pt`. Ensure this path is correct or pass a custom path to the constructor.
- **Lanes**: You can modify the `lane_rois` dictionary in `detector.py` to match the geometric areas of your specific camera feed.
