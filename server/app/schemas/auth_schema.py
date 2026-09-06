from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    doctor = "doctor"
    professor = "professor"


class LoginRequest(BaseModel):
    email: str = Field(..., description="User's email address")
    password: str = Field(..., min_length=1, description="Account password")


class RegisterRequest(BaseModel):
    firstName: str = Field(..., min_length=1, description="First name")
    lastName: str = Field(..., min_length=1, description="Last name")
    email: str = Field(..., description="Email address")
    password: str = Field(..., min_length=4, description="Password — minimum 4 characters")
    licenseNumber: Optional[str] = Field(None, description="Medical license number")
    institution: Optional[str] = Field(None, description="Hospital / institution")
    role: Optional[UserRole] = Field(UserRole.doctor, description="User role (default: doctor)")


class GoogleLoginRequest(BaseModel):
    access_token: Optional[str] = Field(None, description="Google OAuth access token from frontend")
    email: Optional[str] = Field(None, description="Fallback Google account email")
    firstName: Optional[str] = Field("Clinician", description="First name")
    lastName: Optional[str] = Field("", description="Last name")
    licenseNumber: Optional[str] = Field(None, description="Medical license number")
    institution: Optional[str] = Field(None, description="Hospital / institution")


class DoctorProfile(BaseModel):
    id: str
    firstName: str
    lastName: str
    email: str
    role: UserRole = UserRole.doctor
    licenseNumber: Optional[str] = None
    institution: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    firstName: Optional[str] = Field(None, description="Updated first name")
    lastName: Optional[str] = Field(None, description="Updated last name")
    institution: Optional[str] = Field(None, description="Updated hospital / institution")
    licenseNumber: Optional[str] = Field(None, description="Updated medical license number")
    department: Optional[str] = Field(None, description="Department / surgical specialty")
    phone: Optional[str] = Field(None, description="Office contact phone number")


class AuthResponse(BaseModel):
    token: str
    doctor: DoctorProfile


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=8, description="Current password")
    new_password: str = Field(..., min_length=8, description="New password — minimum 8 characters")


class AdminUserProfile(BaseModel):
    """User profile returned to admins — NEVER includes password_hash."""
    id: str
    firstName: str
    lastName: str
    email: str
    role: UserRole = UserRole.doctor
    licenseNumber: Optional[str] = None
    institution: Optional[str] = None
    created_at: Optional[str] = None


class AdminUserListResponse(BaseModel):
    users: List[AdminUserProfile]
    total: int


class AdminEditUserRequest(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    institution: Optional[str] = None
    licenseNumber: Optional[str] = None
    role: Optional[UserRole] = None


class AdminStatsResponse(BaseModel):
    total_users: int = 0
    total_patients: int = 0
    total_assessments: int = 0
    admin_count: int = 0
    doctor_count: int = 0
    professor_count: int = 0
