import uuid
from typing import Optional, List
from sqlalchemy import (
    String,
    Text,
    Boolean,
    Integer,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base, TimestampMixin


class Watchlist(Base, TimestampMixin):
    """User watchlist entry for bookmarked media to view later."""
    __tablename__ = "watchlists"
    __table_args__ = (
        UniqueConstraint("user_id", "media_id", name="uq_user_watchlist_media"),
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

    user: Mapped["User"] = relationship("User")
    media: Mapped["Media"] = relationship("Media")


class Favorite(Base, TimestampMixin):
    """User favorite entry for starred media titles."""
    __tablename__ = "favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "media_id", name="uq_user_favorite_media"),
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

    user: Mapped["User"] = relationship("User")
    media: Mapped["Media"] = relationship("Media")


class Collection(Base, TimestampMixin):
    """Custom user-curated collection/playlist grouping multiple media items."""
    __tablename__ = "collections"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship("User")
    items: Mapped[List["CollectionItem"]] = relationship(
        "CollectionItem", back_populates="collection", cascade="all, delete-orphan", order_by="CollectionItem.order"
    )


class CollectionItem(Base, TimestampMixin):
    """Item association inside a custom user collection."""
    __tablename__ = "collection_items"
    __table_args__ = (
        UniqueConstraint("collection_id", "media_id", name="uq_collection_media_item"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    collection_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("collections.id", ondelete="CASCADE"), nullable=False, index=True
    )
    media_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("media.id", ondelete="CASCADE"), nullable=False, index=True
    )
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    collection: Mapped[Collection] = relationship("Collection", back_populates="items")
    media: Mapped["Media"] = relationship("Media")
