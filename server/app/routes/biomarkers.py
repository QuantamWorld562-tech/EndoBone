from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from app.schemas.biomarker_schema import BiomarkerCreate, BiomarkerUpdate, BiomarkerResponse
from app.services.biomarker_service import BiomarkerService

router = APIRouter(prefix="/biomarkers", tags=["Biomarkers"])

@router.get("", response_model=Dict[str, List[BiomarkerResponse]])
async def get_all_biomarkers():
    biomarkers = await BiomarkerService.list_biomarkers()
    return {"biomarkers": biomarkers}

@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_biomarker(biomarker_in: BiomarkerCreate):
    result = await BiomarkerService.create_biomarker(biomarker_in)
    if result.get("message") == "Case not found":
        raise HTTPException(status_code=404, detail=result.get("detail", "Case not found"))
    return result

@router.put("/{biomarker_id}", response_model=Dict[str, Any])
async def update_biomarker(biomarker_id: str, biomarker_update: BiomarkerUpdate):
    result = await BiomarkerService.update_biomarker(biomarker_id, biomarker_update)
    if result.get("message") == "Biomarker not found":
        raise HTTPException(status_code=404, detail=f"Biomarker record '{biomarker_id}' not found")
    return result
