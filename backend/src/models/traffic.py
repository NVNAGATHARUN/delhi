from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from .config import Base

class TrafficLog(Base):
    __tablename__ = "traffic_logs"

    id = Column(Integer, primary_key=True, index=True)
    lane_id = Column(String)
    vehicle_count = Column(Integer)
    congestion_level = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class EmergencyEvent(Base):
    __tablename__ = "emergency_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String) # e.g. "AMBULANCE_DETECTED"
    lane_id = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
