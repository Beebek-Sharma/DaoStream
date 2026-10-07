import uuid
import enum
from datetime import date
from typing import List, Optional, Dict, Any
from sqlalchemy import (
    String,
    Text,
    Float,
    Integer,
    Date,
    Enum,
    JSON,
    ForeignKey,
    UniqueConstraint,
    Boolean,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base, TimestampMixin


class MediaType(str, enum.Enum):
    MOVIE = "movie"
    SERIES = "series"
    ANIME = "anime"
    DRAMA = "drama"
    BOOK = "book"
    AUDIO = "audio"


class Media(Base, TimestampMixin):
    """Normalized core entity representing any media catalog item."""
    __tablename__ = "media"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    type: Mapped[MediaType] = mapped_column(Enum(MediaType), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    original_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    release_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    genres: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    poster: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    backdrop: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # in minutes
    metadata_payload: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships to type-specific entities
    movie: Mapped[Optional["Movie"]] = relationship(
        "Movie", back_populates="media", uselist=False, cascade="all, delete-orphan"
    )
    series: Mapped[Optional["Series"]] = relationship(
        "Series", back_populates="media", uselist=False, cascade="all, delete-orphan"
    )
    book: Mapped[Optional["Book"]] = relationship(
        "Book", back_populates="media", uselist=False, cascade="all, delete-orphan"
    )


class Movie(Base, TimestampMixin):
    """Movie-specific attributes and playable source link."""
    __tablename__ = "movies"

    id: Mapped[str] = mapped_column(
        String(36), ForeignKey("media.id", ondelete="CASCADE"), primary_key=True
    )
    video_codec: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    resolution: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    media: Mapped[Media] = relationship("Media", back_populates="movie")


class Series(Base, TimestampMixin):
    """TV Series, Anime, or Drama containing seasons and episodes."""
    __tablename__ = "series"

    id: Mapped[str] = mapped_column(
        String(36), ForeignKey("media.id", ondelete="CASCADE"), primary_key=True
    )
    total_seasons: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    media: Mapped[Media] = relationship("Media", back_populates="series")
    seasons: Mapped[List["Season"]] = relationship(
        "Season", back_populates="series", cascade="all, delete-orphan", order_by="Season.season_number"
    )


class Season(Base, TimestampMixin):
    """A season container belonging to a Series."""
    __tablename__ = "seasons"
    __table_args__ = (
        UniqueConstraint("series_id", "season_number", name="uq_series_season_number"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    series_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("series.id", ondelete="CASCADE"), nullable=False, index=True
    )
    season_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    poster: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    series: Mapped[Series] = relationship("Series", back_populates="seasons")
    episodes: Mapped[List["Episode"]] = relationship(
        "Episode", back_populates="season", cascade="all, delete-orphan", order_by="Episode.episode_number"
    )


class Episode(Base, TimestampMixin):
    """An individual episode belonging to a Season."""
    __tablename__ = "episodes"
    __table_args__ = (
        UniqueConstraint("season_id", "episode_number", name="uq_season_episode_number"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    season_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("seasons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    episode_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # in minutes/seconds
    still_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    season: Mapped[Season] = relationship("Season", back_populates="episodes")


class Book(Base, TimestampMixin):
    """Book or Novel entity with author and format attributes."""
    __tablename__ = "books"

    id: Mapped[str] = mapped_column(
        String(36), ForeignKey("media.id", ondelete="CASCADE"), primary_key=True
    )
    author: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    isbn: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    format: Mapped[str] = mapped_column(String(20), default="epub", nullable=False)
    page_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reading_sources: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)

    media: Mapped[Media] = relationship("Media", back_populates="book")
