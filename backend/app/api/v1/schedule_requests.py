from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.core.database import get_db
from app.models import (
    ScheduleRequest,
    ScheduleRequestStatus,
    ScheduleRequestType,
    Appointment,
    AppointmentStatus,
    RequestedBy,
    Patient,
    Therapist,
    Parent,
)
from app.schemas.schemas import (
    ScheduleRequestCreate,
    ScheduleRequestResponse,
    ScheduleRequestActionRequest,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/", response_model=ScheduleRequestResponse)
async def create_schedule_request(
    req: ScheduleRequestCreate,
    db: AsyncSession = Depends(get_db),
):
    """Parent creates a booking or reschedule request. Called from parent portal."""
    # Verify patient exists
    result = await db.execute(select(Patient).where(Patient.id == req.patient_id))
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Get parent from patient
    if not patient.parent_id:
        raise HTTPException(status_code=400, detail="Patient has no linked parent")

    db_req = ScheduleRequest(
        parent_id=patient.parent_id,
        patient_id=req.patient_id,
        therapist_id=req.therapist_id,
        requested_start=req.requested_start,
        requested_end=req.requested_end,
        type=req.type,
        original_appointment_id=req.original_appointment_id,
    )
    db.add(db_req)
    await db.commit()
    await db.refresh(db_req)
    return db_req


@router.get("/", response_model=list[ScheduleRequestResponse])
async def list_schedule_requests(
    status: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    query = select(ScheduleRequest).where(
        ScheduleRequest.therapist_id == current_user.id
    )
    if status:
        query = query.where(ScheduleRequest.status == status)
    query = query.order_by(ScheduleRequest.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/{request_id}/approve", response_model=ScheduleRequestResponse)
async def approve_schedule_request(
    request_id: int,
    body: ScheduleRequestActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(ScheduleRequest).where(
            ScheduleRequest.id == request_id,
            ScheduleRequest.therapist_id == current_user.id,
        )
    )
    req = result.scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != ScheduleRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request is not pending")

    req.status = ScheduleRequestStatus.APPROVED
    req.therapist_notes = body.therapist_notes

    # Create or reschedule appointment
    if req.type == ScheduleRequestType.NEW_BOOKING:
        end_time = req.requested_end
        if not end_time:
            from datetime import timedelta

            end_time = req.requested_start + timedelta(minutes=45)

        appt = Appointment(
            therapist_id=current_user.id,
            patient_id=req.patient_id,
            start_time=req.requested_start,
            end_time=end_time,
            status=AppointmentStatus.PLANNED,
            requested_by=RequestedBy.PARENT,
        )
        db.add(appt)
    elif req.type == ScheduleRequestType.RESCHEDULE and req.original_appointment_id:
        appt_result = await db.execute(
            select(Appointment).where(Appointment.id == req.original_appointment_id)
        )
        appt = appt_result.scalars().first()
        if appt:
            appt.start_time = req.requested_start
            if req.requested_end:
                appt.end_time = req.requested_end

    await db.commit()
    await db.refresh(req)
    return req


@router.put("/{request_id}/reject", response_model=ScheduleRequestResponse)
async def reject_schedule_request(
    request_id: int,
    body: ScheduleRequestActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(ScheduleRequest).where(
            ScheduleRequest.id == request_id,
            ScheduleRequest.therapist_id == current_user.id,
        )
    )
    req = result.scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != ScheduleRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request is not pending")

    req.status = ScheduleRequestStatus.REJECTED
    req.therapist_notes = body.therapist_notes

    await db.commit()
    await db.refresh(req)
    return req
