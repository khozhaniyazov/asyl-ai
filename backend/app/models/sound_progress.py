from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base


class SoundStage(str, enum.Enum):
    NOT_STARTED = "not_started"
    ISOLATION = "isolation"
    SYLLABLES = "syllables"
    WORDS = "words"
    PHRASES = "phrases"
    CONNECTED_SPEECH = "connected_speech"
    AUTOMATED = "automated"


class SoundProgressRecord(Base):
    __tablename__ = "sound_progress_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    sound = Column(String(10), nullable=False)  # e.g. "Р", "Ш", "Л", "С"
    stage = Column(Enum(SoundStage), default=SoundStage.NOT_STARTED)
    accuracy_percent = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    assessed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient", back_populates="sound_progress_records")
    session = relationship("Session", back_populates="sound_progress_records")
