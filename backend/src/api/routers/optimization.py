from fastapi import APIRouter
from src.modules.quantum.optimizer import QuantumSignalOptimizer

router = APIRouter(
    prefix="/optimization",
    tags=["optimization"]
)

optimizer = QuantumSignalOptimizer()

@router.post("/optimize")
async def run_optimization(lane_densities: dict):
    result = optimizer.optimize_signals(lane_densities)
    return {"optimal_phase": result}
