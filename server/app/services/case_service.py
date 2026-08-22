import time
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.core.database import db_manager
from app.schemas.case_schema import CaseCreate, CaseUpdate
from app.services.model_service import ModelService

class CaseService:
    @staticmethod
    async def list_cases() -> List[Dict[str, Any]]:
        if db_manager.is_connected and db_manager.db is not None:
            cursor = db_manager.db.cases.find({})
            cases = await cursor.to_list(length=200)
            for c in cases:
                c["_id"] = str(c["_id"])
            return cases
        
        # Fallback to local JSON storage
        local_data = db_manager.get_local_data()
        return local_data.get("cases", [])

    @staticmethod
    async def get_case_by_id(case_id: str) -> Optional[Dict[str, Any]]:
        cases = await CaseService.list_cases()
        target = case_id.strip().lower()
        for c in cases:
            c_id = str(c.get("_id", "")).lower()
            c_case_id = str(c.get("case_id", "")).lower()
            if c_id == target or c_case_id == target:
                return c
        return None

    @staticmethod
    async def create_case(case_in: CaseCreate) -> Dict[str, Any]:
        case_dict = case_in.model_dump()
        case_dict["_id"] = f"case_{int(time.time() * 1000)}"
        case_dict["created_at"] = datetime.utcnow().isoformat() + "Z"
        case_dict["updated_at"] = case_dict["created_at"]

        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.cases.insert_one(case_dict)
            case_dict["_id"] = str(case_dict["_id"])
        else:
            local_data = db_manager.get_local_data()
            local_data["cases"].append(case_dict)
            db_manager.save_local_data(local_data)

        return case_dict

    @staticmethod
    async def get_full_case_view(case_id: str) -> Optional[Dict[str, Any]]:
        patient_case = await CaseService.get_case_by_id(case_id)
        if not patient_case:
            return None

        model_id = patient_case.get("model_id", "01")
        model = ModelService.get_model_by_id(model_id)

        # Retrieve biomarker
        from app.services.biomarker_service import BiomarkerService
        biomarker = await BiomarkerService.get_biomarker_by_case_id(patient_case.get("case_id")) or \
                    await BiomarkerService.get_biomarker_by_case_id(patient_case.get("_id"))

        from app.ai.biomarker_engine import BiomarkerRuleEngine
        from app.schemas.biomarker_schema import BiomarkerInput
        assessment = None
        if biomarker:
            b_input = BiomarkerInput(
                vitamin_d=biomarker.get("vitamin_d"),
                pth=biomarker.get("pth"),
                calcium=biomarker.get("calcium"),
                phosphate=biomarker.get("phosphate"),
                alp=biomarker.get("alp")
            )
            assessment = BiomarkerRuleEngine.evaluate(b_input).model_dump()

        return {
            **patientCase_dict(patient_case),
            "model": model,
            "biomarker": biomarker,
            "assessment": assessment
        }

def patientCase_dict(c: Dict[str, Any]) -> Dict[str, Any]:
    res = dict(c)
    if "_id" in res:
        res["id"] = str(res["_id"])
    return res
