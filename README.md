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

## Deploy to Fly.io (Free Tier)

### Prerequisites
- [Fly CLI installed](https://fly.io/docs/flyctl/install/)
- `flyctl auth login`

### 1. Deploy Backend
```bash
cd backend

# Create the app (if first time)
fly apps create asyl-ai-backend

# Launch the app with persistent volume
fly launch --no-deploy

# Create persistent volume for SQLite database
fly volumes create asyl_data --size 1

# Set required secrets
fly secrets set GEMINI_API_KEY=your_gemini_api_key
fly secrets set SECRET_KEY=your-secure-random-secret

# Deploy
fly deploy
```

### 2. Deploy Frontend
```bash
cd frontend

# Create the app (if first time)
fly apps create asyl-ai-frontend

# Update nginx.conf with your backend URL
# Edit frontend/nginx.conf line 16: set $backend "https://asyl-ai-backend.fly.dev";

# Deploy
fly deploy
```

### 3. Get URLs
```bash
fly apps list
fly status -a asyl-ai-backend
fly status -a asyl-ai-frontend
```

Your app will be live at: `https://asyl-ai-frontend.fly.dev`

### Free Tier Limits
- 3 shared VMs (160GB bandwidth/month)
- 1GB persistent volume for database
- No sleep - scales to 0 automatically when idle