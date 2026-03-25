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


# --- v5_002: Enhanced marketplace tests ---


@pytest.mark.asyncio
async def test_profile_with_new_fields(
    client: AsyncClient, token_headers: dict, test_therapist
):
    """Test creating profile with license_number, age_groups, etc."""
    resp = await client.post(
        "/api/v1/marketplace/profiles/my/profile",
        json={
            "bio": "Experienced therapist",
            "specializations": ["dysarthria", "stuttering"],
            "license_number": "KZ-LOG-2024-1234",
            "age_groups": ["children", "adolescents"],
            "city": "Алматы",
            "is_published": True,
        },
        headers=token_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["license_number"] == "KZ-LOG-2024-1234"
    assert data["age_groups"] == ["children", "adolescents"]


@pytest.mark.asyncio
async def test_update_video_intro(
    client: AsyncClient, token_headers: dict, test_therapist
):
    """Test updating video_intro_url."""
    await client.post(
        "/api/v1/marketplace/profiles/my/profile",
        json={"bio": "Test", "is_published": True},
        headers=token_headers,
    )
    resp = await client.put(
        "/api/v1/marketplace/profiles/my/profile",
        json={"video_intro_url": "https://example.com/intro.mp4"},
        headers=token_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["video_intro_url"] == "https://example.com/intro.mp4"


@pytest.mark.asyncio
async def test_verification_requires_license(
    client: AsyncClient, token_headers: dict, test_therapist
):
    """Test that verification requires license_number."""
    await client.post(
        "/api/v1/marketplace/profiles/my/profile",
        json={"bio": "Test", "is_published": True},
        headers=token_headers,
    )
    resp = await client.post(
        "/api/v1/marketplace/profiles/my/verify",
        headers=token_headers,
    )
    assert resp.status_code == 400
    assert "License number" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_verification_requires_documents(
    client: AsyncClient, token_headers: dict, test_therapist
):
    """Test that verification requires credential documents."""
    await client.post(
        "/api/v1/marketplace/profiles/my/profile",
        json={"bio": "Test", "license_number": "KZ-123", "is_published": True},
        headers=token_headers,
    )
    resp = await client.post(
        "/api/v1/marketplace/profiles/my/verify",
        headers=token_headers,
    )
    assert resp.status_code == 400
    assert "credential document" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_search_with_verified_only(
    client: AsyncClient, token_headers: dict, test_therapist
):
    """Test verified_only filter returns empty when no verified profiles."""
    await client.post(
        "/api/v1/marketplace/profiles/my/profile",
        json={"bio": "Test", "city": "Алматы", "is_published": True},
        headers=token_headers,
    )
    resp = await client.get("/api/v1/marketplace/profiles/search?verified_only=true")
    assert resp.status_code == 200
    assert len(resp.json()) == 0

    # Without filter should return the profile
    resp = await client.get("/api/v1/marketplace/profiles/search")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


@pytest.mark.asyncio
async def test_search_with_age_group(
    client: AsyncClient, token_headers: dict, test_therapist
):
    """Test age_group filter."""
    await client.post(
        "/api/v1/marketplace/profiles/my/profile",
        json={
            "bio": "Test",
            "age_groups": ["children", "adolescents"],
            "is_published": True,
        },
        headers=token_headers,
    )
    resp = await client.get("/api/v1/marketplace/profiles/search?age_group=children")
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = await client.get("/api/v1/marketplace/profiles/search?age_group=adults")
    assert resp.status_code == 200
    assert len(resp.json()) == 0


@pytest.mark.asyncio
async def test_search_multi_specialization(
    client: AsyncClient, token_headers: dict, test_therapist
):
    """Test comma-separated specializations filter."""
    await client.post(
        "/api/v1/marketplace/profiles/my/profile",
        json={
            "bio": "Test",
            "specializations": ["dysarthria"],
            "is_published": True,
        },
        headers=token_headers,
    )
    # Match: dysarthria is in the list
    resp = await client.get(
        "/api/v1/marketplace/profiles/search?specializations=dysarthria,stuttering"
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    # No match
    resp = await client.get(
        "/api/v1/marketplace/profiles/search?specializations=aphasia"
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 0


@pytest.mark.asyncio
async def test_public_profile_includes_stats(
    client: AsyncClient, token_headers: dict, test_therapist
):
    """Test that public profile includes total_patients and total_sessions."""
    await client.post(
        "/api/v1/marketplace/profiles/my/profile",
        json={"bio": "Test", "is_published": True},
        headers=token_headers,
    )
    resp = await client.get(f"/api/v1/marketplace/profiles/{test_therapist.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_patients" in data
    assert "total_sessions" in data
    assert "next_available_slot" in data
    assert data["total_patients"] == 0
    assert data["total_sessions"] == 0


@pytest.mark.asyncio
async def test_sort_by_newest(client: AsyncClient, token_headers: dict, test_therapist):
    """Test sort_by=newest."""
    await client.post(
        "/api/v1/marketplace/profiles/my/profile",
        json={"bio": "Test", "is_published": True},
        headers=token_headers,
    )
    resp = await client.get("/api/v1/marketplace/profiles/search?sort_by=newest")
    assert resp.status_code == 200
    assert len(resp.json()) == 1
