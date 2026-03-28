from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models import Session, Appointment, Patient, Therapist
from app.models.appointment import AppointmentStatus
from app.schemas.schemas import SessionUpdate, SessionResponse
from app.integrations.whatsapp_service import whatsapp_service
from app.api.deps import get_current_user
from pydantic import BaseModel
from typing import Optional


class CreateSessionRequest(BaseModel):
    soap_subjective: Optional[str] = None
    soap_objective: Optional[str] = None
    soap_assessment: Optional[str] = None
    soap_plan: Optional[str] = None
    homework_for_parents: Optional[str] = None


router = APIRouter()


@router.post("/{appointment_id}", response_model=SessionResponse)
async def create_session(
    appointment_id: int,
    data: CreateSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Create a session with manual SOAP notes for an appointment."""
    result = await db.execute(
        select(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.therapist_id == current_user.id,
        )
    )
    appt = result.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Check if session already exists
    existing = await db.execute(
        select(Session).filter(Session.appointment_id == appointment_id)
    )
    db_session = existing.scalars().first()

    if db_session:
        # Update existing session
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(db_session, field, value)
        db_session.status = "completed"
        appt.status = AppointmentStatus.COMPLETED
    else:
        # Create new session
        db_session = Session(
            appointment_id=appointment_id,
            status="completed",
            **data.model_dump(exclude_unset=True),
        )
        db.add(db_session)

    # Sync Appointment status
    appt.status = AppointmentStatus.COMPLETED
    db.add(appt)

    await db.commit()
    await db.refresh(db_session)
    return db_session


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Retrieve a session by ID."""
    result = await db.execute(
        select(Session)
        .join(Appointment)
        .filter(Session.id == session_id, Appointment.therapist_id == current_user.id)
    )
    db_session = result.scalars().first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: int,
    update: SessionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Save edited SOAP notes back to a session."""
    result = await db.execute(
        select(Session)
        .join(Appointment)
        .filter(Session.id == session_id, Appointment.therapist_id == current_user.id)
    )
    db_session = result.scalars().first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_session, field, value)

    await db.commit()
    await db.refresh(db_session)
    return db_session


@router.post("/{session_id}/send-homework")
async def send_homework_whatsapp(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Send homework to parent via WhatsApp."""
    result = await db.execute(
        select(Session)
        .join(Appointment)
        .options(selectinload(Session.appointment).selectinload(Appointment.patient))
        .filter(Session.id == session_id, Appointment.therapist_id == current_user.id)
    )
    db_session = result.scalars().first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not db_session.homework_for_parents:
        raise HTTPException(status_code=400, detail="No homework to send")

    patient = db_session.appointment.patient
    if not patient or not patient.parent_phone:
        raise HTTPException(status_code=400, detail="No parent phone number on file")

    sent = await whatsapp_service.send_text_message(
        phone=patient.parent_phone,
        message=f"Homework for {patient.first_name}:\n\n{db_session.homework_for_parents}",
    )

    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send WhatsApp message")

    return {"detail": "Homework sent via WhatsApp", "phone": patient.parent_phone}
