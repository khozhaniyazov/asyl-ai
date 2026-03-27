# Sandar - Agent Configuration

## Project Context
Sandar is a vertical SaaS CRM for speech therapists in Kazakhstan. SaaS-first strategy (get 50-100 therapists using the CRM daily), then activate the marketplace as a growth feature once supply exists. Subscription-only pricing at 7,500 KZT/month (~$15), no commission.

## Tech Stack
- **Backend**: FastAPI + SQLAlchemy (async) + Alembic + PostgreSQL (prod) / SQLite (dev)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + i18next (ru/kk)
- **Infra**: Docker Compose + DigitalOcean ($6/month droplet) + Caddy (auto HTTPS)
- **Payments**: Kaspi integration (mocked — waiting for API keys)
- **Messaging**: WhatsApp Business (mocked — waiting for API keys)
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
9. **Deployment Setup**: docker-compose.prod.yml, deploy.sh, DEPLOYMENT.md (DigitalOcean + Caddy guide)

## Project Structure
```
sandar/
  backend/
    app/
      api/v1/         # 30 route modules (16 active, 14 hidden)
      models/          # 27 SQLAlchemy models
      schemas/         # Pydantic request/response schemas
      core/            # Config, database, security, audit, rate_limit, security_headers
      integrations/    # WhatsApp (mocked), Kaspi (mocked)
      services/        # S3 service
    alembic/           # 13 migration versions (all applied)
    scripts/           # Utility scripts (seed, stress test)
    tests/             # 12 core tests passing
  frontend/
    src/
      app/
        components/    # 40+ React components + ProtectedRoute guards
        components/ui/ # 49 shadcn/ui components
        validation.ts  # Zod schemas (login, register, patient, OTP, SOAP)
      i18n/locales/    # ru.json, kk.json (730+ keys each)
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

## Next Steps (Priority Order)
1. **Mobile responsiveness audit** — Important for therapists using phones between sessions. Audit all therapist-facing pages.
2. **Seed data / demo mode** — Create realistic demo account for onboarding first therapists.
3. **Replace mocked integrations** — Kaspi.kz payments and WhatsApp Business APIs (waiting for user's API keys).
4. **Improve test coverage** — Currently 12 backend core tests and 17 frontend component tests. Need coverage for finance, billing, parent portal, homework modules.
5. **Production deployment** — User needs to buy domain + DigitalOcean droplet, then follow DEPLOYMENT.md.
6. **Future: Make sound progress configurable** — Rename to generic "Progress Metrics", keep speech-therapy stages for now.
7. **Future: Reactivate marketplace** — When 50+ active therapists exist, unhide the 14 route modules.

## Key Discoveries
- No competitors exist for speech therapy CRM in Kazakhstan or CIS markets.
- All 30 backend route modules are real implementations (none are stubs).
- No orphaned frontend components — all 40+ are used.
- Backend uses SQLite for dev, PostgreSQL for production.
- Frontend bundle is ~1,232 KB — should consider code splitting with dynamic imports.
- Kaspi and WhatsApp integrations are mocked — user will provide API keys later.
- Rate limiting uses in-memory store with Redis fallback (Redis optional locally).
