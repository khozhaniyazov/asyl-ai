# Asyl AI - Logoped SaaS

A specialized B2B/B2C SaaS platform designed for speech therapists (logopedists/defectologists) in Kazakhstan to manage their clinics and automate the generation of SOAP medical notes using AI.

## Architecture
- **Backend:** Python, FastAPI, SQLAlchemy, SQLite (Async), Alembic, Pytest.
- **Frontend:** React, Vite, TailwindCSS.
- **AI Integrations:** Gemini Pro (for Markdown-driven SOAP generation), Whisper (mocked for audio transcription).
- **Other Integrations:** Kaspi Pay (mocked for payment links), WhatsApp Business (mocked for notifications).

## Quick Start (Docker)
The easiest way to run the entire stack is using Docker Compose.

1. Create an `.env` file in the root directory:
   ```bash
   GEMINI_API_KEY=your_actual_gemini_key_here
   SECRET_KEY=your_secure_jwt_secret
   ```

2. Build and run the containers:
   ```bash
   docker-compose up -d --build
   ```

3. Access the applications:
   - **Frontend:** http://localhost
   - **Backend API & Swagger Docs:** http://localhost:8000/docs

## Manual Development Setup

### Backend
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows
source .venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Running Tests
```bash
cd backend
pytest -v
```