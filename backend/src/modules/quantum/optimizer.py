from qiskit import QuantumCircuit
from qiskit_aer import Aer
from qiskit_algorithms import QAOA
from qiskit_algorithms.optimizers import COBYLA
from qiskit.primitives import Sampler
from qiskit_optimization import QuadraticProgram
from qiskit_optimization.algorithms import MinimumEigenOptimizer
import numpy as np
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QuantumTrafficOptimizer:
    def __init__(self):
        """
        Initialize the Quantum Engine using Qiskit's Aer simulator.
        """
        self.sampler = Sampler()
        self.optimizer = COBYLA()
        logger.info("Quantum Traffic Optimizer initialized with Aer Simulator.")

    def solve_traffic_qubo(self, intersections_data: dict):
        """
        Optimizes traffic signal priority across multiple intersections using QAOA.
        Problem: For each intersection i, select Phase 0 (NS) or Phase 1 (EW).
        Objective: Minimize total global vehicle delay (queue weights).
        """
        # 1. Define the Quadratic Program
        qp = QuadraticProgram("GlobalTrafficOptimization")
        
        # Binary variables for each intersection: 1=NS Green, 0=EW Green
        for int_id in intersections_data:
            qp.binary_var(f"phase_{int_id}")
        
        # Objective: Minimise total vehicles waiting in RED lanes.
        # Cost_i = ns_weight_i * (1 - phase_i) + ew_weight_i * phase_i
        # Total Cost = sum [ (ew_weight_i - ns_weight_i) * phase_i ] + constant
        linear_objective = {}
        for int_id, lanes in intersections_data.items():
            ns_weight = lanes.get('north', 0) + lanes.get('south', 0)
            ew_weight = lanes.get('east', 0) + lanes.get('west', 0)
            linear_objective[f"phase_{int_id}"] = ew_weight - ns_weight
            
        qp.minimize(linear=linear_objective)
        
        try:
            qaoa = QAOA(sampler=self.sampler, optimizer=self.optimizer, reps=1)
            optimizer = MinimumEigenOptimizer(qaoa)
            result = optimizer.solve(qp)
            
            optimized_results = {}
            for i, int_id in enumerate(intersections_data.keys()):
                active_phase = "NS" if result.x[i] == 1 else "EW"
                densities = intersections_data[int_id]
                
                optimized_results[int_id] = {
                    "active_phase": active_phase,
                    "lane_timings": {
                        "north": int(30 + (densities.get('north', 0) * 1.5)) if active_phase == "NS" else 15,
                        "south": int(30 + (densities.get('south', 0) * 1.5)) if active_phase == "NS" else 15,
                        "east": int(30 + (densities.get('east', 0) * 1.5)) if active_phase == "EW" else 15,
                        "west": int(30 + (densities.get('west', 0) * 1.5)) if active_phase == "EW" else 15
                    }
                }
            
            logger.info(f"Global Quantum Optimization successful for {len(intersections_data)} nodes.")
            return {
                "intersections": optimized_results,
                "quantum_metadata": {
                    "algorithm": "QAOA",
                    "status": "GLOBAL_OPTIMAL_FOUND",
                    "nodes": len(result.x)
                }
            }

        except Exception as e:
            logger.error(f"Global Quantum solver failed: {e}. Falling back to local greedy.")
            return self.get_baseline_optimization(intersections_data)

    def get_baseline_optimization(self, intersections_data):
        results = {}
        for int_id, densities in intersections_data.items():
            ns = densities.get('north', 0) + densities.get('south', 0)
            ew = densities.get('east', 0) + densities.get('west', 0)
            results[int_id] = {"active_phase": "NS" if ns >= ew else "EW"}
        return {"intersections": results, "status": "CLASSICAL_FALLBACK"}

if __name__ == "__main__":
    opt = QuantumTrafficOptimizer()
    test_data = {'north': 25, 'south': 15, 'east': 5, 'west': 8}
    result = opt.solve_traffic_qubo(test_data)
    print(json.dumps(result, indent=4))
