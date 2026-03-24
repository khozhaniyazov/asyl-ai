"""Parent portal API — homework, appointments, progress."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models import Parent, Patient, Appointment, Session

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


def get_patient_ids(parent: Parent) -> list[int]:
    if not parent.linked_patient_ids:
        return []
    return [int(x) for x in parent.linked_patient_ids.split(",") if x.strip()]


class ParentMeResponse(BaseModel):
    id: int
    phone: str
    full_name: str | None
    patient_ids: list[int]


@router.get("/me", response_model=ParentMeResponse)
async def parent_me(parent: Parent = Depends(get_current_parent)):
    return {
        "id": parent.id,
        "phone": parent.phone,
        "full_name": parent.full_name,
        "patient_ids": get_patient_ids(parent),
    }


@router.get("/children")
async def get_children(
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    ids = get_patient_ids(parent)
    if not ids:
        return []
    result = await db.execute(select(Patient).filter(Patient.id.in_(ids)))
    patients = result.scalars().all()
    return [
        {
            "id": p.id,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "diagnosis": p.diagnosis,
        }
        for p in patients
    ]


@router.get("/appointments")
async def get_parent_appointments(
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    ids = get_patient_ids(parent)
    if not ids:
        return []
    result = await db.execute(
        select(Appointment)
        .filter(Appointment.patient_id.in_(ids))
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
            "kaspi_link": a.kaspi_link,
        }
        for a in appointments
    ]


@router.get("/homework")
async def get_homework(
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    ids = get_patient_ids(parent)
    if not ids:
        return []
    result = await db.execute(
        select(Session)
        .join(Appointment)
        .filter(Appointment.patient_id.in_(ids))
        .filter(Session.status == "completed")
        .filter(Session.homework_for_parents.isnot(None))
        .order_by(Session.created_at.desc())
        .limit(20)
    )
    sessions = result.scalars().all()
    return [
        {
            "id": s.id,
            "appointment_id": s.appointment_id,
            "homework": s.homework_for_parents,
            "date": s.created_at.isoformat() if s.created_at else None,
            "soap_assessment": s.soap_assessment,
        }
        for s in sessions
    ]


@router.get("/progress")
async def get_progress(
    db: AsyncSession = Depends(get_db),
    parent: Parent = Depends(get_current_parent),
):
    ids = get_patient_ids(parent)
    if not ids:
        return {"sessions_count": 0, "sessions": []}
    result = await db.execute(
        select(Session)
        .join(Appointment)
        .filter(Appointment.patient_id.in_(ids))
        .filter(Session.status == "completed")
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
