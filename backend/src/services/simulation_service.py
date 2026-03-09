import asyncio
import logging
import random
from src.modules.ai.detector import TrafficDetector
from src.modules.analytics.analyzer import TrafficAnalyzer
from src.modules.quantum.optimizer import QuantumTrafficOptimizer
from src.modules.simulation.sumo_controller import SumoController
from src.modules.analytics.emergency_manager import EmergencyManager

logger = logging.getLogger(__name__)

class SimulationService:
    def __init__(self, shared_state):
        self.state = shared_state
        self.detector = TrafficDetector()
        self.analyzer = TrafficAnalyzer()
        self.quantum_opt = QuantumTrafficOptimizer()
        self.sumo = SumoController()
        self.emergency_mgr = EmergencyManager()
        self._running = False

    async def run_loop(self):
        self._running = True
        self.state["status"] = "RUNNING"
        logger.info("Integrated Simulation Loop Started")

        while self._running and self.state["status"] == "RUNNING":
            try:
                # 1. Simulate/Capture Frame & Detect Vehicles
                # In prototype, we simulate counts that would come from AI
                # But we call the logic to show integration
                lane_counts, emergency_data = self.detector.detect_and_count(None) 
                
                # For demo purposes, if detector returns 0 (dummy), we inject some random traffic
                if sum(lane_counts.values()) == 0:
                    lane_counts = {
                        "north": random.randint(5, 30),
                        "south": random.randint(5, 30),
                        "east": random.randint(5, 30),
                        "west": random.randint(5, 30)
                    }

                # 2. Process Emergency Priority
                if emergency_data["detected"]:
                    self.state["emergency_active"] = True
                    plan = self.emergency_mgr.generate_corridor_plan(emergency_data["lane"])
                    self.state["current_phase"] = "EMERGENCY_OVERRIDE"
                    # Apply to lanes
                    for lane in self.state["lanes"]:
                        self.state["lanes"][lane]["signal"] = "GREEN" if lane == emergency_data["lane"] else "RED"
                else:
                    self.state["emergency_active"] = False
                    
                    # 3. Quantum Optimization
                    q_result = self.quantum_opt.solve_traffic_qubo(lane_counts)
                    self.state["current_phase"] = q_result["active_phase"]
                    
                    # 4. Analyze and Update State
                    analysis = self.analyzer.analyze_lanes(lane_counts)
                    for lane, info in analysis.items():
                        if lane in self.state["lanes"]:
                            self.state["lanes"][lane]["vehicles"] = info["count"]
                            self.state["lanes"][lane]["congestion"] = info["congestion_level"]
                            
                            # Set signals based on Quantum Phase
                            if self.state["current_phase"] == "NS":
                                self.state["lanes"][lane]["signal"] = "GREEN" if lane in ["north", "south"] else "RED"
                            else:
                                self.state["lanes"][lane]["signal"] = "GREEN" if lane in ["east", "west"] else "RED"

                # 5. Step SUMO (if active)
                # self.sumo.step() 

                await asyncio.sleep(2) # Simulation step interval
            except Exception as e:
                logger.error(f"Error in simulation loop: {e}")
                await asyncio.sleep(5)

    def stop(self):
        self._running = False
        self.state["status"] = "STOPPED"
        logger.info("Integrated Simulation Loop Stopped")
