// API response types matching backend schemas

export interface Therapist {
  id: number;
  email: string;
  full_name: string;
  clinic_name: string | null;
}

export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  diagnosis: string | null;
  parent_phone: string | null;
  therapist_id: number;
  created_at: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  therapist_id: number;
  start_time: string;
  end_time: string;
  status: "PLANNED" | "PAID" | "COMPLETED" | "CANCELLED";
  kaspi_link: string | null;
}

// Enriched appointment with patient info (joined client-side)
export interface AppointmentWithPatient extends Appointment {
  patientName: string;
  date: string; // YYYY-MM-DD
  startTimeStr: string; // HH:MM
  endTimeStr: string; // HH:MM
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

export const statusColors: Record<string, string> = {
  PLANNED: "bg-yellow-100 border-yellow-400 text-yellow-800",
  PAID: "bg-green-100 border-green-400 text-green-800",
  COMPLETED: "bg-gray-100 border-gray-400 text-gray-600",
  CANCELLED: "bg-red-100 border-red-400 text-red-800",
};

export const statusDot: Record<string, string> = {
  PLANNED: "bg-yellow-500",
  PAID: "bg-green-500",
  COMPLETED: "bg-gray-400",
  CANCELLED: "bg-red-500",
};
