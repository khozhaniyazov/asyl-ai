from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db, AsyncSessionLocal
from app.models import Session, Appointment, Patient, Therapist
from app.schemas.schemas import SOAPResponse, SessionUpdate, SessionResponse
from app.integrations.whisper_service import WhisperService
from app.integrations.whatsapp_service import whatsapp_service
from app.services.llm_service import LLMService
from app.services.s3_service import s3_service
from app.api.deps import get_current_user
import enum
from pydantic import BaseModel
import asyncio


class SessionStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class SessionStatusResponse(BaseModel):
    id: int
    status: str
    soap: SOAPResponse | None = None


router = APIRouter()


async def process_audio_background(
    session_id: int, audio_bytes: bytes, patient_diagnosis: str, previous_plan: str
):
    async with AsyncSessionLocal() as db:
        try:
            # 0. Upload to S3
            s3_key = await asyncio.to_thread(s3_service.upload_audio, audio_bytes)

            # 1. Transcription (Uses real OpenAI if key is present, otherwise falls back to mock)
            transcript = await WhisperService.transcribe(audio_bytes)

            # 2. Generate SOAP via LLM
            soap_dict = await LLMService.generate_soap_note(
                patient_diagnosis=patient_diagnosis,
                previous_plan=previous_plan,
                raw_transcript=transcript,
            )

            # 3. Update DB
            result = await db.execute(select(Session).filter(Session.id == session_id))
            db_session = result.scalars().first()
            if db_session:
                db_session.audio_file_path = s3_key
                db_session.raw_transcript = transcript
                db_session.soap_subjective = soap_dict.get("subjective")
                db_session.soap_objective = soap_dict.get("objective")
                db_session.soap_assessment = soap_dict.get("assessment")
                db_session.soap_plan = soap_dict.get("plan")
                db_session.homework_for_parents = soap_dict.get("homework_for_parents")
                db_session.status = SessionStatus.COMPLETED
                await db.commit()
        except Exception as e:
            result = await db.execute(select(Session).filter(Session.id == session_id))
            db_session = result.scalars().first()
            if db_session:
                db_session.status = SessionStatus.FAILED
                await db.commit()


@router.post("/{appointment_id}/transcribe-and-analyze")
async def process_session_audio(
    appointment_id: int,
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.patient))
        .filter(
            Appointment.id == appointment_id,
            Appointment.therapist_id == current_user.id,
        )
    )
    appt = result.scalars().first()

    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient_diagnosis = appt.patient.diagnosis if appt.patient else ""
    previous_plan = ""

    session_result = await db.execute(
        select(Session).filter(Session.appointment_id == appointment_id)
    )
    db_session = session_result.scalars().first()

    if not db_session:
        db_session = Session(
            appointment_id=appointment_id, status=SessionStatus.PROCESSING
        )
        db.add(db_session)
    else:
        db_session.status = SessionStatus.PROCESSING

    await db.commit()
    await db.refresh(db_session)

    audio_bytes = await audio.read()

    background_tasks.add_task(
        process_audio_background,
        session_id=db_session.id,
        audio_bytes=audio_bytes,
        patient_diagnosis=patient_diagnosis,
        previous_plan=previous_plan,
    )

    return {"message": "Audio processing started", "session_id": db_session.id}


@router.get("/{session_id}/status", response_model=SessionStatusResponse)
async def get_session_status(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    result = await db.execute(
        select(Session)
        .join(Appointment)
        .filter(Session.id == session_id, Appointment.therapist_id == current_user.id)
    )
    db_session = result.scalars().first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    response = {
        "id": db_session.id,
        "status": getattr(db_session, "status", SessionStatus.PROCESSING),
    }

    if (
        getattr(db_session, "status", SessionStatus.PROCESSING)
        == SessionStatus.COMPLETED
    ):
        response["soap"] = {
            "subjective": db_session.soap_subjective or "",
            "objective": db_session.soap_objective or "",
            "assessment": db_session.soap_assessment or "",
            "plan": db_session.soap_plan or "",
            "homework_for_parents": db_session.homework_for_parents or "",
        }

    return response


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: int,
    update: SessionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Save edited SOAP notes back to a session."""
    result = await db.execute(
        select(Session)
        .join(Appointment)
        .filter(Session.id == session_id, Appointment.therapist_id == current_user.id)
    )
    db_session = result.scalars().first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_session, field, value)

    await db.commit()
    await db.refresh(db_session)
    return db_session


@router.post("/{session_id}/send-homework")
async def send_homework_whatsapp(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user),
):
    """Send homework to parent via WhatsApp."""
    result = await db.execute(
        select(Session)
        .join(Appointment)
        .options(selectinload(Session.appointment).selectinload(Appointment.patient))
        .filter(Session.id == session_id, Appointment.therapist_id == current_user.id)
    )
    db_session = result.scalars().first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not db_session.homework_for_parents:
        raise HTTPException(status_code=400, detail="No homework to send")

    patient = db_session.appointment.patient
    if not patient or not patient.parent_phone:
        raise HTTPException(status_code=400, detail="No parent phone number on file")

    sent = await whatsapp_service.send_text_message(
        phone=patient.parent_phone,
        message=f"Homework for {patient.first_name}:\n\n{db_session.homework_for_parents}",
    )

    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send WhatsApp message")

    return {"detail": "Homework sent via WhatsApp", "phone": patient.parent_phone}
