# Asyl AI - Agent Configuration

## Project Context
Asyl AI is a vertical SaaS for speech therapists in Kazakhstan. The goal is to provide an all-in-one platform (CRM, Billing, EMR) with an AI SOAP generation core.

## Tech Stack
- **Backend**: FastAPI + SQLAlchemy (async) + Alembic + PostgreSQL (prod) / SQLite (dev)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + i18next (ru/kk)
- **AI**: Google Gemini (SOAP generation) + OpenAI Whisper (transcription)
- **Infra**: Docker Compose + Fly.io + S3/MinIO + Celery + Redis
- **Payments**: Kaspi integration (mocked)
- **Messaging**: WhatsApp Business (mocked)

## Completed Milestones
1. **CRM + EMR Core**: Patient management, appointments, session recording, AI SOAP notes
2. **Marketplace Discovery**: Full search with filters (city, specialization, price, language, rating, verification, online, age group). Therapist profiles with stats enrichment (ratings, patient count, next slot).
3. **Online Session Simplification**: Daily.co removed. Using `session_type` enum (in_person/online/hybrid) with simple meeting links.
4. **Clinical Tracking**: Sound progression framework (isolation -> connected speech) with parent-visible progress tracking.
5. **Verification Workflow**: Therapist credential upload, admin review/approve/reject pipeline.
6. **Payout System**: Commission tracking (7.5%), bank account management, admin approval workflow.
7. **Parent Portal**: OTP login, homework feed, sound progress, upcoming sessions, payments.
8. **Billing**: Session packages, Kaspi payment links, debtor tracking.
9. **Reports & Export**: HTML progress reports, PMPK reports, CSV/JSON data export.
10. **Admin Panel**: Platform stats, verification management, payout management.

## Project Structure
```
asyl-ai/
  backend/
    app/
      api/v1/         # 30 route modules (all functional)
      models/          # 27 SQLAlchemy models
      schemas/         # Pydantic request/response schemas
      core/            # Config, database, security, audit
      integrations/    # WhatsApp, Kaspi, Whisper, Gemini
      services/        # LLM, S3 services
      tasks/           # Celery background tasks
    alembic/           # 10 migration versions
    scripts/           # Utility scripts (seed, stress test)
    tests/             # Test modules
  frontend/
    src/
      app/
        components/    # 40+ React components
        components/ui/ # 49 shadcn/ui components
      i18n/locales/    # ru.json, kk.json (730+ keys each)
      styles/          # Theme, fonts, Tailwind
  deploy/              # Docker Compose prod, Nginx, deploy script
```

## Agent Roles
- **Workflow Rule**: All verified changes MUST be committed and pushed to GitHub immediately after every successful update.

## Next Steps
1. Replace mocked integrations (Kaspi, WhatsApp) with real APIs.
2. Improve test coverage (currently minimal for 40+ components and 30 route modules).
3. Production deployment hardening (error monitoring, logging, rate limiting).
4. Performance optimization for marketplace search at scale.
5. Mobile responsiveness audit across all therapist-facing pages.
