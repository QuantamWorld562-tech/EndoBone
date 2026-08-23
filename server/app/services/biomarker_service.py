import time
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.core.database import db_manager
from app.schemas.biomarker_schema import BiomarkerCreate, BiomarkerUpdate, BiomarkerInput
from app.ai.biomarker_engine import BiomarkerRuleEngine

class BiomarkerService:
    @staticmethod
    async def list_biomarkers() -> List[Dict[str, Any]]:
        if db_manager.is_connected and db_manager.db is not None:
            cursor = db_manager.db.biomarkers.find({})
            records = await cursor.to_list(length=200)
            if records:
                for r in records:
                    r["_id"] = str(r["_id"])
                return records
        
        local_data = db_manager.get_local_data()
        return local_data.get("biomarkers", [])

    @staticmethod
    async def get_biomarker_by_case_id(case_id: Optional[str]) -> Optional[Dict[str, Any]]:
        if not case_id:
            return None
        records = await BiomarkerService.list_biomarkers()
        target = case_id.strip().lower()
        for r in records:
            if str(r.get("case_id", "")).lower() == target or str(r.get("_id", "")).lower() == target:
                return r
        return None

    @staticmethod
    async def get_biomarker_by_id(biomarker_id: str) -> Optional[Dict[str, Any]]:
        records = await BiomarkerService.list_biomarkers()
        target = biomarker_id.strip().lower()
        for r in records:
            if str(r.get("_id", "")).lower() == target:
                return r
        return None

    @staticmethod
    async def create_biomarker(b_in: BiomarkerCreate) -> Dict[str, Any]:
        # Validate that case exists
        from app.services.case_service import CaseService
        c = await CaseService.get_case_by_id(b_in.case_id)
        if not c:
            return {"message": "Case not found", "detail": f"Case '{b_in.case_id}' does not exist"}

        # Run assessment
        assessment = BiomarkerRuleEngine.evaluate(
            BiomarkerInput(
                vitamin_d=b_in.vitamin_d,
                pth=b_in.pth,
                calcium=b_in.calcium,
                phosphate=b_in.phosphate,
                alp=b_in.alp
            )
        )

        b_dict = b_in.model_dump()
        b_dict["_id"] = f"bm_{int(time.time() * 1000)}"
        b_dict["updated_at"] = datetime.utcnow().isoformat() + "Z"
        b_dict["assessment"] = assessment.model_dump()

        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.biomarkers.insert_one(b_dict)
            b_dict["_id"] = str(b_dict["_id"])
        else:
            local_data = db_manager.get_local_data()
            local_data["biomarkers"].append(b_dict)
            db_manager.save_local_data(local_data)

        return b_dict

    @staticmethod
    async def update_biomarker(biomarker_id: str, b_update: BiomarkerUpdate) -> Dict[str, Any]:
        existing = await BiomarkerService.get_biomarker_by_id(biomarker_id)
        if not existing:
            return {"message": "Biomarker not found"}

        update_dict = {k: v for k, v in b_update.model_dump().items() if v is not None}
        merged = {**existing, **update_dict}
        
        # Recalculate assessment
        assessment = BiomarkerRuleEngine.evaluate(
            BiomarkerInput(
                vitamin_d=merged.get("vitamin_d"),
                pth=merged.get("pth"),
                calcium=merged.get("calcium"),
                phosphate=merged.get("phosphate"),
                alp=merged.get("alp")
            )
        )
        merged["assessment"] = assessment.model_dump()
        merged["updated_at"] = datetime.utcnow().isoformat() + "Z"

        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.biomarkers.replace_one({"_id": existing["_id"]}, merged)
        else:
            local_data = db_manager.get_local_data()
            for idx, r in enumerate(local_data.get("biomarkers", [])):
                if str(r.get("_id")) == str(biomarker_id):
                    local_data["biomarkers"][idx] = merged
                    break
            db_manager.save_local_data(local_data)

        return merged
