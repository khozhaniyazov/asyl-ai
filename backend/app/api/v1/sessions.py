from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db, AsyncSessionLocal
from app.models import Session, Appointment, Patient, Therapist
from app.schemas.schemas import SOAPResponse
from app.integrations.mock_services import WhisperMock
from app.services.llm_service import LLMService
from app.api.deps import get_current_user
import enum
from pydantic import BaseModel
from sqlalchemy import Column, String

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

async def process_audio_background(session_id: int, audio_bytes: bytes, patient_diagnosis: str, previous_plan: str):
    async with AsyncSessionLocal() as db:
        try:
            # 1. Mock Whisper Transcription
            transcript = await WhisperMock.transcribe(audio_bytes)
            
            # 2. Generate SOAP via LLM
            soap_dict = await LLMService.generate_soap_note(
                patient_diagnosis=patient_diagnosis,
                previous_plan=previous_plan,
                raw_transcript=transcript
            )
            
            # 3. Update DB
            result = await db.execute(select(Session).filter(Session.id == session_id))
            db_session = result.scalars().first()
            if db_session:
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
    current_user: Therapist = Depends(get_current_user)
):
    # 1. Fetch appointment & patient info securely
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.patient))
        .filter(Appointment.id == appointment_id, Appointment.therapist_id == current_user.id)
    )
    appt = result.scalars().first()
    
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    patient_diagnosis = appt.patient.diagnosis if appt.patient else ""
    previous_plan = ""

    # 2. Setup Session DB Record
    session_result = await db.execute(select(Session).filter(Session.appointment_id == appointment_id))
    db_session = session_result.scalars().first()
    
    if not db_session:
        db_session = Session(appointment_id=appointment_id, status=SessionStatus.PROCESSING)
        db.add(db_session)
    else:
        db_session.status = SessionStatus.PROCESSING
    
    await db.commit()
    await db.refresh(db_session)
    
    audio_bytes = await audio.read()
    
    # 3. Trigger Background Task
    background_tasks.add_task(
        process_audio_background, 
        session_id=db_session.id, 
        audio_bytes=audio_bytes, 
        patient_diagnosis=patient_diagnosis, 
        previous_plan=previous_plan
    )
    
    return {"message": "Audio processing started", "session_id": db_session.id}

@router.get("/{session_id}/status", response_model=SessionStatusResponse)
async def get_session_status(
    session_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: Therapist = Depends(get_current_user)
):
    result = await db.execute(
        select(Session).join(Appointment).filter(Session.id == session_id, Appointment.therapist_id == current_user.id)
    )
    db_session = result.scalars().first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    response = {
        "id": db_session.id,
        "status": getattr(db_session, "status", SessionStatus.PROCESSING)
    }
    
    if getattr(db_session, "status", SessionStatus.PROCESSING) == SessionStatus.COMPLETED:
        response["soap"] = {
            "subjective": db_session.soap_subjective or "",
            "objective": db_session.soap_objective or "",
            "assessment": db_session.soap_assessment or "",
            "plan": db_session.soap_plan or "",
            "homework_for_parents": db_session.homework_for_parents or ""
        }
        
    return response
