"""
Celery application factory — production-ready configuration.

Broker: Redis
Result backend: Redis (separate DB)
Serialization: JSON
Retry: exponential backoff, max 3 retries
Task time limits: soft=60s, hard=120s
"""

import os
import sys

# Ensure the backend package is importable when running celery standalone
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from celery import Celery
from celery.schedules import crontab

from app.core.config import settings


celery_app = Celery(
    "asyl_ai",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

# --- Serialization ---
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Almaty",
    enable_utc=True,
)

# --- Reliability ---
celery_app.conf.update(
    task_acks_late=True,  # ack after execution, not before
    worker_prefetch_multiplier=1,  # one task at a time per worker
    task_reject_on_worker_lost=True,  # requeue if worker dies mid-task
    task_soft_time_limit=60,  # soft limit: 60s
    task_time_limit=120,  # hard kill: 120s
    task_default_retry_delay=60,  # first retry after 60s
    task_max_retries=3,  # max 3 retries
    broker_connection_retry_on_startup=True,
)

# --- Result backend ---
celery_app.conf.update(
    result_expires=3600,  # results expire after 1 hour
    result_backend_transport_options={
        "retry_policy": {
            "timeout": 5.0,
        }
    },
)

# --- Task routing ---
celery_app.conf.task_routes = {
    "app.tasks.reminders.*": {"queue": "reminders"},
    "app.tasks.notifications.*": {"queue": "notifications"},
}

# --- Dead letter queue ---
celery_app.conf.task_default_queue = "default"

# --- Periodic tasks (Celery Beat) ---
celery_app.conf.beat_schedule = {
    "check-overdue-homework-every-hour": {
        "task": "app.tasks.reminders.check_overdue_homework",
        "schedule": crontab(minute=0),  # every hour on the hour
    },
    "process-pending-reminders-every-5-min": {
        "task": "app.tasks.reminders.process_pending_reminders",
        "schedule": 300.0,  # every 5 minutes
    },
}

# --- Auto-discover tasks ---
celery_app.autodiscover_tasks(["app.tasks"])
