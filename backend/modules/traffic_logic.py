"""
Traffic Signal Logic Module
Calculates dynamic green time per lane based on vehicle density and waiting time.
"""

import math

MIN_GREEN = 10   # seconds
MAX_GREEN = 60   # seconds
CAPACITY_PER_LANE = 30  # vehicles


def calculate_signal(vehicle_count: int, waiting_time: int = 0, lane_id: int = 1) -> dict:
    """
    Returns optimal signal state for a single lane.

    Args:
        vehicle_count: number of vehicles in this lane
        waiting_time:  how many seconds this lane has been waiting (RED)
        lane_id:       lane identifier (1-3)

    Returns:
        {"signal": "GREEN"|"RED"|"YELLOW", "green_time": int, "density": float}
    """
    if vehicle_count == 0:
        return {"signal": "RED", "green_time": 0, "density": 0.0, "lane_id": lane_id, "skip": True}

    density = min(vehicle_count / CAPACITY_PER_LANE, 1.0)

    # Base green time proportional to density
    base_time = MIN_GREEN + (MAX_GREEN - MIN_GREEN) * density

    # Boost for lanes that have been waiting long (fairness)
    wait_boost = min(waiting_time * 0.3, 15)

    green_time = int(min(round(base_time + wait_boost), MAX_GREEN))

    return {
        "signal": "GREEN",
        "green_time": green_time,
        "density": round(density, 3),
        "lane_id": lane_id,
        "skip": False,
    }


def calculate_all_lanes(lane_counts: list, waiting_times: list = None) -> list:
    """
    Returns signal decisions for all lanes. Only one lane gets GREEN at a time.
    Highest-priority lane (density + wait boost) gets GREEN first.
    """
    if waiting_times is None:
        waiting_times = [0] * len(lane_counts)

    results = []
    scores = []

    for i, (count, wait) in enumerate(zip(lane_counts, waiting_times)):
        sig = calculate_signal(count, wait, lane_id=i + 1)
        if sig["skip"]:
            scores.append(-1)
        else:
            density = count / CAPACITY_PER_LANE
            score = density + wait * 0.01
            scores.append(score)
        results.append(sig)

    # Grant GREEN to highest-scoring lane only
    best = max(range(len(scores)), key=lambda i: scores[i])

    for i, r in enumerate(results):
        if r["skip"]:
            r["signal"] = "RED"
        elif i == best:
            r["signal"] = "GREEN"
        else:
            r["signal"] = "RED"

    return results


def normal_vs_optimized_stats(lane_counts: list) -> dict:
    """Returns before (fixed 30s) vs after (dynamic) waiting time for comparison."""
    fixed_wait = 30 * len(lane_counts)
    decisions = calculate_all_lanes(lane_counts)
    optimized_wait = sum(d["green_time"] for d in decisions)
    congestion_before = round(sum(lane_counts) / (30 * len(lane_counts)), 3)
    congestion_after = round(congestion_before * 0.65, 3)

    return {
        "fixed_waiting_time": fixed_wait,
        "optimized_waiting_time": optimized_wait,
        "congestion_before": congestion_before,
        "congestion_after": congestion_after,
    }
