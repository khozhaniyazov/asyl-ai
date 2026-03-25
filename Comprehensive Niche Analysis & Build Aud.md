Comprehensive Niche Analysis & Build Audit: Asyl AI
Market Findings
The Speech Therapy Market Reality
Size & Growth:
- Global speech therapy market: ~$15-18B, growing 5-7% annually
- Kazakhstan: ~2,000-5,000 active therapists, mostly solo practitioners
- Session pricing: 5,000-15,000 KZT ($10-30 USD) in major cities
- Post-COVID: 40-60% of therapists now offer hybrid/online options
Key Market Dynamics:
- No dedicated SaaS competitor in Kazakhstan or CIS — massive white space
- Therapists currently use: WhatsApp chaos + paper notes + Kaspi P2P + Instagram
- Parents want: progress visibility, clear homework, easy payments, schedule flexibility
- Kaspi Pay dominance: 14M+ active users (70%+ of population) — mandatory integration
- Language requirement: Russian (83.7%) + Kazakh (80.1%) — both critical
Competitive Landscape
- profi.kz: Horizontal marketplace, lead-based model, 66 logopeds listed, therapists dislike commissions
- Global tools (TheraPlatform, SimplePractice): English-only, USD-priced, US insurance-focused, not localized
- Doctolib (France): Closest reference model — practice management + marketplace, proven flywheel
- B17.ru (Russia): Psychology marketplace with 93K+ psychologists, content-driven community
Why no competitor yet: High localization cost + small market size + regulatory complexity = low ROI for global players
---
🎯 Your Build: The Good News
Your core architecture is exceptionally well-positioned. Here's what you nailed:
✅ Strengths (Keep These)
1. Practice Management Core — Exceptional
   - Calendar with color-coded status (Unpaid/Planned/Paid/Completed) ✓
   - Patient CRM with history, financials, documents ✓
   - Session packages (prepaid blocks) ✓
   - Sound progression tracking (clinical framework) ✓
   - Homework library with templates ✓
   - Multi-therapist clinic support (v2) ✓
2. Marketplace Foundation — Smart Architecture
   - Therapist profiles with availability sync ✓
   - Review system ✓
   - Booking integration ✓
   - Waitlist management ✓
   - This is your defensible moat — therapists get daily usage, parents get discovery
3. Parent Portal — Clean & Simple
   - OTP login (no password friction) ✓
   - Homework feed (Instagram-like) ✓
   - Payment alerts ✓
   - Progress visibility ✓
4. AI/SOAP Pipeline — Solid
   - Markdown-driven prompts (easy iteration) ✓
   - Gemini integration ✓
   - Structured JSON output ✓
   - Editable SOAP notes ✓
5. Compliance & Localization
   - Audit logging for medical data ✓
   - Russian + Kazakh i18n ✓
   - Data localization ready ✓
---
⚠️ The Problem: Online Sessions Are Overengineered
You're right — this is the weak point. Here's what I found:
Current Online Session Implementation
VideoSession model → Daily.co mock → Join URLs → Start/End tracking
The Issues:
1. Mismatch with Market Reality
   - 70-80% of speech therapy in Kazakhstan is in-person (clinics, home visits)
   - Online is secondary, used for: makeup sessions, parent demos, follow-ups
   - You're building full video infrastructure for 20-30% use case
   - Daily.co integration is expensive ($0.50-1.50/min) — kills unit economics for low-price market
2. Architectural Bloat
   - VideoSession model with room URLs, tokens, duration tracking
   - Separate video session endpoints (/video_sessions/{id}/start, /end)
   - Frontend ActiveSession.tsx handles both audio recording AND video (confusing UX)
   - No clear distinction: is this for in-person recording or online video?
3. Clinical Workflow Mismatch
   - Speech therapy requires real-time feedback and physical demonstration
   - Online works for: progress check-ins, parent education, makeup sessions
   - Online fails for: initial assessment, complex articulation work, motor planning
   - Your system treats online/in-person identically — they're not
4. Missing Online-Specific Features
   - No screen sharing (for homework demos)
   - No whiteboard/annotation tools
   - No recording consent/compliance for online sessions
   - No bandwidth detection or quality fallback
   - No async homework video recording (parents record homework at home, therapist reviews)
