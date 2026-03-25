# Asyl AI - Agent Configuration

## Project Context
Asyl AI is a vertical SaaS for speech therapists in Kazakhstan. The goal is to provide an all-in-one platform (CRM, Billing, EMR) with an AI SOAP generation core.

## Current Strategy (Marketplace + PM Flywheel)
Based on recent market research and build audits, the focus has shifted:
1. **Marketplace Discovery (HIGH PRIORITY)**: Build search and filtering for therapists (specialization, price, city, language). This is the primary growth engine and defensive moat.
2. **Online Session Simplification**: Deprecate the complex Daily.co integration. Focus on in-person sessions as the 80% use case. Use simple meeting links for online sessions.
3. **Clinical Tracking**: Use the sound progression framework (isolation -> connected speech) as the universal progress tracker for parents.

## Agent Roles
- **Plan Agent**: Research the current codebase (FastAPI backend, React frontend) and design the Marketplace and Payout components.
- **Build Agent**: Implement the Marketplace filters, therapist profile enrichment, and simplify the `ActiveSession` component.
- **Workflow Rule**: All verified changes MUST be committed and pushed to GitHub immediately after every successful update.

## Supervisor
Antigravity (AI Supervisor) is managing the project flow and permissions.

## Next Steps
1. Analyze `frontend/` and `backend/` for marketplace readiness.
2. Propose a schema for `TherapistProfile` specializations and verification.
3. Replace Daily.co mocks with a simple `session_type` enum and link-based online sessions.
