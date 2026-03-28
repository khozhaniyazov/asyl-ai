from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
    Boolean,
    Numeric,
    Enum,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base


class BookingType(str, enum.Enum):
    DIAGNOSTIC = "diagnostic"
    REGULAR = "regular"


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class MarketplaceBooking(Base):
    __tablename__ = "marketplace_bookings"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("parents.id"), nullable=False)
    therapist_id = Column(Integer, ForeignKey("therapists.id"), nullable=False)
    type = Column(Enum(BookingType), default=BookingType.DIAGNOSTIC)
    requested_slot = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    deposit_paid = Column(Boolean, default=False)
    deposit_amount = Column(Numeric(10, 2), nullable=True)
    kaspi_link = Column(String, nullable=True)
    notes = Column(Text, nullable=True)  # parent's message to therapist
    appointment_id = Column(
        Integer, ForeignKey("appointments.id"), nullable=True
    )  # set when confirmed
    # Commission tracking
    commission_rate = Column(Numeric(5, 2), default=7.5)  # platform % (5-10%)
    commission_amount = Column(Numeric(10, 2), nullable=True)
    net_amount = Column(Numeric(10, 2), nullable=True)
    payout_id = Column(Integer, ForeignKey("payouts.id"), nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    parent = relationship("Parent", back_populates="marketplace_bookings")
    therapist = relationship("Therapist", back_populates="marketplace_bookings")
    appointment = relationship("Appointment")
