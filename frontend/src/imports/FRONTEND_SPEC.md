# Frontend Architecture & Design Specification: Logoped SaaS

## 1. Global Application Shell
The application is a B2B SaaS for Speech Therapists (Tablet/Desktop) and a B2C Portal for Parents (Mobile).

### 1.1 Auth & Onboarding
*   **Login Screen:** Email/Phone & Password, "Forgot Password" link.
*   **Registration Screen:** Therapist Name, Clinic Name, Email, Password.
*   **Onboarding Wizard (Optional but recommended):** Set default session duration (e.g., 45 mins), default price per session.

### 1.2 Layout Structure (Therapist View - Tablet/Desktop)
*   **Sidebar Navigation:** Dashboard (Calendar), Patients, Finance, Settings.
*   **Top Bar:** Global Search (find patient by name), Notifications (AI processing completed, Payments received), User Profile Menu.
*   **Global States:** Toast notifications (Success, Error), Processing indicators.

---

## 2. Core Modules (Therapist View)

### 2.1 Dashboard & Calendar (The Hub)
*   **Interactive Calendar:** Weekly and Daily views.
*   **Appointment Blocks:** Must clearly show: Patient Name, Time, and Status Color (Red = Unpaid, Yellow = Planned/Pending, Green = Paid, Gray = Completed).
*   **Quick Actions on Appointment Hover/Click:**
    *   "Start Session" (Routes to Active Session View).
    *   "Generate Payment Link" (Triggers Kaspi API, shows QR or link to copy).
    *   "Cancel/Reschedule".

### 2.2 Patient Management (CRM)
*   **Patient List:** Searchable table/list showing Name, Age, Diagnosis, Parent Phone, Status (Active/Inactive), Next Appointment.
*   **Patient Profile (Detailed View):**
    *   **Tab 1: Info:** Basic details, Diagnosis, Parent info.
    *   **Tab 2: History:** Timeline of all past sessions.
    *   **Tab 3: Financials:** Total paid, Outstanding debt.
    *   **Tab 4: Documents/Notes:** Aggregated view of all previous SOAP notes and Homework.

### 2.3 The "Active Session" & EMR (The Killer Feature)
This is the most critical screen. It should feel like a focused "focus mode".
*   **Session Header:** Patient Name, Current Time/Timer, End Session Button.
*   **Audio Recording Component:**
    *   Prominent Mic Button (Start/Pause/Stop).
    *   Visual audio waveform (optional, for aesthetics).
    *   Current recording duration.
*   **Manual Note Taking Area:** While recording, allow the therapist to type quick manual bullet points just in case.
*   **Processing State:** Once "Stop & Analyze" is clicked, show a high-quality loading skeleton (e.g., "AI is analyzing speech patterns...").
*   **SOAP Note Review UI (Post-Processing):**
    *   Four distinct text-areas or rich-text editors for **S, O, A, P**.
    *   These must be editable so the therapist can correct AI mistakes.
    *   **Homework Section:** An isolated text box for the generated homework.
    *   **Actions:** "Save Session", "Save & Send Homework via WhatsApp".

### 2.4 Finance & Billing
*   **Overview Dashboard:** Total earned this month, Projected income, Outstanding debts.
*   **Transactions List:** Table of all payments (Date, Patient, Amount, Method (Kaspi/Cash), Status).
*   **Debtors View:** A dedicated view showing parents who have completed sessions but haven't paid, with a 1-click "Send WhatsApp Reminder" button.

### 2.5 Settings
*   **Profile Settings:** Personal info.
*   **Integration Settings:** Kaspi API Key input, WhatsApp Business connection status.
*   **Template Settings:** Ability to edit the underlying "Markdown prompt" preferences (e.g., "I prefer shorter homework assignments").

---

## 3. Parent Portal (B2C View - Mobile First)
This view must be dead-simple. Parents are busy.

### 3.1 Authentication (Parent)
*   **Magic Link / OTP:** Login via Phone Number receiving an SMS/WhatsApp code (no passwords to remember).

### 3.2 Parent Dashboard
*   **Upcoming Appointments:** Next session date and time.
*   **Billing Alert (Prominent):** If an appointment is unpaid, show a large "Pay X KZT via Kaspi" button.
*   **Homework Feed:** A timeline feed (like Instagram) showing the homework assigned after each session.
*   **Progress View (Optional):** A simple chart or text summary from the therapist showing the child's progress over time.

---

## 4. UI/UX "Final Polish" Requirements
*   **Responsiveness:** Therapist view must work flawlessly on iPads (tablets are heavily used in clinics).
*   **Form Validation:** Red borders/text for missing required fields (e.g., Parent Phone is required to save a Patient).
*   **Empty States:** Beautiful "No patients yet. Add your first patient!" screens instead of blank white pages.
*   **Data Grids:** Use pagination or infinite scroll for the Patient List and Transactions to ensure the app doesn't freeze when they have 500 patients.
