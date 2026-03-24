# Asyl AI — Product Roadmap & Market Analysis

**Version:** 2.0
**Date:** March 24, 2026
**Status:** v1 complete, v2 planned

---

## Product Vision

Asyl AI is a **vertical platform for speech therapy in Kazakhstan** with three layers:

1. **Practice Management SaaS** — the logoped's daily tool (scheduling, sessions, notes, homework, payments, progress)
2. **Parent Portal** — homework tracking, payments, progress visibility, scheduling
3. **Marketplace** — parents find and choose specialists by price/city/availability/specialization/reviews

This is the **Doctolib model for Kazakhstan speech therapy**. The SaaS creates daily usage and switching costs. The marketplace creates demand. The parent portal creates retention. Together they form a flywheel that's defensible against both horizontal marketplaces (profi.kz) and generic PM tools.

---

## Market Context

### Target Market
- ~2,000-5,000 speech therapists (logopedists) in Kazakhstan
- Mostly solo practitioners or small centers (2-5 specialists)
- Session pricing: 5,000-15,000 KZT (~$10-30 USD) in Almaty/Astana
- No existing SaaS competitors in KZ or CIS for this niche

### Key Market Facts
- **Kaspi Pay**: ~14M active users (70%+ of population). Mandatory integration.
- **WhatsApp**: Primary parent-to-service-provider communication channel.
- **Telegram**: Growing fast, secondary channel.
- **Languages**: Russian (83.7% speak), Kazakh (80.1% speak, ~49% daily). Both required.
- **Compliance**: "Law on Personal Data and Their Protection" (2013). Medical data = special category.

### Competitive Landscape
- **profi.kz**: Horizontal marketplace (plumbers to tutors). Lead-based model (pay per response). 66 logopeds in Astana. Logopeds dislike the commission model. Can't add specialized PM features.
- **No dedicated speech therapy SaaS** in KZ or CIS.
- **Global tools** (TheraPlatform, SimplePractice): English-only, USD-priced, US-insurance-focused.
- **Doctolib** (France): Closest reference — practice management + marketplace. Dominant in France. Proves the combined model works.
- **B17.ru** (Russia): Psychology marketplace with 93K+ psychologists. Content-driven community model.
- **Current therapist workflow**: WhatsApp chaos + paper notes + Kaspi P2P + Instagram for marketing.

---

## What's Built

### v0 (Foundation)
- [x] JWT auth (therapist register/login)
- [x] Patient CRUD with search
- [x] Appointment CRUD with calendar views
- [x] Real audio recording (MediaRecorder API)
- [x] AI pipeline: audio → S3 → Whisper → Gemini → SOAP notes
- [x] Session save + WhatsApp homework delivery (mock)
- [x] Kaspi payment link generation (mock)
- [x] Polished UI with animations, responsive design, dark/light theming
- [x] Docker + Fly.io deployment + CI/CD

### v1 (KZ Market Readiness) — COMPLETE
- [x] i18n — Russian + Kazakh (react-i18next, ~300 keys per language)
- [x] Kaspi Pay API integration layer (with mock fallback)
- [x] WhatsApp Business API integration layer (with mock fallback)
- [x] Parent OTP authentication via WhatsApp
- [x] Parent portal API (children, appointments, homework, progress)
- [x] Subscription/billing system (trial/free/standard/premium)
- [x] Audit logging middleware for compliance
- [x] Offline audio recording (IndexedDB + auto-sync)
- [x] Tablet UX optimization (44px touch targets)
- [x] Production deployment stack (docker-compose, Nginx+SSL, deploy script)

---

## v2: Practice Management Platform (NEXT)

### Product Pivot
Focus shifts from "AI session recorder" to "manage the whole logoped's work." The AI SOAP generation remains a feature, but the core value is automating the daily logoped-parent workflow that currently lives in WhatsApp chaos.

### Research Findings: The Real Logoped Workflow

**Typical day**: 5-8 sessions (30-45 min each), 5-15 min admin between each (notes, homework messages, parent replies). Evening: 1-2 hours responding to parents, tracking payments, planning tomorrow.

**Biggest time-wasters** (ranked):
1. WhatsApp chaos — scheduling, homework, payments, progress all in one undifferentiated chat per parent
2. Manual scheduling and rescheduling — 3-5 reschedule requests per week, all via back-and-forth messaging
3. Homework distribution — photographing worksheets, recording voice messages, sending individually
4. Payment tracking — no system, mental tally of who owes what, awkward follow-ups
5. Session notes — paper notebook or scattered notes apps, no structured format
6. Repeating information — same homework instructions, same progress updates

**What parents want**:
- Progress visibility ("Is this working? How much longer?")
- Clear homework instructions (with video/audio demonstrations)
- Easy payment (know what they owe, pay via Kaspi)
- Schedule flexibility (see available slots, request changes)
- Continuity (transferable records if switching logopeds)

**Key clinical workflow — sound progression stages**:
```
not_started → isolation → syllables → words → phrases → connected_speech → automated
```
Each sound (Р, Ш, Л, С, etc.) progresses through these stages independently. This is the universal framework for tracking speech therapy progress.

