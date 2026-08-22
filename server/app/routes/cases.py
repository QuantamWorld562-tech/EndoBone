from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from app.schemas.case_schema import CaseCreate, CaseResponse, FullCaseResponse
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
