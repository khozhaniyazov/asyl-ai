import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_homework_templates(auth_client: AsyncClient):
    response = await auth_client.get("/api/v1/homework/templates/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_create_homework_template(auth_client: AsyncClient):
    response = await auth_client.post(
        "/api/v1/homework/templates/",
        json={
            "title": "Test Homework",
            "description": "Practice sounds",
            "instructions": "Repeat 10 times daily",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Homework"
