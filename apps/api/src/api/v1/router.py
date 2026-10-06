from fastapi import APIRouter
from src.api.v1.endpoints import health, auth, user_library, providers, media, playback, local_media, settings

api_v1_router = APIRouter()

# Mount endpoints
api_v1_router.include_router(health.router, prefix="/health", tags=["health"])
api_v1_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_v1_router.include_router(user_library.router, prefix="/library", tags=["library"])
api_v1_router.include_router(providers.router, prefix="/providers", tags=["providers"])
api_v1_router.include_router(media.router, prefix="/media", tags=["media"])
api_v1_router.include_router(playback.router, prefix="/playback", tags=["playback"])
api_v1_router.include_router(local_media.router, prefix="/local", tags=["local"])
api_v1_router.include_router(settings.router, prefix="/settings", tags=["settings"])



