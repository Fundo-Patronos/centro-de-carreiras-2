from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.core.config import settings
from app.api.routes import auth, mentors, jobs, bookings

app = FastAPI(
    title="Centro de Carreiras API",
    description="API para o Centro de Carreiras da Unicamp - Fundo Patronos",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Rotas
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(mentors.router, prefix="/api/mentors", tags=["Mentores"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Vagas"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Agendamentos"])

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "OK",
        "message": "Centro de Carreiras API está rodando",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Bem-vindo à API do Centro de Carreiras da Unicamp",
        "docs": "/api/docs"
    }
