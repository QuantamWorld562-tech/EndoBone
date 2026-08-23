import time
import random
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.core.database import db_manager
from app.schemas.case_schema import CaseCreate, CaseUpdate
from app.services.model_service import ModelService

# Seed mock cases for fallback support
FALLBACK_CASES = [
    {
        "_id": "PEB-8842-A",
        "case_id": "PEB-8842-A",
        "model_id": "01",
        "patient_name": "Eleanor Vance",
        "patient_age": 67,
        "patient_gender": "Female",
        "clinical_indication": "Total Hip Arthroplasty (THA)",
        "procedure": "Total Hip Arthroplasty (THA)",
        "status": "active",
        "created_at": "2026-02-15T08:30:00Z",
        "updated_at": "2026-02-15T08:30:00Z",
    },
    {
        "_id": "PEB-9104-M",
        "case_id": "PEB-9104-M",
        "model_id": "01",
        "patient_name": "Marcus Chen",
        "patient_age": 62,
        "patient_gender": "Male",
        "clinical_indication": "Proximal femur fracture fixation",
        "procedure": "Proximal femur fracture fixation",
        "status": "active",
        "created_at": "2026-02-18T10:15:00Z",
        "updated_at": "2026-02-18T10:15:00Z",
    },
    {
        "_id": "PEB-7721-F",
        "case_id": "PEB-7721-F",
        "model_id": "01",
        "patient_name": "Sarah Jenkins",
        "patient_age": 71,
        "patient_gender": "Female",
        "clinical_indication": "Revision arthroplasty planning",
        "procedure": "Revision arthroplasty planning",
        "status": "pending_review",
        "created_at": "2026-02-20T14:45:00Z",
        "updated_at": "2026-02-20T14:45:00Z",
    },
]

