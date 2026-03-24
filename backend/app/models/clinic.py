from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Enum,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base


class ClinicRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    THERAPIST = "therapist"


class Clinic(Base):
    __tablename__ = "clinics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_therapist_id = Column(Integer, ForeignKey("therapists.id"), nullable=False)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("Therapist")
    memberships = relationship(
        "ClinicMembership", back_populates="clinic", cascade="all, delete-orphan"
    )


class ClinicMembership(Base):
    __tablename__ = "clinic_memberships"

    id = Column(Integer, primary_key=True, index=True)
    clinic_id = Column(Integer, ForeignKey("clinics.id"), nullable=False)
    therapist_id = Column(Integer, ForeignKey("therapists.id"), nullable=False)
    role = Column(Enum(ClinicRole), default=ClinicRole.THERAPIST)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    clinic = relationship("Clinic", back_populates="memberships")
    therapist = relationship("Therapist")