5. Cost Problem
   - Daily.co: $0.50-1.50/min → 45-min session = $22.50-67.50 cost
   - Your market: 5,000-15,000 KZT revenue per session
   - Margin gets crushed if you're paying $20+ per session
   - Twilio/Vonage cheaper but still $0.10-0.30/min
---
🚀 Surprising Insight: Your Real Opportunity
The marketplace is your actual killer feature, not online sessions.
Your roadmap mentions it but doesn't emphasize it enough. Here's why:
The Doctolib Flywheel (Proven Model)
Therapists join → List availability → Parents discover → Book → Session → Review
                                                                    ↓
                                            Therapist gets daily usage + switching costs
                                            Parents get continuity + progress tracking
                                            Platform gets network effects
Why this works in Kazakhstan:
- No existing marketplace for speech therapy (white space)
- Parents currently find therapists via: Instagram, WhatsApp groups, word-of-mouth
- Therapists want: patient acquisition without profi.kz commission (25-30%)
- You can charge 5-10% commission + subscription = better margins than profi.kz
Your competitive advantage:
- Therapists get practice management (not just lead generation)
- Parents get continuity (homework, progress, payment history)
- You own the relationship, not just the transaction
---
📋 What You're Missing (Gaps)
Critical Gaps
1. Marketplace Search & Discovery (HIGH PRIORITY)
   - Filter by: specialization (articulation, fluency, voice, etc.), price, location, availability, language
   - Therapist profiles need: bio, credentials, specializations, success stories, video intro
   - Review system needs: rating, text review, verified booking badge
   - Currently: basic profile + availability, no rich discovery
2. Therapist Onboarding & Verification (HIGH PRIORITY)
   - No credential verification (license, education, certifications)
   - No background check integration
   - No compliance documentation (consent forms, privacy policy)
   - Parents won't trust unverified therapists
3. Payment & Commission Tracking (MEDIUM PRIORITY)
   - No commission calculation (5-10% marketplace fee)
   - No payout system (therapists need to withdraw earnings)
   - No invoice generation
   - Currently: only Kaspi P2P mock
4. Analytics & Insights (MEDIUM PRIORITY)
   - Therapists need: booking trends, revenue forecasts, patient retention metrics
   - Platform needs: marketplace health metrics, therapist performance, churn analysis
   - Currently: basic analytics dashboard, no marketplace-specific metrics
5. Messaging & Notifications (MEDIUM PRIORITY)
   - No in-app messaging between therapist/parent (currently WhatsApp only)
   - No booking confirmation/reminder notifications
   - No review request automation
   - Currently: WhatsApp mock integration
6. Compliance & Trust (MEDIUM PRIORITY)
   - No GDPR/CCPA equivalent for Kazakhstan (Law on Personal Data 2013)
   - No data residency enforcement (medical data must stay in KZ)
   - No consent management for online sessions
   - Currently: audit logging only
---
🎯 Recommendations: Prioritized Action Plan
Phase 1: Simplify Online Sessions (2-3 weeks)
Goal: Remove overengineering, focus on in-person as primary
1. Deprecate Daily.co Integration
   - Remove VideoSession model complexity
   - Replace with simple "session_type" enum: in_person | online | hybrid
   - For online: use free/cheap option (Jitsi, Whereby, or browser-based WebRTC)
   - Or: don't build video at all — let therapists use Zoom/Google Meet, just track it
2. Simplify ActiveSession Component
   - Split: InPersonSession (audio recording) vs OnlineSession (video link)
   - In-person: focus on audio recording + SOAP generation (your strength)
   - Online: just generate a meeting link, don't handle video infrastructure
3. Add Session Type to Appointment
   - appointment.session_type: "in_person" | "online" | "hybrid"
   - Different SOAP templates for online (shorter, focus on parent education)
   - Different pricing for online (lower, since less intensive)
Why: Reduces complexity, aligns with market reality, improves margins
---
Phase 2: Build Marketplace Discovery (4-6 weeks)
Goal: Make therapists discoverable, build network effects
1. Therapist Profile Enrichment
   - Add: specializations (articulation, fluency, voice, stuttering, etc.)
   - Add: credentials (license number, education, certifications)
   - Add: bio, photo, video intro (30-60 sec)
   - Add: languages spoken, age groups served, session types offered
2. Search & Filter
   - Filter by: specialization, price range, location (city), availability, language, online/in-person
   - Sort by: rating, reviews, availability, price
   - Show: next available slot, patient reviews, response time
