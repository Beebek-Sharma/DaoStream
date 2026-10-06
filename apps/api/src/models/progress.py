import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    String,
    Float,
    Boolean,
    ForeignKey,
    UniqueConstraint,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base, TimestampMixin


class WatchProgress(Base, TimestampMixin):
    """Tracks playback position, runtime duration, and completion status for movies and episodes."""
    __tablename__ = "watch_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "media_id", "episode_id", name="uq_user_media_episode_progress"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    media_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("media.id", ondelete="CASCADE"), nullable=False, index=True
    )
    episode_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("episodes.id", ondelete="CASCADE"), nullable=True, index=True
    )
    position: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # in seconds
    duration: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # in seconds
    percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # 0.0 to 100.0
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="watch_progress")
    media: Mapped["Media"] = relationship("Media")
    episode: Mapped[Optional["Episode"]] = relationship("Episode")


class ReadingProgress(Base, TimestampMixin):
    """Tracks reading progress, bookmark positions, and CFI locations for books and novels."""
    __tablename__ = "reading_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "book_id", name="uq_user_book_progress"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    book_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True
    )
    location: Mapped[str] = mapped_column(String(512), nullable=False)  # EPUB CFI or page number
    percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # 0.0 to 100.0
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    bookmarks: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="reading_progress")
    book: Mapped["Book"] = relationship("Book")
