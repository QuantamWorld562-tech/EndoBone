from typing import Optional
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(..., description="Doctor's email address")
    password: str = Field(..., min_length=8, description="Account password")


class RegisterRequest(BaseModel):
    firstName: str = Field(..., min_length=1, description="First name")
    lastName: str = Field(..., min_length=1, description="Last name")
    email: str = Field(..., description="Email address")
    password: str = Field(..., min_length=8, description="Password — minimum 8 characters")
    licenseNumber: Optional[str] = Field(None, description="Medical license number")
    institution: Optional[str] = Field(None, description="Hospital / institution")


class DoctorProfile(BaseModel):
    id: str
    firstName: str
    lastName: str
    email: str
    licenseNumber: Optional[str] = None
    institution: Optional[str] = None


class AuthResponse(BaseModel):
    token: str
    doctor: DoctorProfile
