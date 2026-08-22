from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class LoginRequest(BaseModel):
    email: str = Field(..., description="Doctor's email address")
    password: str = Field(..., min_length=4, description="Account password")


class RegisterRequest(BaseModel):
    firstName: str = Field(..., min_length=1, description="First name")
    lastName: str = Field(..., min_length=1, description="Last name")
    email: str = Field(..., description="Email address")
    password: str = Field(..., min_length=4, description="Password")
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
