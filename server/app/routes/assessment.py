from typing import Dict, Any
from fastapi import APIRouter
from app.schemas.biomarker_schema import BiomarkerInput
from app.schemas.assessment_schema import ComprehensiveAssessmentResponse
from app.services.assessment_service import AssessmentService

router = APIRouter(tags=["Biomarker Rule Engine"])

@router.post("/assess", response_model=ComprehensiveAssessmentResponse)
async def assess_biomarkers(input_data: BiomarkerInput):
    """Executes Models 4, 5, and 6 rule engines over provided endocrine biomarkers."""
    return AssessmentService.assess_biomarkers(input_data)

@router.get("/reference-ranges", response_model=Dict[str, Dict[str, Any]])
async def get_reference_ranges():
    """Returns clinical laboratory reference ranges for Vitamin D, PTH, Calcium, Phosphate, and ALP."""
    return AssessmentService.get_reference_ranges()
