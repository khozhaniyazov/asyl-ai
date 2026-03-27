# Sandar - Agent Configuration

## Project Context
Sandar is a vertical SaaS CRM for speech therapists in Kazakhstan. SaaS-first strategy (get 50-100 therapists using the CRM daily), then activate the marketplace as a growth feature once supply exists. Subscription-only pricing at 7,500 KZT/month (~$15), no commission.

## Tech Stack
- **Backend**: FastAPI + SQLAlchemy (async) + Alembic + PostgreSQL (prod) / SQLite (dev)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + i18next (ru/kk)
- **Infra**: Docker Compose + Hetzner VPS (CX22, 4GB RAM) + Caddy (auto HTTPS)
- **Payments**: Kaspi integration (mocked — waiting for API keys)
- **Messaging**: WhatsApp Business API (LIVE — permanent token, business number +7 700 804 0903)
- **Validation**: zod + @hookform/resolvers (frontend), Pydantic (backend)

## Completed Milestones
1. **CRM + EMR Core**: Patient management, appointments, manual SOAP session notes
2. **Clinical Tracking**: Sound progression framework (isolation -> connected speech) with parent-visible progress tracking
3. **Parent Portal**: OTP login (6-digit), homework feed, sound progress, upcoming sessions, payments
4. **Billing**: Session packages, Kaspi payment links, debtor tracking
5. **Homework Library**: Template library with assignment system
6. **SaaS Pivot (v7)**: Removed AI/audio (Whisper, Gemini, Celery). Sessions use manual SOAP entry. 14 marketplace/admin routes hidden (not deleted). 16 active route modules.
7. **Security Hardening (v8)**: Rate limiting, 6-digit OTP with attempt limits, password strength validation, security headers middleware, JWT 1-hour expiry, CORS restriction in production
8. **Frontend Quality**: Zod validation on Login, Register, ParentLogin, Patients, ActiveSession (SOAP). Route protection guards (ProtectedRoute, ParentProtectedRoute). 17 component tests + Playwright E2E setup.
9. **Deployment Setup**: docker-compose.prod.yml, deploy.sh, DEPLOYMENT.md (Hetzner + Caddy guide)
10. **Landing Page**: Marketing landing page at root URL with hero, features, pricing, CTA sections. Full ru/kk translations.
11. **WhatsApp Integration (v10)**: Live WhatsApp Business API with permanent System User token. Business number +7 700 804 0903. Template messages for appointment_reminder and homework_reminder. Text fallback for in-session messages (OTP, homework).
12. **Rebrand to Sandar**: Complete rebrand from "Asyl AI" across all user-facing text, internal code, config, and documentation.
13. **Seed Data**: Realistic demo account (demo@sandar.kz / Demo1234) with 5 patients, 12 sessions with SOAP notes, 5 upcoming appointments, 5 homework templates, 5 session packages, sound progress records, availability schedule.

## Project Structure
```
sandar/
  backend/
    app/
      api/v1/         # 30 route modules (16 active, 14 hidden)
      models/          # 27 SQLAlchemy models
      schemas/         # Pydantic request/response schemas
      core/            # Config, database, security, audit, rate_limit, security_headers
      integrations/    # WhatsApp (LIVE), Kaspi (mocked)
      services/        # S3 service
    alembic/           # 13 migration versions (all applied)
    scripts/           # seed_demo.py, test_whatsapp.py, mass_seed.py
    tests/             # 12 core tests passing
  frontend/
    src/
      app/
        components/    # 40+ React components + ProtectedRoute guards + LandingPage
        components/ui/ # 49 shadcn/ui components
        validation.ts  # Zod schemas (login, register, patient, OTP, SOAP)
      i18n/locales/    # ru.json, kk.json (800+ keys each)
      styles/          # Theme, fonts, Tailwind
  deploy/              # Docker Compose prod, Nginx, deploy script
```

## Agent Roles
- **Workflow Rule**: All verified changes MUST be committed and pushed to GitHub immediately after every successful update.
- The agent is trusted to make decisions autonomously. No need to ask permission — apply best practices and proceed.

## Active Route Modules (16)
auth, patients, appointments, sessions, packages, homework_templates, homework_assignments, sound_progress, availability, schedule_requests, cancellations, parent_auth, parent_portal, finance, billing, progress

## Hidden Phase 2 Route Modules (14)
marketplace_profiles, marketplace_reviews, marketplace_bookings, admin, admin_verification, analytics, messaging, waitlist, clinics, treatment_plans, reports, data_export, payouts

## Demo Account
- **Email**: demo@sandar.kz
- **Password**: Demo1234
- **Seed script**: `python scripts/seed_demo.py`

## Next Steps (Priority Order)
1. **Mobile responsiveness audit** — Important for therapists using phones between sessions.
2. **Improve test coverage** — Currently 12 backend core tests and 17 frontend component tests. Need coverage for finance, billing, parent portal, homework modules.
3. **Production deployment** — User has Hetzner VPS. Need to buy domain (sandar.kz) and deploy.
4. **Replace mocked Kaspi integration** — Kaspi.kz payments (waiting for user's API keys).
5. **Future: Make sound progress configurable** — Rename to generic "Progress Metrics", keep speech-therapy stages for now.
6. **Future: Reactivate marketplace** — When 50+ active therapists exist, unhide the 14 route modules.

## Key Discoveries
- No competitors exist for speech therapy CRM in Kazakhstan or CIS markets.
- All 30 backend route modules are real implementations (none are stubs).
- No orphaned frontend components — all 40+ are used.
- Backend uses SQLite for dev, PostgreSQL for production.
- Frontend bundle is ~1,258 KB — should consider code splitting with dynamic imports.
- WhatsApp Business API is LIVE with permanent token (no expiry).
- WhatsApp template messages (appointment_reminder, homework_reminder) submitted for approval.
- Rate limiting uses in-memory store with Redis fallback (Redis optional locally).
