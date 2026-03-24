from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Enum,
    Text,
    Boolean,
    Numeric,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base


class CancellationType(str, enum.Enum):
    CANCELLATION = "cancellation"
    NO_SHOW = "no_show"
    LATE_CANCEL = "late_cancel"


class CancelledBy(str, enum.Enum):
    THERAPIST = "therapist"
    PARENT = "parent"


class CancellationRecord(Base):
    __tablename__ = "cancellation_records"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    type = Column(Enum(CancellationType), nullable=False)
    reason = Column(Text, nullable=True)
    cancelled_by = Column(Enum(CancelledBy), nullable=False)
    cancelled_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    fee_charged = Column(Numeric(10, 2), nullable=True)
    package_session_returned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    appointment = relationship("Appointment", back_populates="cancellation")
