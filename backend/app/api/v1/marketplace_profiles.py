"""Marketplace profiles — public search + therapist CRUD + photo upload."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case
from typing import Optional
import uuid

from app.core.database import get_db
from app.models import (
    TherapistProfile,
    VerificationStatus,
    Therapist,
    Review,
)
from app.schemas.schemas import (
    TherapistProfileCreate,
    TherapistProfileUpdate,
    TherapistProfileResponse,
    TherapistProfilePublic,
)
from app.api.deps import get_current_user
from app.services.s3_service import s3_service

router = APIRouter()


# --- Public endpoints (no auth) ---


@router.get("/search", response_model=list[TherapistProfilePublic])
async def search_profiles(
    city: Optional[str] = None,
    specialization: Optional[str] = None,
    language: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    online_only: bool = False,
    gender: Optional[str] = None,
    min_rating: Optional[float] = None,
    sort_by: str = "rating",
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Public: search therapist profiles with filters."""
    # Base query: only published profiles
    avg_rating_subq = (
        select(
            Review.therapist_id,
            func.avg(Review.rating_overall).label("avg_rating"),
            func.count(Review.id).label("review_count"),
        )
        .where(Review.is_published == True)
        .group_by(Review.therapist_id)
        .subquery()
    )

    query = (
        select(
            TherapistProfile,
            Therapist.full_name,
            Therapist.clinic_name,
            func.coalesce(avg_rating_subq.c.avg_rating, 0).label("avg_rating"),
            func.coalesce(avg_rating_subq.c.review_count, 0).label("review_count"),
        )
        .join(Therapist, TherapistProfile.therapist_id == Therapist.id)
        .outerjoin(
            avg_rating_subq,
            TherapistProfile.therapist_id == avg_rating_subq.c.therapist_id,
        )
        .where(TherapistProfile.is_published == True)
    )

    # Apply filters
    if city:
        query = query.where(TherapistProfile.city.ilike(f"%{city}%"))
    if specialization:
        # JSON array contains — works with PostgreSQL
        query = query.where(
            TherapistProfile.specializations.cast(String).ilike(f"%{specialization}%")
        )
    if language:
        query = query.where(
            TherapistProfile.languages.cast(String).ilike(f"%{language}%")
        )
    if price_min is not None:
        query = query.where(TherapistProfile.price_range_max >= price_min)
    if price_max is not None:
        query = query.where(TherapistProfile.price_range_min <= price_max)
    if online_only:
        query = query.where(TherapistProfile.online_available == True)
    if gender:
        query = query.where(TherapistProfile.gender == gender)
    if min_rating is not None:
        query = query.where(
            func.coalesce(avg_rating_subq.c.avg_rating, 0) >= min_rating
        )

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(TherapistProfile.price_range_min.asc().nullslast())
    elif sort_by == "price_desc":
        query = query.order_by(TherapistProfile.price_range_max.desc().nullslast())
    elif sort_by == "experience":
        query = query.order_by(TherapistProfile.years_of_experience.desc().nullslast())
    else:  # default: rating
        query = query.order_by(
            func.coalesce(avg_rating_subq.c.avg_rating, 0).desc(),
            func.coalesce(avg_rating_subq.c.review_count, 0).desc(),
        )

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    rows = result.all()

    return [
        TherapistProfilePublic(
            **{
                c.key: getattr(profile, c.key)
                for c in TherapistProfile.__table__.columns
            },
            therapist_name=full_name,
            clinic_name=clinic_name,
            avg_rating=round(float(avg_r), 2) if avg_r else None,
            review_count=int(rev_count),
        )
        for profile, full_name, clinic_name, avg_r, rev_count in rows
    ]


@router.get("/{therapist_id}", response_model=TherapistProfilePublic)
async def get_public_profile(
    therapist_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Public: get a single therapist's full profile."""
    result = await db.execute(
        select(TherapistProfile).where(
            TherapistProfile.therapist_id == therapist_id,
            TherapistProfile.is_published == True,
        )
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Get therapist name
    therapist_result = await db.execute(
        select(Therapist).where(Therapist.id == therapist_id)
    )
    therapist = therapist_result.scalars().first()

    # Get aggregated ratings
    rating_result = await db.execute(
        select(
            func.avg(Review.rating_overall),
            func.count(Review.id),
        ).where(
            Review.therapist_id == therapist_id,
            Review.is_published == True,
        )
    )
    avg_r, rev_count = rating_result.one()

    return TherapistProfilePublic(
        **{c.key: getattr(profile, c.key) for c in TherapistProfile.__table__.columns},
        therapist_name=therapist.full_name if therapist else "",
        clinic_name=therapist.clinic_name if therapist else None,
        avg_rating=round(float(avg_r), 2) if avg_r else None,
        review_count=int(rev_count) if rev_count else 0,
    )


# --- Therapist endpoints (auth required) ---


@router.get("/my/profile", response_model=TherapistProfileResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Therapist: get own marketplace profile."""
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.therapist_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not created yet")
    return profile


@router.post("/my/profile", response_model=TherapistProfileResponse)
async def create_my_profile(
    data: TherapistProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Therapist: create marketplace profile."""
    # Check if already exists
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.therapist_id == current_user.id)
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=400, detail="Profile already exists. Use PUT to update."
        )

    profile = TherapistProfile(
        therapist_id=current_user.id,
        **data.model_dump(),
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.put("/my/profile", response_model=TherapistProfileResponse)
async def update_my_profile(
    data: TherapistProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Therapist: update marketplace profile."""
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.therapist_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not created yet")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile


@router.post("/my/photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Therapist: upload profile photo to S3."""
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.therapist_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Create profile first")

    # Read file
    contents = await file.read()
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    if ext not in ("jpg", "jpeg", "png", "webp"):
        raise HTTPException(status_code=400, detail="Only jpg/png/webp allowed")

    # Upload to S3
    file_key = f"therapist-photos/{current_user.id}/{uuid.uuid4().hex}.{ext}"
    if s3_service.s3_client:
        s3_service.s3_client.put_object(
            Bucket=s3_service.bucket,
            Key=file_key,
            Body=contents,
            ContentType=f"image/{ext}",
        )
        photo_url = f"{s3_service.bucket}/{file_key}"
    else:
        photo_url = f"mock_photo_{uuid.uuid4().hex}.{ext}"

    profile.photo_url = photo_url
    await db.commit()
    return {"photo_url": photo_url}


# Need String import for cast
from sqlalchemy import String
