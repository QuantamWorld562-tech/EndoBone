import time
import hashlib
import hmac
import json
import base64
import secrets
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Header
from app.schemas.auth_schema import (
    LoginRequest, RegisterRequest, AuthResponse, DoctorProfile,
    ChangePasswordRequest, UserRole,
)
from app.core.database import db_manager
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ───────────────────────────────────────────────
# Lightweight JWT helpers (no external dependency)
# ───────────────────────────────────────────────
_SECRET = getattr(settings, "JWT_SECRET", "endobone-ai-secret-key-2026-production")


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)


def _create_jwt(payload: Dict[str, Any]) -> str:
    header = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload["iat"] = int(time.time())
    payload["exp"] = int(time.time()) + 86400 * 7  # 7 days
    body = _b64url(json.dumps(payload).encode())
    sig = hmac.new(_SECRET.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
    return f"{header}.{body}.{_b64url(sig)}"


def verify_jwt(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify a JWT token. Returns payload dict or None."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, body_b64, sig_b64 = parts
        expected_sig = hmac.new(
            _SECRET.encode(), f"{header_b64}.{body_b64}".encode(), hashlib.sha256
        ).digest()
        actual_sig = _b64url_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        payload = json.loads(_b64url_decode(body_b64))
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload
    except Exception:
        return None


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


async def get_current_user(authorization: str = Header(None)):
    """Extract and verify user from Authorization header. Returns doctor record."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header.")
    token = authorization.replace("Bearer ", "")
    payload = verify_jwt(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload.")

    doctor_record = None
    if db_manager.is_connected and db_manager.db is not None:
        doctor_record = await db_manager.db.doctors.find_one({"_id": user_id})
    else:
        local = db_manager.get_local_data()
        doctors = local.get("doctors", [])
        doctor_record = next((d for d in doctors if d.get("_id") == user_id), None)

    if not doctor_record:
        raise HTTPException(status_code=401, detail="User not found.")
    return doctor_record


async def require_admin(authorization: str = Header(None)):
    """Dependency that ensures the current user is an admin."""
    user = await get_current_user(authorization)
    if user.get("role", "doctor") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


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
    role = req.role or UserRole.doctor
    doctor_record = {
        "_id": doc_id,
        "firstName": req.firstName.strip(),
        "lastName": req.lastName.strip(),
        "email": email_lower,
        "password_hash": _hash_password(req.password),
        "role": role.value if hasattr(role, "value") else str(role),
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
        role=doctor_record["role"],
        licenseNumber=doctor_record["licenseNumber"],
        institution=doctor_record["institution"],
    )
    token = _create_jwt({"sub": doc_id, "email": email_lower, "role": doctor_record["role"]})
    return AuthResponse(token=token, doctor=profile)


@router.post("/login", response_model=AuthResponse)
async def login_doctor(req: LoginRequest):
    """Authenticate a user and return JWT token with role."""
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
    role = doctor_record.get("role", "doctor")
    profile = DoctorProfile(
        id=doc_id,
        firstName=doctor_record.get("firstName", ""),
        lastName=doctor_record.get("lastName", ""),
        email=doctor_record.get("email", ""),
        role=role,
        licenseNumber=doctor_record.get("licenseNumber"),
        institution=doctor_record.get("institution"),
    )
    token = _create_jwt({"sub": doc_id, "email": email_lower, "role": role})
    return AuthResponse(token=token, doctor=profile)


@router.put("/change-password")
async def change_password(req: ChangePasswordRequest, authorization: str = Header(None)):
    """User changes their own password. Requires current password verification."""
    user = await get_current_user(authorization)
    user_id = user.get("_id")

    # Verify old password
    if not _verify_password(req.old_password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")

    new_hash = _hash_password(req.new_password)

    if db_manager.is_connected and db_manager.db is not None:
        await db_manager.db.doctors.update_one(
            {"_id": user_id}, {"$set": {"password_hash": new_hash}}
        )
    else:
        local = db_manager.get_local_data()
        for doc in local.get("doctors", []):
            if doc.get("_id") == user_id:
                doc["password_hash"] = new_hash
                break
        db_manager.save_local_data(local)

    return {"message": "Password changed successfully."}
