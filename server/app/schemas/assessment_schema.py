from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class IndividualAssessment(BaseModel):
    biomarker: str
    value: Optional[float]
    unit: str
    status: str
    observation: str

class DetectedRelationship(BaseModel):
    rule_id: str
    name: str
    involved_biomarkers: List[str]
    relationship_observation: str

class ExplainabilityFactor(BaseModel):
    factor: str
    explanation: str

class ComprehensiveAssessmentResponse(BaseModel):
    model_version: str = "Models 4, 5 & 6 (Multi-Biomarker Endocrine Engine)"
    individual_assessments: List[IndividualAssessment]
    detected_relationships: List[DetectedRelationship]
    explainability: List[ExplainabilityFactor]
    disclaimer: str
