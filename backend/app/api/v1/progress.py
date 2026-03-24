"""Patient progress tracking API."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models import Patient, Appointment, Session, Therapist
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/patients/{patient_id}/progress")
async def get_patient_progress(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    # Verify patient belongs to therapist
    result = await db.execute(
        select(Patient).filter(
            Patient.id == patient_id, Patient.therapist_id == current_user.id
        )
    )
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Get all completed sessions for this patient
    sessions_result = await db.execute(
        select(Session)
        .join(Appointment)
        .filter(Appointment.patient_id == patient_id)
        .filter(Session.status == "completed")
        .order_by(Session.created_at.asc())
    )
    sessions = sessions_result.scalars().all()

    # Count total appointments
    appt_count_result = await db.execute(
        select(func.count(Appointment.id)).filter(Appointment.patient_id == patient_id)
    )
    total_appointments = appt_count_result.scalar() or 0

    return {
        "patient_id": patient_id,
        "patient_name": f"{patient.first_name} {patient.last_name}",
        "total_appointments": total_appointments,
        "completed_sessions": len(sessions),
        "timeline": [
            {
                "session_id": s.id,
                "date": s.created_at.isoformat() if s.created_at else None,
                "assessment": s.soap_assessment,
                "plan": s.soap_plan,
                "homework": s.homework_for_parents,
            }
            for s in sessions
        ],
    }
