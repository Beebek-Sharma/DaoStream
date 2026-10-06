from fastapi import APIRouter, status
from pydantic import BaseModel
from datetime import datetime, timezone
from src.core.config import settings

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    environment: str
    debug: bool
    timestamp: datetime


@router.get("", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def check_health() -> HealthResponse:
    """Returns the operational status and environment metadata of the API service."""
    return HealthResponse(
        status="healthy",
        app=settings.APP_NAME,
        version=settings.VERSION,
        environment=settings.APP_ENV,
        debug=settings.DEBUG,
        timestamp=datetime.now(timezone.utc)
    )
