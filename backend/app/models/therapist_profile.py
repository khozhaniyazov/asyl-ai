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
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base


class VerificationStatus(str, enum.Enum):
    UNVERIFIED = "unverified"
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class TherapistProfile(Base):
    __tablename__ = "therapist_profiles"

    id = Column(Integer, primary_key=True, index=True)
    therapist_id = Column(
        Integer, ForeignKey("therapists.id"), nullable=False, unique=True
    )
    bio = Column(Text, nullable=True)
    photo_url = Column(String, nullable=True)
    video_intro_url = Column(String, nullable=True)
    specializations = Column(JSON, nullable=True)  # ["dysarthria", "stuttering", ...]
    education = Column(Text, nullable=True)
    certifications = Column(JSON, nullable=True)  # ["cert1", "cert2"]
    license_number = Column(String, nullable=True)
    credential_documents = Column(JSON, nullable=True)  # ["url1", "url2"]
    years_of_experience = Column(Integer, nullable=True)
    age_groups = Column(JSON, nullable=True)  # ["children", "adolescents", "adults"]
    city = Column(String, nullable=True, index=True)
    district = Column(String, nullable=True)
    online_available = Column(Boolean, default=False)
    price_range_min = Column(Numeric(10, 2), nullable=True)
    price_range_max = Column(Numeric(10, 2), nullable=True)
    session_duration = Column(Integer, nullable=True)  # minutes
    languages = Column(JSON, nullable=True)  # ["ru", "kk"]
    gender = Column(String, nullable=True)
    response_time_hours = Column(
        Integer, nullable=True
    )  # avg response time for bookings
    success_stories = Column(JSON, nullable=True)  # [{"title": "...", "text": "..."}]
    verification_status = Column(
        Enum(VerificationStatus),
        default=VerificationStatus.UNVERIFIED,
        index=True,
    )
    verification_submitted_at = Column(DateTime(timezone=True), nullable=True)
    verification_notes = Column(Text, nullable=True)  # admin notes on verification
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by_id = Column(Integer, ForeignKey("therapists.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    is_published = Column(Boolean, default=False, index=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    therapist = relationship(
        "Therapist",
        back_populates="profile",
        foreign_keys=[therapist_id],
    )
    verified_by = relationship("Therapist", foreign_keys=[verified_by_id])
