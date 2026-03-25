"""Test login endpoint directly"""

import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


async def test_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test with form data (correct way)
        response = await client.post(
            "/api/v1/auth/login",
            data={"username": "admin@samga.ai", "password": "admin123"},
        )
        print(f"Form data login: {response.status_code}")
        print(f"Response: {response.text}")

        # Test with JSON (wrong way, but let's see)
        response2 = await client.post(
            "/api/v1/auth/login",
            json={"username": "admin@samga.ai", "password": "admin123"},
        )
        print(f"\nJSON login: {response2.status_code}")
        print(f"Response: {response2.text}")


asyncio.run(test_login())
