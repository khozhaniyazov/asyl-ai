from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
from datetime import datetime, date
from app.models.appointment import AppointmentStatus, RequestedBy, SessionType
from app.models.patient import PatientStatus
from app.models.session_package import PaymentStatus
from app.models.homework_template import HomeworkCategory
from app.models.homework_assignment import HomeworkStatus
from app.models.sound_progress import SoundStage
from app.models.schedule_request import ScheduleRequestType, ScheduleRequestStatus
from app.models.cancellation import CancellationType, CancelledBy
from app.models.waitlist import WaitlistStatus
from app.models.reminder import ReminderType, ReminderChannel, ReminderStatus
from app.models.therapist_profile import VerificationStatus
from app.models.marketplace_booking import BookingType, BookingStatus


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
    default_session_duration: Optional[int] = None
    default_price: Optional[float] = None
    onboarding_completed: bool = False


class OnboardingUpdate(BaseModel):
    default_session_duration: int
    default_price: float


# --- Patients ---


class PatientBase(BaseModel):
    first_name: str
    last_name: str
    diagnosis: Optional[str] = None
    parent_phone: Optional[str] = None


class PatientCreate(PatientBase):
    date_of_birth: Optional[date] = None
    status: Optional[PatientStatus] = PatientStatus.ACTIVE
    parent_id: Optional[int] = None


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    diagnosis: Optional[str] = None
    parent_phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    status: Optional[PatientStatus] = None
    parent_id: Optional[int] = None


