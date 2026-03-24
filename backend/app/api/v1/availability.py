from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import time as dt_time
from app.core.database import get_db
from app.models import TherapistAvailability, Therapist
from app.schemas.schemas import (
    AvailabilityCreate,
    AvailabilityUpdate,
    AvailabilityResponse,
)
from app.api.deps import get_current_user

router = APIRouter()


def _parse_time(t: str) -> dt_time:
    parts = t.split(":")
    return dt_time(int(parts[0]), int(parts[1]))


def _format_time(t: dt_time) -> str:
    return t.strftime("%H:%M")


@router.post("/", response_model=AvailabilityResponse)
async def create_availability(
    slot: AvailabilityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    db_slot = TherapistAvailability(
        therapist_id=current_user.id,
        day_of_week=slot.day_of_week,
        start_time=_parse_time(slot.start_time),
        end_time=_parse_time(slot.end_time),
        is_active=slot.is_active,
        specific_date=slot.specific_date,
    )
    db.add(db_slot)
    await db.commit()
    await db.refresh(db_slot)
    return _to_response(db_slot)


@router.get("/", response_model=list[AvailabilityResponse])
async def list_availability(
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(TherapistAvailability)
        .where(TherapistAvailability.therapist_id == current_user.id)
        .order_by(TherapistAvailability.day_of_week)
    )
    return [_to_response(s) for s in result.scalars().all()]


@router.put("/{slot_id}", response_model=AvailabilityResponse)
async def update_availability(
    slot_id: int,
    update: AvailabilityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(TherapistAvailability).where(
            TherapistAvailability.id == slot_id,
            TherapistAvailability.therapist_id == current_user.id,
        )
    )
    slot = result.scalars().first()
    if not slot:
        raise HTTPException(status_code=404, detail="Availability slot not found")

    data = update.model_dump(exclude_unset=True)
    if "start_time" in data:
        data["start_time"] = _parse_time(data["start_time"])
    if "end_time" in data:
        data["end_time"] = _parse_time(data["end_time"])
    for field, value in data.items():
        setattr(slot, field, value)

    await db.commit()
    await db.refresh(slot)
    return _to_response(slot)


@router.delete("/{slot_id}")
async def delete_availability(
    slot_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(TherapistAvailability).where(
            TherapistAvailability.id == slot_id,
            TherapistAvailability.therapist_id == current_user.id,
        )
    )
    slot = result.scalars().first()
    if not slot:
        raise HTTPException(status_code=404, detail="Availability slot not found")

    await db.delete(slot)
    await db.commit()
    return {"detail": "Slot deleted"}


@router.get(
    "/therapist/{therapist_id}/slots", response_model=list[AvailabilityResponse]
)
async def get_therapist_slots(
    therapist_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint: get available slots for a therapist (for parent booking)."""
    result = await db.execute(
        select(TherapistAvailability)
        .where(
            TherapistAvailability.therapist_id == therapist_id,
            TherapistAvailability.is_active == True,
        )
        .order_by(TherapistAvailability.day_of_week)
    )
    return [_to_response(s) for s in result.scalars().all()]


def _to_response(slot: TherapistAvailability) -> dict:
    return {
        "id": slot.id,
        "therapist_id": slot.therapist_id,
        "day_of_week": slot.day_of_week,
        "start_time": _format_time(slot.start_time),
        "end_time": _format_time(slot.end_time),
        "is_active": slot.is_active,
        "specific_date": slot.specific_date,
        "created_at": slot.created_at,
    }
