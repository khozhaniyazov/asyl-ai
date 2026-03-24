from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean, Time, Date
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class TherapistAvailability(Base):
    __tablename__ = "therapist_availability"

    id = Column(Integer, primary_key=True, index=True)
    therapist_id = Column(Integer, ForeignKey("therapists.id"), nullable=False)
    day_of_week = Column(
        Integer, nullable=True
    )  # 0=Monday, 6=Sunday (nullable for specific_date)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_active = Column(Boolean, default=True)
    specific_date = Column(Date, nullable=True)  # override for a specific date
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    therapist = relationship("Therapist", back_populates="availability_slots")
