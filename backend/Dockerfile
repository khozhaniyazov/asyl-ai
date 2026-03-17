# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (needed for standard audio processing if real whisper is used later)
RUN apt-get update && apt-get install -y ffmpeg libavcodec-extra && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run migrations and start server
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
