import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SignalOptimizationEngine:
    def __init__(self, min_green=15, max_green=90, cycle_time=120):
        """
        Initialize with constraints for signal timing.
        """
        self.min_green = min_green
        self.max_green = max_green
        self.cycle_time = cycle_time # Total cycle time for all phases

    def optimize_timings(self, lane_data: dict, intersection_layout: str = "4-way"):
        """
        Optimize signal timings for each lane based on traffic demand.
        lane_data: { "laneA": {"count": 25, "level": "MEDIUM"}, ... }
        """
        total_vehicles = sum(l['count'] for l in lane_data.values())
        
        if total_vehicles == 0:
            # Equal distribution if no traffic
            share = 1.0 / len(lane_data)
            return {lane: self.min_green for lane in lane_data}

        optimizations = {}
        
        # Calculate demand-based timing
        # We use a proportional approach to minimize total waiting time
        for lane, data in lane_data.items():
            count = data.get('count', 0)
            level = data.get('level', 'LOW')
            
            # Weighted demand (High congestion lanes get a slight boost to clear queues)
            weight = 1.0
            if level == 'HIGH': weight = 1.5
            elif level == 'MEDIUM': weight = 1.2
            
            demand_share = (count * weight) / total_vehicles
            calculated_time = demand_share * self.cycle_time
            
            # Apply constraints
            final_time = max(self.min_green, min(self.max_green, int(calculated_time)))
            optimizations[lane] = final_time

        logger.info(f"Signal optimization completed for {intersection_layout} intersection.")
        return optimizations

if __name__ == "__main__":
    # Mock data from analyzer
    mock_lane_data = {
        "Lane A": {"count": 45, "level": "HIGH"},
        "Lane B": {"count": 10, "level": "LOW"},
        "Lane C": {"count": 25, "level": "MEDIUM"}
    }
    
    engine = SignalOptimizationEngine()
    optimized_timings = engine.optimize_timings(mock_lane_data)
    
    print("\n--- Optimized Signal Timings ---")
    for lane, time in optimized_timings.items():
        print(f"{lane} → {time} seconds")
