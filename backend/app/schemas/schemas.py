from pydantic import BaseModel, ConfigDict, EmailStr
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
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    clinic_name: Optional[str] = None


# --- Patients ---


class PatientBase(BaseModel):
    first_name: str
    last_name: str
    diagnosis: Optional[str] = None
    parent_phone: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    diagnosis: Optional[str] = None
    parent_phone: Optional[str] = None


class PatientResponse(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    therapist_id: int
    created_at: datetime


# --- Appointments ---


class AppointmentBase(BaseModel):
    patient_id: int
    start_time: datetime
    end_time: datetime
    status: AppointmentStatus = AppointmentStatus.PLANNED


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[AppointmentStatus] = None


class AppointmentResponse(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    therapist_id: int
    kaspi_link: Optional[str] = None


# --- Sessions ---


class SOAPResponse(BaseModel):
    subjective: str
    objective: str
    assessment: str
    plan: str
    homework_for_parents: str


class SessionUpdate(BaseModel):
    soap_subjective: Optional[str] = None
    soap_objective: Optional[str] = None
    soap_assessment: Optional[str] = None
    soap_plan: Optional[str] = None
    homework_for_parents: Optional[str] = None


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    appointment_id: int
    status: str
    audio_file_path: Optional[str] = None
    raw_transcript: Optional[str] = None
    soap_subjective: Optional[str] = None
    soap_objective: Optional[str] = None
    soap_assessment: Optional[str] = None
    soap_plan: Optional[str] = None
    homework_for_parents: Optional[str] = None
    created_at: datetime
