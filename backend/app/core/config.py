from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Asyl AI - Logoped SaaS"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./asyl_ai.db"
    
    # Auth
    SECRET_KEY: str = "your-super-secret-jwt-key-replace-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 11520 # 8 days
    
    # Gemini AI
    GEMINI_API_KEY: str = ""
    
    # S3 Storage (MinIO or AWS)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_ENDPOINT_URL: Optional[str] = None
    S3_BUCKET_NAME: str = "logoped-sessions"
    
    # WhatsApp / Kaspi placeholers
    KASPI_API_KEY: str = ""
    WHATSAPP_API_TOKEN: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

settings = Settings()
