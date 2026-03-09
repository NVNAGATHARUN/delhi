from fastapi import APIRouter, BackgroundTasks
from src.modules.simulation.sumo_controller import SumoController

router = APIRouter(
    prefix="/simulation",
    tags=["simulation"]
)

sumo = SumoController()

@router.post("/start")
async def start_simulation(background_tasks: BackgroundTasks):
    # This would trigger the loop we built earlier
    return {"message": "Simulation started"}

@router.post("/stop")
async def stop_simulation():
    sumo.close()
    return {"message": "Simulation stopped"}
