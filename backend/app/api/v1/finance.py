"""Finance summary and analytics endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.models import (
    SessionPackage,
    PaymentStatus,
    Appointment,
    AppointmentStatus,
    Patient,
    Therapist,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/summary")
async def get_finance_summary(
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Get financial summary: earned this month, outstanding, total."""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Total earned this month (paid packages purchased this month)
    result = await db.execute(
        select(func.coalesce(func.sum(SessionPackage.total_price), 0)).where(
            SessionPackage.therapist_id == current_user.id,
            SessionPackage.payment_status == PaymentStatus.PAID,
            SessionPackage.purchased_at >= month_start,
        )
    )
    earned_this_month = float(result.scalar() or 0)

    # Total earned all time
    result = await db.execute(
        select(func.coalesce(func.sum(SessionPackage.total_price), 0)).where(
            SessionPackage.therapist_id == current_user.id,
            SessionPackage.payment_status == PaymentStatus.PAID,
        )
    )
    total_earned = float(result.scalar() or 0)

    # Outstanding (pending + overdue packages)
    result = await db.execute(
        select(func.coalesce(func.sum(SessionPackage.total_price), 0)).where(
            SessionPackage.therapist_id == current_user.id,
            SessionPackage.payment_status.in_(
                [PaymentStatus.PENDING, PaymentStatus.OVERDUE]
            ),
        )
    )
    outstanding = float(result.scalar() or 0)

    # Last month earned (for comparison)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    result = await db.execute(
        select(func.coalesce(func.sum(SessionPackage.total_price), 0)).where(
            SessionPackage.therapist_id == current_user.id,
            SessionPackage.payment_status == PaymentStatus.PAID,
            SessionPackage.purchased_at >= last_month_start,
            SessionPackage.purchased_at < month_start,
        )
    )
    earned_last_month = float(result.scalar() or 0)

    change_percent = 0.0
    if earned_last_month > 0:
        change_percent = round(
            ((earned_this_month - earned_last_month) / earned_last_month) * 100, 1
        )

    # Sessions this month
    result = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.therapist_id == current_user.id,
            Appointment.status == AppointmentStatus.COMPLETED,
            Appointment.start_time >= month_start,
        )
    )
    sessions_this_month = result.scalar() or 0

    return {
        "earned_this_month": earned_this_month,
        "earned_last_month": earned_last_month,
        "total_earned": total_earned,
        "outstanding": outstanding,
        "change_percent": change_percent,
        "sessions_this_month": sessions_this_month,
    }


@router.get("/revenue-chart")
async def get_revenue_chart(
    months: int = 6,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Get monthly revenue data for chart."""
    now = datetime.now(timezone.utc)
    data = []

    for i in range(months - 1, -1, -1):
        # Calculate month boundaries
        target = now - timedelta(days=30 * i)
        m_start = target.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i > 0:
            next_month = (m_start + timedelta(days=32)).replace(day=1)
        else:
            next_month = now

        result = await db.execute(
            select(func.coalesce(func.sum(SessionPackage.total_price), 0)).where(
                SessionPackage.therapist_id == current_user.id,
                SessionPackage.payment_status == PaymentStatus.PAID,
                SessionPackage.purchased_at >= m_start,
                SessionPackage.purchased_at < next_month,
            )
        )
        amount = float(result.scalar() or 0)
        data.append(
            {
                "month": m_start.strftime("%b"),
                "amount": amount,
            }
        )

    return data


@router.get("/debtors")
async def get_debtors(
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Get patients with outstanding payments."""
    result = await db.execute(
        select(SessionPackage, Patient)
        .join(Patient, SessionPackage.patient_id == Patient.id)
        .where(
            SessionPackage.therapist_id == current_user.id,
            SessionPackage.payment_status.in_(
                [PaymentStatus.PENDING, PaymentStatus.OVERDUE]
            ),
        )
        .order_by(SessionPackage.created_at.desc())
    )
    rows = result.all()

    debtors = []
    for pkg, patient in rows:
        debtors.append(
            {
                "package_id": pkg.id,
                "patient_id": patient.id,
                "patient_name": f"{patient.first_name} {patient.last_name}",
                "parent_phone": patient.parent_phone,
                "amount": float(pkg.total_price),
                "payment_status": pkg.payment_status.value,
                "purchased_at": pkg.purchased_at.isoformat()
                if pkg.purchased_at
                else None,
            }
        )

    return debtors


@router.get("/packages")
async def get_all_packages(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Get all packages for the therapist (transaction-like view)."""
    result = await db.execute(
        select(SessionPackage, Patient)
        .join(Patient, SessionPackage.patient_id == Patient.id)
        .where(SessionPackage.therapist_id == current_user.id)
        .order_by(SessionPackage.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    rows = result.all()

    return [
        {
            "id": pkg.id,
            "patient_name": f"{patient.first_name} {patient.last_name}",
            "total_sessions": pkg.total_sessions,
            "used_sessions": pkg.used_sessions,
            "total_price": float(pkg.total_price),
            "payment_status": pkg.payment_status.value,
            "purchased_at": pkg.purchased_at.isoformat() if pkg.purchased_at else None,
        }
        for pkg, patient in rows
    ]
