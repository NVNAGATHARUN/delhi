"""
Simulation Engine — generates dynamic dummy data for 3 demo scenarios.
Each tick() call returns a fresh snapshot.
"""

import random
import time
import math

# ─── State ────────────────────────────────────────────────────────────────────
_current_scenario = "normal"
_tick = 0

SCENARIOS = ["normal", "heavy", "emergency"]

def set_scenario(name: str):
    global _current_scenario, _tick
    if name not in SCENARIOS:
        raise ValueError(f"Unknown scenario: {name}. Choose from {SCENARIOS}")
    _current_scenario = name
    _tick = 0

def get_scenario() -> str:
    return _current_scenario

# ─── Per-lane vehicle generators ──────────────────────────────────────────────

def _normal_lane_counts():
    base = [12, 8, 5]
    return [max(1, b + random.randint(-3, 3)) for b in base]

def _heavy_lane_counts():
    base = [35, 28, 22]
    return [max(5, b + random.randint(-5, 5)) for b in base]

def _emergency_lane_counts():
    # Lane 3 nearly empty (reserved for ambulance)
    counts = [30, 25, random.randint(0, 2)]
    return counts

# ─── Main tick ────────────────────────────────────────────────────────────────

def tick() -> dict:
    global _tick
    _tick += 1

    scenario = _current_scenario

    if scenario == "normal":
        lane_counts = _normal_lane_counts()
        emergency_detected = False
        ambulance_lane = None
    elif scenario == "heavy":
        lane_counts = _heavy_lane_counts()
        emergency_detected = False
        ambulance_lane = None
    else:  # emergency
        lane_counts = _emergency_lane_counts()
        emergency_detected = True
        ambulance_lane = 3

    total = sum(lane_counts)
    capacity = 90  # 30 per lane
    density = round(total / capacity, 3)

    # Vehicles list detail
    vehicles = []
    types = ["car", "bike", "bus", "truck"]
    weights = [0.5, 0.25, 0.15, 0.10]
    for lane_idx, count in enumerate(lane_counts, start=1):
        for _ in range(count):
            vtype = random.choices(types, weights=weights, k=1)[0]
            vehicles.append({"type": vtype, "lane": lane_idx})

    # Historical density (last 10 ticks) — simulated
    history = [round(density + math.sin(i + _tick) * 0.05, 3) for i in range(10)]

    return {
        "tick": _tick,
        "scenario": scenario,
        "lane_counts": lane_counts,  # [lane1, lane2, lane3]
        "vehicle_count": total,
        "vehicles": vehicles,
        "density": density,
        "emergency_detected": emergency_detected,
        "ambulance_lane": ambulance_lane,
        "density_history": history,
    }
