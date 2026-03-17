import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_appointment(client: AsyncClient, token_headers: dict):
    # Create patient first
    patient_res = await client.post(
        "/api/v1/patients/",
        headers=token_headers,
        json={"first_name": "Test", "last_name": "Patient"}
    )
    patient_id = patient_res.json()["id"]

    response = await client.post(
        "/api/v1/appointments/",
        headers=token_headers,
        json={
            "patient_id": patient_id,
            "start_time": "2026-03-20T10:00:00Z",
            "end_time": "2026-03-20T11:00:00Z",
            "status": "planned"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["patient_id"] == patient_id
    assert "id" in data

@pytest.mark.asyncio
async def test_create_appointment_wrong_patient(client: AsyncClient, token_headers: dict):
    # Try to create appointment for non-existent patient (or patient not belonging to therapist)
    response = await client.post(
        "/api/v1/appointments/",
        headers=token_headers,
        json={
            "patient_id": 9999,
            "start_time": "2026-03-20T10:00:00Z",
            "end_time": "2026-03-20T11:00:00Z"
        }
    )
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_generate_kaspi_link(client: AsyncClient, token_headers: dict):
    # Create patient and appointment
    patient_res = await client.post(
        "/api/v1/patients/",
        headers=token_headers,
        json={"first_name": "Test", "last_name": "Patient"}
    )
    patient_id = patient_res.json()["id"]

    appt_res = await client.post(
        "/api/v1/appointments/",
        headers=token_headers,
        json={
            "patient_id": patient_id,
            "start_time": "2026-03-20T10:00:00Z",
            "end_time": "2026-03-20T11:00:00Z"
        }
    )
    appt_id = appt_res.json()["id"]

    response = await client.post(
        f"/api/v1/appointments/{appt_id}/generate-kaspi-link",
        headers=token_headers
    )
    assert response.status_code == 200
    assert "kaspi_link" in response.json()
    assert "kaspi.kz/pay" in response.json()["kaspi_link"]
