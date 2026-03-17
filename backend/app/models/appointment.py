from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class AppointmentStatus(str, enum.Enum):
    PLANNED = "planned"
    PAID = "paid"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    therapist_id = Column(Integer, ForeignKey("therapists.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.PLANNED)
    kaspi_link = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    therapist = relationship("Therapist", back_populates="appointments")
    patient = relationship("Patient", back_populates="appointments")
    session = relationship("Session", back_populates="appointment", uselist=False)
