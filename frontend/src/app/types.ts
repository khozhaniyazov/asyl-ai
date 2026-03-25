// API response types matching backend schemas

export interface Therapist {
  id: number;
  email: string;
  full_name: string;
  clinic_name: string | null;
  default_session_duration: number | null;
  default_price: number | null;
  onboarding_completed: boolean;
}

export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  diagnosis: string | null;
  parent_phone: string | null;
  therapist_id: number;
  date_of_birth: string | null;
  status: "active" | "discharged" | "waitlisted" | "paused";
  parent_id: number | null;
  created_at: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  therapist_id: number;
  start_time: string;
  end_time: string;
  status: "planned" | "paid" | "completed" | "cancelled" | "no_show";
  kaspi_link: string | null;
  session_number: number | null;
  package_id: number | null;
  reminder_sent: boolean;
  requested_by: "therapist" | "parent";
}

export interface AppointmentWithPatient extends Appointment {
  patientName: string;
  date: string;
  startTimeStr: string;
  endTimeStr: string;
}

export interface Session {
  id: number;
  appointment_id: number;
  status: string;
  audio_file_path: string | null;
  raw_transcript: string | null;
  soap_subjective: string | null;
  soap_objective: string | null;
  soap_assessment: string | null;
  soap_plan: string | null;
  homework_for_parents: string | null;
  created_at: string;
}

// --- v2 types ---

export interface SessionPackage {
  id: number;
  patient_id: number;
  therapist_id: number;
  total_sessions: number;
  used_sessions: number;
  price_per_session: number;
  total_price: number;
  payment_status: "pending" | "partial" | "paid" | "overdue" | "refunded";
  purchased_at: string;
  expires_at: string | null;
  remaining_sessions: number;
  is_exhausted: boolean;
  created_at: string;
}

export interface PackageBalance {
  patient_id: number;
  active_package_id: number | null;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
  payment_status: string | null;
}

