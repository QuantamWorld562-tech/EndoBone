from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class CaseBase(BaseModel):
    case_id: str = Field(..., description="Unique case identifier, e.g. CASE-2026-001")
    model_id: str = Field(..., description="Referenced 3D CT bone model tracking ID, e.g. '01'")
    patient_name: Optional[str] = Field("Anonymous Patient", description="Full name or pseudonym")
    patient_age: Optional[int] = Field(65, ge=0, le=120, description="Age in years")
    patient_gender: Optional[str] = Field("Female", description="Biological sex/gender")
    clinical_indication: Optional[str] = Field(
        "Pre-surgical evaluation for femoral osteotomy and arthroplasty",
        description="Clinical diagnosis and orthopedic indications"
    )

class CaseCreate(CaseBase):
    initial_biomarkers: Optional[Dict[str, Optional[float]]] = None

class CaseUpdate(BaseModel):
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    clinical_indication: Optional[str] = None
    model_id: Optional[str] = None

class CaseResponse(CaseBase):
    id: Optional[str] = Field(None, alias="_id")
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        populate_by_name = True

class FullCaseResponse(CaseResponse):
    model: Optional[Dict[str, Any]] = None
    biomarker: Optional[Dict[str, Any]] = None
    assessment: Optional[Dict[str, Any]] = None
