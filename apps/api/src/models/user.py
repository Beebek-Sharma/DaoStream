import uuid
import enum
from typing import Dict, Any, Optional, List, TYPE_CHECKING
from sqlalchemy import (
    String,
    Boolean,
    Enum,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.models.progress import WatchProgress, ReadingProgress


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"


class User(Base, TimestampMixin):
    """User account entity supporting role-based access and user-specific preferences."""
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    preferences: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    watch_progress: Mapped[List["WatchProgress"]] = relationship(
        "WatchProgress", back_populates="user", cascade="all, delete-orphan"
    )
    reading_progress: Mapped[List["ReadingProgress"]] = relationship(
        "ReadingProgress", back_populates="user", cascade="all, delete-orphan"
    )
