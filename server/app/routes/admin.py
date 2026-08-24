"""
Admin-only API routes.
All endpoints require a valid JWT with role=admin.
Passwords are NEVER exposed — only the system can verify them.
"""
import time
from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.auth_schema import (
    AdminUserProfile, AdminUserListResponse, AdminEditUserRequest,
    AdminStatsResponse,
)
from app.routes.auth import require_admin
from app.core.database import db_manager

router = APIRouter(prefix="/admin", tags=["Admin"])


def _safe_user_profile(doc: dict) -> AdminUserProfile:
    """Convert a doctor record to an admin-safe profile (no password_hash)."""
    return AdminUserProfile(
        id=str(doc.get("_id", "")),
        firstName=doc.get("firstName", ""),
        lastName=doc.get("lastName", ""),
        email=doc.get("email", ""),
        role=doc.get("role", "doctor"),
        licenseNumber=doc.get("licenseNumber"),
        institution=doc.get("institution"),
        created_at=doc.get("created_at"),
    )


# ── User Management ──────────────────────────────────────────────────────────

@router.get("/users", response_model=AdminUserListResponse)
async def list_users(admin=Depends(require_admin)):
    """List all registered users. Never returns password hashes."""
    users = []
    if db_manager.is_connected and db_manager.db is not None:
        cursor = db_manager.db.doctors.find({})
        async for doc in cursor:
            users.append(_safe_user_profile(doc))
    else:
        local = db_manager.get_local_data()
        for doc in local.get("doctors", []):
            users.append(_safe_user_profile(doc))
    return AdminUserListResponse(users=users, total=len(users))


@router.get("/users/{user_id}", response_model=AdminUserProfile)
async def get_user(user_id: str, admin=Depends(require_admin)):
    """Get a single user profile by ID. Never returns password hash."""
    doc = None
    if db_manager.is_connected and db_manager.db is not None:
        doc = await db_manager.db.doctors.find_one({"_id": user_id})
    else:
        local = db_manager.get_local_data()
        doc = next((d for d in local.get("doctors", []) if d.get("_id") == user_id), None)

    if not doc:
        raise HTTPException(status_code=404, detail="User not found.")
    return _safe_user_profile(doc)


@router.put("/users/{user_id}", response_model=AdminUserProfile)
async def update_user(user_id: str, req: AdminEditUserRequest, admin=Depends(require_admin)):
    """
    Admin edits a user's profile (name, email, role, institution, license).
    Admin CANNOT change a user's password — only the user themselves can.
    """
    update_data = {}
    if req.firstName is not None:
        update_data["firstName"] = req.firstName.strip()
    if req.lastName is not None:
        update_data["lastName"] = req.lastName.strip()
    if req.email is not None:
        update_data["email"] = req.email.strip().lower()
    if req.institution is not None:
        update_data["institution"] = req.institution.strip()
    if req.licenseNumber is not None:
        update_data["licenseNumber"] = req.licenseNumber.strip()
    if req.role is not None:
        update_data["role"] = req.role.value if hasattr(req.role, "value") else str(req.role)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update.")

    if db_manager.is_connected and db_manager.db is not None:
        result = await db_manager.db.doctors.find_one_and_update(
            {"_id": user_id}, {"$set": update_data}, return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="User not found.")
        return _safe_user_profile(result)
    else:
        local = db_manager.get_local_data()
        found = False
        doc = None
        for d in local.get("doctors", []):
            if d.get("_id") == user_id:
                d.update(update_data)
                doc = d
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail="User not found.")
        db_manager.save_local_data(local)
        return _safe_user_profile(doc)


