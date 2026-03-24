from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta, timezone
from app.core.database import get_db
from app.models import (
    Appointment,
    AppointmentStatus,
    Patient,
    Therapist,
    SessionPackage,
    Reminder,
    ReminderType,
    ReminderStatus,
    ReminderChannel,
)
from app.schemas.schemas import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
)
from app.integrations.mock_services import KaspiMock
from app.api.deps import get_current_user

router = APIRouter()


async def _compute_session_number(db: AsyncSession, patient_id: int) -> int:
    """Auto-increment session number per patient."""
    result = await db.execute(
        select(func.count(Appointment.id)).where(Appointment.patient_id == patient_id)
    )
    return (result.scalar() or 0) + 1


async def _schedule_reminders(
    db: AsyncSession, appointment_id: int, start_time: datetime
):
    """Auto-create 24h and 1h reminders for an appointment."""
    now = datetime.now(timezone.utc)
    # Ensure start_time is timezone-aware for comparison
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    for rtype, delta in [
        (ReminderType.SESSION_24H, timedelta(hours=24)),
        (ReminderType.SESSION_1H, timedelta(hours=1)),
    ]:
        scheduled_for = start_time - delta
        if scheduled_for > now:
            reminder = Reminder(
                appointment_id=appointment_id,
                type=rtype,
                channel=ReminderChannel.WHATSAPP,
                scheduled_for=scheduled_for,
                status=ReminderStatus.SCHEDULED,
            )
            db.add(reminder)


async def _deduct_package_session(db: AsyncSession, appointment: Appointment):
    """Auto-deduct a session from the linked package when appointment is completed."""
    if not appointment.package_id:
        return
    result = await db.execute(
        select(SessionPackage).where(SessionPackage.id == appointment.package_id)
    )
    pkg = result.scalars().first()
    if pkg and not pkg.is_exhausted:
        pkg.used_sessions += 1


@router.post("/", response_model=AppointmentResponse)
async def create_appointment(
    appointment: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(Patient).filter(
            Patient.id == appointment.patient_id,
            Patient.therapist_id == current_user.id,
        )
    )
    if not result.scalars().first():
        raise HTTPException(
            status_code=403,
            detail="Not authorized to create appointment for this patient",
        )

    # Auto-compute session number
    session_number = await _compute_session_number(db, appointment.patient_id)

    db_appt = Appointment(
        **appointment.model_dump(),
        therapist_id=current_user.id,
        session_number=session_number,
    )
    db.add(db_appt)
    await db.flush()  # get the ID

    # Auto-schedule reminders
    await _schedule_reminders(db, db_appt.id, appointment.start_time)

    await db.commit()
    await db.refresh(db_appt)
    return db_appt


@router.get("/", response_model=list[AppointmentResponse])
async def read_appointments(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(Appointment)
        .filter(Appointment.therapist_id == current_user.id)
        .order_by(Appointment.start_time.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.therapist_id == current_user.id,
        )
    )
    appt = result.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: int,
    update: AppointmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.therapist_id == current_user.id,
        )
    )
    appt = result.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    old_status = appt.status
    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appt, field, value)

    # Auto-deduct package session when status changes to COMPLETED
    new_status = update_data.get("status")
    if (
        new_status == AppointmentStatus.COMPLETED
        and old_status != AppointmentStatus.COMPLETED
    ):
        await _deduct_package_session(db, appt)

    await db.commit()
    await db.refresh(appt)
    return appt


@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.therapist_id == current_user.id,
        )
    )
    appt = result.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Cancel any pending reminders
    reminder_result = await db.execute(
        select(Reminder).where(
            Reminder.appointment_id == appointment_id,
            Reminder.status == ReminderStatus.SCHEDULED,
        )
    )
    for reminder in reminder_result.scalars().all():
        reminder.status = ReminderStatus.CANCELLED

    await db.delete(appt)
    await db.commit()
    return {"detail": "Appointment deleted"}


@router.post("/{appointment_id}/generate-kaspi-link")
async def generate_kaspi_link(
    appointment_id: int,
    amount: int = 5000,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.therapist_id == current_user.id,
        )
    )
    appt = result.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    link = await KaspiMock.generate_payment_link(amount, appointment_id)
    appt.kaspi_link = link
    await db.commit()
    return {"kaspi_link": link}
