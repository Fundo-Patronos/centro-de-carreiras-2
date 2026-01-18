from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    APP_NAME: str = "Centro de Carreiras API"
    DEBUG: bool = False

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # Firebase
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_SERVICE_ACCOUNT_PATH: str = "firebase-service-account.json"

    # Airtable
    AIRTABLE_API_TOKEN: str = ""
    AIRTABLE_BASE_ID: str = ""
    AIRTABLE_MENTORS_TABLE: str = "mentores_residentes_prod"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Singleton instance for easy imports
settings = get_settings()
