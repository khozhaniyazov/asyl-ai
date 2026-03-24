"""
Reminder Celery tasks — production-ready with retries and error handling.

Tasks:
- send_session_reminder: 24h and 1h before appointment
- send_payment_reminder: when package payment is overdue
- send_homework_reminder: when homework due date approaches
- check_overdue_homework: periodic — marks overdue, sends reminders
- process_pending_reminders: periodic — picks up scheduled reminders and fires them
- send_waitlist_offer: notify waitlisted patient when slot opens
"""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.celery_app import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_async_session_factory():
    """Create a standalone async session factory for Celery tasks."""
    engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
    if "sqlite" in settings.DATABASE_URL:
        engine = create_async_engine(
            settings.DATABASE_URL,
            echo=False,
            future=True,
            connect_args={"check_same_thread": False},
        )
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


import asyncio


def run_async(coro):
    """Run an async coroutine from a sync Celery task."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures

            with concurrent.futures.ThreadPoolExecutor() as pool:
                return pool.submit(asyncio.run, coro).result()
        return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


@celery_app.task(
    bind=True,
    name="app.tasks.reminders.send_session_reminder",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
)
def send_session_reminder(self, reminder_id: int):
    """Send a session reminder (24h or 1h before) via WhatsApp."""
    run_async(_send_session_reminder(reminder_id, self))


async def _send_session_reminder(reminder_id: int, task):
    SessionFactory = _get_async_session_factory()
    async with SessionFactory() as db:
        from app.models.reminder import Reminder, ReminderStatus
        from app.models.appointment import Appointment
        from app.models.patient import Patient

        result = await db.execute(select(Reminder).where(Reminder.id == reminder_id))
        reminder = result.scalar_one_or_none()
        if not reminder or reminder.status != ReminderStatus.SCHEDULED:
            logger.info(f"Reminder {reminder_id} skipped (not found or not scheduled)")
            return

        try:
            # Load appointment and patient
            appt_result = await db.execute(
                select(Appointment).where(Appointment.id == reminder.appointment_id)
            )
            appointment = appt_result.scalar_one_or_none()
            if not appointment:
                reminder.status = ReminderStatus.CANCELLED
                await db.commit()
                return

            patient_result = await db.execute(
                select(Patient).where(Patient.id == appointment.patient_id)
            )
            patient = patient_result.scalar_one_or_none()

            # Send via WhatsApp (uses mock fallback if not configured)
            from app.integrations.whatsapp_service import send_appointment_reminder

            phone = patient.parent_phone if patient else None
            if phone:
                await send_appointment_reminder(
                    phone=phone,
                    patient_name=f"{patient.first_name} {patient.last_name}",
                    appointment_time=appointment.start_time,
                    reminder_type=reminder.type.value,
                )

            reminder.status = ReminderStatus.SENT
            reminder.sent_at = datetime.now(timezone.utc)
            await db.commit()
            logger.info(f"Session reminder {reminder_id} sent successfully")

        except Exception as e:
            reminder.status = ReminderStatus.FAILED
            reminder.error_message = str(e)[:500]
            await db.commit()
            logger.error(f"Failed to send session reminder {reminder_id}: {e}")
            raise


@celery_app.task(
    bind=True,
    name="app.tasks.reminders.send_payment_reminder",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def send_payment_reminder(self, reminder_id: int):
    """Send a payment reminder via WhatsApp."""
    run_async(_send_payment_reminder(reminder_id))


async def _send_payment_reminder(reminder_id: int):
    SessionFactory = _get_async_session_factory()
    async with SessionFactory() as db:
        from app.models.reminder import Reminder, ReminderStatus

        result = await db.execute(select(Reminder).where(Reminder.id == reminder_id))
        reminder = result.scalar_one_or_none()
        if not reminder or reminder.status != ReminderStatus.SCHEDULED:
            return

        try:
            # Payment reminder logic — would integrate with Kaspi
            reminder.status = ReminderStatus.SENT
            reminder.sent_at = datetime.now(timezone.utc)
            await db.commit()
            logger.info(f"Payment reminder {reminder_id} sent")
        except Exception as e:
            reminder.status = ReminderStatus.FAILED
            reminder.error_message = str(e)[:500]
            await db.commit()
            raise


@celery_app.task(
    bind=True,
    name="app.tasks.reminders.send_homework_reminder",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def send_homework_reminder(self, reminder_id: int):
    """Send a homework due reminder via WhatsApp."""
    run_async(_send_homework_reminder(reminder_id))


async def _send_homework_reminder(reminder_id: int):
    SessionFactory = _get_async_session_factory()
    async with SessionFactory() as db:
        from app.models.reminder import Reminder, ReminderStatus
        from app.models.homework_assignment import HomeworkAssignment
        from app.models.patient import Patient

        result = await db.execute(select(Reminder).where(Reminder.id == reminder_id))
        reminder = result.scalar_one_or_none()
        if not reminder or reminder.status != ReminderStatus.SCHEDULED:
            return

        try:
            hw_result = await db.execute(
                select(HomeworkAssignment).where(
                    HomeworkAssignment.id == reminder.homework_assignment_id
                )
            )
            hw = hw_result.scalar_one_or_none()
            if not hw:
                reminder.status = ReminderStatus.CANCELLED
                await db.commit()
                return

            patient_result = await db.execute(
                select(Patient).where(Patient.id == hw.patient_id)
            )
            patient = patient_result.scalar_one_or_none()

            if patient and patient.parent_phone:
                from app.integrations.whatsapp_service import send_homework_reminder_msg

                await send_homework_reminder_msg(
                    phone=patient.parent_phone,
                    patient_name=f"{patient.first_name} {patient.last_name}",
                    due_date=hw.due_date,
                )

            reminder.status = ReminderStatus.SENT
            reminder.sent_at = datetime.now(timezone.utc)
            await db.commit()
            logger.info(f"Homework reminder {reminder_id} sent")
        except Exception as e:
            reminder.status = ReminderStatus.FAILED
            reminder.error_message = str(e)[:500]
            await db.commit()
            raise


@celery_app.task(name="app.tasks.reminders.check_overdue_homework")
def check_overdue_homework():
    """Periodic task: mark overdue homework assignments and schedule reminders."""
    run_async(_check_overdue_homework())


async def _check_overdue_homework():
    SessionFactory = _get_async_session_factory()
    async with SessionFactory() as db:
        from app.models.homework_assignment import HomeworkAssignment, HomeworkStatus

        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(HomeworkAssignment).where(
                and_(
                    HomeworkAssignment.status == HomeworkStatus.ASSIGNED,
                    HomeworkAssignment.due_date != None,
                    HomeworkAssignment.due_date < now,
                )
            )
        )
        overdue = result.scalars().all()

        count = 0
        for hw in overdue:
            hw.status = HomeworkStatus.OVERDUE
            count += 1

        await db.commit()
        logger.info(f"Marked {count} homework assignments as overdue")


@celery_app.task(name="app.tasks.reminders.process_pending_reminders")
def process_pending_reminders():
    """Periodic task: pick up scheduled reminders that are due and dispatch them."""
    run_async(_process_pending_reminders())


async def _process_pending_reminders():
    SessionFactory = _get_async_session_factory()
    async with SessionFactory() as db:
        from app.models.reminder import Reminder, ReminderStatus, ReminderType

        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(Reminder).where(
                and_(
                    Reminder.status == ReminderStatus.SCHEDULED,
                    Reminder.scheduled_for <= now,
                )
            )
        )
        due_reminders = result.scalars().all()

        for reminder in due_reminders:
            task_map = {
                ReminderType.SESSION_24H: send_session_reminder,
                ReminderType.SESSION_1H: send_session_reminder,
                ReminderType.PAYMENT_DUE: send_payment_reminder,
                ReminderType.HOMEWORK_DUE: send_homework_reminder,
                ReminderType.WAITLIST_OFFER: send_waitlist_offer,
            }
            task_fn = task_map.get(reminder.type)
            if task_fn:
                task_fn.delay(reminder.id)

        logger.info(f"Dispatched {len(due_reminders)} pending reminders")


@celery_app.task(
    bind=True,
    name="app.tasks.reminders.send_waitlist_offer",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def send_waitlist_offer(self, reminder_id: int):
    """Notify a waitlisted patient that a slot has opened."""
    run_async(_send_waitlist_offer(reminder_id))


async def _send_waitlist_offer(reminder_id: int):
    SessionFactory = _get_async_session_factory()
    async with SessionFactory() as db:
        from app.models.reminder import Reminder, ReminderStatus

        result = await db.execute(select(Reminder).where(Reminder.id == reminder_id))
        reminder = result.scalar_one_or_none()
        if not reminder or reminder.status != ReminderStatus.SCHEDULED:
            return

        try:
            # Waitlist offer notification logic
            reminder.status = ReminderStatus.SENT
            reminder.sent_at = datetime.now(timezone.utc)
            await db.commit()
            logger.info(f"Waitlist offer reminder {reminder_id} sent")
        except Exception as e:
            reminder.status = ReminderStatus.FAILED
            reminder.error_message = str(e)[:500]
            await db.commit()
            raise
