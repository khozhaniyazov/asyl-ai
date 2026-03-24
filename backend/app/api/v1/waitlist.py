from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models import WaitlistEntry, WaitlistStatus, Patient, Therapist
from app.schemas.schemas import (
    WaitlistCreate,
    WaitlistUpdate,
    WaitlistResponse,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/", response_model=WaitlistResponse)
async def add_to_waitlist(
    entry: WaitlistCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    # Verify patient belongs to therapist
    result = await db.execute(
        select(Patient).where(
            Patient.id == entry.patient_id,
            Patient.therapist_id == current_user.id,
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=403, detail="Patient not found or not yours")

    db_entry = WaitlistEntry(
        **entry.model_dump(),
        therapist_id=current_user.id,
    )
    db.add(db_entry)
    await db.commit()
    await db.refresh(db_entry)
    return db_entry


@router.get("/", response_model=list[WaitlistResponse])
async def list_waitlist(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(WaitlistEntry)
        .where(
            WaitlistEntry.therapist_id == current_user.id,
            WaitlistEntry.status == WaitlistStatus.WAITING,
        )
        .order_by(WaitlistEntry.priority.desc(), WaitlistEntry.created_at)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.put("/{entry_id}", response_model=WaitlistResponse)
async def update_waitlist_entry(
    entry_id: int,
    update: WaitlistUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(WaitlistEntry).where(
            WaitlistEntry.id == entry_id,
            WaitlistEntry.therapist_id == current_user.id,
        )
    )
    entry = result.scalars().first()
    if not entry:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")

    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)

    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{entry_id}")
async def remove_from_waitlist(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(WaitlistEntry).where(
            WaitlistEntry.id == entry_id,
            WaitlistEntry.therapist_id == current_user.id,
        )
    )
    entry = result.scalars().first()
    if not entry:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")

    await db.delete(entry)
    await db.commit()
    return {"detail": "Removed from waitlist"}


@router.post("/{entry_id}/offer", response_model=WaitlistResponse)
async def offer_slot(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Mark a waitlist entry as offered — triggers notification to parent."""
    result = await db.execute(
        select(WaitlistEntry).where(
            WaitlistEntry.id == entry_id,
            WaitlistEntry.therapist_id == current_user.id,
        )
    )
    entry = result.scalars().first()
    if not entry:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")

    if entry.status != WaitlistStatus.WAITING:
        raise HTTPException(status_code=400, detail="Entry is not in waiting status")

    entry.status = WaitlistStatus.OFFERED

    # Schedule a notification via the reminder system
    from app.models import Reminder, ReminderType, ReminderStatus, ReminderChannel
    from datetime import datetime, timezone

    reminder = Reminder(
        type=ReminderType.WAITLIST_OFFER,
        channel=ReminderChannel.WHATSAPP,
        scheduled_for=datetime.now(timezone.utc),
        status=ReminderStatus.SCHEDULED,
    )
    db.add(reminder)

    await db.commit()
    await db.refresh(entry)
    return entry
