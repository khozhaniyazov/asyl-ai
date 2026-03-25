from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.core.database import get_db
from app.models import (
    HomeworkAssignment,
    HomeworkStatus,
    Patient,
    Therapist,
    Reminder,
    ReminderType,
    ReminderStatus,
    ReminderChannel,
)
from app.schemas.schemas import (
    HomeworkAssignmentCreate,
    HomeworkAssignmentUpdate,
    HomeworkAssignmentResponse,
    HomeworkCompletionRequest,
    HomeworkVerifyRequest,
)
from app.api.deps import get_current_user
from typing import Optional
from datetime import timedelta

router = APIRouter()


@router.post("/", response_model=HomeworkAssignmentResponse)
async def create_assignment(
    assignment: HomeworkAssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    # Verify patient belongs to therapist
    result = await db.execute(
        select(Patient).where(
            Patient.id == assignment.patient_id,
            Patient.therapist_id == current_user.id,
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=403, detail="Patient not found or not yours")

    db_hw = HomeworkAssignment(**assignment.model_dump())
    db.add(db_hw)
    await db.flush()

    # Auto-schedule homework due reminder if due_date is set
    if assignment.due_date:
        reminder_time = assignment.due_date - timedelta(hours=24)
        if reminder_time > datetime.now(timezone.utc):
            reminder = Reminder(
                homework_assignment_id=db_hw.id,
                type=ReminderType.HOMEWORK_DUE,
                channel=ReminderChannel.WHATSAPP,
                scheduled_for=reminder_time,
                status=ReminderStatus.SCHEDULED,
            )
            db.add(reminder)

    await db.commit()
    await db.refresh(db_hw)
    return db_hw


@router.get("/", response_model=list[HomeworkAssignmentResponse])
async def list_assignments(
    patient_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    query = (
        select(HomeworkAssignment)
        .join(Patient, HomeworkAssignment.patient_id == Patient.id)
        .where(Patient.therapist_id == current_user.id)
    )
    if patient_id:
        query = query.where(HomeworkAssignment.patient_id == patient_id)
    if status:
        query = query.where(HomeworkAssignment.status == status)
    query = (
        query.order_by(HomeworkAssignment.created_at.desc()).offset(skip).limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{assignment_id}", response_model=HomeworkAssignmentResponse)
async def get_assignment(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(HomeworkAssignment)
        .join(Patient, HomeworkAssignment.patient_id == Patient.id)
        .where(
            HomeworkAssignment.id == assignment_id,
            Patient.therapist_id == current_user.id,
        )
    )
    hw = result.scalars().first()
    if not hw:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return hw


@router.put("/{assignment_id}", response_model=HomeworkAssignmentResponse)
async def update_assignment(
    assignment_id: int,
    update: HomeworkAssignmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(HomeworkAssignment)
        .join(Patient, HomeworkAssignment.patient_id == Patient.id)
        .where(
            HomeworkAssignment.id == assignment_id,
            Patient.therapist_id == current_user.id,
        )
    )
    hw = result.scalars().first()
    if not hw:
        raise HTTPException(status_code=404, detail="Assignment not found")

    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(hw, field, value)

    await db.commit()
    await db.refresh(hw)
    return hw


@router.post("/{assignment_id}/complete", response_model=HomeworkAssignmentResponse)
async def complete_assignment(
    assignment_id: int,
    body: HomeworkCompletionRequest,
    db: AsyncSession = Depends(get_db),
):
    """Parent marks homework as completed. No auth required (parent portal uses separate token)."""
    result = await db.execute(
        select(HomeworkAssignment).where(HomeworkAssignment.id == assignment_id)
    )
    hw = result.scalars().first()
    if not hw:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if hw.status not in (HomeworkStatus.ASSIGNED, HomeworkStatus.OVERDUE):
        raise HTTPException(
            status_code=400, detail="Assignment cannot be completed in current state"
        )

    hw.status = HomeworkStatus.COMPLETED
    hw.parent_completed_at = datetime.now(timezone.utc)
    hw.parent_notes = body.parent_notes
    if body.parent_video_url:
        hw.parent_video_url = body.parent_video_url

    await db.commit()
    await db.refresh(hw)
    return hw


@router.post("/{assignment_id}/verify", response_model=HomeworkAssignmentResponse)
async def verify_assignment(
    assignment_id: int,
    body: HomeworkVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(HomeworkAssignment)
        .join(Patient, HomeworkAssignment.patient_id == Patient.id)
        .where(
            HomeworkAssignment.id == assignment_id,
            Patient.therapist_id == current_user.id,
        )
    )
    hw = result.scalars().first()
    if not hw:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if hw.status != HomeworkStatus.COMPLETED:
        raise HTTPException(
            status_code=400, detail="Can only verify completed assignments"
        )

    hw.status = HomeworkStatus.VERIFIED
    hw.therapist_verified_at = datetime.now(timezone.utc)
    hw.therapist_feedback = body.therapist_feedback

    await db.commit()
    await db.refresh(hw)
    return hw
