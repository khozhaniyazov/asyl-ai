from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models import Appointment, AppointmentStatus, Patient, Therapist
from app.schemas.schemas import AppointmentCreate, AppointmentResponse
from app.integrations.mock_services import KaspiMock
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=AppointmentResponse)
async def create_appointment(
    appointment: AppointmentCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user)
):
    # Verify patient belongs to user
    result = await db.execute(select(Patient).filter(Patient.id == appointment.patient_id, Patient.therapist_id == current_user.id))
    if not result.scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized to create appointment for this patient")
        
    db_appt = Appointment(**appointment.model_dump(), therapist_id=current_user.id)
    db.add(db_appt)
    await db.commit()
    await db.refresh(db_appt)
    return db_appt

@router.get("/", response_model=list[AppointmentResponse])
async def read_appointments(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user)
):
    result = await db.execute(
        select(Appointment)
        .filter(Appointment.therapist_id == current_user.id)
        .offset(skip).limit(limit)
    )
    return result.scalars().all()

@router.post("/{appointment_id}/generate-kaspi-link")
async def generate_kaspi_link(
    appointment_id: int, 
    amount: int = 5000, 
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user)
):
    result = await db.execute(select(Appointment).filter(Appointment.id == appointment_id, Appointment.therapist_id == current_user.id))
    appt = result.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    link = await KaspiMock.generate_payment_link(amount, appointment_id)
    appt.kaspi_link = link
    await db.commit()
    return {"kaspi_link": link}
