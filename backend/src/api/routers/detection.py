from fastapi import APIRouter
from src.modules.ai.detector import TrafficDetector

router = APIRouter(
    prefix="/detection",
    tags=["detection"]
)

detector = TrafficDetector()

@router.get("/status")
async def detection_status():
    return {"status": "ACTIVE", "model": "YOLOv8n"}

@router.post("/process-frame")
async def process_frame():
    # In a real app, this would receive an image/frame
    return {"message": "Frame processed successfully"}
