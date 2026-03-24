#!/usr/bin/env python
"""
Celery worker entrypoint.

Usage:
    celery -A celery_worker.celery_app worker --loglevel=info -Q default,reminders,notifications
    celery -A celery_worker.celery_app beat --loglevel=info
"""

from app.celery_app import celery_app  # noqa: F401

# Import tasks so they are registered
import app.tasks  # noqa: F401
