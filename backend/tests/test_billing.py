import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_billing_status(auth_client: AsyncClient):
    response = await auth_client.get("/api/v1/billing/status")
    assert response.status_code == 200
    data = response.json()
    assert "plan" in data
    assert "status" in data
    assert data["status"] == "active"


@pytest.mark.asyncio
async def test_subscribe_to_plan(auth_client: AsyncClient):
    response = await auth_client.post(
        "/api/v1/billing/subscribe", json={"plan": "standard"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "payment_url" in data
