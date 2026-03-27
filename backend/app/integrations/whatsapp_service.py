"""WhatsApp Business API integration via Meta Cloud API with mock fallback.

Notes on WhatsApp Business API messaging rules:
- Text messages (free-form) can only be sent within a 24-hour conversation window
  that starts when the USER messages the business first.
- To send messages OUTSIDE the 24h window (e.g. reminders, notifications),
  you must use pre-approved MESSAGE TEMPLATES.
- Template messages cost ~$0.02-0.05 per conversation.
- First 1,000 conversations/month are free.
- Templates must be created and approved in WhatsApp Manager:
  https://business.facebook.com/wa/manage/message-templates/
"""

import httpx
import logging
from app.core.config import settings
from app.integrations.mock_services import WhatsAppMock

logger = logging.getLogger(__name__)


class WhatsAppService:
    """Meta Cloud API client for WhatsApp Business. Falls back to mock when token is empty."""

    BASE_URL = "https://graph.facebook.com/v22.0"

    def __init__(self):
        self.token = getattr(settings, "WHATSAPP_API_TOKEN", "")
        self.phone_number_id = getattr(settings, "WHATSAPP_PHONE_NUMBER_ID", "")
        self.is_configured = bool(self.token and self.phone_number_id)

        if self.is_configured:
            logger.info(
                f"WhatsApp service configured with phone ID: {self.phone_number_id}"
            )
        else:
            logger.warning("WhatsApp service not configured - using mock")

    async def _send_request(self, payload: dict) -> bool:
        """Send a request to the WhatsApp Cloud API."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/{self.phone_number_id}/messages",
                    headers={
                        "Authorization": f"Bearer {self.token}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=10.0,
                )

                if response.status_code == 200:
                    logger.info(f"WhatsApp message sent: {payload.get('to')}")
                    return True
                else:
                    logger.error(
                        f"WhatsApp API error: {response.status_code} - {response.text}"
                    )
                    return False

        except Exception as e:
            logger.error(f"WhatsApp send failed: {str(e)}")
            return False

    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone number to digits only (E.164 without +)."""
        return (
            phone.replace(" ", "")
            .replace("+", "")
            .replace("-", "")
            .replace("(", "")
            .replace(")", "")
        )

    async def send_text_message(self, phone: str, message: str) -> bool:
        """Send a free-form text message. Only works within 24h conversation window."""
        if not self.is_configured:
            return await WhatsAppMock.send_message(phone, message)

        return await self._send_request(
            {
                "messaging_product": "whatsapp",
                "to": self._normalize_phone(phone),
                "type": "text",
                "text": {"body": message},
            }
        )

    async def send_template_message(
        self,
        phone: str,
        template_name: str,
        language: str = "ru",
        parameters: list[str] | None = None,
    ) -> bool:
        """Send a pre-approved template message. Works outside 24h window.

        Templates must be created in WhatsApp Manager first.
        """
        if not self.is_configured:
            params_str = ", ".join(parameters) if parameters else ""
            return await WhatsAppMock.send_message(
                phone, f"[Template: {template_name}] {params_str}"
            )

        template_payload: dict = {
            "name": template_name,
            "language": {"code": language},
        }

        # Add template parameters if provided
        if parameters:
            template_payload["components"] = [
                {
                    "type": "body",
                    "parameters": [{"type": "text", "text": p} for p in parameters],
                }
            ]

        return await self._send_request(
            {
                "messaging_product": "whatsapp",
                "to": self._normalize_phone(phone),
                "type": "template",
                "template": template_payload,
            }
        )

    # --- Convenience methods ---

    async def send_otp(self, phone: str, code: str) -> bool:
        """Send OTP code. Uses text message (parent initiates login, so within 24h window)."""
        message = f"Ваш код для входа в Asyl AI: {code}\n\nКод действителен 5 минут."
        return await self.send_text_message(phone, message)

    async def send_homework(self, phone: str, patient_name: str, homework: str) -> bool:
        """Send homework to parent. Uses text (therapist sends right after session)."""
        message = f"Домашнее задание для {patient_name}:\n\n{homework}\n\n— Asyl AI"
        return await self.send_text_message(phone, message)

    async def send_appointment_reminder(
        self, phone: str, patient_name: str, date_str: str, therapist_name: str
    ) -> bool:
        """Send appointment reminder. Uses template (works outside 24h window).
        Falls back to text message if template fails."""
        # Try template first (works outside 24h window)
        result = await self.send_template_message(
            phone,
            template_name="appointment_reminder",
            language="ru",
            parameters=[patient_name, date_str, therapist_name],
        )
        if result:
            return True

        # Fallback to text (only works within 24h window)
        logger.warning(f"Template failed for {phone}, falling back to text message")
        message = (
            f"Напоминание: сеанс для {patient_name}\n"
            f"Дата: {date_str}\n"
            f"Специалист: {therapist_name}\n\n— Asyl AI"
        )
        return await self.send_text_message(phone, message)

    async def send_homework_reminder(
        self, phone: str, patient_name: str, due_date_str: str
    ) -> bool:
        """Send homework reminder. Uses template (works outside 24h window).
        Falls back to text message if template fails."""
        # Try template first
        result = await self.send_template_message(
            phone,
            template_name="homework_reminder",
            language="ru",
            parameters=[patient_name, due_date_str],
        )
        if result:
            return True

        # Fallback to text
        logger.warning(f"Template failed for {phone}, falling back to text message")
        message = (
            f"Напоминание: домашнее задание для {patient_name} "
            f"нужно выполнить до {due_date_str}\n\n— Asyl AI"
        )
        return await self.send_text_message(phone, message)


whatsapp_service = WhatsAppService()


# --- Module-level convenience functions ---


async def send_appointment_reminder(
    phone: str, patient_name: str, appointment_time, reminder_type: str
) -> bool:
    """Send appointment reminder via template."""
    time_str = appointment_time.strftime("%d.%m.%Y %H:%M") if appointment_time else "—"
    therapist_name = "Ваш специалист"
    return await whatsapp_service.send_appointment_reminder(
        phone, patient_name, time_str, therapist_name
    )


async def send_homework_reminder_msg(phone: str, patient_name: str, due_date) -> bool:
    """Send homework due reminder via template."""
    date_str = due_date.strftime("%d.%m.%Y") if due_date else "скоро"
    return await whatsapp_service.send_homework_reminder(phone, patient_name, date_str)
