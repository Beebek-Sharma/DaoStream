from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from contextlib import asynccontextmanager
import logging

from src.core.config import settings
from src.core.logging import setup_logging
from src.core.errors import (
    AppError,
    app_error_handler,
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)
from src.core.security_hardening import SecurityHeadersMiddleware, RateLimiterMiddleware
from src.core.security import get_password_hash
from src.db.base import Base
from src.db.session import engine, async_session_factory
import src.models  # Register all models on Base.metadata
from src.models.user import User, UserRole
from sqlalchemy import select, func
from src.api.v1.router import api_v1_router
from src.providers.registry import provider_registry
from src.providers.mock_provider import MockMediaHubProvider
from src.providers.openlibrary_provider import OpenLibraryProvider
from src.providers.tmdb_provider import TMDBProvider
from src.providers.local_provider import LocalMediaProvider

setup_logging(debug=settings.DEBUG)
logger = logging.getLogger("media_hub.main")


async def seed_default_accounts():
    """Ensure baseline admin and demo accounts are present on launch for frictionless operation."""
    try:
        async with async_session_factory() as session:
            admin_check = await session.execute(
                select(User).where(User.username == "admin")
            )
            admin_user = admin_check.scalar_one_or_none()
            if not admin_user:
                admin_user = User(
                    email="admin@mediahub.com",
                    username="admin",
                    hashed_password=get_password_hash("AdminPass123!"),
                    role=UserRole.ADMIN,
                    is_superuser=True,
                    is_active=True,
                    preferences={
                        "preferred_quality": "1080p",
                        "auto_play_next": True,
                        "default_subtitle_language": "en",
                        "reader_theme": "obsidian",
                        "reader_font_size": 18,
                        "reader_font_family": "sans",
                    },
                )
                session.add(admin_user)
                logger.info("Seeded initial Administrator account (admin@mediahub.com / AdminPass123!)")

            demo_check = await session.execute(
                select(User).where(User.username == "demo")
            )
            demo_user = demo_check.scalar_one_or_none()
            if not demo_user:
                demo_user = User(
                    email="demo@mediahub.com",
                    username="demo",
                    hashed_password=get_password_hash("DemoPass123!"),
                    role=UserRole.USER,
                    is_superuser=False,
                    is_active=True,
                    preferences={
                        "preferred_quality": "1080p",
                        "auto_play_next": True,
                        "default_subtitle_language": "en",
                        "reader_theme": "obsidian",
                        "reader_font_size": 18,
                        "reader_font_family": "sans",
                    },
                )
                session.add(demo_user)
                logger.info("Seeded initial Demo user account (demo@mediahub.com / DemoPass123!)")

            await session.commit()
    except Exception as exc:
        logger.error(f"Failed to seed default accounts: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.VERSION} [{settings.APP_ENV}]")

    # 1. Guarantee complete schema exists
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Seed baseline user accounts
    await seed_default_accounts()

    # 3. Register real external and local media providers
    provider_registry.register(OpenLibraryProvider())
    provider_registry.register(
        TMDBProvider(
            config={"api_key": settings.TMDB_API_KEY or settings.TMDB_ACCESS_TOKEN}
            if (settings.TMDB_API_KEY or settings.TMDB_ACCESS_TOKEN)
            else None
        )
    )
    provider_registry.register(LocalMediaProvider())

    yield
    logger.info(f"Shutting down {settings.APP_NAME}")


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        description="Unified personal media hub backend API.",
        lifespan=lifespan,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
        allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    )

    # Security Headers Middleware
    app.add_middleware(SecurityHeadersMiddleware)

    # Rate Limiting Middleware
    app.add_middleware(RateLimiterMiddleware)

    # Exception Handlers
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    # Mount API v1 router
    app.include_router(api_v1_router, prefix="/api/v1")

    @app.get("/")
    async def root():
        return {
            "name": settings.APP_NAME,
            "version": settings.VERSION,
            "status": "online",
            "api_v1": "/api/v1",
        }

    return app


app = create_application()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.DEBUG,
    )
