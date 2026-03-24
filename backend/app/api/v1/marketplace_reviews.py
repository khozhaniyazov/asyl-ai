"""Marketplace reviews — parent creates (session-verified), public reads."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.core.database import get_db
from app.models import (
    Review,
    Therapist,
    Parent,
    Session,
    Appointment,
    Patient,
)
from app.schemas.schemas import (
    ReviewCreate,
    ReviewResponse,
    ReviewAggregation,
)
from app.api.v1.parent_portal import get_current_parent

router = APIRouter()


# --- Public endpoints ---


@router.get("/therapist/{therapist_id}", response_model=list[ReviewResponse])
async def get_therapist_reviews(
    therapist_id: int,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Public: get reviews for a therapist (paginated)."""
    result = await db.execute(
        select(Review)
        .where(
            Review.therapist_id == therapist_id,
            Review.is_published == True,
        )
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    reviews = result.scalars().all()

    # Get parent names for display (first name only for privacy)
    parent_ids = [r.parent_id for r in reviews]
    parent_map = {}
    if parent_ids:
        parent_result = await db.execute(
            select(Parent).where(Parent.id.in_(parent_ids))
        )
        for p in parent_result.scalars().all():
            if p.full_name:
                parts = p.full_name.split()
                parent_map[p.id] = parts[0] + (
                    " " + parts[1][0] + "." if len(parts) > 1 else ""
                )
            else:
                parent_map[p.id] = "Родитель"

    return [
        ReviewResponse(
            id=r.id,
            therapist_id=r.therapist_id,
            session_id=r.session_id,
            rating_overall=r.rating_overall,
            rating_results=r.rating_results,
            rating_approach=r.rating_approach,
            rating_communication=r.rating_communication,
            rating_punctuality=r.rating_punctuality,
            text=r.text,
            is_verified=r.is_verified,
            created_at=r.created_at,
            parent_name=parent_map.get(r.parent_id, "Родитель"),
        )
        for r in reviews
    ]


@router.get("/therapist/{therapist_id}/summary", response_model=ReviewAggregation)
async def get_review_summary(
    therapist_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Public: get aggregated ratings for a therapist."""
    result = await db.execute(
        select(
            func.avg(Review.rating_overall),
            func.avg(Review.rating_results),
            func.avg(Review.rating_approach),
            func.avg(Review.rating_communication),
            func.avg(Review.rating_punctuality),
            func.count(Review.id),
        ).where(
            Review.therapist_id == therapist_id,
            Review.is_published == True,
        )
    )
    row = result.one()
    return ReviewAggregation(
        therapist_id=therapist_id,
        avg_overall=round(float(row[0]), 2) if row[0] else None,
        avg_results=round(float(row[1]), 2) if row[1] else None,
        avg_approach=round(float(row[2]), 2) if row[2] else None,
        avg_communication=round(float(row[3]), 2) if row[3] else None,
        avg_punctuality=round(float(row[4]), 2) if row[4] else None,
        total_reviews=int(row[5]) if row[5] else 0,
    )


# --- Parent endpoints (auth required) ---


@router.post("/", response_model=ReviewResponse)
async def create_review(
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    """Parent: create a review (session-verified only)."""
    # Validate rating range
    for field in [
        data.rating_overall,
        data.rating_results,
        data.rating_approach,
        data.rating_communication,
        data.rating_punctuality,
    ]:
        if field is not None and (field < 1 or field > 5):
            raise HTTPException(status_code=400, detail="Ratings must be 1-5")

    # Verify session exists and belongs to this parent's child
    session_result = await db.execute(
        select(Session)
        .join(Appointment, Session.appointment_id == Appointment.id)
        .join(Patient, Appointment.patient_id == Patient.id)
        .where(
            Session.id == data.session_id,
            Patient.parent_id == parent.id,
            Session.status == "completed",
        )
    )
    session = session_result.scalars().first()
    if not session:
        raise HTTPException(
            status_code=403,
            detail="Session not found or not linked to your child",
        )

    # Verify therapist matches
    appt_result = await db.execute(
        select(Appointment).where(Appointment.id == session.appointment_id)
    )
    appt = appt_result.scalars().first()
    if not appt or appt.therapist_id != data.therapist_id:
        raise HTTPException(status_code=400, detail="Therapist doesn't match session")

    # Check no duplicate review for this session
    existing = await db.execute(
        select(Review).where(Review.session_id == data.session_id)
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=400, detail="Review already exists for this session"
        )

    review = Review(
        parent_id=parent.id,
        therapist_id=data.therapist_id,
        session_id=data.session_id,
        rating_overall=data.rating_overall,
        rating_results=data.rating_results,
        rating_approach=data.rating_approach,
        rating_communication=data.rating_communication,
        rating_punctuality=data.rating_punctuality,
        text=data.text,
        is_verified=True,  # session-verified
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    return ReviewResponse(
        id=review.id,
        therapist_id=review.therapist_id,
        session_id=review.session_id,
        rating_overall=review.rating_overall,
        rating_results=review.rating_results,
        rating_approach=review.rating_approach,
        rating_communication=review.rating_communication,
        rating_punctuality=review.rating_punctuality,
        text=review.text,
        is_verified=review.is_verified,
        created_at=review.created_at,
        parent_name=None,
    )


@router.get("/my", response_model=list[ReviewResponse])
async def get_my_reviews(
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    """Parent: get own reviews."""
    result = await db.execute(
        select(Review)
        .where(Review.parent_id == parent.id)
        .order_by(Review.created_at.desc())
    )
    return [
        ReviewResponse(
            id=r.id,
            therapist_id=r.therapist_id,
            session_id=r.session_id,
            rating_overall=r.rating_overall,
            rating_results=r.rating_results,
            rating_approach=r.rating_approach,
            rating_communication=r.rating_communication,
            rating_punctuality=r.rating_punctuality,
            text=r.text,
            is_verified=r.is_verified,
            created_at=r.created_at,
            parent_name=None,
        )
        for r in result.scalars().all()
    ]


@router.delete("/{review_id}")
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    """Parent: delete own review."""
    result = await db.execute(
        select(Review).where(
            Review.id == review_id,
            Review.parent_id == parent.id,
        )
    )
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    await db.delete(review)
    await db.commit()
    return {"detail": "Review deleted"}
