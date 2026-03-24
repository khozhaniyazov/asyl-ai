from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Asyl AI - Logoped SaaS"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./asyl_ai.db"

    # Auth
    SECRET_KEY: str = "your-super-secret-jwt-key-replace-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 11520  # 8 days

    # AI Keys
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: Optional[str] = None

    # S3 Storage (MinIO or AWS)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_ENDPOINT_URL: Optional[str] = None
    S3_BUCKET_NAME: str = "logoped-sessions"

    # Integrations
    KASPI_API_KEY: str = ""
    WHATSAPP_API_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    KASPI_MERCHANT_ID: str = ""
    FRONTEND_URL: str = "http://localhost"

    # Celery + Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    model_config = SettingsConfigDict(
        env_file=".env", env_ignore_empty=True, extra="ignore"
    )


settings = Settings()
