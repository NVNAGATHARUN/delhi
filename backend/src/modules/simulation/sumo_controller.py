import os
import sys
import logging
import traci
from sumolib import checkBinary

logger = logging.getLogger(__name__)

class SumoController:
    def __init__(self, config_file='simulation/scenarios/traffic.sumocfg'):
        self.config_file = config_file
        self.sumo_binary = checkBinary('sumo') # or 'sumo-gui'
        self.is_running = False

    def start_simulation(self):
        """
        Start the SUMO simulation using TraCI.
        """
        try:
            # -n: network file, -r: route file
            # In a real scenario, we'd point to the .sumocfg file
            if not os.path.exists(self.config_file):
                logger.warning(f"SUMO config {self.config_file} not found. Simulation might fail.")
            
            traci.start([self.sumo_binary, "-c", self.config_file, "--start"])
            self.is_running = True
            logger.info("SUMO simulation started.")
        except Exception as e:
            logger.error(f"Failed to start SUMO: {e}")
            self.is_running = False

    def step(self):
        """
        Execute one step of the simulation.
        """
        if self.is_running:
            traci.simulationStep()
            return True
        return False

    def get_lane_vehicle_count(self, lane_id):
        """
        Get number of vehicles on a specific lane.
        """
        if self.is_running:
            return traci.lane.getLastStepVehicleNumber(lane_id)
        return 0

    def set_signal_phase(self, traffic_light_id, phase_index):
        """
        Change the traffic light phase.
        """
        if self.is_running:
            traci.trafficlight.setPhase(traffic_light_id, phase_index)

    def close(self):
        """
        Close the simulation.
        """
        if self.is_running:
            traci.close()
            self.is_running = False
            logger.info("SUMO simulation closed.")

if __name__ == "__main__":
    # Mock usage
    controller = SumoController()
    # controller.start_simulation() # Requires valid config
