from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
    Enum,
    Date,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base


class PlanStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class GoalStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    ACHIEVED = "achieved"
    DISCONTINUED = "discontinued"


class GoalType(str, enum.Enum):
    LONG_TERM = "long_term"
    SHORT_TERM = "short_term"


class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    therapist_id = Column(Integer, ForeignKey("therapists.id"), nullable=False)
    diagnosis = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    target_end_date = Column(Date, nullable=True)
    status = Column(Enum(PlanStatus), default=PlanStatus.ACTIVE)
    notes = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    patient = relationship("Patient", back_populates="treatment_plans")
    therapist = relationship("Therapist")
    goals = relationship(
        "TreatmentGoal", back_populates="plan", cascade="all, delete-orphan"
    )


class TreatmentGoal(Base):
    __tablename__ = "treatment_goals"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("treatment_plans.id"), nullable=False)
    type = Column(Enum(GoalType), nullable=False)
    description = Column(Text, nullable=False)
    target_sound = Column(String, nullable=True)
    measurable_criteria = Column(Text, nullable=True)
    status = Column(Enum(GoalStatus), default=GoalStatus.NOT_STARTED)
    target_date = Column(Date, nullable=True)
    achieved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    plan = relationship("TreatmentPlan", back_populates="goals")


class GoalTemplate(Base):
    __tablename__ = "goal_templates"

    id = Column(Integer, primary_key=True, index=True)
    therapist_id = Column(
        Integer, ForeignKey("therapists.id"), nullable=True
    )  # null = system-wide
    category = Column(String, nullable=True)  # articulation, phonology, etc.
    description = Column(Text, nullable=False)
    measurable_criteria = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    therapist = relationship("Therapist")
