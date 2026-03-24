from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.core.database import get_db
from app.models import (
    CancellationRecord,
    CancellationType,
    Appointment,
    AppointmentStatus,
    SessionPackage,
    Patient,
    Therapist,
)
from app.schemas.schemas import CancellationCreate, CancellationResponse
from app.api.deps import get_current_user
from typing import Optional

router = APIRouter()


@router.post("/", response_model=CancellationResponse)
async def cancel_appointment(
    cancel: CancellationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    # Verify appointment belongs to therapist
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == cancel.appointment_id,
            Appointment.therapist_id == current_user.id,
        )
    )
    appt = result.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appt.status in (
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
    ):
        raise HTTPException(status_code=400, detail="Appointment already finalized")

    # Update appointment status
    if cancel.type == CancellationType.NO_SHOW:
        appt.status = AppointmentStatus.NO_SHOW
    else:
        appt.status = AppointmentStatus.CANCELLED

    # Create cancellation record
    record = CancellationRecord(
        appointment_id=cancel.appointment_id,
        type=cancel.type,
        reason=cancel.reason,
        cancelled_by=cancel.cancelled_by,
        fee_charged=cancel.fee_charged,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/", response_model=list[CancellationResponse])
async def list_cancellations(
    patient_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    query = (
        select(CancellationRecord)
        .join(Appointment, CancellationRecord.appointment_id == Appointment.id)
        .where(Appointment.therapist_id == current_user.id)
    )
    if patient_id:
        query = query.where(Appointment.patient_id == patient_id)
    query = (
        query.order_by(CancellationRecord.created_at.desc()).offset(skip).limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{record_id}/return-session", response_model=CancellationResponse)
async def return_session_to_package(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Return a session to the package after cancellation."""
    result = await db.execute(
        select(CancellationRecord)
        .join(Appointment, CancellationRecord.appointment_id == Appointment.id)
        .where(
            CancellationRecord.id == record_id,
            Appointment.therapist_id == current_user.id,
        )
    )
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Cancellation record not found")

    if record.package_session_returned:
        raise HTTPException(status_code=400, detail="Session already returned")

    # Find the appointment's package and return the session
    appt_result = await db.execute(
        select(Appointment).where(Appointment.id == record.appointment_id)
    )
    appt = appt_result.scalars().first()
    if appt and appt.package_id:
        pkg_result = await db.execute(
            select(SessionPackage).where(SessionPackage.id == appt.package_id)
        )
        pkg = pkg_result.scalars().first()
        if pkg and pkg.used_sessions > 0:
            pkg.used_sessions -= 1
            record.package_session_returned = True

    await db.commit()
    await db.refresh(record)
    return record
