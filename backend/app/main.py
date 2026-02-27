"""Centro de Carreiras FastAPI Application."""

import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from .core.config import get_settings
from .core.logging import setup_logging, set_request_context, clear_request_context
from .api.v1.router import api_router

settings = get_settings()

# Setup structured logging
setup_logging(debug=settings.DEBUG)
logger = logging.getLogger(__name__)


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Middleware to set request context for logging and tracing."""

    async def dispatch(self, request: Request, call_next):
        # Generate request ID from header or create new one
        request_id = request.headers.get("X-Request-ID")
        request_id = set_request_context(request_id=request_id)

        # Add request ID to response headers
        start_time = time.time()

        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id

            # Log request completion
            duration_ms = (time.time() - start_time) * 1000
            logger.info(
                f"{request.method} {request.url.path} - {response.status_code}",
                extra={
                    "extra_fields": {
                        "method": request.method,
                        "path": request.url.path,
                        "status_code": response.status_code,
                        "duration_ms": round(duration_ms, 2),
                    }
                },
            )
            return response
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(
                f"{request.method} {request.url.path} - Error: {str(e)}",
                exc_info=True,
                extra={
                    "extra_fields": {
                        "method": request.method,
                        "path": request.url.path,
                        "duration_ms": round(duration_ms, 2),
                        "error": str(e),
                    }
                },
            )
            raise
        finally:
            clear_request_context()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="API para o Centro de Carreiras da Unicamp",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Parse CORS origins (supports comma-separated list)
cors_origins = [
    origin.strip()
    for origin in settings.FRONTEND_URL.split(",")
    if origin.strip()
]

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request context middleware (for logging and tracing)
app.add_middleware(RequestContextMiddleware)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    """Log application startup."""
    logger.info(
        f"Application started: {settings.APP_NAME}",
        extra={
            "extra_fields": {
                "app_name": settings.APP_NAME,
                "debug": settings.DEBUG,
                "cors_origins": cors_origins,
            }
        },
    )


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
