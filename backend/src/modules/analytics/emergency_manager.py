import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmergencyManager:
    def __init__(self):
        # Map of lane arrival to signal override path
        # Assuming a standard 4-way intersection layout
        self.lane_override_map = {
            "laneA": ["laneA", "lane_exit_opposing"], # North -> South
            "laneB": ["laneB", "lane_exit_opposing"], # East -> West
            "laneC": ["laneC", "lane_exit_opposing"], # South -> North
            "laneD": ["laneD", "lane_exit_opposing"]  # West -> East
        }

    def generate_corridor_plan(self, ambulance_lane: str, intersection_id: str = "INT_001"):
        """
        Generates a route plan and signal override for an detected ambulance.
        """
        if not ambulance_lane or ambulance_lane not in self.lane_override_map:
            logger.warning(f"Ambiguous or unknown lane for ambulance: {ambulance_lane}")
            return None

        affected_path = self.lane_override_map[ambulance_lane]
        
        # Plan for the signal controller
        plan = {
            "intersection_id": intersection_id,
            "status": "EMERGENCY_OVERRIDE",
            "priority_lane": ambulance_lane,
            "path": affected_path,
            "signal_commands": [
                {"lane": ambulance_lane, "action": "TURN_GREEN", "duration": "INDEFINITE_UNTIL_CLEAR"},
                {"lane": "all_others", "action": "TURN_RED", "duration": "INDEFINITE_UNTIL_CLEAR"}
            ],
            "timestamp": "ISO_TIMESTAMP_PLACEHOLDER"
        }

        logger.info(f"Generated emergency green corridor plan for ambulance in {ambulance_lane}")
        return plan

    def resolve_conflicts(self, plans: list):
        """
        Handle multiple emergency vehicles if they arrive at once.
        Priority logic could be added here.
        """
        if not plans:
            return None
        return plans[0] # Simplistic: First come, first served

if __name__ == "__main__":
    manager = EmergencyManager()
    plan = manager.generate_corridor_plan("laneA")
    print("\n--- Emergency Route Plan ---")
    print(json.dumps(plan, indent=4))
