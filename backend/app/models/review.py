from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
    Boolean,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("parents.id"), nullable=False)
    therapist_id = Column(
        Integer, ForeignKey("therapists.id"), nullable=False, index=True
    )
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True, unique=True)
    rating_overall = Column(Integer, nullable=False)  # 1-5
    rating_results = Column(Integer, nullable=True)
    rating_approach = Column(Integer, nullable=True)
    rating_communication = Column(Integer, nullable=True)
    rating_punctuality = Column(Integer, nullable=True)
    text = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)  # True if session_id is set
    is_published = Column(Boolean, default=True)
    therapist_reply = Column(Text, nullable=True)
    therapist_reply_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    parent = relationship("Parent", back_populates="reviews")
    therapist = relationship("Therapist", back_populates="reviews")
    session = relationship("Session", back_populates="review")