class PatientResponse(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    therapist_id: int
    date_of_birth: Optional[date] = None
    status: Optional[PatientStatus] = PatientStatus.ACTIVE
    parent_id: Optional[int] = None
    created_at: datetime


# --- Appointments ---


class AppointmentBase(BaseModel):
    patient_id: int
    start_time: datetime
    end_time: datetime
    status: AppointmentStatus = AppointmentStatus.PLANNED
    session_type: SessionType = SessionType.IN_PERSON


class AppointmentCreate(AppointmentBase):
    package_id: Optional[int] = None
    requested_by: RequestedBy = RequestedBy.THERAPIST
    meeting_link: Optional[str] = None


class AppointmentUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[AppointmentStatus] = None
    package_id: Optional[int] = None
    session_type: Optional[SessionType] = None
    meeting_link: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    therapist_id: int
    kaspi_link: Optional[str] = None
    meeting_link: Optional[str] = None
    session_number: Optional[int] = None
    package_id: Optional[int] = None
    reminder_sent: Optional[bool] = False
    requested_by: Optional[RequestedBy] = RequestedBy.THERAPIST


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


# --- Session Packages ---


class SessionPackageCreate(BaseModel):
    patient_id: int
    total_sessions: int
    price_per_session: float
    total_price: float
    payment_status: PaymentStatus = PaymentStatus.PENDING
    expires_at: Optional[datetime] = None


class SessionPackageUpdate(BaseModel):
    total_sessions: Optional[int] = None
    used_sessions: Optional[int] = None
    price_per_session: Optional[float] = None
    total_price: Optional[float] = None
    payment_status: Optional[PaymentStatus] = None
    expires_at: Optional[datetime] = None


class SessionPackageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    therapist_id: int
    total_sessions: int
    used_sessions: int
    price_per_session: float
    total_price: float
    payment_status: PaymentStatus
    purchased_at: datetime
    expires_at: Optional[datetime] = None
    remaining_sessions: int
    is_exhausted: bool
    created_at: datetime


class PackageBalanceResponse(BaseModel):
    patient_id: int
    active_package_id: Optional[int] = None
    total_sessions: int = 0
    used_sessions: int = 0
    remaining_sessions: int = 0
    payment_status: Optional[PaymentStatus] = None


# --- Homework Templates ---


class HomeworkTemplateCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: HomeworkCategory = HomeworkCategory.OTHER
    instructions: Optional[str] = None
    media_urls: Optional[list[str]] = None
    target_sounds: Optional[str] = None
    age_range: Optional[str] = None


class HomeworkTemplateUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[HomeworkCategory] = None
    instructions: Optional[str] = None
    media_urls: Optional[list[str]] = None
    target_sounds: Optional[str] = None
    age_range: Optional[str] = None


class HomeworkTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    therapist_id: int
    title: str
    description: Optional[str] = None
    category: HomeworkCategory
    instructions: Optional[str] = None
    media_urls: Optional[list[str]] = None
    target_sounds: Optional[str] = None
    age_range: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# --- Homework Assignments ---


class HomeworkAssignmentCreate(BaseModel):
    session_id: Optional[int] = None
    patient_id: int
    template_id: Optional[int] = None
    custom_instructions: Optional[str] = None
    due_date: Optional[datetime] = None


class HomeworkAssignmentUpdate(BaseModel):
    custom_instructions: Optional[str] = None
    due_date: Optional[datetime] = None
    parent_video_url: Optional[str] = None
    therapist_feedback: Optional[str] = None
    status: Optional[HomeworkStatus] = None


class HomeworkCompletionRequest(BaseModel):
    parent_notes: Optional[str] = None
    parent_video_url: Optional[str] = None


class HomeworkVerifyRequest(BaseModel):
    therapist_feedback: Optional[str] = None


class HomeworkAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: Optional[int] = None
    patient_id: int
    template_id: Optional[int] = None
    custom_instructions: Optional[str] = None
    assigned_at: datetime
    due_date: Optional[datetime] = None
    parent_completed_at: Optional[datetime] = None
    parent_notes: Optional[str] = None
    parent_video_url: Optional[str] = None
    therapist_verified_at: Optional[datetime] = None
    therapist_feedback: Optional[str] = None
    status: HomeworkStatus
    created_at: datetime


# --- Sound Progress ---


class SoundProgressCreate(BaseModel):
    patient_id: int
    session_id: Optional[int] = None
    sound: str
    stage: SoundStage = SoundStage.NOT_STARTED
    accuracy_percent: Optional[float] = None
    notes: Optional[str] = None


class SoundProgressUpdate(BaseModel):
    stage: Optional[SoundStage] = None
    accuracy_percent: Optional[float] = None
    notes: Optional[str] = None


class SoundProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    session_id: Optional[int] = None
    sound: str
    stage: SoundStage
    accuracy_percent: Optional[float] = None
    notes: Optional[str] = None
    assessed_at: datetime
    created_at: datetime


# --- Therapist Availability ---


class AvailabilityCreate(BaseModel):
    day_of_week: Optional[int] = None  # 0=Mon, 6=Sun
    start_time: str  # "09:00"
    end_time: str  # "17:00"
    is_active: bool = True
    specific_date: Optional[date] = None


class AvailabilityUpdate(BaseModel):
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_active: Optional[bool] = None
    specific_date: Optional[date] = None


class AvailabilityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    therapist_id: int
    day_of_week: Optional[int] = None
    start_time: str
    end_time: str
    is_active: bool
    specific_date: Optional[date] = None
    created_at: datetime


# --- Schedule Requests ---


class ScheduleRequestCreate(BaseModel):
    patient_id: int
    therapist_id: int
    requested_start: datetime
    requested_end: Optional[datetime] = None
    type: ScheduleRequestType
    original_appointment_id: Optional[int] = None


class ScheduleRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    parent_id: int
    patient_id: int
    therapist_id: int
    requested_start: datetime
    requested_end: Optional[datetime] = None
    type: ScheduleRequestType
    original_appointment_id: Optional[int] = None
    status: ScheduleRequestStatus
    therapist_notes: Optional[str] = None
    created_at: datetime


class ScheduleRequestActionRequest(BaseModel):
    therapist_notes: Optional[str] = None


# --- Cancellation Records ---


class CancellationCreate(BaseModel):
    appointment_id: int
    type: CancellationType
    reason: Optional[str] = None
    cancelled_by: CancelledBy
    fee_charged: Optional[float] = None


class CancellationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    appointment_id: int
    type: CancellationType
    reason: Optional[str] = None
    cancelled_by: CancelledBy
    cancelled_at: datetime
    fee_charged: Optional[float] = None
    package_session_returned: bool
    created_at: datetime


# --- Waitlist ---


class WaitlistCreate(BaseModel):
    patient_id: int
    preferred_days: Optional[list[int]] = None
    preferred_times: Optional[list[str]] = None
    priority: int = 0
    notes: Optional[str] = None


class WaitlistUpdate(BaseModel):
    preferred_days: Optional[list[int]] = None
    preferred_times: Optional[list[str]] = None
    priority: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[WaitlistStatus] = None


class WaitlistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    therapist_id: int
    preferred_days: Optional[list[int]] = None
    preferred_times: Optional[list[str]] = None
    priority: int
    status: WaitlistStatus
    notes: Optional[str] = None
    created_at: datetime


# --- v3: Therapist Profile ---


class SuccessStory(BaseModel):
    title: str
    text: str


class TherapistProfileCreate(BaseModel):
    bio: Optional[str] = None
    specializations: Optional[list[str]] = None
    education: Optional[str] = None
    certifications: Optional[list[str]] = None
    license_number: Optional[str] = None
    years_of_experience: Optional[int] = None
    age_groups: Optional[list[str]] = None
    city: Optional[str] = None
    district: Optional[str] = None
    online_available: bool = False
    price_range_min: Optional[float] = None
    price_range_max: Optional[float] = None
    session_duration: Optional[int] = None
    languages: Optional[list[str]] = None
    gender: Optional[str] = None
    success_stories: Optional[list[SuccessStory]] = None
    is_published: bool = False


class TherapistProfileUpdate(BaseModel):
    bio: Optional[str] = None
    specializations: Optional[list[str]] = None
    education: Optional[str] = None
    certifications: Optional[list[str]] = None
    license_number: Optional[str] = None
    video_intro_url: Optional[str] = None
    years_of_experience: Optional[int] = None
    age_groups: Optional[list[str]] = None
    city: Optional[str] = None
    district: Optional[str] = None
    online_available: Optional[bool] = None
    price_range_min: Optional[float] = None
    price_range_max: Optional[float] = None
    session_duration: Optional[int] = None
    languages: Optional[list[str]] = None
    gender: Optional[str] = None
    success_stories: Optional[list[SuccessStory]] = None
    is_published: Optional[bool] = None


class TherapistProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    therapist_id: int
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    video_intro_url: Optional[str] = None
    specializations: Optional[list[str]] = None
    education: Optional[str] = None
    certifications: Optional[list[str]] = None
    license_number: Optional[str] = None
    credential_documents: Optional[list[str]] = None
    years_of_experience: Optional[int] = None
    age_groups: Optional[list[str]] = None
    city: Optional[str] = None
    district: Optional[str] = None
    online_available: bool = False
    price_range_min: Optional[float] = None
    price_range_max: Optional[float] = None
    session_duration: Optional[int] = None
    languages: Optional[list[str]] = None
    gender: Optional[str] = None
    response_time_hours: Optional[int] = None
    success_stories: Optional[list[dict]] = None
    verification_status: VerificationStatus = VerificationStatus.UNVERIFIED
    is_published: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None


class TherapistProfilePublic(TherapistProfileResponse):
    """Public view — includes therapist name and aggregated ratings."""

    therapist_name: str
    clinic_name: Optional[str] = None
    avg_rating: Optional[float] = None
    review_count: int = 0
    next_available_slot: Optional[datetime] = None
    total_patients: Optional[int] = None
    total_sessions: Optional[int] = None


class MarketplaceSearchParams(BaseModel):
    city: Optional[str] = None
    specialization: Optional[str] = None
    language: Optional[str] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    online_only: bool = False
    gender: Optional[str] = None
    min_rating: Optional[float] = None
    sort_by: str = "rating"  # rating, price_asc, price_desc, experience, response_time
    skip: int = 0
    limit: int = 20


# --- v3: Reviews ---


class ReviewCreate(BaseModel):
    therapist_id: int
    session_id: int  # required for verification
    rating_overall: int  # 1-5
    rating_results: Optional[int] = None
    rating_approach: Optional[int] = None
    rating_communication: Optional[int] = None
    rating_punctuality: Optional[int] = None
    text: Optional[str] = None


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    therapist_id: int
    session_id: Optional[int] = None
    rating_overall: int
    rating_results: Optional[int] = None
    rating_approach: Optional[int] = None
    rating_communication: Optional[int] = None
    rating_punctuality: Optional[int] = None
    text: Optional[str] = None
    is_verified: bool
    created_at: datetime
    # anonymized parent info
    parent_name: Optional[str] = None
    # therapist reply
    therapist_reply: Optional[str] = None
    therapist_reply_at: Optional[datetime] = None


class ReviewReplyRequest(BaseModel):
    reply: str


class ReviewAggregation(BaseModel):
    therapist_id: int
    avg_overall: Optional[float] = None
    avg_results: Optional[float] = None
    avg_approach: Optional[float] = None
    avg_communication: Optional[float] = None
    avg_punctuality: Optional[float] = None
    total_reviews: int = 0


# --- v3: Marketplace Bookings ---


class MarketplaceBookingCreate(BaseModel):
    therapist_id: int
    type: BookingType = BookingType.DIAGNOSTIC
    requested_slot: datetime
    notes: Optional[str] = None


class MarketplaceBookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    parent_id: int
    therapist_id: int
    type: BookingType
    requested_slot: datetime
    status: BookingStatus
    deposit_paid: bool
    deposit_amount: Optional[float] = None
    kaspi_link: Optional[str] = None
    notes: Optional[str] = None
    appointment_id: Optional[int] = None
    created_at: datetime
