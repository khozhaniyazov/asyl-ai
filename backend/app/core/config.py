from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Asyl AI - Logoped SaaS"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./asyl_ai.db"
    
    # Gemini AI
    GEMINI_API_KEY: str = ""
    
    # WhatsApp / Kaspi placeholers
    KASPI_API_KEY: str = ""
    WHATSAPP_API_TOKEN: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

settings = Settings()
