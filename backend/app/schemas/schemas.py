from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.appointment import AppointmentStatus

class Token(BaseModel):
    access_token: str
    token_type: str

class TherapistCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    clinic_name: Optional[str] = None

class TherapistResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    clinic_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class PatientBase(BaseModel):
    first_name: str
    last_name: str
    diagnosis: Optional[str] = None
    parent_phone: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientResponse(PatientBase):
    id: int
    therapist_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class AppointmentBase(BaseModel):
    patient_id: int
    start_time: datetime
    end_time: datetime
    status: AppointmentStatus = AppointmentStatus.PLANNED

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentResponse(AppointmentBase):
    id: int
    therapist_id: int
    kaspi_link: Optional[str] = None
    
    class Config:
        from_attributes = True

class SOAPResponse(BaseModel):
    subjective: str
    objective: str
    assessment: str
    plan: str
    homework_for_parents: str
