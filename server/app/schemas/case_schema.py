from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class CaseBase(BaseModel):
    case_id: Optional[str] = Field(None, description="Unique case identifier, e.g. CASE-2026-001 or PEB-8842-A")
    model_id: Optional[str] = Field("01", description="Referenced 3D CT bone model tracking ID, e.g. '01'")
    patient_name: Optional[str] = Field(None, description="Full name or pseudonym")
    patient_age: Optional[int] = Field(None, ge=0, le=120, description="Age in years")
    patient_gender: Optional[str] = Field(None, description="Biological sex/gender")
    clinical_indication: Optional[str] = Field(
        "Pre-surgical evaluation for femoral osteotomy and arthroplasty",
        description="Clinical diagnosis and orthopedic indications"
    )
    procedure: Optional[str] = None
    condition: Optional[str] = None
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    status: Optional[str] = "active"

class CaseCreate(CaseBase):
    initial_biomarkers: Optional[Dict[str, Any]] = None
    pth: Optional[float] = None
    vitaminD: Optional[float] = None
    vitamin_d: Optional[float] = None
    calcium: Optional[float] = None
    phosphate: Optional[float] = None
    alp: Optional[float] = None
    tsh: Optional[float] = None
    free_t4: Optional[float] = None
    ctx: Optional[float] = None

class CaseUpdate(BaseModel):
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    clinical_indication: Optional[str] = None
    procedure: Optional[str] = None
    condition: Optional[str] = None
    model_id: Optional[str] = None
    status: Optional[str] = None

class CaseResponse(CaseBase):
    id: Optional[str] = Field(None, alias="_id")
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True, extra="allow")

class FullCaseResponse(CaseResponse):
    model: Optional[Dict[str, Any]] = None
    biomarker: Optional[Dict[str, Any]] = None
    assessment: Optional[Dict[str, Any]] = None
    roi: Optional[List[Dict[str, Any]]] = []
    annotations: Optional[List[Dict[str, Any]]] = []
    simulation: Optional[Dict[str, Any]] = None
    model_config = ConfigDict(populate_by_name=True, extra="allow")

class ROIBase(BaseModel):
    region_name: str = Field("femoral-neck", description="ROI region identifier, e.g. proximal-femur, femoral-neck, shaft")
    cortical_thickness_mm: Optional[float] = None
    trabecular_v_bmd: Optional[float] = None
    risk_level: Optional[str] = "moderate"
    observation: Optional[str] = None
    recommendation: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = None

class ROICreate(ROIBase):
    pass

class ROIUpdate(BaseModel):
    region_name: Optional[str] = None
    cortical_thickness_mm: Optional[float] = None
    trabecular_v_bmd: Optional[float] = None
    risk_level: Optional[str] = None
    observation: Optional[str] = None
    recommendation: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = None

class ROIResponse(ROIBase):
    id: Optional[str] = Field(None, alias="_id")
    case_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    model_config = ConfigDict(populate_by_name=True, extra="allow")

class AnnotationBase(BaseModel):
    text: str = Field(..., description="Clinician note or 3D annotation text")
    author: Optional[str] = Field("Orthopedic Surgeon", description="Author title or doctor name")
    region_id: Optional[str] = Field("proximal-femur", description="Associated anatomical ROI")
    position: Optional[Dict[str, float]] = None
    note_type: Optional[str] = "clinical"

class AnnotationCreate(AnnotationBase):
    pass

class AnnotationUpdate(BaseModel):
    text: Optional[str] = None
    author: Optional[str] = None
    region_id: Optional[str] = None
    position: Optional[Dict[str, float]] = None
    note_type: Optional[str] = None

class AnnotationResponse(AnnotationBase):
    id: Optional[str] = Field(None, alias="_id")
    case_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    model_config = ConfigDict(populate_by_name=True, extra="allow")

class SimulationBase(BaseModel):
    load_vector_n: Optional[float] = Field(4200.0, description="Axial/transverse load applied in Newtons")
    target_region: Optional[str] = "femoral_neck"
    yield_strength_n: Optional[float] = 3920.0
    failure_probability_pct: Optional[float] = 42.0
    risk_score: Optional[float] = 68.0
    implant_stability: Optional[str] = "augmented_indicated"
    recommendation: Optional[str] = None

class SimulationCreate(SimulationBase):
    pass

class SimulationUpdate(BaseModel):
    load_vector_n: Optional[float] = None
    target_region: Optional[str] = None
    yield_strength_n: Optional[float] = None
    failure_probability_pct: Optional[float] = None
    risk_score: Optional[float] = None
    implant_stability: Optional[str] = None
    recommendation: Optional[str] = None

class SimulationResponse(SimulationBase):
    id: Optional[str] = Field(None, alias="_id")
    case_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    model_config = ConfigDict(populate_by_name=True, extra="allow")

class CompleteCaseResponse(BaseModel):
    case: Dict[str, Any]
    biomarkers: Optional[Dict[str, Any]] = None
    bone_model: Optional[Dict[str, Any]] = None
    assessment: Optional[Dict[str, Any]] = None
    roi: List[Dict[str, Any]] = []
    annotations: List[Dict[str, Any]] = []
    simulation: Optional[Dict[str, Any]] = None
