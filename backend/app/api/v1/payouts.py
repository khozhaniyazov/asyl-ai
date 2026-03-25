"""Payout management for therapists."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone

from app.core.database import get_db
from app.models import (
    Payout,
    PayoutStatus,
    BankAccount,
    Therapist,
    MarketplaceBooking,
    BookingStatus,
)
from app.schemas.schemas import (
    PayoutRequest,
    PayoutResponse,
    BankAccountCreate,
    BankAccountResponse,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/earnings", response_model=dict)
async def get_earnings_summary(
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Get therapist earnings summary."""
    # Total completed bookings
    result = await db.execute(
        select(
            func.sum(MarketplaceBooking.deposit_amount).label("total_earned"),
            func.sum(MarketplaceBooking.commission_amount).label("total_commission"),
            func.sum(MarketplaceBooking.net_amount).label("total_net"),
        ).where(
            MarketplaceBooking.therapist_id == current_user.id,
            MarketplaceBooking.status == BookingStatus.COMPLETED,
            MarketplaceBooking.payout_id.is_(None),
        )
    )
    row = result.first()
    available = float(row.total_net or 0)

    # Pending payouts
    pending_result = await db.execute(
        select(func.sum(Payout.net_amount)).where(
            Payout.therapist_id == current_user.id,
            Payout.status == PayoutStatus.PENDING,
        )
    )
    pending = float(pending_result.scalar() or 0)

    return {
        "available_balance": available,
        "pending_payout": pending,
        "total_earned": float(row.total_earned or 0),
        "total_commission": float(row.total_commission or 0),
    }


@router.post("/request", response_model=PayoutResponse)
async def request_payout(
    data: PayoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Request a payout."""
    # Check bank account
    bank_result = await db.execute(
        select(BankAccount).where(BankAccount.therapist_id == current_user.id)
    )
    bank_account = bank_result.scalars().first()
    if not bank_account:
        raise HTTPException(status_code=400, detail="Add bank account first")

    # Check available balance
    result = await db.execute(
        select(func.sum(MarketplaceBooking.net_amount)).where(
            MarketplaceBooking.therapist_id == current_user.id,
            MarketplaceBooking.status == BookingStatus.COMPLETED,
            MarketplaceBooking.payout_id.is_(None),
        )
    )
    available = float(result.scalar() or 0)

    if data.amount > available:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Calculate commission (7.5% default)
    commission = data.amount * 0.075
    net = data.amount - commission

    payout = Payout(
        therapist_id=current_user.id,
        amount=data.amount,
        commission_amount=commission,
        net_amount=net,
        bank_account_id=bank_account.id,
        status=PayoutStatus.PENDING,
    )
    db.add(payout)
    await db.commit()
    await db.refresh(payout)
    return payout


@router.get("/", response_model=list[PayoutResponse])
async def list_payouts(
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """List therapist's payouts."""
    result = await db.execute(
        select(Payout)
        .where(Payout.therapist_id == current_user.id)
        .order_by(Payout.created_at.desc())
    )
    return result.scalars().all()


@router.post("/bank-account", response_model=BankAccountResponse)
async def create_bank_account(
    data: BankAccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Create or update bank account."""
    result = await db.execute(
        select(BankAccount).where(BankAccount.therapist_id == current_user.id)
    )
    existing = result.scalars().first()

    if existing:
        for field, value in data.model_dump().items():
            setattr(existing, field, value)
        existing.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(existing)
        return existing

    account = BankAccount(therapist_id=current_user.id, **data.model_dump())
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


@router.get("/bank-account", response_model=BankAccountResponse)
async def get_bank_account(
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Get therapist's bank account."""
    result = await db.execute(
        select(BankAccount).where(BankAccount.therapist_id == current_user.id)
    )
    account = result.scalars().first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    return account
