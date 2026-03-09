import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrafficAnalyzer:
    def __init__(self, lane_capacity=50):
        """
        Initialize the analyzer with lane capacity and congestion thresholds.
        """
        self.lane_capacity = lane_capacity
        # Thresholds relative to lane capacity
        self.thresholds = {
            'HIGH': 0.7,   # 70% or more
            'MEDIUM': 0.3, # 30% to 70%
            'LOW': 0.0     # Less than 30%
        }
        
        # Recommended green signal timings in seconds
        self.timing_config = {
            'HIGH': 60,
            'MEDIUM': 30,
            'LOW': 15
        }

    def calculate_congestion_level(self, count):
        """
        Determine the congestion level based on vehicle count.
        """
        ratio = count / self.lane_capacity
        if ratio >= self.thresholds['HIGH']:
            return 'HIGH'
        elif ratio >= self.thresholds['MEDIUM']:
            return 'MEDIUM'
        else:
            return 'LOW'

    def analyze_lanes(self, lane_counts: dict):
        """
        Perform a full analysis on multiple lanes.
        Input: {"laneA": 10, "laneB": 40}
        Output: { "laneA": {"level": "LOW", "timing": 15}, ... }
        """
        analysis = {}
        for lane, count in lane_counts.items():
            level = self.calculate_congestion_level(count)
            analysis[lane] = {
                "count": count,
                "congestion_level": level,
                "recommended_green_time": self.timing_config[level],
                "utilization": round((count / self.lane_capacity) * 100, 2)
            }
        
        logger.info(f"Traffic analysis completed for {len(lane_counts)} lanes.")
        return analysis

if __name__ == "__main__":
    # Test cases
    analyzer = TrafficAnalyzer(lane_capacity=100)
    test_counts = {
        "laneA": 10,  # LOW
        "laneB": 45,  # MEDIUM
        "laneC": 80   # HIGH
    }
    
    results = analyzer.analyze_lanes(test_counts)
    import json
    print(json.dumps(results, indent=4))