export interface HomeworkTemplate {
  id: number;
  therapist_id: number;
  title: string;
  description: string | null;
  category: "articulation" | "phonology" | "vocabulary" | "grammar" | "fluency" | "other";
  instructions: string | null;
  media_urls: string[] | null;
  target_sounds: string | null;
  age_range: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface HomeworkAssignment {
  id: number;
  session_id: number | null;
  patient_id: number;
  template_id: number | null;
  custom_instructions: string | null;
  assigned_at: string;
  due_date: string | null;
  parent_completed_at: string | null;
  parent_notes: string | null;
  therapist_verified_at: string | null;
  therapist_feedback: string | null;
  status: "assigned" | "completed" | "verified" | "overdue";
  created_at: string;
}

export interface SoundProgress {
  id: number;
  patient_id: number;
  session_id: number | null;
  sound: string;
  stage: "not_started" | "isolation" | "syllables" | "words" | "phrases" | "connected_speech" | "automated";
  accuracy_percent: number | null;
  notes: string | null;
  assessed_at: string;
  created_at: string;
}

export interface Availability {
  id: number;
  therapist_id: number;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  is_active: boolean;
  specific_date: string | null;
  created_at: string;
}

export interface ScheduleRequest {
  id: number;
  parent_id: number;
  patient_id: number;
  therapist_id: number;
  requested_start: string;
  requested_end: string | null;
  type: "new_booking" | "reschedule";
  original_appointment_id: number | null;
  status: "pending" | "approved" | "rejected";
  therapist_notes: string | null;
  created_at: string;
}

export interface CancellationRecord {
  id: number;
  appointment_id: number;
  type: "cancellation" | "no_show" | "late_cancel";
  reason: string | null;
  cancelled_by: "therapist" | "parent";
  cancelled_at: string;
  fee_charged: number | null;
  package_session_returned: boolean;
  created_at: string;
}

export interface WaitlistEntry {
  id: number;
  patient_id: number;
  therapist_id: number;
  preferred_days: number[] | null;
  preferred_times: string[] | null;
  priority: number;
  status: "waiting" | "offered" | "enrolled" | "expired";
  notes: string | null;
  created_at: string;
}

export const statusColors: Record<string, string> = {
  planned: "bg-yellow-100 border-yellow-400 text-yellow-800",
  paid: "bg-green-100 border-green-400 text-green-800",
  completed: "bg-gray-100 border-gray-400 text-gray-600",
  cancelled: "bg-red-100 border-red-400 text-red-800",
  no_show: "bg-orange-100 border-orange-400 text-orange-800",
  // Keep uppercase for backward compat
  PLANNED: "bg-yellow-100 border-yellow-400 text-yellow-800",
  PAID: "bg-green-100 border-green-400 text-green-800",
  COMPLETED: "bg-gray-100 border-gray-400 text-gray-600",
  CANCELLED: "bg-red-100 border-red-400 text-red-800",
  NO_SHOW: "bg-orange-100 border-orange-400 text-orange-800",
};

export const statusDot: Record<string, string> = {
  planned: "bg-yellow-500",
  paid: "bg-green-500",
  completed: "bg-gray-400",
  cancelled: "bg-red-500",
  no_show: "bg-orange-500",
  PLANNED: "bg-yellow-500",
  PAID: "bg-green-500",
  COMPLETED: "bg-gray-400",
  CANCELLED: "bg-red-500",
  NO_SHOW: "bg-orange-500",
};

export const SOUND_STAGES = [
  "not_started",
  "isolation",
  "syllables",
  "words",
  "phrases",
  "connected_speech",
  "automated",
] as const;

export const HOMEWORK_CATEGORIES = [
  "articulation",
  "phonology",
  "vocabulary",
  "grammar",
  "fluency",
  "other",
] as const;

// --- v3: Marketplace types ---

export interface TherapistProfileData {
  id: number;
  therapist_id: number;
  bio: string | null;
  photo_url: string | null;
  video_intro_url: string | null;
  specializations: string[] | null;
  education: string | null;
  certifications: string[] | null;
  license_number: string | null;
  credential_documents: string[] | null;
  years_of_experience: number | null;
  age_groups: string[] | null;
  city: string | null;
  district: string | null;
  online_available: boolean;
  price_range_min: number | null;
  price_range_max: number | null;
  session_duration: number | null;
  languages: string[] | null;
  gender: string | null;
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  is_published: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface TherapistProfilePublic extends TherapistProfileData {
  therapist_name: string;
  clinic_name: string | null;
  avg_rating: number | null;
  review_count: number;
  next_available_slot: string | null;
  total_patients: number | null;
  total_sessions: number | null;
}

export interface ReviewData {
  id: number;
  therapist_id: number;
  session_id: number | null;
  rating_overall: number;
  rating_results: number | null;
  rating_approach: number | null;
  rating_communication: number | null;
  rating_punctuality: number | null;
  text: string | null;
  is_verified: boolean;
  created_at: string;
  parent_name: string | null;
  therapist_reply: string | null;
  therapist_reply_at: string | null;
}

export interface ReviewAggregation {
  therapist_id: number;
  avg_overall: number | null;
  avg_results: number | null;
  avg_approach: number | null;
  avg_communication: number | null;
  avg_punctuality: number | null;
  total_reviews: number;
}

export interface MarketplaceBookingData {
  id: number;
  parent_id: number;
  therapist_id: number;
  type: "diagnostic" | "regular";
  requested_slot: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  deposit_paid: boolean;
  deposit_amount: number | null;
  kaspi_link: string | null;
  notes: string | null;
  appointment_id: number | null;
  created_at: string;
}

export const SPECIALIZATIONS = [
  "dysarthria",
  "stuttering",
  "speech_delay",
  "alalia",
  "dyslalia",
  "rhinolalia",
  "aphasia",
  "dysgraphia",
  "dyslexia",
  "phonetic_phonemic",
  "general_speech_underdevelopment",
  "other",
] as const;

export const KZ_CITIES = [
  "Алматы",
  "Астана",
  "Шымкент",
  "Караганда",
  "Актобе",
  "Тараз",
  "Павлодар",
  "Усть-Каменогорск",
  "Семей",
  "Атырау",
  "Костанай",
  "Кызылорда",
  "Уральск",
  "Петропавловск",
  "Актау",
  "Темиртау",
  "Туркестан",
] as const;

export const AGE_GROUPS = [
  "children",
  "adolescents",
  "adults",
] as const;
