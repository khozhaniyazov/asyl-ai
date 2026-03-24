from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime, timezone
import enum
from app.core.database import Base


class WaitlistStatus(str, enum.Enum):
    WAITING = "waiting"
    OFFERED = "offered"
    ENROLLED = "enrolled"
    EXPIRED = "expired"


class WaitlistEntry(Base):
    __tablename__ = "waitlist_entries"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    therapist_id = Column(Integer, ForeignKey("therapists.id"), nullable=False)
    preferred_days = Column(JSON, nullable=True)  # e.g. [0, 2, 4] for Mon/Wed/Fri
    preferred_times = Column(JSON, nullable=True)  # e.g. ["09:00-12:00", "14:00-17:00"]
    priority = Column(Integer, default=0)  # higher = more urgent
    status = Column(Enum(WaitlistStatus), default=WaitlistStatus.WAITING)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient", back_populates="waitlist_entry")
    therapist = relationship("Therapist", back_populates="waitlist_entries")
