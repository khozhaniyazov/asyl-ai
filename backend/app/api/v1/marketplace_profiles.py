"""Marketplace profiles — public search + therapist CRUD + photo upload + verification."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid

from app.core.database import get_db
from app.models import (
    TherapistProfile,
    VerificationStatus,
    Therapist,
    Review,
    Patient,
    Appointment,
    AppointmentStatus,
    Session,
)
from app.models.availability import TherapistAvailability
from app.schemas.schemas import (
    TherapistProfileCreate,
    TherapistProfileUpdate,
    TherapistProfileResponse,
    TherapistProfilePublic,
)
from app.api.deps import get_current_user
from app.services.s3_service import s3_service

router = APIRouter()


# --- Helpers ---


async def _get_next_available_slot(
    db: AsyncSession, therapist_id: int
) -> Optional[datetime]:
    """Find the next available slot based on therapist availability and existing appointments."""
    result = await db.execute(
        select(TherapistAvailability)
        .where(
            TherapistAvailability.therapist_id == therapist_id,
            TherapistAvailability.is_active == True,
        )
        .order_by(TherapistAvailability.day_of_week)
    )
    slots = result.scalars().all()
    if not slots:
        return None

    now = datetime.now(timezone.utc)
    # Check next 14 days
    for day_offset in range(14):
        check_date = now + timedelta(days=day_offset)
        weekday = check_date.weekday()  # 0=Monday
        for slot in slots:
            if slot.day_of_week != weekday:
                continue
            # Parse slot start time
            try:
                hour, minute = slot.start_time.split(":")
                slot_dt = check_date.replace(
                    hour=int(hour), minute=int(minute), second=0, microsecond=0
                )
                if slot_dt.tzinfo is None:
                    slot_dt = slot_dt.replace(tzinfo=timezone.utc)
            except (ValueError, AttributeError):
                continue
            if slot_dt <= now:
                continue
            # Check if slot is already booked
            booked = await db.execute(
                select(func.count(Appointment.id)).where(
                    Appointment.therapist_id == therapist_id,
                    Appointment.start_time == slot_dt,
                    Appointment.status.notin_([AppointmentStatus.CANCELLED, "no_show"]),
                )
            )
            if (booked.scalar() or 0) == 0:
                return slot_dt
    return None


async def _get_therapist_stats(db: AsyncSession, therapist_id: int) -> tuple[int, int]:
    """Return (total_patients, total_completed_sessions) for a therapist."""
    patients_result = await db.execute(
        select(func.count(Patient.id)).where(Patient.therapist_id == therapist_id)
    )
    total_patients = patients_result.scalar() or 0

    sessions_result = await db.execute(
        select(func.count(Session.id))
        .join(Appointment, Session.appointment_id == Appointment.id)
        .where(
            Appointment.therapist_id == therapist_id,
            Session.status == "completed",
        )
    )
    total_sessions = sessions_result.scalar() or 0
    return total_patients, total_sessions


# --- Public endpoints (no auth) ---


@router.get("/search", response_model=list[TherapistProfilePublic])
async def search_profiles(
    city: Optional[str] = None,
    specialization: Optional[str] = None,
    specializations: Optional[str] = None,  # comma-separated for multi-filter
    language: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    online_only: bool = False,
    gender: Optional[str] = None,
    min_rating: Optional[float] = None,
    age_group: Optional[str] = None,
    verified_only: bool = False,
    q: Optional[str] = None,  # text search across name, bio, specializations
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
        query = query.where(
            TherapistProfile.specializations.cast(String).ilike(f"%{specialization}%")
        )
    if specializations:
        # Multi-specialization filter: match any of the comma-separated values
        spec_list = [s.strip() for s in specializations.split(",")]
        conditions = [
            TherapistProfile.specializations.cast(String).ilike(f"%{s}%")
            for s in spec_list
        ]
        query = query.where(or_(*conditions))
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
    if age_group:
        query = query.where(
            TherapistProfile.age_groups.cast(String).ilike(f"%{age_group}%")
        )
    if verified_only:
        query = query.where(
            TherapistProfile.verification_status == "verified"
        )
    if q:
        # Text search across therapist name, bio, and specializations
        search_term = f"%{q}%"
        query = query.where(
            or_(
                Therapist.full_name.ilike(search_term),
                TherapistProfile.bio.ilike(search_term),
                TherapistProfile.specializations.cast(String).ilike(search_term),
            )
        )

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(TherapistProfile.price_range_min.asc().nullslast())
    elif sort_by == "price_desc":
        query = query.order_by(TherapistProfile.price_range_max.desc().nullslast())
    elif sort_by == "experience":
        query = query.order_by(TherapistProfile.years_of_experience.desc().nullslast())
    elif sort_by == "newest":
        query = query.order_by(TherapistProfile.created_at.desc())
    elif sort_by == "response_time":
        query = query.order_by(TherapistProfile.response_time_hours.asc().nullslast())
    else:  # default: rating
        query = query.order_by(
            func.coalesce(avg_rating_subq.c.avg_rating, 0).desc(),
            func.coalesce(avg_rating_subq.c.review_count, 0).desc(),
        )

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    rows = result.all()

    # Build response with next_available_slot and stats
    profiles = []
    for profile, full_name, clinic_name, avg_r, rev_count in rows:
        next_slot = await _get_next_available_slot(db, profile.therapist_id)
        total_patients, total_sessions = await _get_therapist_stats(
            db, profile.therapist_id
        )
        profiles.append(
            TherapistProfilePublic(
                **{
                    c.key: getattr(profile, c.key)
                    for c in TherapistProfile.__table__.columns
                },
                therapist_name=full_name,
                clinic_name=clinic_name,
                avg_rating=round(float(avg_r), 2) if avg_r else None,
                review_count=int(rev_count),
                next_available_slot=next_slot,
                total_patients=total_patients,
                total_sessions=total_sessions,
            )
        )
    return profiles


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

    next_slot = await _get_next_available_slot(db, therapist_id)
    total_patients, total_sessions = await _get_therapist_stats(db, therapist_id)

    return TherapistProfilePublic(
        **{c.key: getattr(profile, c.key) for c in TherapistProfile.__table__.columns},
        therapist_name=therapist.full_name if therapist else "",
        clinic_name=therapist.clinic_name if therapist else None,
        avg_rating=round(float(avg_r), 2) if avg_r else None,
        review_count=int(rev_count) if rev_count else 0,
        next_available_slot=next_slot,
        total_patients=total_patients,
        total_sessions=total_sessions,
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


@router.patch("/my/publish")
async def toggle_publish(
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Therapist: toggle is_published on their marketplace profile."""
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.therapist_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Create profile first")

    profile.is_published = not profile.is_published
    await db.commit()
    await db.refresh(profile)
    return {"is_published": profile.is_published}


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


