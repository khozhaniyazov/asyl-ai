import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_therapist_profile(
    client: AsyncClient, token_headers: dict, test_therapist
):
    resp = await client.post(
        "/api/v1/marketplace/profiles/my/profile",
        json={
            "bio": "Логопед с 10-летним опытом работы с детьми",
            "specializations": ["dysarthria", "speech_delay"],
            "education": "КазНУ, дефектология",
            "years_of_experience": 10,
            "city": "Алматы",
            "online_available": True,
            "price_range_min": 7000,
            "price_range_max": 12000,
            "session_duration": 45,
            "languages": ["ru", "kk"],
            "gender": "female",
            "is_published": True,
        },
        headers=token_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["bio"] == "Логопед с 10-летним опытом работы с детьми"
    assert data["city"] == "Алматы"
    assert data["is_published"] is True
    assert data["specializations"] == ["dysarthria", "speech_delay"]


@pytest.mark.asyncio
async def test_update_therapist_profile(
    client: AsyncClient, token_headers: dict, test_therapist
):
    # Create first
    await client.post(
        "/api/v1/marketplace/profiles/my/profile",
        json={"bio": "Initial bio", "city": "Астана", "is_published": True},
        headers=token_headers,
    )

    # Update
    resp = await client.put(
        "/api/v1/marketplace/profiles/my/profile",
        json={"bio": "Updated bio", "years_of_experience": 5},
        headers=token_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["bio"] == "Updated bio"
    assert resp.json()["years_of_experience"] == 5
    assert resp.json()["city"] == "Астана"  # unchanged


@pytest.mark.asyncio
async def test_search_profiles_empty(client: AsyncClient):
    resp = await client.get("/api/v1/marketplace/profiles/search")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_search_profiles_with_results(
    client: AsyncClient, token_headers: dict, test_therapist
):
    # Create and publish profile
    await client.post(
        "/api/v1/marketplace/profiles/my/profile",
        json={
            "bio": "Experienced therapist",
            "city": "Алматы",
            "specializations": ["dysarthria"],
            "is_published": True,
            "price_range_min": 5000,
            "price_range_max": 10000,
        },
        headers=token_headers,
    )

    # Search
    resp = await client.get("/api/v1/marketplace/profiles/search")
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) == 1
    assert results[0]["city"] == "Алматы"
    assert results[0]["therapist_name"] == "Test Therapist"

    # Search with city filter
    resp = await client.get("/api/v1/marketplace/profiles/search?city=Алматы")
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    # Search with wrong city
    resp = await client.get("/api/v1/marketplace/profiles/search?city=Караганда")
    assert resp.status_code == 200
    assert len(resp.json()) == 0


@pytest.mark.asyncio
async def test_get_public_profile(
    client: AsyncClient, token_headers: dict, test_therapist
):
    await client.post(
        "/api/v1/marketplace/profiles/my/profile",
        json={"bio": "Public bio", "city": "Астана", "is_published": True},
        headers=token_headers,
    )

    resp = await client.get(f"/api/v1/marketplace/profiles/{test_therapist.id}")
    assert resp.status_code == 200
    assert resp.json()["bio"] == "Public bio"
    assert resp.json()["therapist_name"] == "Test Therapist"
    assert resp.json()["review_count"] == 0


@pytest.mark.asyncio
async def test_unpublished_profile_not_visible(
    client: AsyncClient, token_headers: dict, test_therapist
):
    await client.post(
        "/api/v1/marketplace/profiles/my/profile",
        json={"bio": "Draft", "is_published": False},
        headers=token_headers,
    )

    resp = await client.get(f"/api/v1/marketplace/profiles/{test_therapist.id}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_review_summary_empty(client: AsyncClient, test_therapist):
    resp = await client.get(
        f"/api/v1/marketplace/reviews/therapist/{test_therapist.id}/summary"
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_reviews"] == 0
    assert data["avg_overall"] is None


@pytest.mark.asyncio
async def test_get_therapist_reviews_empty(client: AsyncClient, test_therapist):
    resp = await client.get(
        f"/api/v1/marketplace/reviews/therapist/{test_therapist.id}"
    )
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_incoming_bookings_empty(
    client: AsyncClient, token_headers: dict, test_therapist
):
    resp = await client.get(
        "/api/v1/marketplace/bookings/incoming",
        headers=token_headers,
    )
    assert resp.status_code == 200
    assert resp.json() == []