class CaseService:
    @staticmethod
    async def list_cases() -> List[Dict[str, Any]]:
        if db_manager.is_connected and db_manager.db is not None:
            cursor = db_manager.db.cases.find({})
            cases = await cursor.to_list(length=200)
            if cases:
                for c in cases:
                    c["_id"] = str(c["_id"])
                    if "id" not in c:
                        c["id"] = c["_id"]
                return cases
        
        # Fallback to local JSON storage
        local_data = db_manager.get_local_data()
        cases = local_data.get("cases", [])
        if not cases:
            return FALLBACK_CASES
        return cases

    @staticmethod
    async def get_case_by_id(case_id: str) -> Optional[Dict[str, Any]]:
        cases = await CaseService.list_cases()
        target = case_id.strip().lower()
        for c in cases:
            c_id = str(c.get("_id", "")).lower()
            c_case_id = str(c.get("case_id", "")).lower()
            if c_id == target or c_case_id == target:
                return c
        
        for fc in FALLBACK_CASES:
            if fc["case_id"].lower() == target or fc["_id"].lower() == target:
                return fc

        # Generate on-the-fly record for valid format IDs
        gender = "Female" if "-F" in case_id.upper() else "Male" if "-M" in case_id.upper() else "Other"
        return {
            "_id": case_id,
            "id": case_id,
            "case_id": case_id,
            "model_id": "01",
            "patient_name": f"Patient {case_id}",
            "patient_age": 62,
            "patient_gender": gender,
            "clinical_indication": "Total Hip Arthroplasty (THA)",
            "procedure": "Total Hip Arthroplasty (THA)",
            "status": "active",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "updated_at": datetime.utcnow().isoformat() + "Z",
        }

    @staticmethod
    async def create_case(case_in: CaseCreate) -> Dict[str, Any]:
        case_dict = case_in.model_dump(exclude_unset=False)
        gender = case_dict.get("patient_gender") or case_dict.get("gender") or "Female"
        case_id = case_dict.get("case_id") or case_dict.get("id") or f"PEB-{random.randint(1000, 9999)}-{gender[0].upper()}"
        model_id = case_dict.get("model_id") or "01"
        patient_name = case_dict.get("patient_name") or case_dict.get("name") or f"Patient {case_id}"
        patient_age = case_dict.get("patient_age") or case_dict.get("age") or 58
        procedure = case_dict.get("procedure") or case_dict.get("clinical_indication") or "Total Hip Arthroplasty (THA)"

        case_dict["case_id"] = case_id
        case_dict["id"] = case_id
        case_dict["model_id"] = model_id
        case_dict["patient_name"] = patient_name
        case_dict["patient_age"] = patient_age
        case_dict["patient_gender"] = gender
        case_dict["clinical_indication"] = procedure
        case_dict["procedure"] = procedure
        case_dict["_id"] = case_id
        case_dict["status"] = case_dict.get("status") or "active"
        case_dict["created_at"] = datetime.utcnow().isoformat() + "Z"
        case_dict["updated_at"] = case_dict["created_at"]

        if db_manager.is_connected and db_manager.db is not None:
            await db_manager.db.cases.insert_one(case_dict)
            case_dict["_id"] = str(case_dict["_id"])
        else:
            local_data = db_manager.get_local_data()
            if "cases" not in local_data:
                local_data["cases"] = []
            local_data["cases"].append(case_dict)
            db_manager.save_local_data(local_data)

        # Create Biomarkers & AI rule assessment for the case
        init_bm = case_dict.get("initial_biomarkers") or {}
        pth = init_bm.get("pth") or case_dict.get("pth") or 72.0
        vitamin_d = init_bm.get("vitamin_d") or init_bm.get("vitaminD") or case_dict.get("vitamin_d") or case_dict.get("vitaminD") or 28.0
        calcium = init_bm.get("calcium") or case_dict.get("calcium") or 9.4
        phosphate = init_bm.get("phosphate") or case_dict.get("phosphate") or 3.2
        alp = init_bm.get("alp") or case_dict.get("alp") or 112.0
        ctx = init_bm.get("ctx") or case_dict.get("ctx") or 380.0

        from app.services.biomarker_service import BiomarkerService
        from app.schemas.biomarker_schema import BiomarkerCreate
        b_create = BiomarkerCreate(
            case_id=case_id,
            pth=float(pth),
            vitamin_d=float(vitamin_d),
            calcium=float(calcium),
            phosphate=float(phosphate),
            alp=float(alp),
            ctx=float(ctx)
        )
        await BiomarkerService.create_biomarker(b_create)

        # Create standard ROIs for 3D Bone Planning
        default_rois = [
            {
                "region_name": "femoral-neck",
                "cortical_thickness_mm": 2.1,
                "trabecular_v_bmd": 118.5,
                "risk_level": "high" if float(pth) > 65 else "moderate",
                "observation": "Cortical thinning observed at superior aspect of femoral neck.",
                "recommendation": "Consider augmented screw purchase or bone cement augmentation.",
                "coordinates": {"x": 24.5, "y": 88.2, "z": -12.4}
            },
            {
                "region_name": "greater-trochanter",
                "cortical_thickness_mm": 3.4,
                "trabecular_v_bmd": 156.0,
                "risk_level": "moderate",
                "observation": "Moderate trabecular rarefaction with preserved cortical rim.",
                "recommendation": "Standard fixation anchor seating appropriate.",
                "coordinates": {"x": 42.1, "y": 72.0, "z": -8.1}
            },
            {
                "region_name": "shaft",
                "cortical_thickness_mm": 5.8,
                "trabecular_v_bmd": 240.2,
                "risk_level": "low",
                "observation": "Robust cortical diaphyseal cylinder.",
                "recommendation": "Optimal bicortical screw purchase zone.",
                "coordinates": {"x": 12.0, "y": 15.0, "z": -4.0}
            }
        ]
        for roi_item in default_rois:
            await CaseService.create_roi(case_id, roi_item)

        # Create standard initial AI Annotations
        default_annos = [
            {
                "text": f"Pre-op 3D AI planning for {procedure}. Bone quality evaluation generated.",
                "author": "AI Surgical Planner",
                "region_id": "femoral-neck",
                "note_type": "clinical"
            },
            {
                "text": f"Metabolic risk flagged: PTH {pth} pg/mL. Verify implant primary stability.",
                "author": "EndoBone AI Engine",
                "region_id": "proximal-femur",
                "note_type": "metabolic"
            }
        ]
        for anno_item in default_annos:
            await CaseService.create_annotation(case_id, anno_item)

        # Create standard Simulation
        sim_data = {
            "load_vector_n": 4200.0,
            "target_region": "femoral_neck",
            "yield_strength_n": 3920.0,
            "failure_probability_pct": 38.5 if float(pth) > 65 else 18.2,
            "risk_score": 72.0 if float(pth) > 65 else 45.0,
            "implant_stability": "augmented_indicated" if float(pth) > 65 else "stable",
            "recommendation": "Augmented dual-geometry screw anchorage recommended under 4.2 kN peak load."
        }
        await CaseService.create_simulation(case_id, sim_data)

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
                    await BiomarkerService.get_biomarker_by_case_id(patient_case.get("_id")) or \
                    await BiomarkerService.get_biomarker_by_case_id(case_id)

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
        else:
            # Generate baseline assessment
            b_input = BiomarkerInput(vitamin_d=28.0, pth=72.0, calcium=9.4, phosphate=3.2, alp=112.0)
            assessment = BiomarkerRuleEngine.evaluate(b_input).model_dump()
            biomarker = {
                "case_id": case_id,
                "vitamin_d": 28.0,
                "pth": 72.0,
                "calcium": 9.4,
                "phosphate": 3.2,
                "alp": 112.0,
                "ctx": 380.0,
                "assessment": assessment
            }

        rois = await CaseService.list_roi(case_id)
        annotations = await CaseService.list_annotations(case_id)
        simulations = await CaseService.list_simulations(case_id)

        return {
            **patientCase_dict(patient_case),
            "model": model,
            "biomarker": biomarker,
            "assessment": assessment,
            "roi": rois,
            "annotations": annotations,
            "simulation": simulations[0] if simulations else None,
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
        filtered = [r for r in rois if str(r.get("case_id", "")).lower() == target]
        if not filtered:
            # Provide default femur ROIs if empty
            return [
                {
                    "_id": f"roi_1_{target}",
                    "case_id": case_id,
                    "region_name": "femoral-neck",
                    "cortical_thickness_mm": 2.1,
                    "trabecular_v_bmd": 118.5,
                    "risk_level": "high",
                    "observation": "Cortical thinning observed at superior aspect of femoral neck.",
                    "recommendation": "Consider augmented screw purchase or bone cement augmentation.",
                    "coordinates": {"x": 24.5, "y": 88.2, "z": -12.4}
                },
                {
                    "_id": f"roi_2_{target}",
                    "case_id": case_id,
                    "region_name": "greater-trochanter",
                    "cortical_thickness_mm": 3.4,
                    "trabecular_v_bmd": 156.0,
                    "risk_level": "moderate",
                    "observation": "Moderate trabecular rarefaction with preserved cortical rim.",
                    "recommendation": "Standard fixation anchor seating appropriate.",
                    "coordinates": {"x": 42.1, "y": 72.0, "z": -8.1}
                },
                {
                    "_id": f"roi_3_{target}",
                    "case_id": case_id,
                    "region_name": "shaft",
                    "cortical_thickness_mm": 5.8,
                    "trabecular_v_bmd": 240.2,
                    "risk_level": "low",
                    "observation": "Robust cortical diaphyseal cylinder.",
                    "recommendation": "Optimal bicortical screw purchase zone.",
                    "coordinates": {"x": 12.0, "y": 15.0, "z": -4.0}
                }
            ]
        return filtered

    @staticmethod
    async def create_roi(case_id: str, roi_in: Any) -> Dict[str, Any]:
        roi_dict = roi_in.model_dump() if hasattr(roi_in, "model_dump") else dict(roi_in)
        roi_dict["_id"] = f"roi_{int(time.time() * 1000)}_{random.randint(100, 999)}"
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
        filtered = [a for a in annos if str(a.get("case_id", "")).lower() == target]
        if not filtered:
            return [
                {
                    "_id": f"anno_1_{target}",
                    "case_id": case_id,
                    "text": "Pre-op 3D AI planning. Cortical geometry evaluated.",
                    "author": "AI Surgical Planner",
                    "region_id": "femoral-neck",
                    "note_type": "clinical",
                    "created_at": datetime.utcnow().isoformat() + "Z"
                }
            ]
        return filtered

    @staticmethod
    async def create_annotation(case_id: str, anno_in: Any) -> Dict[str, Any]:
        anno_dict = anno_in.model_dump() if hasattr(anno_in, "model_dump") else dict(anno_in)
        anno_dict["_id"] = f"anno_{int(time.time() * 1000)}_{random.randint(100, 999)}"
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
        filtered = [s for s in sims if str(s.get("case_id", "")).lower() == target]
        if not filtered:
            return [
                {
                    "_id": f"sim_1_{target}",
                    "case_id": case_id,
                    "load_vector_n": 4200.0,
                    "target_region": "femoral_neck",
                    "yield_strength_n": 3920.0,
                    "failure_probability_pct": 38.5,
                    "risk_score": 68.0,
                    "implant_stability": "augmented_indicated",
                    "recommendation": "Augmented dual-geometry screw anchorage recommended under 4.2 kN peak load."
                }
            ]
        return filtered

    @staticmethod
    async def create_simulation(case_id: str, sim_in: Any) -> Dict[str, Any]:
        sim_dict = sim_in.model_dump() if hasattr(sim_in, "model_dump") else dict(sim_in)
        sim_dict["_id"] = f"sim_{int(time.time() * 1000)}_{random.randint(100, 999)}"
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
            "mrn": full_view.get("mrn") or full_view.get("case_id"),
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
