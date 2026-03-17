from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    therapist_id = Column(Integer, ForeignKey("therapists.id"), nullable=False)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    diagnosis = Column(String)
    parent_phone = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    therapist = relationship("Therapist", back_populates="patients")
    appointments = relationship("Appointment", back_populates="patient")
