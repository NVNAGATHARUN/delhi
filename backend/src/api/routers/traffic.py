from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.db.config import get_db
from src.models.traffic import TrafficLog

router = APIRouter(
    prefix="/traffic",
    tags=["traffic"]
)

@router.get("/data")
async def get_traffic_data(db: Session = Depends(get_db)):
    return db.query(TrafficLog).limit(100).all()

@router.get("/summary")
async def get_traffic_summary():
    # Placeholder for summary logic
    return {"message": "Traffic summary data"}
