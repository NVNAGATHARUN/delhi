"""
Demo Service - Scripted traffic simulation scenarios for demonstration.

Showcases:
  1. Normal traffic flow with dynamic signal optimization
  2. High congestion and quantum-driven rebalancing
  3. Emergency green corridor activation (Ambulance)
"""
import asyncio
import logging
from src.modules.analytics.analyzer import TrafficAnalyzer
from src.modules.quantum.optimizer import QuantumTrafficOptimizer
from src.modules.analytics.emergency_manager import EmergencyManager

logger = logging.getLogger(__name__)

class DemoService:
    def __init__(self, shared_state: dict):
        self.state = shared_state
        self.analyzer = TrafficAnalyzer()
        self.quantum_opt = QuantumTrafficOptimizer()
        self.emergency_mgr = EmergencyManager()
        self._running = False

    def _apply_counts(self, counts: dict):
        """Helper to update lane counts, run analysis and quantum opt."""
        analysis = self.analyzer.analyze_lanes(counts)
        q_result = self.quantum_opt.get_baseline_optimization(counts)
        active_phase = q_result.get("active_phase", "NS")
        self.state["current_phase"] = active_phase

        for lane, info in analysis.items():
            if lane in self.state["lanes"]:
                self.state["lanes"][lane]["vehicles"] = info["count"]
                self.state["lanes"][lane]["congestion"] = info["congestion_level"]
                if active_phase == "NS":
                    self.state["lanes"][lane]["signal"] = "GREEN" if lane in ["north", "south"] else "RED"
                else:
                    self.state["lanes"][lane]["signal"] = "GREEN" if lane in ["east", "west"] else "RED"

        self.state["emergency_active"] = False

    def _apply_emergency(self, lane: str):
        """Override signals for emergency vehicle."""
        for l in self.state["lanes"]:
            self.state["lanes"][l]["signal"] = "GREEN" if l == lane else "RED"
            self.state["lanes"][l]["congestion"] = "HIGH" if l != lane else "LOW"
        self.state["emergency_active"] = True
        self.state["current_phase"] = "EMERGENCY_OVERRIDE"

    async def run_demo(self):
        """Run the full scripted demo sequence."""
        self._running = True
        self.state["status"] = "RUNNING"
        logger.info("=== DEMO MODE STARTED ===")

        try:
            # ────────────────────────────────────────
            # SCENE 1: Steady / Low Traffic
            # ────────────────────────────────────────
            logger.info("[DEMO] Scene 1: Normal low traffic → Balanced signals")
            for _ in range(5):
                if not self._running: return
                self._apply_counts({"north": 8, "south": 6, "east": 5, "west": 7})
                await asyncio.sleep(2)

            # ────────────────────────────────────────
            # SCENE 2: North-South Congestion Builds Up
            # ────────────────────────────────────────
            logger.info("[DEMO] Scene 2: N-S congestion rising → Quantum shifts phase to NS Green")
            counts = {"north": 8, "south": 6, "east": 5, "west": 7}
            for step in range(6):
                if not self._running: return
                counts["north"] = min(40, counts["north"] + 5)
                counts["south"] = min(35, counts["south"] + 4)
                self._apply_counts(counts)
                await asyncio.sleep(2)

            # ────────────────────────────────────────
            # SCENE 3: Quantum Decongestion Phase
            # ────────────────────────────────────────
            logger.info("[DEMO] Scene 3: Quantum optimizer decongests N-S lanes")
            for step in range(5):
                if not self._running: return
                counts["north"] = max(8, counts["north"] - 6)
                counts["south"] = max(6, counts["south"] - 5)
                self._apply_counts(counts)
                await asyncio.sleep(2)

            # ────────────────────────────────────────
            # SCENE 4: Emergency Ambulance Detected!
            # ────────────────────────────────────────
            logger.info("[DEMO] Scene 4: AMBULANCE detected in north lane → GREEN CORRIDOR")
            for _ in range(6):
                if not self._running: return
                self._apply_emergency("north")
                await asyncio.sleep(2)

            # ────────────────────────────────────────
            # SCENE 5: Emergency Cleared, Return to Normal
            # ────────────────────────────────────────
            logger.info("[DEMO] Scene 5: Emergency cleared → Returning to normal optimization")
            for _ in range(5):
                if not self._running: return
                self._apply_counts({"north": 10, "south": 8, "east": 12, "west": 9})
                await asyncio.sleep(2)

        finally:
            self.state["status"] = "STOPPED"
            self._running = False
            logger.info("=== DEMO MODE COMPLETE ===")

    def stop(self):
        self._running = False
