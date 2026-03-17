from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models import Patient, Therapist
from app.schemas.schemas import PatientCreate, PatientResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=PatientResponse)
async def create_patient(
    patient: PatientCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user)
):
    db_patient = Patient(**patient.model_dump(), therapist_id=current_user.id)
    db.add(db_patient)
    await db.commit()
    await db.refresh(db_patient)
    return db_patient

@router.get("/", response_model=list[PatientResponse])
async def read_patients(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user)
):
    result = await db.execute(
        select(Patient)
        .filter(Patient.therapist_id == current_user.id)
        .offset(skip).limit(limit)
    )
    return result.scalars().all()
