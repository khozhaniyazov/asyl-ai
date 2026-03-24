from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base


class PatientStatus(str, enum.Enum):
    ACTIVE = "active"
    DISCHARGED = "discharged"
    WAITLISTED = "waitlisted"
    PAUSED = "paused"


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    therapist_id = Column(Integer, ForeignKey("therapists.id"), nullable=False)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    diagnosis = Column(String)
    parent_phone = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # v2 fields
    date_of_birth = Column(Date, nullable=True)
    status = Column(Enum(PatientStatus), default=PatientStatus.ACTIVE)
    parent_id = Column(Integer, ForeignKey("parents.id"), nullable=True)

    therapist = relationship("Therapist", back_populates="patients")
    appointments = relationship("Appointment", back_populates="patient")
    parent = relationship("Parent", back_populates="children")
    session_packages = relationship("SessionPackage", back_populates="patient")
    homework_assignments = relationship("HomeworkAssignment", back_populates="patient")
    sound_progress_records = relationship(
        "SoundProgressRecord", back_populates="patient"
    )
    waitlist_entry = relationship(
        "WaitlistEntry", back_populates="patient", uselist=False
    )
    treatment_plans = relationship("TreatmentPlan", back_populates="patient")
