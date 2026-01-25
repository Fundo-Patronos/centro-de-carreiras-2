"""API v1 router combining all endpoints."""

from fastapi import APIRouter

from .auth import router as auth_router
from .users import router as users_router
from .mentors import router as mentors_router
from .admin import router as admin_router
from .sessions import router as sessions_router
from .feedback import router as feedback_router

api_router = APIRouter()

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(mentors_router)
api_router.include_router(admin_router)
api_router.include_router(sessions_router)
api_router.include_router(feedback_router)
