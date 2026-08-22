from typing import Dict, Any
from app.schemas.biomarker_schema import BiomarkerInput
from app.schemas.assessment_schema import ComprehensiveAssessmentResponse
from app.ai.biomarker_engine import BiomarkerRuleEngine, REFERENCE_RANGES

class AssessmentService:
    @staticmethod
    def assess_biomarkers(input_data: BiomarkerInput) -> ComprehensiveAssessmentResponse:
        return BiomarkerRuleEngine.evaluate(input_data)

    @staticmethod
    def get_reference_ranges() -> Dict[str, Dict[str, Any]]:
        return REFERENCE_RANGES
