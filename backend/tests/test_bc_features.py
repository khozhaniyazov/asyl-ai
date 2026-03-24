import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_treatment_plan_crud(
    client: AsyncClient, token_headers: dict, test_therapist
):
    # Create patient
    patient_resp = await client.post(
        "/api/v1/patients/",
        json={"first_name": "План", "last_name": "Тест", "diagnosis": "Дизартрия"},
        headers=token_headers,
    )
    patient_id = patient_resp.json()["id"]

    # Create plan
    resp = await client.post(
        "/api/v1/treatment/plans",
        json={
            "patient_id": patient_id,
            "diagnosis": "Дизартрия",
            "start_date": "2026-03-01",
        },
        headers=token_headers,
    )
    assert resp.status_code == 200
    plan_id = resp.json()["id"]
    assert resp.json()["diagnosis"] == "Дизартрия"

    # Add goal
    resp = await client.post(
        f"/api/v1/treatment/plans/{plan_id}/goals",
        json={
            "type": "short_term",
            "description": "Автоматизация звука Р в слогах",
            "target_sound": "Р",
            "measurable_criteria": "80% точность",
        },
        headers=token_headers,
    )
    assert resp.status_code == 200
    goal_id = resp.json()["id"]

    # Update goal status
    resp = await client.put(
        f"/api/v1/treatment/goals/{goal_id}",
        json={"status": "in_progress"},
        headers=token_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"

    # Get plan with goals
    resp = await client.get(f"/api/v1/treatment/plans/{plan_id}", headers=token_headers)
    assert resp.status_code == 200
    assert len(resp.json()["goals"]) == 1

    # List plans
    resp = await client.get(
        f"/api/v1/treatment/plans?patient_id={patient_id}", headers=token_headers
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 1


@pytest.mark.asyncio
async def test_goal_templates(client: AsyncClient, token_headers: dict, test_therapist):
    # Create template
    resp = await client.post(
        "/api/v1/treatment/goal-templates",
        json={
            "category": "articulation",
            "description": "Постановка звука в изоляции",
            "measurable_criteria": "Правильное произношение в 8/10 попыток",
        },
        headers=token_headers,
    )
    assert resp.status_code == 200
    tmpl_id = resp.json()["id"]

    # List templates
    resp = await client.get("/api/v1/treatment/goal-templates", headers=token_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

    # Delete
    resp = await client.delete(
        f"/api/v1/treatment/goal-templates/{tmpl_id}", headers=token_headers
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_analytics_summary(
    client: AsyncClient, token_headers: dict, test_therapist
):
    resp = await client.get("/api/v1/analytics/summary", headers=token_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "sessions_this_week" in data
    assert "cancellation_rate" in data
    assert "total_patients" in data


@pytest.mark.asyncio
async def test_analytics_trends(
    client: AsyncClient, token_headers: dict, test_therapist
):
    resp = await client.get("/api/v1/analytics/trends", headers=token_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "weekly_sessions" in data
    assert "monthly_revenue" in data
    assert "new_patients" in data


@pytest.mark.asyncio
async def test_finance_summary(
    client: AsyncClient, token_headers: dict, test_therapist
):
    resp = await client.get("/api/v1/finance/summary", headers=token_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "earned_this_month" in data
    assert "outstanding" in data


@pytest.mark.asyncio
async def test_export_patients_csv(
    client: AsyncClient, token_headers: dict, test_therapist
):
    resp = await client.get("/api/v1/export/patients", headers=token_headers)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("content-type", "")


@pytest.mark.asyncio
async def test_export_patient_record(
    client: AsyncClient, token_headers: dict, test_therapist
):
    # Create patient first
    patient_resp = await client.post(
        "/api/v1/patients/",
        json={"first_name": "Экспорт", "last_name": "Тест"},
        headers=token_headers,
    )
    patient_id = patient_resp.json()["id"]

    resp = await client.get(
        f"/api/v1/export/patient/{patient_id}", headers=token_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["patient"]["first_name"] == "Экспорт"


@pytest.mark.asyncio
async def test_video_session(client: AsyncClient, token_headers: dict, test_therapist):
    # Create patient + appointment
    patient_resp = await client.post(
        "/api/v1/patients/",
        json={"first_name": "Видео", "last_name": "Тест"},
        headers=token_headers,
    )
    patient_id = patient_resp.json()["id"]

    appt_resp = await client.post(
        "/api/v1/appointments/",
        json={
            "patient_id": patient_id,
            "start_time": "2026-04-01T10:00:00",
            "end_time": "2026-04-01T10:45:00",
        },
        headers=token_headers,
    )
    appt_id = appt_resp.json()["id"]

    # Create video session
    resp = await client.post(f"/api/v1/video/{appt_id}", headers=token_headers)
    assert resp.status_code == 200
    assert "room_url" in resp.json()
    assert "therapist_join_url" in resp.json()

    # Get video session
    resp = await client.get(f"/api/v1/video/{appt_id}", headers=token_headers)
    assert resp.status_code == 200

    # Start
    resp = await client.post(f"/api/v1/video/{appt_id}/start", headers=token_headers)
    assert resp.status_code == 200
    assert resp.json()["started_at"] is not None

    # End
    resp = await client.post(f"/api/v1/video/{appt_id}/end", headers=token_headers)
    assert resp.status_code == 200
    assert resp.json()["ended_at"] is not None
    assert resp.json()["duration_seconds"] is not None


@pytest.mark.asyncio
async def test_clinic_management(
    client: AsyncClient, token_headers: dict, test_therapist
):
    # Create clinic
    resp = await client.post(
        "/api/v1/clinics/",
        json={
            "name": "SpeechCare Almaty",
            "address": "ул. Абая 10",
            "phone": "+7 727 123 4567",
        },
        headers=token_headers,
    )
    assert resp.status_code == 200
    clinic_id = resp.json()["id"]
    assert resp.json()["name"] == "SpeechCare Almaty"

    # Get my clinics
    resp = await client.get("/api/v1/clinics/my", headers=token_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["my_role"] == "owner"
    assert len(resp.json()[0]["members"]) == 1

    # Update clinic
    resp = await client.put(
        f"/api/v1/clinics/{clinic_id}",
        json={"name": "SpeechCare Almaty Pro"},
        headers=token_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "SpeechCare Almaty Pro"


@pytest.mark.asyncio
async def test_progress_report(
    client: AsyncClient, token_headers: dict, test_therapist
):
    # Create patient
    patient_resp = await client.post(
        "/api/v1/patients/",
        json={"first_name": "Отчёт", "last_name": "Тест", "diagnosis": "ОНР"},
        headers=token_headers,
    )
    patient_id = patient_resp.json()["id"]

    resp = await client.get(
        f"/api/v1/reports/progress/{patient_id}", headers=token_headers
    )
    assert resp.status_code == 200
    assert "text/html" in resp.headers.get("content-type", "")
    body = resp.text
    assert "Отчёт Тест" in body
    assert "ОНР" in body