### v2 Features (8 items)

#### 1. Session Package Management [VERY HIGH]
- **Model**: `SessionPackage` — patient_id, therapist_id, total_sessions, used_sessions, price_per_session, total_price, payment_status, purchased_at, expires_at
- **API**: CRUD, GET balance, auto-deduct on session completion
- **Frontend**: Package balance card in PatientProfile, create package in Finance
- **Why**: "Was this session 7 or 8?" is a constant source of confusion. Packages are the standard billing model.

#### 2. Automated Reminders (Celery + Redis) [VERY HIGH]
- **Infrastructure**: Celery worker + Redis + Celery Beat scheduler
- **Model**: `Reminder` — appointment_id, homework_assignment_id, type (session_24h/session_1h/payment_due/homework_due), channel, scheduled_for, sent_at, status
- **Tasks**: send_session_reminder (24h + 1h before), send_payment_reminder, send_homework_reminder, check_overdue_homework
- **Auto-creation**: When appointment is created → schedule reminders. When homework is assigned → schedule due reminder.
- **Why**: Manual WhatsApp reminders are the #2 time-waster. This eliminates them entirely.

#### 3. Homework Template Library + Completion Tracking [HIGH]
- **Models**:
  - `HomeworkTemplate` — therapist_id, title, description, category (articulation/phonology/vocabulary/grammar/fluency), instructions, media_urls (JSON), target_sounds, age_range
  - `HomeworkAssignment` — session_id, patient_id, template_id (nullable), custom_instructions, assigned_at, due_date, parent_completed_at, parent_notes, therapist_verified_at, therapist_feedback, status (assigned/completed/verified/overdue)
- **API**: Template CRUD, assign from template or custom, parent marks done, therapist verifies
- **Frontend**: HomeworkLibrary page, HomeworkAssign step in ActiveSession, completion button in ParentPortal
- **Why**: Logopeds send the same homework to multiple patients with similar cases. Templates save time. Completion tracking answers "did they practice?"

#### 4. Structured Sound Progress Tracking [HIGH]
- **Model**: `SoundProgressRecord` — patient_id, session_id, sound (e.g. "Р"), status (not_started/isolation/syllables/words/phrases/connected_speech/automated), accuracy_percent, notes, assessed_at
- **API**: CRUD per patient, timeline view
- **Frontend**: SoundProgressChart in PatientProfile (visual progression per sound), progress data in ParentPortal
- **Why**: Parents' #1 question is "Is this working?" Structured tracking with visual charts answers it definitively.

#### 5. Parent Self-Service Scheduling [HIGH]
- **Models**:
  - `TherapistAvailability` — therapist_id, day_of_week, start_time, end_time, is_active, specific_date
  - `ScheduleRequest` — parent_id, patient_id, therapist_id, requested_start, type (new_booking/reschedule), original_appointment_id, status (pending/approved/rejected), therapist_notes
- **API**: Therapist sets availability, parent views available slots, parent requests booking/reschedule, therapist approves/rejects
- **Frontend**: AvailabilitySettings in Settings, available slots view in ParentPortal, request flow
- **Why**: Schedule renegotiation via WhatsApp is the #1 time-waster. Self-service eliminates the back-and-forth.

#### 6. Session Counting [MEDIUM]
- Add `session_number` (auto-incremented per patient) to Appointment model
- Computed on appointment creation: count previous appointments for this patient + 1
- Displayed in Dashboard, PatientProfile, ParentPortal
- **Why**: "Which session is this?" should never be a question.

#### 7. Cancellation/No-Show Tracking [MEDIUM]
- **Model**: `CancellationRecord` — appointment_id, type (cancellation/no_show/late_cancel), reason, cancelled_by (therapist/parent), cancelled_at, fee_charged, package_session_returned
- Add `NO_SHOW` to AppointmentStatus enum
- **API**: Cancel with reason, record no-shows, optional package session return
- **Frontend**: Cancellation modal with reason dropdown, no-show button in Dashboard
- **Why**: Cancellation patterns reveal problem clients. No-show tracking protects revenue.

#### 8. Waitlist Management [MEDIUM]
- **Model**: `WaitlistEntry` — patient_id, therapist_id, preferred_days (JSON), preferred_times (JSON), priority, status (waiting/offered/enrolled/expired), notes, created_at
- **API**: Add to waitlist, auto-notify when slot opens (via reminder system), promote to active
- **Frontend**: WaitlistView page accessible from sidebar
- **Why**: Popular logopeds have waitlists managed in their heads. Automated notification when a slot opens prevents forgotten families.

### v2 Model Changes to Existing Tables
- `Appointment`: add `session_number` (int), `package_id` (FK), `reminder_sent` (bool), `NO_SHOW` status, `requested_by` (therapist/parent)
- `Patient`: add `date_of_birth`, `status` (active/discharged/waitlisted/paused), `parent_id` (FK → Parent)
- `Parent`: remove `linked_patient_ids` CSV, relationship now via Patient.parent_id
- `Session`: keep `homework_for_parents` for backward compat, add relationship to HomeworkAssignment

