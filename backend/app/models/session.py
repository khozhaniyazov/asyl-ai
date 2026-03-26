from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), unique=True)

    status = Column(String, default="pending")

    # SOAP notes (manually entered by therapist)
    soap_subjective = Column(Text, nullable=True)
    soap_objective = Column(Text, nullable=True)
    soap_assessment = Column(Text, nullable=True)
    soap_plan = Column(Text, nullable=True)
    homework_for_parents = Column(Text, nullable=True)

    # Legacy columns kept for migration compatibility
    audio_file_path = Column(String, nullable=True)
    raw_transcript = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    appointment = relationship("Appointment", back_populates="session")
    homework_assignments = relationship("HomeworkAssignment", back_populates="session")
    sound_progress_records = relationship(
        "SoundProgressRecord", back_populates="session"
    )
    # v3: marketplace review (Phase 2)
    review = relationship("Review", back_populates="session", uselist=False)
