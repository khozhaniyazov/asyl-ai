"""Video session API — create rooms, get join URLs."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import uuid

from app.core.database import get_db
from app.models import VideoSession, Appointment, Therapist
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/{appointment_id}")
async def create_video_session(
    appointment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Create a video room for an appointment."""
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.therapist_id == current_user.id,
        )
    )
    appt = result.scalars().first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Check if already exists
    result = await db.execute(
        select(VideoSession).where(VideoSession.appointment_id == appointment_id)
    )
    existing = result.scalars().first()
    if existing:
        return _video_to_dict(existing)

    # Generate room (mock — in production, call Daily.co API)
    room_id = uuid.uuid4().hex[:12]
    room_url = f"https://asyl-ai.daily.co/{room_id}"
    therapist_token = uuid.uuid4().hex
    parent_token = uuid.uuid4().hex

    video = VideoSession(
        appointment_id=appointment_id,
        room_url=room_url,
        therapist_join_url=f"{room_url}?t={therapist_token}",
        parent_join_url=f"{room_url}?t={parent_token}",
    )
    db.add(video)
    await db.commit()
    await db.refresh(video)
    return _video_to_dict(video)


@router.get("/{appointment_id}")
async def get_video_session(
    appointment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(VideoSession)
        .join(Appointment)
        .where(
            VideoSession.appointment_id == appointment_id,
            Appointment.therapist_id == current_user.id,
        )
    )
    video = result.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="Video session not found")
    return _video_to_dict(video)


@router.post("/{appointment_id}/start")
async def start_video_session(
    appointment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(VideoSession)
        .join(Appointment)
        .where(
            VideoSession.appointment_id == appointment_id,
            Appointment.therapist_id == current_user.id,
        )
    )
    video = result.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="Video session not found")

    video.started_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(video)
    return _video_to_dict(video)


@router.post("/{appointment_id}/end")
async def end_video_session(
    appointment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(VideoSession)
        .join(Appointment)
        .where(
            VideoSession.appointment_id == appointment_id,
            Appointment.therapist_id == current_user.id,
        )
    )
    video = result.scalars().first()
    if not video:
        raise HTTPException(status_code=404, detail="Video session not found")

    video.ended_at = datetime.now(timezone.utc)
    if video.started_at:
        started = video.started_at
        if started.tzinfo is None:
            started = started.replace(tzinfo=timezone.utc)
        video.duration_seconds = int((video.ended_at - started).total_seconds())
    await db.commit()
    await db.refresh(video)
    return _video_to_dict(video)


def _video_to_dict(v: VideoSession) -> dict:
    return {
        "id": v.id,
        "appointment_id": v.appointment_id,
        "room_url": v.room_url,
        "therapist_join_url": v.therapist_join_url,
        "parent_join_url": v.parent_join_url,
        "started_at": v.started_at.isoformat() if v.started_at else None,
        "ended_at": v.ended_at.isoformat() if v.ended_at else None,
        "duration_seconds": v.duration_seconds,
    }
