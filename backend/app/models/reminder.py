from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base


class ReminderType(str, enum.Enum):
    SESSION_24H = "session_24h"
    SESSION_1H = "session_1h"
    PAYMENT_DUE = "payment_due"
    HOMEWORK_DUE = "homework_due"
    WAITLIST_OFFER = "waitlist_offer"


class ReminderChannel(str, enum.Enum):
    WHATSAPP = "whatsapp"
    TELEGRAM = "telegram"
    SMS = "sms"


class ReminderStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    homework_assignment_id = Column(
        Integer, ForeignKey("homework_assignments.id"), nullable=True
    )
    type = Column(Enum(ReminderType), nullable=False)
    channel = Column(Enum(ReminderChannel), default=ReminderChannel.WHATSAPP)
    scheduled_for = Column(DateTime, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    status = Column(Enum(ReminderStatus), default=ReminderStatus.SCHEDULED)
    error_message = Column(String, nullable=True)
    celery_task_id = Column(String, nullable=True)  # track the Celery task
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    appointment = relationship("Appointment", back_populates="reminders")
    homework_assignment = relationship("HomeworkAssignment", back_populates="reminders")
