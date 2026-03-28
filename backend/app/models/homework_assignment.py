from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base


class HomeworkStatus(str, enum.Enum):
    ASSIGNED = "assigned"
    COMPLETED = "completed"
    VERIFIED = "verified"
    OVERDUE = "overdue"


class HomeworkAssignment(Base):
    __tablename__ = "homework_assignments"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("homework_templates.id"), nullable=True)
    custom_instructions = Column(Text, nullable=True)
    assigned_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    due_date = Column(DateTime(timezone=True), nullable=True)
    parent_completed_at = Column(DateTime(timezone=True), nullable=True)
    parent_notes = Column(Text, nullable=True)
    parent_video_url = Column(String, nullable=True)
    therapist_verified_at = Column(DateTime(timezone=True), nullable=True)
    therapist_feedback = Column(Text, nullable=True)
    status = Column(Enum(HomeworkStatus), default=HomeworkStatus.ASSIGNED)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    session = relationship("Session", back_populates="homework_assignments")
    patient = relationship("Patient", back_populates="homework_assignments")
    template = relationship("HomeworkTemplate", back_populates="assignments")
    reminders = relationship("Reminder", back_populates="homework_assignment")
