from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base


class ScheduleRequestType(str, enum.Enum):
    NEW_BOOKING = "new_booking"
    RESCHEDULE = "reschedule"


class ScheduleRequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ScheduleRequest(Base):
    __tablename__ = "schedule_requests"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("parents.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    therapist_id = Column(Integer, ForeignKey("therapists.id"), nullable=False)
    requested_start = Column(DateTime, nullable=False)
    requested_end = Column(DateTime, nullable=True)
    type = Column(Enum(ScheduleRequestType), nullable=False)
    original_appointment_id = Column(
        Integer, ForeignKey("appointments.id"), nullable=True
    )
    status = Column(Enum(ScheduleRequestStatus), default=ScheduleRequestStatus.PENDING)
    therapist_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    parent = relationship("Parent", back_populates="schedule_requests")
    patient = relationship("Patient")
    therapist = relationship("Therapist")
    original_appointment = relationship("Appointment")
