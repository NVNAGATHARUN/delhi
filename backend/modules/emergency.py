"""
Emergency Vehicle Handling Module
Implements green corridor logic: signal override + lane reservation + multi-junction clearance.
"""

from typing import Optional

TOTAL_LANES = 3
EMERGENCY_LANE = 3  # Always reserve lane 3 for emergency vehicles


def handle_emergency(
    emergency_detected: bool,
    route: Optional[list] = None,
    eta_seconds: Optional[list] = None,
    junction_names: Optional[list] = None,
) -> dict:
    """
    Core emergency handler.

    Args:
        emergency_detected: True if ambulance/fire truck found
        route:              list of junction node IDs on ambulance path
        eta_seconds:        ETA in seconds to each junction
        junction_names:     friendly names for each junction

    Returns:
        Full emergency state dict
    """
    if not emergency_detected:
        return {
            "emergency": False,
            "signal_override": None,
            "lane_reserved": None,
            "junctions_cleared": [],
            "mode": "normal",
            "alert_message": None,
        }

    route = route or ["A", "B", "C", "D"]
    eta_seconds = eta_seconds or [0, 20, 40, 60]
    junction_names = junction_names or route

    # Determine which junctions need clearing (arriving in < 45 sec)
    junctions_cleared = []
    for node, eta, name in zip(route, eta_seconds, junction_names):
        if eta < 45:
            junctions_cleared.append({
                "junction": node,
                "name": name,
                "eta_seconds": eta,
                "signal": "GREEN",
                "lane_cleared": EMERGENCY_LANE,
                "status": "CLEARED" if eta == 0 else "PRE-CLEARED",
            })
        else:
            junctions_cleared.append({
                "junction": node,
                "name": name,
                "eta_seconds": eta,
                "signal": "PREPARING",
                "lane_cleared": None,
                "status": "SCHEDULED",
            })

    return {
        "emergency": True,
        "signal_override": "GREEN",
        "lane_reserved": EMERGENCY_LANE,
        "emergency_lane_vehicles": 0,  # Lane cleared
        "junctions_cleared": junctions_cleared,
        "mode": "emergency",
        "alert_message": f"🚑 Emergency vehicle detected — Lane {EMERGENCY_LANE} reserved. {len([j for j in junctions_cleared if j['status'] != 'SCHEDULED'])} junctions cleared.",
        "sound_alert": True,
        "flashing_signal": True,
    }


def get_lane_states(emergency: bool, signal_override: Optional[str] = None) -> list:
    """
    Returns per-lane signal state for display purposes.
    During emergency: lane 3 = GREEN + reserved, others = RED.
    """
    if not emergency:
        return [
            {"lane": 1, "signal": "GREEN", "reserved": False},
            {"lane": 2, "signal": "RED", "reserved": False},
            {"lane": 3, "signal": "RED", "reserved": False},
        ]

    return [
        {"lane": 1, "signal": "RED", "reserved": False, "note": "Cleared for ambulance passage"},
        {"lane": 2, "signal": "RED", "reserved": False, "note": "Cleared for ambulance passage"},
        {"lane": 3, "signal": "GREEN", "reserved": True, "note": "🚑 Emergency Lane — Do not enter"},
    ]
