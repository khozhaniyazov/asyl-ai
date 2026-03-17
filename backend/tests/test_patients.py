import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_patient(client: AsyncClient, token_headers: dict):
    response = await client.post(
        "/api/v1/patients/",
        headers=token_headers,
        json={
            "first_name": "John",
            "last_name": "Doe",
            "diagnosis": "Stuttering",
            "parent_phone": "+77001234567"
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"
    assert "id" in data
    assert "therapist_id" in data

@pytest.mark.asyncio
async def test_create_patient_unauthorized(client: AsyncClient):
    response = await client.post(
        "/api/v1/patients/",
        json={
            "first_name": "John",
            "last_name": "Doe"
        },
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_read_patients(client: AsyncClient, token_headers: dict):
    # First create a patient
    await client.post(
        "/api/v1/patients/",
        headers=token_headers,
        json={
            "first_name": "Jane",
            "last_name": "Doe"
        },
    )
    
    # Then read patients
    response = await client.get("/api/v1/patients/", headers=token_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["first_name"] == "Jane"
