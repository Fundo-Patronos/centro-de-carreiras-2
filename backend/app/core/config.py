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

    # Mixpanel Analytics
    MIXPANEL_TOKEN: str = ""

    # Resend Email Service
    RESEND_API_KEY: str = ""
    EMAIL_FROM_ADDRESS: str = "Centro de Carreiras <noreply@patronos.org>"
    EMAIL_ADMIN_CC: str = "contato@patronos.org"
    EMAIL_ADMIN_BCC: str = "gabriel.aquino@patronos.org"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra env vars not defined in Settings


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Singleton instance for easy imports
settings = get_settings()
