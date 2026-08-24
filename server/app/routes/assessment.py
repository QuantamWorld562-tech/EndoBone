import time
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.schemas.biomarker_schema import BiomarkerInput
from app.schemas.assessment_schema import ComprehensiveAssessmentResponse
from app.services.assessment_service import AssessmentService
from app.core.database import db_manager

router = APIRouter(tags=["Biomarker Rule Engine"])


# ─── Existing endpoints ───

@router.post("/assess", response_model=ComprehensiveAssessmentResponse)
async def assess_biomarkers(input_data: BiomarkerInput):
    """Executes Models 4, 5, and 6 rule engines over provided endocrine biomarkers."""
    return AssessmentService.assess_biomarkers(input_data)


@router.get("/reference-ranges", response_model=Dict[str, Dict[str, Any]])
async def get_reference_ranges():
    """Returns clinical laboratory reference ranges for Vitamin D, PTH, Calcium, Phosphate, and ALP."""
    return AssessmentService.get_reference_ranges()


# ─── New endpoints for frontend integration ───

class AnalyzeRequest(BaseModel):
    """Request body from frontend assessmentService.analyze()"""
    patientId: str = Field(..., description="Patient ID")
    biomarkers: Dict[str, Any] = Field(..., description="Biomarker values keyed by name")


class AiResults(BaseModel):
    risk_level: str = "moderate"
    target_region: str = "femoral_neck"
    anatomical_observations: Optional[str] = None
    metabolic_observations: Optional[str] = None
    contributing_factors: Optional[List[Dict[str, str]]] = None


class AnalyzeResponse(BaseModel):
    id: Optional[str] = None
    patientId: str
    overallQualityRisk: float = 0
    riskLevel: str = "low"
    aiResults: Optional[AiResults] = None
    selected_roi: Optional[str] = None
    planning_notes: Optional[str] = None
    createdAt: Optional[str] = None


class UpdateNotesRequest(BaseModel):
    planning_notes: Optional[str] = None
    selected_roi: Optional[str] = None


@router.post("/assessments/analyze", response_model=AnalyzeResponse)
async def analyze_patient_biomarkers(req: AnalyzeRequest):
    """
    Frontend-facing assessment endpoint.
    Accepts { patientId, biomarkers } from the UI, runs the rule engine,
    derives a risk score, and stores the result.
    """
    # Map frontend biomarker keys to BiomarkerInput fields
    bm = req.biomarkers
    bio_input = BiomarkerInput(
        vitamin_d=_get_num(bm, ["Vitamin D", "vitaminD", "vitamin_d"]),
        pth=_get_num(bm, ["PTH", "pth"]),
        calcium=_get_num(bm, ["Calcium", "calcium"]),
        phosphate=_get_num(bm, ["Phosphate", "phosphate"]),
        alp=_get_num(bm, ["ALP", "alp"]),
    )

    # Run the rule engine
    engine_result = AssessmentService.assess_biomarkers(bio_input)

    # Derive risk level from engine relationships
    detected_ids = [r.rule_id for r in engine_result.detected_relationships]
    risk_score = 30  # base
    if "R1_VITD_PTH_COMPENSATORY" in detected_ids:
        risk_score += 20
    if "R2_VITD_CALCIUM_ABSORPTION" in detected_ids:
        risk_score += 15
    if "R3_CALCIUM_PTH_FEEDBACK" in detected_ids:
        risk_score += 15
    if "R5_AUTONOMOUS_PTH_PATTERN" in detected_ids:
        risk_score += 25

    risk_score = min(max(risk_score, 15), 95)
    risk_level = "high" if risk_score >= 65 else "moderate" if risk_score >= 40 else "low"

    # Determine target region based on risk
    target_region = "femoral_neck" if risk_score >= 50 else "shaft"

    # Build observations from engine output
    observations = []
    for a in engine_result.individual_assessments:
        if a.status != "within_reference_context":
            observations.append(f"{a.biomarker}: {a.observation}")
    anatomical_obs = (
        f"Risk score {risk_score}/100. "
        + (" ".join(observations[:2]) if observations else "All biomarkers within normal range.")
    )

    # Build contributing factors from Module 6 explainability output
    contributing_factors = [
        {"factor": f.factor, "explanation": f.explanation}
        for f in engine_result.explainability
    ]

    assessment_id = f"assess_{int(time.time() * 1000)}"
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    ai_results_data = {
        "risk_level": risk_level,
        "target_region": target_region,
        "anatomical_observations": anatomical_obs,
        "metabolic_observations": "; ".join(
            r.relationship_observation for r in engine_result.detected_relationships
        ),
        "contributing_factors": contributing_factors,
    }

    record = {
        "_id": assessment_id,
        "patientId": req.patientId,
        "overallQualityRisk": risk_score,
        "riskLevel": risk_level,
        "aiResults": ai_results_data,
        "selected_roi": None,
        "planning_notes": None,
        "createdAt": now,
        "updatedAt": now,
        "engine_result": engine_result.model_dump(),
    }

    # Persist
    if db_manager.is_connected and db_manager.db is not None:
        await db_manager.db.assessments.insert_one(record)
    else:
        local = db_manager.get_local_data()
        local.setdefault("assessments", []).append(record)
        db_manager.save_local_data(local)

    return AnalyzeResponse(
        id=assessment_id,
        patientId=req.patientId,
        overallQualityRisk=risk_score,
        riskLevel=risk_level,
        aiResults=AiResults(**ai_results_data),
        selected_roi=None,
        planning_notes=None,
        createdAt=now,
    )


