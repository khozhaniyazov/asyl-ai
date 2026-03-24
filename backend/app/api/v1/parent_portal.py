"""Parent portal API — homework, appointments, progress, sound progress, schedule requests."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models import (
    Parent,
    Patient,
    Appointment,
    Session,
    HomeworkAssignment,
    HomeworkStatus,
    SoundProgressRecord,
    SessionPackage,
)

router = APIRouter()

parent_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/api/v1/parent/verify-otp", auto_error=False
)


async def get_current_parent(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(parent_oauth2),
) -> Parent:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub", "")
        if not sub.startswith("parent:"):
            raise HTTPException(status_code=403, detail="Invalid token scope")
        parent_id = int(sub.split(":")[1])
    except (JWTError, ValueError):
        raise HTTPException(status_code=403, detail="Could not validate credentials")

    result = await db.execute(select(Parent).filter(Parent.id == parent_id))
    parent = result.scalars().first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    return parent


def _get_children_ids_query(parent_id: int):
    """Get patient IDs via the new Patient.parent_id FK."""
    return select(Patient.id).where(Patient.parent_id == parent_id)


class ParentMeResponse(BaseModel):
    id: int
    phone: str
    full_name: str | None
    patient_ids: list[int]


@router.get("/me", response_model=ParentMeResponse)
async def parent_me(
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    result = await db.execute(select(Patient.id).where(Patient.parent_id == parent.id))
    patient_ids = [row[0] for row in result.all()]
    return {
        "id": parent.id,
        "phone": parent.phone,
        "full_name": parent.full_name,
        "patient_ids": patient_ids,
    }


@router.get("/children")
async def get_children(
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    result = await db.execute(select(Patient).where(Patient.parent_id == parent.id))
    patients = result.scalars().all()
    return [
        {
            "id": p.id,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "diagnosis": p.diagnosis,
            "date_of_birth": p.date_of_birth.isoformat() if p.date_of_birth else None,
            "status": p.status.value if p.status else "active",
        }
        for p in patients
    ]


@router.get("/appointments")
async def get_parent_appointments(
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    result = await db.execute(
        select(Appointment)
        .join(Patient, Appointment.patient_id == Patient.id)
        .where(Patient.parent_id == parent.id)
        .order_by(Appointment.start_time.desc())
        .limit(20)
    )
    appointments = result.scalars().all()
    return [
        {
            "id": a.id,
            "patient_id": a.patient_id,
            "start_time": a.start_time.isoformat() if a.start_time else None,
            "end_time": a.end_time.isoformat() if a.end_time else None,
            "status": a.status.value if a.status else "planned",
            "session_number": a.session_number,
            "kaspi_link": a.kaspi_link,
        }
        for a in appointments
    ]


@router.get("/homework")
async def get_homework(
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    """Get homework assignments for parent's children (v2: uses HomeworkAssignment model)."""
    result = await db.execute(
        select(HomeworkAssignment)
        .join(Patient, HomeworkAssignment.patient_id == Patient.id)
        .where(Patient.parent_id == parent.id)
        .order_by(HomeworkAssignment.created_at.desc())
        .limit(30)
    )
    assignments = result.scalars().all()
    return [
        {
            "id": hw.id,
            "patient_id": hw.patient_id,
            "session_id": hw.session_id,
            "template_id": hw.template_id,
            "custom_instructions": hw.custom_instructions,
            "assigned_at": hw.assigned_at.isoformat() if hw.assigned_at else None,
            "due_date": hw.due_date.isoformat() if hw.due_date else None,
            "parent_completed_at": hw.parent_completed_at.isoformat()
            if hw.parent_completed_at
            else None,
            "parent_notes": hw.parent_notes,
            "therapist_feedback": hw.therapist_feedback,
            "status": hw.status.value if hw.status else "assigned",
        }
        for hw in assignments
    ]


@router.get("/progress")
async def get_progress(
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    """Get session progress timeline for parent's children."""
    result = await db.execute(
        select(Session)
        .join(Appointment)
        .join(Patient, Appointment.patient_id == Patient.id)
        .where(Patient.parent_id == parent.id)
        .where(Session.status == "completed")
        .order_by(Session.created_at.asc())
    )
    sessions = result.scalars().all()
    return {
        "sessions_count": len(sessions),
        "sessions": [
            {
                "id": s.id,
                "date": s.created_at.isoformat() if s.created_at else None,
                "assessment": s.soap_assessment,
                "plan": s.soap_plan,
            }
            for s in sessions
        ],
    }


@router.get("/sound-progress")
async def get_sound_progress(
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    """Get sound progress records for parent's children."""
    result = await db.execute(
        select(SoundProgressRecord)
        .join(Patient, SoundProgressRecord.patient_id == Patient.id)
        .where(Patient.parent_id == parent.id)
        .order_by(SoundProgressRecord.assessed_at.desc())
    )
    records = result.scalars().all()
    return [
        {
            "id": r.id,
            "patient_id": r.patient_id,
            "sound": r.sound,
            "stage": r.stage.value if r.stage else "not_started",
            "accuracy_percent": r.accuracy_percent,
            "notes": r.notes,
            "assessed_at": r.assessed_at.isoformat() if r.assessed_at else None,
        }
        for r in records
    ]


@router.get("/packages")
async def get_packages(
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    """Get session packages for parent's children."""
    result = await db.execute(
        select(SessionPackage)
        .join(Patient, SessionPackage.patient_id == Patient.id)
        .where(Patient.parent_id == parent.id)
        .order_by(SessionPackage.created_at.desc())
    )
    packages = result.scalars().all()
    return [
        {
            "id": p.id,
            "patient_id": p.patient_id,
            "total_sessions": p.total_sessions,
            "used_sessions": p.used_sessions,
            "remaining_sessions": p.remaining_sessions,
            "total_price": float(p.total_price),
            "payment_status": p.payment_status.value if p.payment_status else "pending",
        }
        for p in packages
    ]
