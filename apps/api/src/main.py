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
from src.api.v1.router import api_v1_router

setup_logging(debug=settings.DEBUG)
logger = logging.getLogger("media_hub.main")


from src.providers.registry import provider_registry
from src.providers.mock_provider import MockMediaHubProvider


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.VERSION} [{settings.APP_ENV}]")
    # Initialize default built-in providers
    provider_registry.register(MockMediaHubProvider())
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
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

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
            "api_v1": "/api/v1"
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
