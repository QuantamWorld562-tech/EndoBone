import time
import hashlib
import hmac
import json
import base64
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status
from app.schemas.auth_schema import LoginRequest, RegisterRequest, AuthResponse, DoctorProfile
from app.core.database import db_manager
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

import secrets

# ───────────────────────────────────────────────
# Lightweight JWT helpers (no external dependency)
# ───────────────────────────────────────────────
_SECRET = getattr(settings, "JWT_SECRET", "endobone-ai-secret-key-2026-production")


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _create_jwt(payload: Dict[str, Any]) -> str:
    header = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload["iat"] = int(time.time())
    payload["exp"] = int(time.time()) + 86400 * 7  # 7 days
    body = _b64url(json.dumps(payload).encode())
    sig = hmac.new(_SECRET.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
    return f"{header}.{body}.{_b64url(sig)}"


def _hash_password(password: str, salt: str = None) -> str:
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000).hex()
    return f"{salt}${key}"


def _verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash:
        return False
    if "$" in stored_hash:
        salt, _ = stored_hash.split("$", 1)
        return _hash_password(password, salt) == stored_hash
    # Backward compatibility with legacy unsalted SHA256 hashes
    legacy_hash = hashlib.sha256((_SECRET + password).encode()).hexdigest()
    legacy_hash_fallback = hashlib.sha256(("endobone-ai-secret-key-change-in-production" + password).encode()).hexdigest()
    return stored_hash == legacy_hash or stored_hash == legacy_hash_fallback


# ───────────────────────────────────────────────
# Routes
# ───────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register_doctor(req: RegisterRequest):
    """Register a new doctor account."""
    email_lower = req.email.strip().lower()

    # Check for existing user
    if db_manager.is_connected and db_manager.db is not None:
        existing = await db_manager.db.doctors.find_one({"email": email_lower})
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
    else:
        local = db_manager.get_local_data()
        doctors = local.get("doctors", [])
        if any(d["email"] == email_lower for d in doctors):
            raise HTTPException(status_code=409, detail="An account with this email already exists.")

    doc_id = f"doc_{int(time.time() * 1000)}"
    doctor_record = {
        "_id": doc_id,
        "firstName": req.firstName.strip(),
        "lastName": req.lastName.strip(),
        "email": email_lower,
        "password_hash": _hash_password(req.password),
        "licenseNumber": req.licenseNumber or "",
        "institution": req.institution or "",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    if db_manager.is_connected and db_manager.db is not None:
        await db_manager.db.doctors.insert_one(doctor_record)
    else:
        local = db_manager.get_local_data()
        local.setdefault("doctors", []).append(doctor_record)
        db_manager.save_local_data(local)

    profile = DoctorProfile(
        id=doc_id,
        firstName=doctor_record["firstName"],
        lastName=doctor_record["lastName"],
        email=doctor_record["email"],
        licenseNumber=doctor_record["licenseNumber"],
        institution=doctor_record["institution"],
    )
    token = _create_jwt({"sub": doc_id, "email": email_lower})
    return AuthResponse(token=token, doctor=profile)


@router.post("/login", response_model=AuthResponse)
async def login_doctor(req: LoginRequest):
    """Authenticate a doctor and return JWT token."""
    email_lower = req.email.strip().lower()
    doctor_record = None

    if db_manager.is_connected and db_manager.db is not None:
        doctor_record = await db_manager.db.doctors.find_one({"email": email_lower})
    else:
        local = db_manager.get_local_data()
        doctors = local.get("doctors", [])
        doctor_record = next((d for d in doctors if d["email"] == email_lower), None)

    if not doctor_record:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not _verify_password(req.password, doctor_record.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    doc_id = str(doctor_record.get("_id", ""))
    profile = DoctorProfile(
        id=doc_id,
        firstName=doctor_record.get("firstName", ""),
        lastName=doctor_record.get("lastName", ""),
        email=doctor_record.get("email", ""),
        licenseNumber=doctor_record.get("licenseNumber"),
        institution=doctor_record.get("institution"),
    )
    token = _create_jwt({"sub": doc_id, "email": email_lower})
    return AuthResponse(token=token, doctor=profile)