@router.post("/my/verify")
async def request_verification(
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Therapist: submit profile for verification. Requires license_number and credential_documents."""
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.therapist_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Create profile first")

    if profile.verification_status == VerificationStatus.VERIFIED:
        raise HTTPException(status_code=400, detail="Already verified")
    if profile.verification_status == VerificationStatus.PENDING:
        raise HTTPException(status_code=400, detail="Verification already pending")

    # Require minimum fields for verification
    if not profile.license_number:
        raise HTTPException(
            status_code=400, detail="License number is required for verification"
        )
    if not profile.credential_documents or len(profile.credential_documents) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one credential document is required for verification",
        )

    profile.verification_status = VerificationStatus.PENDING
    profile.verification_submitted_at = datetime.now(timezone.utc)
    await db.commit()
    return {
        "detail": "Verification request submitted",
        "status": "pending",
    }


@router.post("/my/credentials")
async def upload_credential_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Therapist: upload a credential document (diploma, license, certificate)."""
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.therapist_id == current_user.id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Create profile first")

    contents = await file.read()
    ext = file.filename.split(".")[-1] if file.filename else "pdf"
    if ext not in ("pdf", "jpg", "jpeg", "png", "webp"):
        raise HTTPException(status_code=400, detail="Only pdf/jpg/png/webp allowed")

    file_key = f"credentials/{current_user.id}/{uuid.uuid4().hex}.{ext}"
    if s3_service.s3_client:
        s3_service.s3_client.put_object(
            Bucket=s3_service.bucket,
            Key=file_key,
            Body=contents,
            ContentType=f"application/{ext}" if ext == "pdf" else f"image/{ext}",
        )
        doc_url = f"{s3_service.bucket}/{file_key}"
    else:
        doc_url = f"mock_credential_{uuid.uuid4().hex}.{ext}"

    # Append to credential_documents list
    docs = profile.credential_documents or []
    docs.append(doc_url)
    profile.credential_documents = docs
    await db.commit()
    return {"document_url": doc_url, "total_documents": len(docs)}


# Need String import for cast
from sqlalchemy import String
