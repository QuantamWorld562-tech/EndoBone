from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.biomarker_schema import BiomarkerInput

class SimulationRequest(BaseModel):
    case_id: Optional[str] = None
    model_id: str = Field(..., description="Target femur model ID ('01' - '10')")
    biomarkers: Optional[BiomarkerInput] = None
    axial_load_n: Optional[float] = Field(2500.0, description="Simulated compressive axial load in Newtons")
    abduction_angle_deg: Optional[float] = Field(15.0, description="Stance phase abduction angle")

class StressDistribution(BaseModel):
    region: str
    von_mises_stress_mpa: float
    yield_risk_factor: float
    safety_margin: float

class SimulationResponse(BaseModel):
    model_id: str
    applied_load_n: float
    estimated_fracture_threshold_n: float
    fracture_risk_category: str
    calcar_hoop_stress_mpa: float
    subcapital_shear_stress_mpa: float
    stress_distribution: List[StressDistribution]
    metabolic_attenuation_factor: float
    pre_surgical_guidance: List[str]

class ClinicalSynthesisRequest(BaseModel):
    case_id: Optional[str] = None
    model_id: str = "01"
    biomarkers: Optional[BiomarkerInput] = None

class ClinicalSynthesisResponse(BaseModel):
    synthesisMarkdown: str
    boneQualitySummary: str
    surgicalConsiderations: List[str]
    metabolicRecommendations: List[str]
