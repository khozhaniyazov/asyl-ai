from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class Therapist(Base):
    __tablename__ = "therapists"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    clinic_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patients = relationship("Patient", back_populates="therapist")
    appointments = relationship("Appointment", back_populates="therapist")
    homework_templates = relationship("HomeworkTemplate", back_populates="therapist")
    session_packages = relationship("SessionPackage", back_populates="therapist")
    availability_slots = relationship(
        "TherapistAvailability", back_populates="therapist"
    )
    waitlist_entries = relationship("WaitlistEntry", back_populates="therapist")
    # v3: marketplace
    profile = relationship(
        "TherapistProfile", back_populates="therapist", uselist=False
    )
    reviews = relationship("Review", back_populates="therapist")
    marketplace_bookings = relationship(
        "MarketplaceBooking", back_populates="therapist"
    )
