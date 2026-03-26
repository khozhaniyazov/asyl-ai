from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import router as api_router
from app.core.audit import AuditMiddleware
from app.core.security_headers import SecurityHeadersMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(AuditMiddleware)

if settings.ENVIRONMENT == "production":
    cors_origins = []
    if settings.FRONTEND_URL:
        cors_origins.append(settings.FRONTEND_URL)
else:
    cors_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost",
        "http://127.0.0.1",
    ]
# Add production frontend URL if configured
if settings.FRONTEND_URL and settings.FRONTEND_URL not in cors_origins:
    cors_origins.append(settings.FRONTEND_URL)
    # Also add HTTPS variant if HTTP was given, and vice versa
    if settings.FRONTEND_URL.startswith("https://"):
        cors_origins.append(settings.FRONTEND_URL.replace("https://", "http://"))
    elif settings.FRONTEND_URL.startswith("http://"):
        cors_origins.append(settings.FRONTEND_URL.replace("http://", "https://"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Asyl AI Logoped API is running"}
