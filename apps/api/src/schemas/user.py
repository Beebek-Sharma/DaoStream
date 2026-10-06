from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from datetime import datetime
from src.models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)
    role: Optional[UserRole] = UserRole.USER
    preferences: Optional[Dict[str, Any]] = None


class UserLogin(BaseModel):
    email_or_username: str
    password: str


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
