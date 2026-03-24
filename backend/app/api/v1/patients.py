from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models import Patient, Therapist
from app.schemas.schemas import PatientCreate, PatientUpdate, PatientResponse
from app.api.deps import get_current_user
from typing import Optional

router = APIRouter()


@router.post("/", response_model=PatientResponse)
async def create_patient(
    patient: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
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
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    query = select(Patient).filter(Patient.therapist_id == current_user.id)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Patient.first_name.ilike(search_term))
            | (Patient.last_name.ilike(search_term))
            | (Patient.diagnosis.ilike(search_term))
        )
    query = query.order_by(Patient.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(Patient).filter(
            Patient.id == patient_id, Patient.therapist_id == current_user.id
        )
    )
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: int,
    patient_update: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(Patient).filter(
            Patient.id == patient_id, Patient.therapist_id == current_user.id
        )
    )
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    update_data = patient_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    await db.commit()
    await db.refresh(patient)
    return patient


@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(Patient).filter(
            Patient.id == patient_id, Patient.therapist_id == current_user.id
        )
    )
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    await db.delete(patient)
    await db.commit()
    return {"detail": "Patient deleted"}
