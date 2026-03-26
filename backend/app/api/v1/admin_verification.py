"""Dedicated admin verification endpoints for therapist profile verification."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
from typing import Optional

from app.core.database import get_db
from app.models import (
    Therapist,
    TherapistProfile,
    VerificationStatus,
)
from app.schemas.schemas import VerificationApprovalRequest
from app.api.deps import get_current_user

router = APIRouter()


async def require_admin(
    current_user: Therapist = Depends(get_current_user),
) -> Therapist:
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/pending")
async def list_pending_verifications(
    db: AsyncSession = Depends(get_db),
    admin: Therapist = Depends(require_admin),
):
    """List all profiles pending verification."""
    result = await db.execute(
        select(TherapistProfile, Therapist.full_name, Therapist.email)
        .join(Therapist, TherapistProfile.therapist_id == Therapist.id)
        .where(TherapistProfile.verification_status == VerificationStatus.PENDING)
        .order_by(TherapistProfile.verification_submitted_at.asc())
    )
    rows = result.all()
    return [
        {
            "profile_id": profile.id,
            "therapist_id": profile.therapist_id,
            "therapist_name": name,
            "therapist_email": email,
            "license_number": profile.license_number,
            "credential_documents": profile.credential_documents,
            "education": profile.education,
            "certifications": profile.certifications,
            "specializations": profile.specializations,
            "city": profile.city,
            "bio": profile.bio,
            "years_of_experience": profile.years_of_experience,
            "submitted_at": profile.verification_submitted_at,
        }
        for profile, name, email in rows
    ]


@router.get("/all")
async def list_all_verifications(
    status: Optional[str] = Query(None, description="Filter by status"),
    db: AsyncSession = Depends(get_db),
    admin: Therapist = Depends(require_admin),
):
    """List all verification requests with optional status filter."""
    query = select(TherapistProfile, Therapist.full_name, Therapist.email).join(
        Therapist, TherapistProfile.therapist_id == Therapist.id
    )
    if status:
        try:
            ver_status = VerificationStatus(status)
            query = query.where(TherapistProfile.verification_status == ver_status)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {[s.value for s in VerificationStatus]}",
            )
    query = query.order_by(TherapistProfile.verification_submitted_at.desc())
    result = await db.execute(query)
    rows = result.all()
    return [
        {
            "profile_id": profile.id,
            "therapist_id": profile.therapist_id,
            "therapist_name": name,
            "therapist_email": email,
            "verification_status": profile.verification_status.value
            if profile.verification_status
            else "unverified",
            "license_number": profile.license_number,
            "credential_documents": profile.credential_documents,
            "specializations": profile.specializations,
            "city": profile.city,
            "submitted_at": profile.verification_submitted_at,
            "verified_at": profile.verified_at,
            "rejection_reason": profile.rejection_reason,
        }
        for profile, name, email in rows
    ]


@router.get("/stats")
async def verification_stats(
    db: AsyncSession = Depends(get_db),
    admin: Therapist = Depends(require_admin),
):
    """Get verification statistics."""
    pending = await db.execute(
        select(func.count(TherapistProfile.id)).where(
            TherapistProfile.verification_status == VerificationStatus.PENDING
        )
    )
    verified = await db.execute(
        select(func.count(TherapistProfile.id)).where(
            TherapistProfile.verification_status == VerificationStatus.VERIFIED
        )
    )
    rejected = await db.execute(
        select(func.count(TherapistProfile.id)).where(
            TherapistProfile.verification_status == VerificationStatus.REJECTED
        )
    )
    total = await db.execute(select(func.count(TherapistProfile.id)))
    return {
        "total_profiles": total.scalar() or 0,
        "pending": pending.scalar() or 0,
        "verified": verified.scalar() or 0,
        "rejected": rejected.scalar() or 0,
    }


@router.get("/{profile_id}")
async def get_verification_detail(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
    admin: Therapist = Depends(require_admin),
):
    """Get detailed verification info for a specific profile."""
    result = await db.execute(
        select(TherapistProfile, Therapist.full_name, Therapist.email)
        .join(Therapist, TherapistProfile.therapist_id == Therapist.id)
        .where(TherapistProfile.id == profile_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile, name, email = row
    return {
        "profile_id": profile.id,
        "therapist_id": profile.therapist_id,
        "therapist_name": name,
        "therapist_email": email,
        "verification_status": profile.verification_status.value
        if profile.verification_status
        else "unverified",
        "bio": profile.bio,
        "license_number": profile.license_number,
        "credential_documents": profile.credential_documents,
        "education": profile.education,
        "certifications": profile.certifications,
        "specializations": profile.specializations,
        "city": profile.city,
        "years_of_experience": profile.years_of_experience,
        "languages": profile.languages,
        "submitted_at": profile.verification_submitted_at,
        "verified_at": profile.verified_at,
        "verified_by_id": profile.verified_by_id,
        "verification_notes": profile.verification_notes,
        "rejection_reason": profile.rejection_reason,
    }


@router.post("/{profile_id}/approve")
async def approve_verification(
    profile_id: int,
    data: VerificationApprovalRequest,
    db: AsyncSession = Depends(get_db),
    admin: Therapist = Depends(require_admin),
):
    """Approve a therapist's verification."""
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.id == profile_id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.verification_status != VerificationStatus.PENDING:
        raise HTTPException(
            status_code=400, detail="Profile is not pending verification"
        )

    profile.verification_status = VerificationStatus.VERIFIED
    profile.verified_at = datetime.now(timezone.utc)
    profile.verified_by_id = admin.id
    profile.verification_notes = (
        data.verification_notes or f"Approved by admin {admin.id}"
    )
    await db.commit()
    return {"detail": "Verification approved", "status": "verified"}


@router.post("/{profile_id}/reject")
async def reject_verification(
    profile_id: int,
    data: VerificationApprovalRequest,
    db: AsyncSession = Depends(get_db),
    admin: Therapist = Depends(require_admin),
):
    """Reject a therapist's verification."""
    result = await db.execute(
        select(TherapistProfile).where(TherapistProfile.id == profile_id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.verification_status != VerificationStatus.PENDING:
        raise HTTPException(
            status_code=400, detail="Profile is not pending verification"
        )

    profile.verification_status = VerificationStatus.REJECTED
    profile.verified_by_id = admin.id
    profile.rejection_reason = data.verification_notes or "Rejected"
    profile.verification_notes = data.verification_notes or "Rejected"
    await db.commit()
    return {"detail": "Verification rejected", "status": "rejected"}
