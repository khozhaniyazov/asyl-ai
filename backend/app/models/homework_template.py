from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime, timezone
import enum
from app.core.database import Base


class HomeworkCategory(str, enum.Enum):
    ARTICULATION = "articulation"
    PHONOLOGY = "phonology"
    VOCABULARY = "vocabulary"
    GRAMMAR = "grammar"
    FLUENCY = "fluency"
    OTHER = "other"


class HomeworkTemplate(Base):
    __tablename__ = "homework_templates"

    id = Column(Integer, primary_key=True, index=True)
    therapist_id = Column(Integer, ForeignKey("therapists.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(Enum(HomeworkCategory), default=HomeworkCategory.OTHER)
    instructions = Column(Text, nullable=True)
    media_urls = Column(JSON, nullable=True)  # list of URLs
    target_sounds = Column(String, nullable=True)  # comma-separated: "Р,Ш,Л"
    age_range = Column(String, nullable=True)  # e.g. "3-5", "6-8"
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    therapist = relationship("Therapist", back_populates="homework_templates")
    assignments = relationship("HomeworkAssignment", back_populates="template")
