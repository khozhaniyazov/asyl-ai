from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    therapist_id = Column(
        Integer, ForeignKey("therapists.id"), nullable=False, unique=True
    )
    plan = Column(String, default="trial")  # trial, free, standard, premium
    status = Column(String, default="active")  # active, expired, cancelled
    started_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    therapist = relationship("Therapist", backref="subscription")
