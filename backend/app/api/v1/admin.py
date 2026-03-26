"""Admin endpoints for verification and payout management."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
from typing import Optional

from app.core.database import get_db
from app.models import (
    Therapist,
    TherapistProfile,
    VerificationStatus,
    Payout,
    PayoutStatus,
    MarketplaceBooking,
    BookingStatus,
)
from app.schemas.schemas import (
    TherapistProfileResponse,
    PayoutResponse,
    VerificationApprovalRequest,
    PayoutApprovalRequest,
)
from app.api.deps import get_current_user

router = APIRouter()


async def require_admin(
    current_user: Therapist = Depends(get_current_user),
) -> Therapist:
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# --- Verification Management ---


@router.get("/verification/pending")
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
            "submitted_at": profile.verification_submitted_at,
        }
        for profile, name, email in rows
    ]


@router.post("/verification/{profile_id}/approve")
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


@router.post("/verification/{profile_id}/reject")
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


# --- Payout Management ---


@router.get("/payouts/pending", response_model=list[dict])
async def list_pending_payouts(
    db: AsyncSession = Depends(get_db),
    admin: Therapist = Depends(require_admin),
):
    """List all pending payouts."""
    result = await db.execute(
        select(Payout, Therapist.full_name, Therapist.email)
        .join(Therapist, Payout.therapist_id == Therapist.id)
        .where(Payout.status == PayoutStatus.PENDING)
        .order_by(Payout.requested_at.asc())
    )
    rows = result.all()
    return [
        {
            "id": payout.id,
            "therapist_id": payout.therapist_id,
            "therapist_name": name,
            "therapist_email": email,
            "amount": float(payout.amount),
            "commission_amount": float(payout.commission_amount),
            "net_amount": float(payout.net_amount),
            "status": payout.status.value,
            "requested_at": payout.requested_at.isoformat()
            if payout.requested_at
            else None,
        }
        for payout, name, email in rows
    ]


@router.post("/payouts/{payout_id}/approve")
async def approve_payout(
    payout_id: int,
    data: PayoutApprovalRequest,
    db: AsyncSession = Depends(get_db),
    admin: Therapist = Depends(require_admin),
):
    """Approve a payout."""
    result = await db.execute(select(Payout).where(Payout.id == payout_id))
    payout = result.scalars().first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    if payout.status != PayoutStatus.PENDING:
        raise HTTPException(status_code=400, detail="Payout is not pending")

    payout.status = PayoutStatus.APPROVED
    payout.admin_notes = data.admin_notes
    payout.processed_at = datetime.now(timezone.utc)
    await db.commit()
    return {"detail": "Payout approved", "status": "approved"}


@router.post("/payouts/{payout_id}/paid")
async def mark_payout_paid(
    payout_id: int,
    db: AsyncSession = Depends(get_db),
    admin: Therapist = Depends(require_admin),
):
    """Mark payout as paid (after bank transfer)."""
    result = await db.execute(select(Payout).where(Payout.id == payout_id))
    payout = result.scalars().first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    if payout.status != PayoutStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Payout must be approved first")

    payout.status = PayoutStatus.PAID
    payout.processed_at = datetime.now(timezone.utc)

    # Mark associated bookings as paid out
    bookings_result = await db.execute(
        select(MarketplaceBooking).where(
            MarketplaceBooking.therapist_id == payout.therapist_id,
            MarketplaceBooking.status == BookingStatus.COMPLETED,
            MarketplaceBooking.payout_id.is_(None),
        )
    )
    bookings = bookings_result.scalars().all()
    for booking in bookings:
        booking.payout_id = payout.id

    await db.commit()
    return {"detail": "Payout marked as paid", "status": "paid"}


@router.post("/payouts/{payout_id}/reject")
async def reject_payout(
    payout_id: int,
    data: PayoutApprovalRequest,
    db: AsyncSession = Depends(get_db),
    admin: Therapist = Depends(require_admin),
):
    """Reject a payout."""
    result = await db.execute(select(Payout).where(Payout.id == payout_id))
    payout = result.scalars().first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    if payout.status != PayoutStatus.PENDING:
        raise HTTPException(status_code=400, detail="Payout is not pending")

    payout.status = PayoutStatus.REJECTED
    payout.admin_notes = data.admin_notes
    payout.processed_at = datetime.now(timezone.utc)
    await db.commit()
    return {"detail": "Payout rejected", "status": "rejected"}


# --- Admin Stats ---


@router.get("/stats")
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    admin: Therapist = Depends(require_admin),
):
    """Platform-wide stats for admin dashboard."""
    pending_verifications = await db.execute(
        select(func.count(TherapistProfile.id)).where(
            TherapistProfile.verification_status == VerificationStatus.PENDING
        )
    )
    pending_payouts = await db.execute(
        select(func.count(Payout.id)).where(Payout.status == PayoutStatus.PENDING)
    )
    total_commission = await db.execute(
        select(func.sum(Payout.commission_amount)).where(
            Payout.status == PayoutStatus.PAID
        )
    )
    return {
        "pending_verifications": pending_verifications.scalar() or 0,
        "pending_payouts": pending_payouts.scalar() or 0,
        "total_commission_earned": float(total_commission.scalar() or 0),
    }
