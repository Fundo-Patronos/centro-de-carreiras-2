"""Centro de Carreiras FastAPI Application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .api.v1.router import api_router

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="API para o Centro de Carreiras da Unicamp",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "app": settings.APP_NAME}


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "app": settings.APP_NAME,
        "version": "2.0.0",
        "docs": "/api/docs",
    }
