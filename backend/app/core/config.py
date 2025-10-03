from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Server
    PORT: int = 5000
    ENVIRONMENT: str = "development"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 dias

    # Airtable
    AIRTABLE_API_KEY: str
    AIRTABLE_BASE_ID: str

    # Email
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str
    FROM_EMAIL: str = "Centro de Carreiras <noreply@fundopatronos.org.br>"

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # Database (opcional para futuro)
    DATABASE_URL: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
