export interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  parentName: string;
  parentPhone: string;
  status: "active" | "inactive";
  nextAppointment: string | null;
  totalPaid: number;
  outstanding: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "unpaid" | "planned" | "paid" | "completed";
}

export interface Transaction {
  id: string;
  date: string;
  patientName: string;
  amount: number;
  method: "kaspi" | "cash";
  status: "completed" | "pending" | "failed";
}

export interface SessionNote {
  id: string;
  patientId: string;
  date: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  homework: string;
}

export const patients: Patient[] = [
  { id: "1", name: "Aibek Nurlan", age: 5, diagnosis: "Dysarthria", parentName: "Nurlan Serikovich", parentPhone: "+7 701 123 4567", status: "active", nextAppointment: "2026-03-18T10:00", totalPaid: 45000, outstanding: 15000 },
  { id: "2", name: "Madina Kanat", age: 4, diagnosis: "Speech delay (ZRR)", parentName: "Kanat Berikovna", parentPhone: "+7 702 234 5678", status: "active", nextAppointment: "2026-03-18T11:00", totalPaid: 30000, outstanding: 0 },
  { id: "3", name: "Daulet Marat", age: 6, diagnosis: "Stuttering", parentName: "Marat Dauletovich", parentPhone: "+7 705 345 6789", status: "active", nextAppointment: "2026-03-19T09:00", totalPaid: 60000, outstanding: 30000 },
  { id: "4", name: "Aliya Serik", age: 3, diagnosis: "Phonological disorder", parentName: "Serik Aliyevna", parentPhone: "+7 707 456 7890", status: "active", nextAppointment: "2026-03-19T14:00", totalPaid: 15000, outstanding: 15000 },
  { id: "5", name: "Timur Aslan", age: 7, diagnosis: "Articulation disorder", parentName: "Aslan Timurovich", parentPhone: "+7 700 567 8901", status: "inactive", nextAppointment: null, totalPaid: 90000, outstanding: 0 },
  { id: "6", name: "Kamila Erbol", age: 5, diagnosis: "Apraxia of speech", parentName: "Erbol Kamilovich", parentPhone: "+7 708 678 9012", status: "active", nextAppointment: "2026-03-20T10:00", totalPaid: 22500, outstanding: 7500 },
];

const today = "2026-03-17";
const tomorrow = "2026-03-18";
const dayAfter = "2026-03-19";

export const appointments: Appointment[] = [
  { id: "a1", patientId: "1", patientName: "Aibek Nurlan", date: today, startTime: "09:00", endTime: "09:45", status: "completed" },
  { id: "a2", patientId: "2", patientName: "Madina Kanat", date: today, startTime: "10:00", endTime: "10:45", status: "paid" },
  { id: "a3", patientId: "3", patientName: "Daulet Marat", date: today, startTime: "11:00", endTime: "11:45", status: "unpaid" },
  { id: "a4", patientId: "4", patientName: "Aliya Serik", date: today, startTime: "14:00", endTime: "14:45", status: "planned" },
  { id: "a5", patientId: "6", patientName: "Kamila Erbol", date: today, startTime: "15:00", endTime: "15:45", status: "unpaid" },
  { id: "a6", patientId: "1", patientName: "Aibek Nurlan", date: tomorrow, startTime: "10:00", endTime: "10:45", status: "planned" },
  { id: "a7", patientId: "2", patientName: "Madina Kanat", date: tomorrow, startTime: "11:00", endTime: "11:45", status: "paid" },
  { id: "a8", patientId: "3", patientName: "Daulet Marat", date: dayAfter, startTime: "09:00", endTime: "09:45", status: "unpaid" },
  { id: "a9", patientId: "4", patientName: "Aliya Serik", date: dayAfter, startTime: "14:00", endTime: "14:45", status: "planned" },
];

export const transactions: Transaction[] = [
  { id: "t1", date: "2026-03-15", patientName: "Aibek Nurlan", amount: 15000, method: "kaspi", status: "completed" },
  { id: "t2", date: "2026-03-14", patientName: "Madina Kanat", amount: 15000, method: "kaspi", status: "completed" },
  { id: "t3", date: "2026-03-13", patientName: "Daulet Marat", amount: 15000, method: "cash", status: "completed" },
  { id: "t4", date: "2026-03-12", patientName: "Aliya Serik", amount: 15000, method: "kaspi", status: "pending" },
  { id: "t5", date: "2026-03-10", patientName: "Timur Aslan", amount: 15000, method: "cash", status: "completed" },
  { id: "t6", date: "2026-03-09", patientName: "Kamila Erbol", amount: 7500, method: "kaspi", status: "completed" },
  { id: "t7", date: "2026-03-08", patientName: "Aibek Nurlan", amount: 15000, method: "kaspi", status: "completed" },
  { id: "t8", date: "2026-03-05", patientName: "Madina Kanat", amount: 15000, method: "cash", status: "completed" },
];

export const sessionNotes: SessionNote[] = [
  { id: "s1", patientId: "1", date: "2026-03-15", subjective: "Parent reports child has been practicing sounds at home. Improved 's' pronunciation noticed during meals.", objective: "Child produced /s/ correctly in 6/10 trials in initial position. Struggled with /s/ blends (sp, st). Oral motor exam shows mild tongue weakness.", assessment: "Moderate progress on /s/ sound. Tongue strengthening exercises showing improvement. Ready to introduce /s/ blends next session.", plan: "Continue tongue exercises. Begin /s/ blend drills. Increase complexity of sentences.", homework: "Practice saying 'sun, soap, sand' 5 times each morning. Do tongue push-ups (press tongue to roof of mouth) 10 times before bed." },
  { id: "s2", patientId: "1", date: "2026-03-10", subjective: "First session. Parent concerned about unclear speech compared to peers.", objective: "Initial assessment: /s/, /r/, /l/ substitutions observed. Oral motor function within normal limits except mild tongue weakness.", assessment: "Articulation disorder affecting /s/, /r/, /l/. Recommend 2x weekly sessions for 3 months.", plan: "Begin with /s/ in isolation and initial position. Introduce tongue strengthening exercises.", homework: "Read picture book together and point out words starting with 'S'. Practice in front of mirror." },
  { id: "s3", patientId: "2", date: "2026-03-14", subjective: "Parent says vocabulary expanding. New words: 'dog', 'more', 'go'.", objective: "Expressive vocabulary estimated at 40 words (age expectation: 200+). Uses 1-word utterances primarily. Receptive language appears age-appropriate.", assessment: "Continued speech delay. Expressive language improving but still significantly below age norms.", plan: "Focus on 2-word combinations. Use play-based therapy to encourage spontaneous speech.", homework: "During play, model 2-word phrases: 'big ball', 'red car'. Wait 5 seconds for child to attempt before repeating." },
];

export const statusColors: Record<Appointment["status"], string> = {
  unpaid: "bg-red-100 border-red-400 text-red-800",
  planned: "bg-yellow-100 border-yellow-400 text-yellow-800",
  paid: "bg-green-100 border-green-400 text-green-800",
  completed: "bg-gray-100 border-gray-400 text-gray-600",
};

export const statusDot: Record<Appointment["status"], string> = {
  unpaid: "bg-red-500",
  planned: "bg-yellow-500",
  paid: "bg-green-500",
  completed: "bg-gray-400",
};
