import os
import secrets
import logging
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from typing import List, Optional
from pathlib import Path

logger = logging.getLogger("media_hub.config")


class Settings(BaseSettings):
    """Application settings with environment variable overrides."""

    model_config = SettingsConfigDict(
        env_file=(
            str(Path(__file__).resolve().parents[4] / ".env"),
            str(Path(".env")),
        ),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "DaoStream"
    APP_ENV: str = "development"
    APP_HOST: str = "127.0.0.1"
    APP_PORT: int = 8000
    DEBUG: bool = True
    VERSION: str = "0.1.0"

    # Security
    SECRET_KEY: str = "insecure-development-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/media_hub.db"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Storage
    MEDIA_STORAGE_PATH: str = "./data/media"
    BOOKS_STORAGE_PATH: str = "./data/books"

    # External Provider Credentials
    TMDB_API_KEY: Optional[str] = None
    TMDB_ACCESS_TOKEN: Optional[str] = None
    CONSUMET_API_URL: Optional[str] = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    def model_post_init(self, __context) -> None:
        if self.SECRET_KEY == "insecure-development-secret-key-change-in-production":
            if self.APP_ENV != "development":
                # In production or staging, never run with hardcoded secret key
                self.SECRET_KEY = secrets.token_hex(32)
                logger.critical(
                    "INSECURE SECRET_KEY detected in non-development environment! "
                    "Auto-generated a secure random cryptographic key for session isolation."
                )
            else:
                logger.warning("Running in development mode with default SECRET_KEY.")


settings = Settings()
