from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from app.schemas.case_schema import (
    CaseCreate, CaseResponse, FullCaseResponse,
    ROICreate, ROIUpdate, ROIResponse,
    AnnotationCreate, AnnotationUpdate, AnnotationResponse,
    SimulationCreate, SimulationUpdate, SimulationResponse,
    CompleteCaseResponse
)
from app.services.case_service import CaseService

router = APIRouter(prefix="/cases", tags=["Cases"])

@router.get("", response_model=Dict[str, List[CaseResponse]])
async def get_all_cases():
    cases = await CaseService.list_cases()
    return {"cases": cases}

@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_new_case(case_in: CaseCreate):
    created = await CaseService.create_case(case_in)
    return created

@router.get("/{case_id}", response_model=CaseResponse)
async def get_single_case(case_id: str):
    case_record = await CaseService.get_case_by_id(case_id)
    if not case_record:
        raise HTTPException(status_code=404, detail=f"Case with ID '{case_id}' not found")
    return case_record

@router.get("/{case_id}/full", response_model=FullCaseResponse)
async def get_full_case_view(case_id: str):
    full_case = await CaseService.get_full_case_view(case_id)
    if not full_case:
        raise HTTPException(status_code=404, detail=f"Case with ID '{case_id}' not found")
    return full_case

# ─────────────────────────────────────────────────────────────
# Module 4: Complete Case Retrieval
# ─────────────────────────────────────────────────────────────
@router.get("/{case_id}/complete", response_model=CompleteCaseResponse)
async def get_complete_case(case_id: str):
    """
    Dynamically gathers:
    Case ├── Biomarkers ├── Bone model ├── Assessment ├── ROI ├── Annotations └── Simulation
    """
    complete_case = await CaseService.get_complete_case(case_id)
    if not complete_case:
        raise HTTPException(status_code=404, detail=f"Case with ID '{case_id}' not found")
    return complete_case

# ─────────────────────────────────────────────────────────────
# Module 1: ROI Endpoints
# ─────────────────────────────────────────────────────────────
@router.get("/{case_id}/roi", response_model=Dict[str, List[ROIResponse]])
async def get_case_rois(case_id: str):
    rois = await CaseService.list_roi(case_id)
    return {"roi": rois}

@router.post("/{case_id}/roi", response_model=ROIResponse, status_code=status.HTTP_201_CREATED)
async def create_case_roi(case_id: str, roi_in: ROICreate):
    created = await CaseService.create_roi(case_id, roi_in)
    return created

@router.put("/{case_id}/roi/{roi_id}", response_model=ROIResponse)
async def update_case_roi(case_id: str, roi_id: str, roi_in: ROIUpdate):
    updated = await CaseService.update_roi(case_id, roi_id, roi_in)
    if not updated:
        raise HTTPException(status_code=404, detail=f"ROI '{roi_id}' for case '{case_id}' not found")
    return updated

@router.delete("/{case_id}/roi/{roi_id}", status_code=status.HTTP_200_OK)
async def delete_case_roi(case_id: str, roi_id: str):
    deleted = await CaseService.delete_roi(case_id, roi_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"ROI '{roi_id}' for case '{case_id}' not found")
    return {"message": "ROI deleted successfully", "id": roi_id}

# ─────────────────────────────────────────────────────────────
# Module 2: Annotations Endpoints
# ─────────────────────────────────────────────────────────────
@router.get("/{case_id}/annotations", response_model=Dict[str, List[AnnotationResponse]])
async def get_case_annotations(case_id: str):
    annotations = await CaseService.list_annotations(case_id)
    return {"annotations": annotations}

@router.post("/{case_id}/annotations", response_model=AnnotationResponse, status_code=status.HTTP_201_CREATED)
async def create_case_annotation(case_id: str, anno_in: AnnotationCreate):
    created = await CaseService.create_annotation(case_id, anno_in)
    return created

@router.put("/{case_id}/annotations/{annotation_id}", response_model=AnnotationResponse)
async def update_case_annotation(case_id: str, annotation_id: str, anno_in: AnnotationUpdate):
    updated = await CaseService.update_annotation(case_id, annotation_id, anno_in)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Annotation '{annotation_id}' for case '{case_id}' not found")
    return updated

@router.delete("/{case_id}/annotations/{annotation_id}", status_code=status.HTTP_200_OK)
async def delete_case_annotation(case_id: str, annotation_id: str):
    deleted = await CaseService.delete_annotation(case_id, annotation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Annotation '{annotation_id}' for case '{case_id}' not found")
    return {"message": "Annotation deleted successfully", "id": annotation_id}

# ─────────────────────────────────────────────────────────────
# Module 3: Simulation Endpoints
# ─────────────────────────────────────────────────────────────
@router.get("/{case_id}/simulation", response_model=Dict[str, List[SimulationResponse]])
async def get_case_simulations(case_id: str):
    simulations = await CaseService.list_simulations(case_id)
    return {"simulations": simulations}

@router.post("/{case_id}/simulation", response_model=SimulationResponse, status_code=status.HTTP_201_CREATED)
async def create_case_simulation(case_id: str, sim_in: SimulationCreate):
    created = await CaseService.create_simulation(case_id, sim_in)
    return created

@router.put("/{case_id}/simulation/{simulation_id}", response_model=SimulationResponse)
async def update_case_simulation(case_id: str, simulation_id: str, sim_in: SimulationUpdate):
    updated = await CaseService.update_simulation(case_id, simulation_id, sim_in)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Simulation '{simulation_id}' for case '{case_id}' not found")
    return updated
