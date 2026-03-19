"""
Route Prediction Module
Uses NetworkX to find shortest path and estimate per-junction arrival times.
Pre-built 4-junction map: A → B → C → D (plus alternate paths)
"""

import networkx as nx

# ─── Static junction map ──────────────────────────────────────────────────────

JUNCTIONS = {
    "A": {"name": "Main Gate",       "x": 0,   "y": 0},
    "B": {"name": "City Center",     "x": 300, "y": 0},
    "C": {"name": "Hospital Road",   "x": 600, "y": 0},
    "D": {"name": "Hospital",        "x": 900, "y": 0},
    "E": {"name": "North Bypass",    "x": 300, "y": 200},
    "F": {"name": "South Bypass",    "x": 600, "y": -200},
}

EDGES = [
    ("A", "B", 300),   # distance in metres
    ("B", "C", 300),
    ("C", "D", 300),
    ("A", "E", 400),
    ("E", "C", 350),
    ("B", "F", 380),
    ("F", "D", 320),
]

# Build graph once
_G = nx.Graph()
for node, attrs in JUNCTIONS.items():
    _G.add_node(node, **attrs)
for u, v, dist in EDGES:
    _G.add_edge(u, v, weight=dist)


# ─── Public API ───────────────────────────────────────────────────────────────

def get_route(source: str = "A", destination: str = "D") -> dict:
    """
    Returns shortest path from source to destination using Dijkstra.
    """
    try:
        path = nx.shortest_path(_G, source=source, target=destination, weight="weight")
        total_dist = nx.shortest_path_length(_G, source=source, target=destination, weight="weight")
    except nx.NetworkXNoPath:
        return {"error": f"No path from {source} to {destination}"}
    except nx.NodeNotFound as e:
        return {"error": str(e)}

    return {
        "path": path,
        "total_distance_m": total_dist,
        "junction_names": [JUNCTIONS[n]["name"] for n in path],
        "nodes": [{"id": n, **JUNCTIONS[n]} for n in path],
    }


def estimate_arrival(path: list, avg_speed_mps: float = 10.0) -> dict:
    """
    Estimates ETA (seconds) from ambulance origin to each junction.

    Args:
        path:           list of junction IDs
        avg_speed_mps:  ambulance speed in m/s (default 10 m/s ≈ 36 km/h)

    Returns:
        {"eta_seconds": [...], "arrival_times": {"B": 30, ...}}
    """
    if len(path) < 2:
        return {"eta_seconds": [0], "arrival_times": {path[0]: 0}}

    eta_seconds = [0]
    cumulative = 0.0

    for i in range(1, len(path)):
        segment_dist = _G[path[i - 1]][path[i]]["weight"]
        cumulative += segment_dist / avg_speed_mps
        eta_seconds.append(round(cumulative))

    arrival_times = {node: eta for node, eta in zip(path, eta_seconds)}

    return {
        "eta_seconds": eta_seconds,
        "arrival_times": arrival_times,
    }


def get_full_route_data(source: str = "A", destination: str = "D", avg_speed_mps: float = 10.0) -> dict:
    """Combined route + ETA in one call."""
    route_data = get_route(source, destination)
    if "error" in route_data:
        return route_data

    eta_data = estimate_arrival(route_data["path"], avg_speed_mps)

    return {
        **route_data,
        **eta_data,
        "avg_speed_mps": avg_speed_mps,
        "source": source,
        "destination": destination,
    }


def get_all_junctions() -> list:
    return [{"id": node, **attrs} for node, attrs in JUNCTIONS.items()]
