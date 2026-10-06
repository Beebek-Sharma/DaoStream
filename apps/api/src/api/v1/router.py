from fastapi import APIRouter
from src.api.v1.endpoints import health, auth, user_library, providers

api_v1_router = APIRouter()

# Mount endpoints
api_v1_router.include_router(health.router, prefix="/health", tags=["health"])
api_v1_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_v1_router.include_router(user_library.router, prefix="/library", tags=["library"])
api_v1_router.include_router(providers.router, prefix="/providers", tags=["providers"])

