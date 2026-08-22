from fastapi import APIRouter
from app.schemas.simulation_schema import (
    SimulationRequest,
    SimulationResponse,
    ClinicalSynthesisRequest,
    ClinicalSynthesisResponse
)
from app.services.simulation_service import SimulationService

router = APIRouter(tags=["Biomechanical Simulation & AI Synthesis"])

@router.post("/simulate", response_model=SimulationResponse)
async def run_biomechanical_simulation(sim_req: SimulationRequest):
    """Executes structural load modeling and metabolic stress attenuation."""
    return SimulationService.run_simulation(sim_req)

@router.post("/ai/clinical-synthesis", response_model=ClinicalSynthesisResponse)
async def generate_ai_clinical_synthesis(synth_req: ClinicalSynthesisRequest):
    """Generates cross-modal Gemini AI clinical consultation report integrating 3D CT and metabolic profile."""
    return await SimulationService.generate_ai_synthesis(synth_req)