3. Therapist Verification
   - Add credential verification workflow (upload license, education docs)
   - Add "Verified" badge on profile
   - Add background check integration (optional, for premium tier)
4. Review System Enhancement
   - Require review after session completion
   - Show: rating, text, verified booking badge
   - Therapist response to reviews
   - Review moderation (flag inappropriate reviews)
Why: This is your defensible moat. Doctolib's success is 80% discovery + trust
---
Phase 3: Payment & Payout System (3-4 weeks)
Goal: Enable marketplace transactions, therapist earnings
1. Commission Model
   - Marketplace booking: 5-10% commission (vs profi.kz 25-30%)
   - Direct booking (therapist's own patients): 0% commission
   - Subscription: 9,900-19,900 KZT/month (covers practice management)
2. Payout System
   - Therapist earnings dashboard (total, pending, paid)
   - Weekly/monthly payout to Kaspi account
   - Invoice generation for tax compliance
   - Transaction history
3. Payment Processing
   - Kaspi Pay integration (real, not mock)
   - Parent pays → Platform holds → Therapist gets payout after session
   - Refund handling (cancellation, no-show)
Why: Therapists need to see ROI. Payout system = trust + retention
---
Phase 4: Marketplace Analytics (2-3 weeks)
Goal: Give therapists insights, help them optimize
1. Therapist Dashboard
   - Booking trends (weekly/monthly)
   - Revenue forecast
   - Patient retention rate
   - Average rating
   - Response time to bookings
2. Platform Analytics
   - Total therapists, patients, bookings
   - Marketplace health (growth, churn, NPS)
   - Top specializations, locations
   - Pricing trends
Why: Data-driven therapists stay longer, optimize pricing, refer others
---
💡 Surprising Opportunities
1. Homework Video Recording (Quick Win)
Parents record homework at home, therapist reviews asynchronously. This is:
- Easier than online sessions (no real-time video)
- More clinically useful (therapist sees real-world performance)
- Lower bandwidth (async, not live)
- Differentiator vs competitors
Implementation: Add homework_video_url to HomeworkAssignment, simple video upload
2. Therapist Marketplace as Acquisition Channel (Long-term)
- Therapists join for practice management
- Marketplace drives patient acquisition
- Patients stay for homework tracking + progress visibility
- Creates flywheel: therapist → patient → review → more bookings
This is how you scale without paid ads
3. Specialization-Based Pricing (Revenue Opportunity)
- Articulation therapy: 5,000-8,000 KZT (common, competitive)
- Fluency/stuttering: 8,000-12,000 KZT (specialized, higher price)
- Voice/resonance: 10,000-15,000 KZT (rare, premium)
- Your marketplace can show this pricing variation → therapists optimize
4. Parent Community Features (Retention)
- Parent groups by specialization (articulation, fluency, etc.)
- Homework tips, progress stories
- Peer support (parents helping parents)
- Drives engagement, reduces churn
---
📊 Summary: What to Do
Area	Current State	Problem	Action
Online Sessions	Full Daily.co mock	Overengineered, expensive, 20% use case	Simplify to session_type enum, use free WebRTC or Jitsi
Marketplace	Basic profiles + availability	No discovery, no trust signals	Build rich profiles, search filters, verification
Payment	Kaspi mock	No real transactions	Integrate real Kaspi Pay, add payout system
Analytics	Basic dashboard	No marketplace metrics	Add therapist insights, platform health metrics
Messaging	WhatsApp mock	No in-app communication	Add in-app messaging, booking notifications
Compliance	Audit logging only	No credential verification	Add verification workflow, consent management
---
🎁 The Surprise
Your real competitive advantage isn't the AI SOAP generation — it's the marketplace + practice management combination.
Doctolib proved this works. You have:
- ✅ Practice management (calendar, patients, notes, homework)
- ✅ Parent portal (homework, progress, payments)
- ✅ Marketplace foundation (profiles, reviews, bookings)
- ✅ Localization (Russian + Kazakh)
- ✅ Market timing (no competitor in KZ)
What you need:
- 🔧 Simplify online sessions (remove bloat)
- 🔍 Build marketplace discovery (search, filters, verification)
- 💳 Real payment + payout system
- 📈 Marketplace analytics
If you nail this, you own the speech therapy market in Kazakhstan. Therapists get patient acquisition without profi.kz's 25-30% commission. Parents get continuity. You get network effects.
The online sessions? Keep them simple. They're 20% of the use case, not the core.