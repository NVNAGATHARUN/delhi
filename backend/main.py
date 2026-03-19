"""
FastAPI Backend — Dynamic AI Traffic Flow Optimizer & Emergency Grid
Endpoints: /traffic, /signal, /emergency, /route, /scenario/{name}, /status
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional, List
import time

from modules.simulation import tick, set_scenario, get_scenario
from modules.detection import _simulate_detection as detect_from_simulation, process_image, process_video_frame, generate_camera_stream, get_latest_camera_stats
from modules.traffic_logic import calculate_all_lanes, calculate_signal, normal_vs_optimized_stats
from modules.quantum_optimizer import optimize_signals, optimize_emergency_route
from modules.emergency import handle_emergency, get_lane_states
from modules.route_predictor import get_full_route_data, get_all_junctions
import os
import shutil

# ─── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Traffic Flow Optimizer & Emergency Grid",
    description="Quantum-enhanced dynamic traffic management with emergency green corridor",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Shared state (updated on each /tick or per-endpoint call) ────────────────

_waiting_times = [0, 0, 0]   # seconds each lane has been waiting
_last_tick_time = 0.0

def _get_sim_snapshot():
    """Get fresh simulation tick and update waiting times."""
    global _waiting_times, _last_tick_time
    data = tick()

    # Update waiting times: non-selected lanes accumulate wait
    lane_counts = data["lane_counts"]
    sigs = calculate_all_lanes(lane_counts, _waiting_times)
    for i, sig in enumerate(sigs):
        if sig["signal"] == "GREEN":
            _waiting_times[i] = 0
        else:
            _waiting_times[i] += 2  # approximate tick duration

    _last_tick_time = time.time()
    return data


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/status")
def health_check():
    return {
        "status": "ok",
        "scenario": get_scenario(),
        "timestamp": time.time(),
    }


@app.get("/traffic")
def get_traffic():
    """Vehicle count + density per lane."""
    sim = _get_sim_snapshot()
    detection = detect_from_simulation(sim)

    return {
        "scenario": sim["scenario"],
        "vehicle_count": detection["vehicle_count"],
        "lane_counts": sim["lane_counts"],
        "vehicles": detection["vehicles"],
        "density": sim["density"],
        "emergency_detected": detection["emergency_detected"],
        "ambulance_lane": sim["ambulance_lane"],
        "density_history": sim["density_history"],
        "source": detection["source"],
        "tick": sim["tick"],
    }


@app.get("/signal")
def get_signal():
    """Quantum-optimized signal timings for all lanes."""
    sim = _get_sim_snapshot()
    lane_counts = sim["lane_counts"]

    # Quantum optimization
    quantum_result = optimize_signals(lane_counts, _waiting_times)

    # Classical comparison
    classical = calculate_all_lanes(lane_counts, _waiting_times)

    # Stats comparison
    stats = normal_vs_optimized_stats(lane_counts)

    return {
        "scenario": sim["scenario"],
        "quantum_optimized": quantum_result,
        "classical_signals": classical,
        "stats": stats,
        "lane_counts": lane_counts,
        "waiting_times": _waiting_times,
    }


@app.get("/emergency")
def get_emergency():
    """Emergency status, lane reservation, junction clearance."""
    sim = _get_sim_snapshot()
    emergency_detected = sim["emergency_detected"]

    # Get route data
    route_data = get_full_route_data("A", "D", avg_speed_mps=10.0)
    route = route_data.get("path", ["A", "B", "C", "D"])
    eta_seconds = route_data.get("eta_seconds", [0, 20, 40, 60])
    junction_names = route_data.get("junction_names", route)

    emergency_state = handle_emergency(
        emergency_detected=emergency_detected,
        route=route,
        eta_seconds=eta_seconds,
        junction_names=junction_names,
    )

    lane_states = get_lane_states(emergency_detected)

    # Quantum route optimization
    lane_counts_per_junction = {
        node: sim["lane_counts"] for node in route
    }
    quantum_route = optimize_emergency_route(route, lane_counts_per_junction)

    return {
        "scenario": sim["scenario"],
        **emergency_state,
        "lane_states": lane_states,
        "quantum_route": quantum_route,
        "route_data": route_data,
    }


@app.get("/route")
def get_route(source: str = "A", destination: str = "D", speed: float = 10.0):
    """Shortest path + ETA for ambulance route."""
    route_data = get_full_route_data(source, destination, avg_speed_mps=speed)
    if "error" in route_data:
        raise HTTPException(status_code=404, detail=route_data["error"])

    sim = _get_sim_snapshot()
    lane_counts_per_junction = {node: sim["lane_counts"] for node in route_data["path"]}
    quantum_route = optimize_emergency_route(route_data["path"], lane_counts_per_junction)

    return {
        **route_data,
        "quantum_optimization": quantum_route,
        "all_junctions": get_all_junctions(),
    }


@app.post("/scenario/{name}")
def switch_scenario(name: str):
    """Switch demo scenario: normal | heavy | emergency"""
    try:
        set_scenario(name)
        # Reset waiting times on scenario switch
        global _waiting_times
        _waiting_times = [0, 0, 0]
        return {"success": True, "scenario": name, "message": f"Switched to '{name}' scenario"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── New Phase 2 Media Endpoints ──────────────────────────────────────────────

@app.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    """Process a single traffic image via YOLOv8, returning annotated base64 and signal timing."""
    contents = await file.read()
    detection_result = process_image(contents, total_lanes=3)
    
    lane_counts = detection_result["lane_counts"]
    quantum_signals = optimize_signals(lane_counts, _waiting_times)
    
    return {
        "detection": detection_result,
        "signals": quantum_signals,
        "success": True
    }

@app.post("/upload/videos")
async def upload_videos(files: List[UploadFile] = File(...)):
    """Process up to 4 video files representing North, South, East, West."""
    if not files or len(files) > 4:
        raise HTTPException(status_code=400, detail="Must upload between 1 and 4 videos.")
        
    temp_dir = "temp_videos"
    os.makedirs(temp_dir, exist_ok=True)
    
    lane_counts = []
    emergencies = []
    
    for idx, file in enumerate(files):
        temp_path = os.path.join(temp_dir, f"temp_{idx}_{file.filename}")
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        result = process_video_frame(temp_path, total_lanes=1)
        # We assign 1 direction = 1 lane for this simulation
        lane_counts.append(result["vehicle_count"])
        emergencies.append(result["emergency_detected"])
        
        os.remove(temp_path)
        
    # Pad to 4 lanes if fewer than 4 videos uploaded
    while len(lane_counts) < 4:
        lane_counts.append(0)
        
    # Run QoS
    waiting_times_4 = [0, 0, 0, 0] # Simple stateless wait array for video 1-shot
    quantum_signals = optimize_signals(lane_counts, waiting_times_4)
    
    emergency_detected = any(emergencies)
    
    # Clean up
    try:
        os.rmdir(temp_dir)
    except:
        pass
        
    return {
        "lane_counts": lane_counts,
        "signals": quantum_signals,
        "emergency_detected": emergency_detected,
        "success": True
    }

@app.get("/camera/stream")
def camera_stream():
    """Returns a Multipart MJPEG stream of the local webcam with YOLO bounding boxes."""
    return StreamingResponse(
        generate_camera_stream(), 
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/camera/stats")
def camera_stats():
    """Returns the instantaneous vehicle count from the active live camera stream."""
    stats = get_latest_camera_stats()
    lane_counts = stats["lane_counts"]
    
    quantum_signals = optimize_signals(lane_counts, _waiting_times)
    stats_comparison = normal_vs_optimized_stats(lane_counts)
    
    return {
        "traffic": {
            "vehicle_count": stats.get("vehicle_count", 0),
            "lane_counts": lane_counts,
            "density": stats.get("density", 0.0),
            "emergency_detected": stats.get("emergency_detected", False),
            "source": "camera"
        },
        "signals": quantum_signals,
        "stats": stats_comparison
    }

@app.get("/combined")
def get_combined():
    """All data in one call — used by frontend for efficiency."""
    sim = _get_sim_snapshot()
    detection = detect_from_simulation(sim)
    lane_counts = sim["lane_counts"]
    emergency_detected = sim["emergency_detected"]

    quantum_signals = optimize_signals(lane_counts, _waiting_times)
    stats = normal_vs_optimized_stats(lane_counts)
    route_data = get_full_route_data("A", "D")
    route = route_data.get("path", ["A", "B", "C", "D"])
    eta_seconds = route_data.get("eta_seconds", [0, 20, 40, 60])
    junction_names = route_data.get("junction_names", route)

    emergency_state = handle_emergency(
        emergency_detected=emergency_detected,
        route=route,
        eta_seconds=eta_seconds,
        junction_names=junction_names,
    )
    lane_states = get_lane_states(emergency_detected)

    return {
        "scenario": sim["scenario"],
        "tick": sim["tick"],
        "traffic": {
            "vehicle_count": detection["vehicle_count"],
            "lane_counts": lane_counts,
            "density": sim["density"],
            "density_history": sim["density_history"],
            "emergency_detected": emergency_detected,
            "ambulance_lane": sim["ambulance_lane"],
        },
        "signals": quantum_signals,
        "emergency": {
            **emergency_state,
            "lane_states": lane_states,
        },
        "route": route_data,
        "stats": stats,
    }
