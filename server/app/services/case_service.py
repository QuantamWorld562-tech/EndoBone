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
            if cases:
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

    # ─────────────────────────────────────────────────────────────
    # Module 1: ROI Management
    # ─────────────────────────────────────────────────────────────
    @staticmethod
    async def list_roi(case_id: str) -> List[Dict[str, Any]]:
        target = case_id.strip().lower()
        if db_manager.is_connected and db_manager.db is not None:
            cursor = db_manager.db.roi.find({"$or": [{"case_id": case_id}, {"case_id": target}]})
            items = await cursor.to_list(length=100)
            if items:
                for item in items:
                    item["_id"] = str(item["_id"])
                return items
        
        local_data = db_manager.get_local_data()
        rois = local_data.get("roi", [])
        return [r for r in rois if str(r.get("case_id", "")).lower() == target]

    @staticmethod
    async def create_roi(case_id: str, roi_in: Any) -> Dict[str, Any]:
        roi_dict = roi_in.model_dump() if hasattr(roi_in, "model_dump") else dict(roi_in)
        roi_dict["_id"] = f"roi_{int(time.time() * 1000)}"
        roi_dict["case_id"] = case_id
        roi_dict["created_at"] = datetime.utcnow().isoformat() + "Z"
        roi_dict["updated_at"] = roi_dict["created_at"]

        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.roi.insert_one(roi_dict)
            roi_dict["_id"] = str(roi_dict["_id"])
        else:
            local_data = db_manager.get_local_data()
            if "roi" not in local_data:
                local_data["roi"] = []
            local_data["roi"].append(roi_dict)
            db_manager.save_local_data(local_data)

        return roi_dict

    @staticmethod
    async def update_roi(case_id: str, roi_id: str, roi_in: Any) -> Optional[Dict[str, Any]]:
        update_fields = {k: v for k, v in (roi_in.model_dump() if hasattr(roi_in, "model_dump") else dict(roi_in)).items() if v is not None}
        update_fields["updated_at"] = datetime.utcnow().isoformat() + "Z"

        if db_manager.is_connected and db_manager.db is not None:
            res = await db_manager.db.roi.find_one_and_update(
                {"_id": roi_id, "$or": [{"case_id": case_id}, {"case_id": case_id.lower()}]},
                {"$set": update_fields},
                return_document=True
            )
            if res:
                res["_id"] = str(res["_id"])
                return res

        local_data = db_manager.get_local_data()
        rois = local_data.get("roi", [])
        for r in rois:
            if str(r.get("_id")) == str(roi_id):
                r.update(update_fields)
                db_manager.save_local_data(local_data)
                return r
        return None

    @staticmethod
    async def delete_roi(case_id: str, roi_id: str) -> bool:
        if db_manager.is_connected and db_manager.db is not None:
            res = await db_manager.db.roi.delete_one({"_id": roi_id})
            return res.deleted_count > 0

        local_data = db_manager.get_local_data()
        rois = local_data.get("roi", [])
        initial_len = len(rois)
        local_data["roi"] = [r for r in rois if str(r.get("_id")) != str(roi_id)]
        if len(local_data["roi"]) != initial_len:
            db_manager.save_local_data(local_data)
            return True
        return False

    # ─────────────────────────────────────────────────────────────
    # Module 2: Annotations Management
    # ─────────────────────────────────────────────────────────────
    @staticmethod
    async def list_annotations(case_id: str) -> List[Dict[str, Any]]:
        target = case_id.strip().lower()
        if db_manager.is_connected and db_manager.db is not None:
            cursor = db_manager.db.annotations.find({"$or": [{"case_id": case_id}, {"case_id": target}]})
            items = await cursor.to_list(length=100)
            if items:
                for item in items:
                    item["_id"] = str(item["_id"])
                return items

        local_data = db_manager.get_local_data()
        annos = local_data.get("annotations", [])
        return [a for a in annos if str(a.get("case_id", "")).lower() == target]

    @staticmethod
    async def create_annotation(case_id: str, anno_in: Any) -> Dict[str, Any]:
        anno_dict = anno_in.model_dump() if hasattr(anno_in, "model_dump") else dict(anno_in)
        anno_dict["_id"] = f"anno_{int(time.time() * 1000)}"
        anno_dict["case_id"] = case_id
        anno_dict["created_at"] = datetime.utcnow().isoformat() + "Z"
        anno_dict["updated_at"] = anno_dict["created_at"]

        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.annotations.insert_one(anno_dict)
            anno_dict["_id"] = str(anno_dict["_id"])
        else:
            local_data = db_manager.get_local_data()
            if "annotations" not in local_data:
                local_data["annotations"] = []
            local_data["annotations"].append(anno_dict)
            db_manager.save_local_data(local_data)

        return anno_dict

    @staticmethod
    async def update_annotation(case_id: str, anno_id: str, anno_in: Any) -> Optional[Dict[str, Any]]:
        update_fields = {k: v for k, v in (anno_in.model_dump() if hasattr(anno_in, "model_dump") else dict(anno_in)).items() if v is not None}
        update_fields["updated_at"] = datetime.utcnow().isoformat() + "Z"

        if db_manager.is_connected and db_manager.db is not None:
            res = await db_manager.db.annotations.find_one_and_update(
                {"_id": anno_id, "$or": [{"case_id": case_id}, {"case_id": case_id.lower()}]},
                {"$set": update_fields},
                return_document=True
            )
            if res:
                res["_id"] = str(res["_id"])
                return res

        local_data = db_manager.get_local_data()
        annos = local_data.get("annotations", [])
        for a in annos:
            if str(a.get("_id")) == str(anno_id):
                a.update(update_fields)
                db_manager.save_local_data(local_data)
                return a
        return None

    @staticmethod
    async def delete_annotation(case_id: str, anno_id: str) -> bool:
        if db_manager.is_connected and db_manager.db is not None:
            res = await db_manager.db.annotations.delete_one({"_id": anno_id})
            return res.deleted_count > 0

        local_data = db_manager.get_local_data()
        annos = local_data.get("annotations", [])
        initial_len = len(annos)
        local_data["annotations"] = [a for a in annos if str(a.get("_id")) != str(anno_id)]
        if len(local_data["annotations"]) != initial_len:
            db_manager.save_local_data(local_data)
            return True
        return False

    # ─────────────────────────────────────────────────────────────
    # Module 3: Simulation Management
    # ─────────────────────────────────────────────────────────────
    @staticmethod
    async def list_simulations(case_id: str) -> List[Dict[str, Any]]:
        target = case_id.strip().lower()
        if db_manager.is_connected and db_manager.db is not None:
            cursor = db_manager.db.simulations.find({"$or": [{"case_id": case_id}, {"case_id": target}]})
            items = await cursor.to_list(length=100)
            if items:
                for item in items:
                    item["_id"] = str(item["_id"])
                return items

        local_data = db_manager.get_local_data()
        sims = local_data.get("simulations", [])
        return [s for s in sims if str(s.get("case_id", "")).lower() == target]

    @staticmethod
    async def create_simulation(case_id: str, sim_in: Any) -> Dict[str, Any]:
        sim_dict = sim_in.model_dump() if hasattr(sim_in, "model_dump") else dict(sim_in)
        sim_dict["_id"] = f"sim_{int(time.time() * 1000)}"
        sim_dict["case_id"] = case_id
        sim_dict["created_at"] = datetime.utcnow().isoformat() + "Z"
        sim_dict["updated_at"] = sim_dict["created_at"]

        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.simulations.insert_one(sim_dict)
            sim_dict["_id"] = str(sim_dict["_id"])
        else:
            local_data = db_manager.get_local_data()
            if "simulations" not in local_data:
                local_data["simulations"] = []
            local_data["simulations"].append(sim_dict)
            db_manager.save_local_data(local_data)

        return sim_dict

    @staticmethod
    async def update_simulation(case_id: str, sim_id: str, sim_in: Any) -> Optional[Dict[str, Any]]:
        update_fields = {k: v for k, v in (sim_in.model_dump() if hasattr(sim_in, "model_dump") else dict(sim_in)).items() if v is not None}
        update_fields["updated_at"] = datetime.utcnow().isoformat() + "Z"

        if db_manager.is_connected and db_manager.db is not None:
            res = await db_manager.db.simulations.find_one_and_update(
                {"_id": sim_id, "$or": [{"case_id": case_id}, {"case_id": case_id.lower()}]},
                {"$set": update_fields},
                return_document=True
            )
            if res:
                res["_id"] = str(res["_id"])
                return res

        local_data = db_manager.get_local_data()
        sims = local_data.get("simulations", [])
        for s in sims:
            if str(s.get("_id")) == str(sim_id):
                s.update(update_fields)
                db_manager.save_local_data(local_data)
                return s
        return None

    # ─────────────────────────────────────────────────────────────
    # Module 4: Complete Case Retrieval
    # ─────────────────────────────────────────────────────────────
    @staticmethod
    async def get_complete_case(case_id: str) -> Optional[Dict[str, Any]]:
        full_view = await CaseService.get_full_case_view(case_id)
        if not full_view:
            return None

        # Fetch ROI, Annotations, and Simulations
        rois = await CaseService.list_roi(case_id)
        annotations = await CaseService.list_annotations(case_id)
        simulations = await CaseService.list_simulations(case_id)

        # Structure complete generic case
        case_data = {
            "case_id": full_view.get("case_id"),
            "model_id": full_view.get("model_id"),
            "patient_name": full_view.get("patient_name"),
            "patient_age": full_view.get("patient_age"),
            "patient_gender": full_view.get("patient_gender"),
            "clinical_indication": full_view.get("clinical_indication"),
            "status": full_view.get("status", "active"),
            "mrn": full_view.get("mrn"),
            "procedure": full_view.get("procedure"),
            "referral_date": full_view.get("referral_date"),
            "scheduled_date": full_view.get("scheduled_date"),
            "clinician": full_view.get("clinician"),
            "created_at": full_view.get("created_at"),
            "updated_at": full_view.get("updated_at"),
            "_id": full_view.get("_id") or full_view.get("id"),
        }

        return {
            "case": case_data,
            "biomarkers": full_view.get("biomarker"),
            "bone_model": full_view.get("model"),
            "assessment": full_view.get("assessment"),
            "roi": rois,
            "annotations": annotations,
            "simulation": simulations[0] if simulations else None,
        }

def patientCase_dict(c: Dict[str, Any]) -> Dict[str, Any]:
    res = dict(c)
    if "_id" in res:
        res["id"] = str(res["_id"])
    return res
