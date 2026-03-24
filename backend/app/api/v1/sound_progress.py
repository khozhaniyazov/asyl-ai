from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models import SoundProgressRecord, Patient, Therapist
from app.schemas.schemas import (
    SoundProgressCreate,
    SoundProgressUpdate,
    SoundProgressResponse,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/", response_model=SoundProgressResponse)
async def create_sound_progress(
    record: SoundProgressCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    # Verify patient belongs to therapist
    result = await db.execute(
        select(Patient).where(
            Patient.id == record.patient_id,
            Patient.therapist_id == current_user.id,
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=403, detail="Patient not found or not yours")

    db_record = SoundProgressRecord(**record.model_dump())
    db.add(db_record)
    await db.commit()
    await db.refresh(db_record)
    return db_record


@router.get("/patient/{patient_id}", response_model=list[SoundProgressResponse])
async def get_patient_sound_progress(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    # Verify patient belongs to therapist
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.therapist_id == current_user.id,
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=403, detail="Patient not found or not yours")

    result = await db.execute(
        select(SoundProgressRecord)
        .where(SoundProgressRecord.patient_id == patient_id)
        .order_by(SoundProgressRecord.assessed_at.desc())
    )
    return result.scalars().all()


@router.put("/{record_id}", response_model=SoundProgressResponse)
async def update_sound_progress(
    record_id: int,
    update: SoundProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(SoundProgressRecord)
        .join(Patient, SoundProgressRecord.patient_id == Patient.id)
        .where(
            SoundProgressRecord.id == record_id,
            Patient.therapist_id == current_user.id,
        )
    )
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(record, field, value)

    await db.commit()
    await db.refresh(record)
    return record


@router.delete("/{record_id}")
async def delete_sound_progress(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(SoundProgressRecord)
        .join(Patient, SoundProgressRecord.patient_id == Patient.id)
        .where(
            SoundProgressRecord.id == record_id,
            Patient.therapist_id == current_user.id,
        )
    )
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    await db.delete(record)
    await db.commit()
    return {"detail": "Record deleted"}
