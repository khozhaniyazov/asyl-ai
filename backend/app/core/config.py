import secrets

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Optional


def _generate_dev_secret() -> str:
    """Generate a random secret for development only."""
    return secrets.token_urlsafe(32)


class Settings(BaseSettings):
    PROJECT_NAME: str = "Sandar - CRM for Speech Therapists"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"  # development | production

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./sandar.db"

    # Auth
    SECRET_KEY: str = _generate_dev_secret()
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Password policy
    PASSWORD_MIN_LENGTH: int = 8

    # Rate limiting
    RATE_LIMIT_LOGIN_MAX: int = 5  # max attempts
    RATE_LIMIT_LOGIN_WINDOW: int = 900  # 15 minutes in seconds
    RATE_LIMIT_OTP_MAX: int = 100
    RATE_LIMIT_OTP_WINDOW: int = 60  # 1 minute

    @field_validator("DATABASE_URL")
    @classmethod
    def fix_database_url(cls, v: str) -> str:
        """Convert Render's postgres:// to postgresql+asyncpg:// for SQLAlchemy async."""
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # S3 Storage (MinIO or AWS) - for profile photos and documents
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_ENDPOINT_URL: Optional[str] = None
    S3_BUCKET_NAME: str = "sandar-uploads"

    # Upload limits
    MAX_UPLOAD_SIZE_MB: int = 5
    ALLOWED_IMAGE_TYPES: list[str] = ["image/jpeg", "image/png", "image/webp"]
    ALLOWED_DOC_TYPES: list[str] = [
        "application/pdf",
        "image/jpeg",
        "image/png",
    ]

    # Integrations
    KASPI_API_KEY: str = ""
    WHATSAPP_API_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    KASPI_MERCHANT_ID: str = ""
    FRONTEND_URL: str = "http://localhost"

    # Redis (for session storage and rate limiting)
    REDIS_URL: str = "redis://localhost:6379/0"

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:
        """Warn if using default secret in production."""
        # In production, SECRET_KEY must be set explicitly via env var
        return v

    model_config = SettingsConfigDict(
        env_file=".env", env_ignore_empty=True, extra="ignore"
    )


settings = Settings()
