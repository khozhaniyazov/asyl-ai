"""Analytics dashboard API — practice metrics and trends."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.models import (
    Appointment,
    AppointmentStatus,
    Patient,
    PatientStatus,
    SessionPackage,
    PaymentStatus,
    CancellationRecord,
    Therapist,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/summary")
async def get_analytics_summary(
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=now.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Sessions this week
    result = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.therapist_id == current_user.id,
            Appointment.status == AppointmentStatus.COMPLETED,
            Appointment.start_time >= week_start,
        )
    )
    sessions_this_week = result.scalar() or 0

    # Sessions this month
    result = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.therapist_id == current_user.id,
            Appointment.status == AppointmentStatus.COMPLETED,
            Appointment.start_time >= month_start,
        )
    )
    sessions_this_month = result.scalar() or 0

    # Patient counts by status
    for status in ["active", "discharged", "waitlisted", "paused"]:
        pass  # will build below

    result = await db.execute(
        select(Patient.status, func.count(Patient.id))
        .where(Patient.therapist_id == current_user.id)
        .group_by(Patient.status)
    )
    patient_counts = {
        row[0].value if row[0] else "active": row[1] for row in result.all()
    }

    # Total patients
    total_patients = sum(patient_counts.values())

    # Revenue this month
    result = await db.execute(
        select(func.coalesce(func.sum(SessionPackage.total_price), 0)).where(
            SessionPackage.therapist_id == current_user.id,
            SessionPackage.payment_status == PaymentStatus.PAID,
            SessionPackage.purchased_at >= month_start,
        )
    )
    revenue_this_month = float(result.scalar() or 0)

    # Cancellation rate (last 30 days)
    result = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.therapist_id == current_user.id,
            Appointment.start_time >= now - timedelta(days=30),
        )
    )
    total_appts_30d = result.scalar() or 0

    result = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.therapist_id == current_user.id,
            Appointment.status.in_(
                [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]
            ),
            Appointment.start_time >= now - timedelta(days=30),
        )
    )
    cancelled_30d = result.scalar() or 0
    cancellation_rate = (
        round((cancelled_30d / total_appts_30d * 100), 1) if total_appts_30d > 0 else 0
    )

    # Avg sessions per patient
    result = await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.therapist_id == current_user.id,
            Appointment.status == AppointmentStatus.COMPLETED,
        )
    )
    total_completed = result.scalar() or 0
    avg_sessions = (
        round(total_completed / total_patients, 1) if total_patients > 0 else 0
    )

    return {
        "sessions_this_week": sessions_this_week,
        "sessions_this_month": sessions_this_month,
        "total_patients": total_patients,
        "patient_counts": patient_counts,
        "revenue_this_month": revenue_this_month,
        "cancellation_rate": cancellation_rate,
        "avg_sessions_per_patient": avg_sessions,
    }


@router.get("/trends")
async def get_analytics_trends(
    weeks: int = 12,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    weekly_sessions = []
    monthly_revenue = []

    # Weekly session counts
    for i in range(weeks - 1, -1, -1):
        w_start = now - timedelta(weeks=i, days=now.weekday())
        w_start = w_start.replace(hour=0, minute=0, second=0, microsecond=0)
        w_end = w_start + timedelta(days=7)

        result = await db.execute(
            select(func.count(Appointment.id)).where(
                Appointment.therapist_id == current_user.id,
                Appointment.status == AppointmentStatus.COMPLETED,
                Appointment.start_time >= w_start,
                Appointment.start_time < w_end,
            )
        )
        count = result.scalar() or 0
        weekly_sessions.append(
            {
                "week": w_start.strftime("%d %b"),
                "sessions": count,
            }
        )

    # Monthly revenue (last 6 months)
    for i in range(5, -1, -1):
        target = now - timedelta(days=30 * i)
        m_start = target.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = (m_start + timedelta(days=32)).replace(day=1) if i > 0 else now

        result = await db.execute(
            select(func.coalesce(func.sum(SessionPackage.total_price), 0)).where(
                SessionPackage.therapist_id == current_user.id,
                SessionPackage.payment_status == PaymentStatus.PAID,
                SessionPackage.purchased_at >= m_start,
                SessionPackage.purchased_at < next_month,
            )
        )
        amount = float(result.scalar() or 0)
        monthly_revenue.append(
            {
                "month": m_start.strftime("%b"),
                "revenue": amount,
            }
        )

    # New patients per month (last 6 months)
    new_patients = []
    for i in range(5, -1, -1):
        target = now - timedelta(days=30 * i)
        m_start = target.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month = (m_start + timedelta(days=32)).replace(day=1) if i > 0 else now

        result = await db.execute(
            select(func.count(Patient.id)).where(
                Patient.therapist_id == current_user.id,
                Patient.created_at >= m_start,
                Patient.created_at < next_month,
            )
        )
        count = result.scalar() or 0
        new_patients.append(
            {
                "month": m_start.strftime("%b"),
                "count": count,
            }
        )

    return {
        "weekly_sessions": weekly_sessions,
        "monthly_revenue": monthly_revenue,
        "new_patients": new_patients,
    }
