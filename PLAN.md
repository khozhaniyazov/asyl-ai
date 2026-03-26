# Asyl AI - SaaS Pivot Implementation Plan

## Goal
Transform Asyl AI from a feature-heavy demo into a focused, production-ready SaaS CRM
for speech therapists in Kazakhstan. Marketplace becomes a Phase 2 growth feature.

## Strategy
1. SaaS-first: Get 50-100 therapists using CRM daily
2. Subscription-only: 7,500 KZT/month, no commission
3. Marketplace activates later once supply base exists (50+ active therapists)

## Phase 1: Backend Cleanup

### 1.1 Remove AI/Audio Processing
- DELETE: whisper_service.py, llm_service.py, tasks/ directory
- MODIFY: sessions.py (remove upload/transcribe/analyze endpoints)
- MODIFY: session model (remove audio_file_path, transcript, processing_status)
- MIGRATION: Drop AI columns from sessions table

### 1.2 Hide Marketplace Routes (Don't Delete)
Comment out in __init__.py:
- marketplace_profiles, marketplace_reviews, marketplace_bookings
- admin, admin_verification
- analytics, messaging, waitlist, clinics, treatment_plans, reports, data_export

Keep active:
- auth, patients, appointments, sessions, packages
- homework_templates, homework_assignments, sound_progress
- availability, schedule_requests, cancellations
- parent_auth, parent_portal, finance, billing

### 1.3 Simplify Infrastructure
- Remove Celery worker/beat from docker-compose.yml
- Remove AI dependencies from requirements.txt (openai, google-generativeai, celery)
- Keep: PostgreSQL, Redis, MinIO, backend, frontend

## Phase 2: Frontend Cleanup

### 2.1 Simplify ActiveSession.tsx
Remove: audio recording, waveform, AI processing, status polling
Keep: manual SOAP fields, homework assignment, sound progress picker

### 2.2 Hide Marketplace Routes
Comment out in routes.ts:
- /marketplace/*, /analytics, /messages, /waitlist, /clinic, /payouts, /admin

### 2.3 Update Navigation
Keep: Dashboard, Patients, Homework, Finance, Settings
Hide: Marketplace, Analytics, Messages, Waitlist, Clinic, Payouts

## Phase 3: Subscription & Billing

### Pricing
- Single tier: 7,500 KZT/month (~$15 USD)
- 14-day free trial
- Unlimited patients, unlimited sessions
- Manual invoicing via Kaspi for first 20 customers

### Payment Methods (Kazakhstan)
- Kaspi.kz (dominant, 80%+ market share)
- Bank transfer (B2B fallback)

## Phase 4: Real Integrations (Pending API Keys)

### Kaspi Payment Integration
- Replace mock in kaspi_service.py
- Add webhook endpoint for payment confirmations
- Needs: Kaspi merchant account + API key

### WhatsApp Business API
- Replace mock in whatsapp_service.py
- Recommendation: Twilio ($0.005/msg) for speed, Meta Cloud API later
- Needs: Twilio/Meta API credentials

## Phase 5: Deployment

### Recommended: Render.com (free tier for MVP)
- Free PostgreSQL (1GB)
- $7/month for paid tier
- Easy deploys from GitHub

### Simplified docker-compose.yml
- Remove: celery-worker, celery-beat
- Keep: db, redis, minio, backend, frontend

## Phase 6: Launch Checklist

### Before first user:
- [ ] Remove all AI code (backend + frontend)
- [ ] Hide marketplace routes
- [ ] Simplify ActiveSession component
- [ ] Test manual SOAP entry workflow
- [ ] Test homework assignment
- [ ] Test sound progress tracking
- [ ] Deploy to production

### Before Kaspi integration:
- [ ] Get Kaspi merchant account
- [ ] Implement real payment links
- [ ] Test payment flow end-to-end

### Before WhatsApp integration:
- [ ] Choose provider (Twilio recommended)
- [ ] Implement real message sending
- [ ] Test homework delivery to parents

## Timeline
- Week 1-2: Core cleanup (Phases 1-2)
- Week 3: Kaspi integration (pending API keys)
- Week 4: WhatsApp integration (pending API keys)
- Week 5: Polish, deploy, first user onboarding
