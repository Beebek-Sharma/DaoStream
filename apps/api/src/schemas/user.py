from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Dict, Any
from datetime import datetime
from src.models.user import UserRole
from src.core.sanitizer import sanitize_text, sanitize_identifier


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)
    role: Optional[UserRole] = UserRole.USER
    preferences: Optional[Dict[str, Any]] = None

    @field_validator("username")
    @classmethod
    def sanitize_username(cls, v: str) -> str:
        clean = sanitize_identifier(v, max_length=50)
        if len(clean) < 3:
            raise ValueError("Username must contain at least 3 valid alphanumeric characters")
        return clean


class UserLogin(BaseModel):
    email_or_username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    preferences: Optional[Dict[str, Any]] = None


class UserRead(BaseModel):
    id: str
    email: str
    username: str
    role: UserRole
    is_active: bool
    is_superuser: bool
    preferences: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class TokenPayload(BaseModel):
    sub: str
    exp: int