### v2 Technical Decisions
- **Background scheduler**: Celery + Redis (production-grade, reliable reminder delivery)
- **Database**: Clean slate migration (no real users yet)
- **Homework system**: Full template library + assign + track (not just text + boolean)

### v2 Execution Order
1. Clean slate DB + all new models + fresh Alembic migration
2. Celery + Redis infrastructure
3. Backend: packages, homework templates, homework assignments APIs
4. Backend: availability, schedule requests, sound progress, waitlist, cancellations APIs
5. Backend: reminder Celery tasks
6. Backend: modify appointments/sessions for auto-triggers
7. Frontend: new components + modified components
8. i18n: ~100 new translation keys (RU + KZ)
9. Docker: redis + celery services
10. Tests + build + verify

---

## v3: Marketplace (FUTURE)

### Vision
A public-facing layer where parents find and choose logopeds. The marketplace is the growth engine; the SaaS is the retention layer.

### How Parents Currently Find Logopeds
1. Word of mouth (dominant)
2. profi.kz (primary online, but logopeds dislike the per-lead cost model)
3. Instagram (content marketing, before/after posts)
4. Neurologist/pediatrician referrals
5. Google/Yandex search

### What Parents Filter By (from profi.kz review analysis)
1. Results/effectiveness (#1 concern)
2. Approach to child (engaging, game-based)
3. Specialization match (dysarthria, stuttering, speech delay, alalia, etc.)
4. Reviews/ratings (extremely important — parents write 300-500 word reviews)
5. Experience with similar cases
6. Price (listed but secondary to results)
7. Location / online availability
8. Language (Russian/Kazakh)
9. Gender

### Marketplace Data Model (New)
- `TherapistProfile` — public bio, photo, specializations, education, certifications, years_of_experience, city, district, online_available, price_range_min, price_range_max, session_duration, languages, gender, verification_status
- `Review` — patient_id (anonymized), therapist_id, session_id (verified), rating_overall, rating_results, rating_approach, rating_communication, rating_punctuality, text, created_at, is_verified
- `MarketplaceBooking` — parent_id, therapist_id, type (diagnostic/regular), requested_slot, status, deposit_paid, created_at
- Search index on TherapistProfile (city, specialization, price, availability, rating)

### Marketplace Flow
1. Parent searches by city + specialization + filters
2. Views therapist profiles with reviews, availability, pricing
3. Books diagnostic session → pays deposit via Kaspi
4. Diagnostic happens → logoped uses PM tools to document
5. If continuing: parent is onboarded into parent portal
6. After sessions: parent leaves verified review → feeds marketplace

### Business Model
| Tier | Price | Marketplace | PM Features |
|------|-------|-------------|-------------|
| Free | 0 KZT | Basic listing | 3 patients, basic scheduling |
| Standard | 9,900 KZT/mo | Full listing + reviews | Unlimited patients, homework, reminders, progress |
| Premium | 19,900 KZT/mo | Priority placement + badge | Multi-therapist, analytics, API access |

**Key insight**: Free marketplace listing for all logopeds who use the SaaS (even free tier). This is better than profi.kz's per-lead model. Revenue comes from SaaS subscriptions, not from taxing the client relationship.

### Competitive Moat
- **profi.kz can't add PM**: Horizontal marketplace DNA, serves plumbers to tutors. Speech-therapy-specific features are too niche.
- **Generic PM tools can't add marketplace**: Two-sided marketplace requires parent acquisition — completely different skill set.
- **Data network effects**: Every session logged, every progress note, every review makes the platform stickier.
- **KZ market size**: Small enough (~5K logopeds) that being first creates a natural monopoly. Not enough to support two competing platforms.
- **The combination is the moat**: PM creates lock-in (switching costs after 6 months of data). Marketplace creates demand (parents come for discovery). Together they form a flywheel.

### Architecture
```
┌─────────────────────────────────────────────┐
│              PUBLIC MARKETPLACE              │
│  (Search, Profiles, Reviews, Booking)        │
├─────────────────────────────────────────────┤
│           SHARED SERVICES LAYER              │
│  (Auth, Payments, Notifications, Messaging)  │
├─────────────────────────────────────────────┤
│         PRACTICE MANAGEMENT (SaaS)           │
│  (Calendar, Sessions, Notes, Progress,       │
│   Homework, Parent Portal, Billing)          │
├─────────────────────────────────────────────┤
│              DATA / MULTI-TENANT             │
│  (Per-logoped tenant + shared marketplace)   │
└─────────────────────────────────────────────┘
```

The calendar is the key bridge: availability shown on the marketplace syncs from the PM calendar. When a marketplace booking is made, it creates an appointment in the PM system.

---

## Pricing Strategy
- **Free Trial**: 14 days, full features
- **Free Plan**: 3 patients, 10 sessions/month, basic marketplace listing
- **Standard**: 9,900 KZT/month (~$20) — unlimited patients/sessions, full marketplace listing
- **Premium**: 19,900 KZT/month (~$40) — multi-therapist, priority marketplace placement, analytics

## Target Deployment
- Primary: Kazakhstan-based VPS (data localization compliance)
- Secondary: Fly.io Frankfurt (for development/staging)
