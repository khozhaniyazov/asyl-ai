from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class Parent(Base):
    __tablename__ = "parents"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    otp_code_hash = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    otp_attempts = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # v2: relationship via Patient.parent_id instead of linked_patient_ids CSV
    children = relationship("Patient", back_populates="parent")
    schedule_requests = relationship("ScheduleRequest", back_populates="parent")
    # v3: marketplace
    reviews = relationship("Review", back_populates="parent")
    marketplace_bookings = relationship("MarketplaceBooking", back_populates="parent")
    conversations = relationship("Conversation", back_populates="parent")
