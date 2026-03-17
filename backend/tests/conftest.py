import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import AsyncGenerator

from app.main import app
from app.core.database import Base, get_db
from app.models.therapist import Therapist
from app.core.security import get_password_hash

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)

async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
async def prepare_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

@pytest.fixture
async def test_therapist(prepare_database) -> Therapist:
    async with TestingSessionLocal() as db:
        therapist = Therapist(
            email="test@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Test Therapist",
            clinic_name="Test Clinic"
        )
        db.add(therapist)
        await db.commit()
        await db.refresh(therapist)
        return therapist

@pytest.fixture
async def token_headers(client: AsyncClient, test_therapist: Therapist) -> dict:
    login_data = {
        "username": "test@example.com",
        "password": "password123",
    }
    r = await client.post("/api/v1/auth/login", data=login_data)
    tokens = r.json()
    a_token = tokens["access_token"]
    return {"Authorization": f"Bearer {a_token}"}
