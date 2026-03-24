from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base


class AppointmentStatus(str, enum.Enum):
    PLANNED = "planned"
    PAID = "paid"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class RequestedBy(str, enum.Enum):
    THERAPIST = "therapist"
    PARENT = "parent"


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    therapist_id = Column(Integer, ForeignKey("therapists.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.PLANNED)
    kaspi_link = Column(String, nullable=True)

    # v2 fields
    session_number = Column(Integer, nullable=True)
    package_id = Column(Integer, ForeignKey("session_packages.id"), nullable=True)
    reminder_sent = Column(Boolean, default=False)
    requested_by = Column(Enum(RequestedBy), default=RequestedBy.THERAPIST)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    therapist = relationship("Therapist", back_populates="appointments")
    patient = relationship("Patient", back_populates="appointments")
    session = relationship("Session", back_populates="appointment", uselist=False)
    package = relationship("SessionPackage", back_populates="appointments")
    cancellation = relationship(
        "CancellationRecord", back_populates="appointment", uselist=False
    )
    reminders = relationship("Reminder", back_populates="appointment")
    video_session = relationship(
        "VideoSession", back_populates="appointment", uselist=False
    )
