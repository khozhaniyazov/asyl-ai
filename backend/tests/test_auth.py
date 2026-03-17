import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "newpassword123",
            "full_name": "New User",
            "clinic_name": "New Clinic"
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert "id" in data

@pytest.mark.asyncio
async def test_register_existing_user(client: AsyncClient, test_therapist):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": test_therapist.email,
            "password": "somepassword",
            "full_name": "Test Therapist duplicate",
        },
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

@pytest.mark.asyncio
async def test_login_user(client: AsyncClient, test_therapist):
    response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": test_therapist.email,
            "password": "password123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, test_therapist):
    response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": test_therapist.email,
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, token_headers: dict):
    response = await client.get("/api/v1/auth/me", headers=token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
