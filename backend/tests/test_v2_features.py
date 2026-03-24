import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_package(client: AsyncClient, token_headers: dict, test_therapist):
    # First create a patient
    patient_resp = await client.post(
        "/api/v1/patients/",
        json={"first_name": "Алия", "last_name": "Нурланова", "diagnosis": "Дизартрия"},
        headers=token_headers,
    )
    assert patient_resp.status_code == 200
    patient_id = patient_resp.json()["id"]

    # Create a package
    resp = await client.post(
        "/api/v1/packages/",
        json={
            "patient_id": patient_id,
            "total_sessions": 10,
            "price_per_session": 7000,
            "total_price": 70000,
            "payment_status": "paid",
        },
        headers=token_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_sessions"] == 10
    assert data["used_sessions"] == 0
    assert data["remaining_sessions"] == 10
    assert data["is_exhausted"] is False


@pytest.mark.asyncio
async def test_get_package_balance(
    client: AsyncClient, token_headers: dict, test_therapist
):
    # Create patient + package
    patient_resp = await client.post(
        "/api/v1/patients/",
        json={"first_name": "Бекзат", "last_name": "Ахметов"},
        headers=token_headers,
    )
    patient_id = patient_resp.json()["id"]

    await client.post(
        "/api/v1/packages/",
        json={
            "patient_id": patient_id,
            "total_sessions": 8,
            "price_per_session": 5000,
            "total_price": 40000,
            "payment_status": "paid",
        },
        headers=token_headers,
    )

    resp = await client.get(
        f"/api/v1/packages/patient/{patient_id}/balance",
        headers=token_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["remaining_sessions"] == 8


@pytest.mark.asyncio
async def test_homework_template_crud(
    client: AsyncClient, token_headers: dict, test_therapist
):
    # Create
    resp = await client.post(
        "/api/v1/homework/templates/",
        json={
            "title": "Артикуляционная гимнастика",
            "description": "Базовые упражнения для языка",
            "category": "articulation",
            "instructions": "Выполнять 10 минут каждый день",
            "target_sounds": "Р,Л",
            "age_range": "4-7",
        },
        headers=token_headers,
    )
    assert resp.status_code == 200
    template_id = resp.json()["id"]
    assert resp.json()["title"] == "Артикуляционная гимнастика"

    # List
    resp = await client.get("/api/v1/homework/templates/", headers=token_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    # Update
    resp = await client.put(
        f"/api/v1/homework/templates/{template_id}",
        json={"title": "Обновлённая гимнастика"},
        headers=token_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Обновлённая гимнастика"

    # Delete
    resp = await client.delete(
        f"/api/v1/homework/templates/{template_id}",
        headers=token_headers,
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_homework_assignment_flow(
    client: AsyncClient, token_headers: dict, test_therapist
):
    # Create patient
    patient_resp = await client.post(
        "/api/v1/patients/",
        json={"first_name": "Дана", "last_name": "Серикова"},
        headers=token_headers,
    )
    patient_id = patient_resp.json()["id"]

    # Assign homework
    resp = await client.post(
        "/api/v1/homework/assignments/",
        json={
            "patient_id": patient_id,
            "custom_instructions": "Делать упражнение 'грибок' 5 минут",
        },
        headers=token_headers,
    )
    assert resp.status_code == 200
    hw_id = resp.json()["id"]
    assert resp.json()["status"] == "assigned"

    # Parent completes
    resp = await client.post(
        f"/api/v1/homework/assignments/{hw_id}/complete",
        json={"parent_notes": "Выполнили все упражнения"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "completed"

    # Therapist verifies
    resp = await client.post(
        f"/api/v1/homework/assignments/{hw_id}/verify",
        json={"therapist_feedback": "Отлично, продолжайте"},
        headers=token_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "verified"


@pytest.mark.asyncio
async def test_sound_progress(client: AsyncClient, token_headers: dict, test_therapist):
    # Create patient
    patient_resp = await client.post(
        "/api/v1/patients/",
        json={"first_name": "Арман", "last_name": "Касымов"},
        headers=token_headers,
    )
    patient_id = patient_resp.json()["id"]

    # Create sound progress record
    resp = await client.post(
        "/api/v1/sound-progress/",
        json={
            "patient_id": patient_id,
            "sound": "Р",
            "stage": "isolation",
            "accuracy_percent": 40.0,
            "notes": "Звук появляется в изоляции",
        },
        headers=token_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["sound"] == "Р"
    assert resp.json()["stage"] == "isolation"

    # Get progress
    resp = await client.get(
        f"/api/v1/sound-progress/patient/{patient_id}",
        headers=token_headers,
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 1


@pytest.mark.asyncio
async def test_availability_crud(
    client: AsyncClient, token_headers: dict, test_therapist
):
    # Create slot
    resp = await client.post(
        "/api/v1/availability/",
        json={"day_of_week": 0, "start_time": "09:00", "end_time": "13:00"},
        headers=token_headers,
    )
    assert resp.status_code == 200
    slot_id = resp.json()["id"]
    assert resp.json()["start_time"] == "09:00"

    # List
    resp = await client.get("/api/v1/availability/", headers=token_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    # Delete
    resp = await client.delete(f"/api/v1/availability/{slot_id}", headers=token_headers)
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_waitlist(client: AsyncClient, token_headers: dict, test_therapist):
    # Create patient
    patient_resp = await client.post(
        "/api/v1/patients/",
        json={"first_name": "Нурай", "last_name": "Жумабаева"},
        headers=token_headers,
    )
    patient_id = patient_resp.json()["id"]

    # Add to waitlist
    resp = await client.post(
        "/api/v1/waitlist/",
        json={
            "patient_id": patient_id,
            "preferred_days": [0, 2, 4],
            "preferred_times": ["09:00-12:00"],
            "priority": 1,
            "notes": "Срочно нужен логопед",
        },
        headers=token_headers,
    )
    assert resp.status_code == 200
    entry_id = resp.json()["id"]
    assert resp.json()["status"] == "waiting"

    # List
    resp = await client.get("/api/v1/waitlist/", headers=token_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    # Remove
    resp = await client.delete(f"/api/v1/waitlist/{entry_id}", headers=token_headers)
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_cancellation(client: AsyncClient, token_headers: dict, test_therapist):
    # Create patient + appointment
    patient_resp = await client.post(
        "/api/v1/patients/",
        json={"first_name": "Тест", "last_name": "Пациент"},
        headers=token_headers,
    )
    patient_id = patient_resp.json()["id"]

    appt_resp = await client.post(
        "/api/v1/appointments/",
        json={
            "patient_id": patient_id,
            "start_time": "2026-03-25T10:00:00",
            "end_time": "2026-03-25T10:45:00",
        },
        headers=token_headers,
    )
    appt_id = appt_resp.json()["id"]

    # Cancel
    resp = await client.post(
        "/api/v1/cancellations/",
        json={
            "appointment_id": appt_id,
            "type": "cancellation",
            "reason": "Болезнь",
            "cancelled_by": "parent",
        },
        headers=token_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["type"] == "cancellation"

    # Verify appointment status changed
    appt_resp = await client.get(
        f"/api/v1/appointments/{appt_id}", headers=token_headers
    )
    assert appt_resp.json()["status"] == "cancelled"


@pytest.mark.asyncio
async def test_appointment_auto_session_number(
    client: AsyncClient, token_headers: dict, test_therapist
):
    # Create patient
    patient_resp = await client.post(
        "/api/v1/patients/",
        json={"first_name": "Сеанс", "last_name": "Тест"},
        headers=token_headers,
    )
    patient_id = patient_resp.json()["id"]

    # Create 3 appointments — session numbers should auto-increment
    for i in range(3):
        resp = await client.post(
            "/api/v1/appointments/",
            json={
                "patient_id": patient_id,
                "start_time": f"2026-03-2{5 + i}T10:00:00",
                "end_time": f"2026-03-2{5 + i}T10:45:00",
            },
            headers=token_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["session_number"] == i + 1
