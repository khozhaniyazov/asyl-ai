"""Data export API — CSV/JSON for compliance and portability."""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import csv
import io
from datetime import datetime

from app.core.database import get_db
from app.models import (
    Patient,
    Appointment,
    Session,
    SessionPackage,
    SoundProgressRecord,
    HomeworkAssignment,
    Therapist,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/patients")
async def export_patients_csv(
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Export all patients as CSV."""
    result = await db.execute(
        select(Patient)
        .where(Patient.therapist_id == current_user.id)
        .order_by(Patient.created_at)
    )
    patients = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "ID",
            "First Name",
            "Last Name",
            "Diagnosis",
            "Status",
            "Date of Birth",
            "Parent Phone",
            "Created At",
        ]
    )
    for p in patients:
        writer.writerow(
            [
                p.id,
                p.first_name,
                p.last_name,
                p.diagnosis or "",
                p.status.value if p.status else "active",
                p.date_of_birth.isoformat() if p.date_of_birth else "",
                p.parent_phone or "",
                p.created_at.isoformat() if p.created_at else "",
            ]
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=patients_{datetime.now().strftime('%Y%m%d')}.csv"
        },
    )


@router.get("/sessions")
async def export_sessions_csv(
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Export all sessions as CSV."""
    result = await db.execute(
        select(Session, Appointment, Patient)
        .join(Appointment, Session.appointment_id == Appointment.id)
        .join(Patient, Appointment.patient_id == Patient.id)
        .where(Appointment.therapist_id == current_user.id)
        .order_by(Session.created_at)
    )
    rows = result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "Session ID",
            "Patient",
            "Date",
            "Status",
            "Subjective",
            "Objective",
            "Assessment",
            "Plan",
            "Homework",
        ]
    )
    for session, appt, patient in rows:
        writer.writerow(
            [
                session.id,
                f"{patient.first_name} {patient.last_name}",
                appt.start_time.isoformat() if appt.start_time else "",
                session.status or "",
                session.soap_subjective or "",
                session.soap_objective or "",
                session.soap_assessment or "",
                session.soap_plan or "",
                session.homework_for_parents or "",
            ]
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=sessions_{datetime.now().strftime('%Y%m%d')}.csv"
        },
    )


@router.get("/patient/{patient_id}")
async def export_patient_record(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Export full patient record as JSON."""
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id, Patient.therapist_id == current_user.id
        )
    )
    patient = result.scalars().first()
    if not patient:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Patient not found")

    # Get all related data
    appts_result = await db.execute(
        select(Appointment)
        .where(Appointment.patient_id == patient_id)
        .order_by(Appointment.start_time)
    )
    appointments = appts_result.scalars().all()

    sessions_result = await db.execute(
        select(Session)
        .join(Appointment)
        .where(Appointment.patient_id == patient_id)
        .order_by(Session.created_at)
    )
    sessions = sessions_result.scalars().all()

    progress_result = await db.execute(
        select(SoundProgressRecord)
        .where(SoundProgressRecord.patient_id == patient_id)
        .order_by(SoundProgressRecord.assessed_at)
    )
    progress = progress_result.scalars().all()

    hw_result = await db.execute(
        select(HomeworkAssignment)
        .where(HomeworkAssignment.patient_id == patient_id)
        .order_by(HomeworkAssignment.created_at)
    )
    homework = hw_result.scalars().all()

    pkgs_result = await db.execute(
        select(SessionPackage)
        .where(SessionPackage.patient_id == patient_id)
        .order_by(SessionPackage.created_at)
    )
    packages = pkgs_result.scalars().all()

    return {
        "export_date": datetime.now().isoformat(),
        "patient": {
            "id": patient.id,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "diagnosis": patient.diagnosis,
            "status": patient.status.value if patient.status else "active",
            "date_of_birth": patient.date_of_birth.isoformat()
            if patient.date_of_birth
            else None,
            "parent_phone": patient.parent_phone,
            "created_at": patient.created_at.isoformat()
            if patient.created_at
            else None,
        },
        "appointments": [
            {
                "id": a.id,
                "start_time": a.start_time.isoformat() if a.start_time else None,
                "end_time": a.end_time.isoformat() if a.end_time else None,
                "status": a.status.value if a.status else None,
                "session_number": a.session_number,
            }
            for a in appointments
        ],
        "sessions": [
            {
                "id": s.id,
                "status": s.status,
                "soap_subjective": s.soap_subjective,
                "soap_objective": s.soap_objective,
                "soap_assessment": s.soap_assessment,
                "soap_plan": s.soap_plan,
                "homework_for_parents": s.homework_for_parents,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in sessions
        ],
        "sound_progress": [
            {
                "sound": p.sound,
                "stage": p.stage.value if p.stage else None,
                "accuracy_percent": p.accuracy_percent,
                "notes": p.notes,
                "assessed_at": p.assessed_at.isoformat() if p.assessed_at else None,
            }
            for p in progress
        ],
        "homework_assignments": [
            {
                "id": h.id,
                "custom_instructions": h.custom_instructions,
                "status": h.status.value if h.status else None,
                "due_date": h.due_date.isoformat() if h.due_date else None,
                "assigned_at": h.assigned_at.isoformat() if h.assigned_at else None,
            }
            for h in homework
        ],
        "packages": [
            {
                "id": p.id,
                "total_sessions": p.total_sessions,
                "used_sessions": p.used_sessions,
                "total_price": float(p.total_price),
                "payment_status": p.payment_status.value if p.payment_status else None,
            }
            for p in packages
        ],
    }