@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(user_id: str, admin=Depends(require_admin)):
    """Delete a user account. Admins cannot delete themselves."""
    admin_id = admin.get("_id")
    if user_id == admin_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account.")

    if db_manager.is_connected and db_manager.db is not None:
        result = await db_manager.db.doctors.delete_one({"_id": user_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found.")
    else:
        local = db_manager.get_local_data()
        doctors = local.get("doctors", [])
        before = len(doctors)
        local["doctors"] = [d for d in doctors if d.get("_id") != user_id]
        if len(local["doctors"]) == before:
            raise HTTPException(status_code=404, detail="User not found.")
        db_manager.save_local_data(local)

    return {"message": f"User {user_id} deleted successfully."}


# ── Patient Data Access ───────────────────────────────────────────────────────

@router.get("/patients")
async def list_all_patients(admin=Depends(require_admin)):
    """List all patient cases across all doctors."""
    cases = []
    if db_manager.is_connected and db_manager.db is not None:
        cursor = db_manager.db.cases.find({})
        async for c in cursor:
            c["_id"] = str(c["_id"])
            cases.append(c)
    else:
        local = db_manager.get_local_data()
        cases = local.get("cases", [])
    return {"cases": cases, "total": len(cases)}


@router.get("/patients/{case_id}")
async def get_patient(case_id: str, admin=Depends(require_admin)):
    """Get full patient data including biomarkers."""
    patient = None
    biomarkers = None

    if db_manager.is_connected and db_manager.db is not None:
        patient = await db_manager.db.cases.find_one({"case_id": case_id})
        biomarkers = await db_manager.db.biomarkers.find_one({"case_id": case_id})
        if patient:
            patient["_id"] = str(patient["_id"])
        if biomarkers:
            biomarkers["_id"] = str(biomarkers["_id"])
    else:
        local = db_manager.get_local_data()
        patient = next((c for c in local.get("cases", []) if c.get("case_id") == case_id), None)
        biomarkers = next((b for b in local.get("biomarkers", []) if b.get("case_id") == case_id), None)

    if not patient:
        raise HTTPException(status_code=404, detail="Patient case not found.")
    return {"patient": patient, "biomarkers": biomarkers}


@router.put("/patients/{case_id}")
async def update_patient(case_id: str, updates: dict, admin=Depends(require_admin)):
    """Admin edits patient demographics or biomarkers."""
    # Separate patient fields from biomarker fields
    biomarker_keys = {"pth", "vitamin_d", "calcium", "phosphate", "alp", "tsh", "free_t4", "ctx"}
    patient_updates = {k: v for k, v in updates.items() if k not in biomarker_keys and k != "_id"}
    biomarker_updates = {k: v for k, v in updates.items() if k in biomarker_keys}

    if db_manager.is_connected and db_manager.db is not None:
        if patient_updates:
            await db_manager.db.cases.update_one({"case_id": case_id}, {"$set": patient_updates})
        if biomarker_updates:
            biomarker_updates["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            await db_manager.db.biomarkers.update_one(
                {"case_id": case_id}, {"$set": biomarker_updates}, upsert=True
            )
    else:
        local = db_manager.get_local_data()
        if patient_updates:
            for c in local.get("cases", []):
                if c.get("case_id") == case_id:
                    c.update(patient_updates)
                    break
        if biomarker_updates:
            found = False
            for b in local.get("biomarkers", []):
                if b.get("case_id") == case_id:
                    b.update(biomarker_updates)
                    found = True
                    break
            if not found:
                biomarker_updates["case_id"] = case_id
                local.setdefault("biomarkers", []).append(biomarker_updates)
        db_manager.save_local_data(local)

    return {"message": f"Patient {case_id} updated successfully."}


# ── Dashboard Stats ───────────────────────────────────────────────────────────

@router.get("/stats", response_model=AdminStatsResponse)
async def get_stats(admin=Depends(require_admin)):
    """Get aggregate statistics for the admin dashboard."""
    total_users = 0
    admin_count = 0
    doctor_count = 0
    professor_count = 0
    total_patients = 0
    total_assessments = 0

    if db_manager.is_connected and db_manager.db is not None:
        total_users = await db_manager.db.doctors.count_documents({})
        admin_count = await db_manager.db.doctors.count_documents({"role": "admin"})
        doctor_count = await db_manager.db.doctors.count_documents({"role": {"$in": ["doctor", None]}})
        professor_count = await db_manager.db.doctors.count_documents({"role": "professor"})
        total_patients = await db_manager.db.cases.count_documents({})
        total_assessments = await db_manager.db.assessments.count_documents({})
    else:
        local = db_manager.get_local_data()
        doctors = local.get("doctors", [])
        total_users = len(doctors)
        admin_count = sum(1 for d in doctors if d.get("role") == "admin")
        doctor_count = sum(1 for d in doctors if d.get("role", "doctor") == "doctor")
        professor_count = sum(1 for d in doctors if d.get("role") == "professor")
        total_patients = len(local.get("cases", []))
        total_assessments = len(local.get("assessments", []))

    return AdminStatsResponse(
        total_users=total_users,
        total_patients=total_patients,
        total_assessments=total_assessments,
        admin_count=admin_count,
        doctor_count=doctor_count,
        professor_count=professor_count,
    )