@router.put("/assessments/{assessment_id}/notes", response_model=AnalyzeResponse)
async def update_assessment_notes(assessment_id: str, req: UpdateNotesRequest):
    """Update planning notes and selected ROI for an existing assessment."""
    record = None

    if db_manager.is_connected and db_manager.db is not None:
        record = await db_manager.db.assessments.find_one({"_id": assessment_id})
        if record:
            update_fields = {"updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
            if req.planning_notes is not None:
                update_fields["planning_notes"] = req.planning_notes
            if req.selected_roi is not None:
                update_fields["selected_roi"] = req.selected_roi
            await db_manager.db.assessments.update_one(
                {"_id": assessment_id}, {"$set": update_fields}
            )
            record.update(update_fields)
    else:
        local = db_manager.get_local_data()
        assessments = local.get("assessments", [])
        for a in assessments:
            if a.get("_id") == assessment_id:
                record = a
                if req.planning_notes is not None:
                    a["planning_notes"] = req.planning_notes
                if req.selected_roi is not None:
                    a["selected_roi"] = req.selected_roi
                a["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                break
        if record:
            db_manager.save_local_data(local)

    if not record:
        raise HTTPException(status_code=404, detail=f"Assessment '{assessment_id}' not found")

    ai_results_raw = record.get("aiResults") or {}
    return AnalyzeResponse(
        id=str(record.get("_id", "")),
        patientId=record.get("patientId", ""),
        overallQualityRisk=record.get("overallQualityRisk", 0),
        riskLevel=record.get("riskLevel", "low"),
        aiResults=AiResults(**ai_results_raw) if ai_results_raw else None,
        selected_roi=record.get("selected_roi"),
        planning_notes=record.get("planning_notes"),
        createdAt=record.get("createdAt"),
    )


def _get_num(bm: Dict[str, Any], keys: List[str]) -> Optional[float]:
    """Extract a numeric value from biomarkers dict, trying multiple key variants."""
    for k in keys:
        val = bm.get(k)
        if val is not None:
            if isinstance(val, (int, float)):
                return float(val)
            if isinstance(val, dict):
                v = val.get("value")
                if v is not None:
                    try:
                        return float(v)
                    except (ValueError, TypeError):
                        pass
            try:
                return float(val)
            except (ValueError, TypeError):
                pass
    return None
