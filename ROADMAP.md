# Asyl AI — Product Roadmap & Market Analysis

**Version:** 1.0
**Date:** March 24, 2026
**Status:** In Progress

## Market Context: Kazakhstan Speech Therapy SaaS

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
- No dedicated SaaS for speech therapists in KZ or CIS
- Global tools (TheraPlatform, SimplePractice) are English-only, USD-priced, US-focused
- Current therapist workflow: WhatsApp + paper notes + Kaspi P2P + Instagram

---

## What's Built (v0)

- [x] JWT auth (therapist register/login)
- [x] Patient CRUD with search
- [x] Appointment CRUD with calendar views
- [x] Real audio recording (MediaRecorder API)
- [x] AI pipeline: audio → S3 → Whisper → Gemini → SOAP notes
- [x] Session save + WhatsApp homework delivery (mock)
- [x] Kaspi payment link generation (mock)
- [x] Polished UI with animations, responsive design, dark/light theming
- [x] Docker + Fly.io deployment + CI/CD

---

## Roadmap Items (v1)

### 1. i18n — Russian + Kazakh Localization [CRITICAL]
- react-i18next with JSON translation files
- ~300 translation keys across all components
- Language switcher in settings + sidebar
- Russian as default, Kazakh as secondary

### 2. Real Kaspi Pay API Integration [HIGH]
- Kaspi Pay merchant API client with mock fallback
- Payment link generation, QR codes, status webhooks
- Config: KASPI_MERCHANT_ID, KASPI_API_KEY

### 3. Real WhatsApp Business API [HIGH]
- Meta Cloud API client with mock fallback
- Template messages, text messages, OTP delivery
- Config: WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID

### 4. Parent OTP Authentication [HIGH]
- Parent model (phone, linked patients, OTP)
- WhatsApp-based OTP flow (no passwords)
- Parent-scoped JWT tokens
- Parent portal API (sessions, homework, appointments, progress)

### 5. Data Localization & Compliance [HIGH]
- Audit logging middleware (all data access/modification)
- Consent fields on models
- Data export + deletion endpoints (right to be forgotten)
- KZ-hosted deployment option

### 6. Subscription/Billing System [MEDIUM]
- Subscription model (plan, status, expiry)
- 14-day free trial on registration
- Plans: Free (3 patients), Standard (9,900 KZT/mo), Premium (19,900 KZT/mo)
- Kaspi Pay for SaaS subscription payments

### 7. Tablet UX Optimization [MEDIUM]
- iPad-specific touch targets (44x44px minimum)
- Larger mic button and waveform in ActiveSession
- Sidebar auto-hide for tablet portrait
- @media (pointer: coarse) adjustments

### 8. Offline Audio Recording + Sync [MEDIUM]
- IndexedDB storage for offline recordings
- Connectivity detection + offline indicator
- Auto-upload on reconnection
- Service worker for basic offline capability

### 9. Patient Progress Tracking [MEDIUM]
- Aggregate session data over time
- Progress API endpoint with timeline data
- Recharts line chart in PatientProfile
- Real data in ParentPortal progress tab

### 10. KZ-Hosted VPS Deployment [HIGH]
- Production docker-compose with Postgres, Nginx, Certbot SSL
- One-command deploy script for any Ubuntu VPS
- Security headers, rate limiting
- .env.production template

---

## Pricing Strategy (Recommended)
- **Free Trial**: 14 days, full features
- **Free Plan**: 3 patients, 10 sessions/month
- **Standard**: 9,900 KZT/month (~$20) — unlimited patients/sessions
- **Premium**: 19,900 KZT/month (~$40) — multi-therapist, priority support

## Target Deployment
- Primary: Kazakhstan-based VPS (data localization compliance)
- Secondary: Fly.io Frankfurt (for development/staging)
