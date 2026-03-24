"""WhatsApp Business API integration via Meta Cloud API with mock fallback."""

import httpx
from app.core.config import settings
from app.integrations.mock_services import WhatsAppMock


class WhatsAppService:
    """Meta Cloud API client for WhatsApp Business. Falls back to mock when token is empty."""

    BASE_URL = "https://graph.facebook.com/v18.0"

    def __init__(self):
        self.token = getattr(settings, "WHATSAPP_API_TOKEN", "")
        self.phone_number_id = getattr(settings, "WHATSAPP_PHONE_NUMBER_ID", "")
        self.is_configured = bool(self.token and self.phone_number_id)

    async def send_text_message(self, phone: str, message: str) -> bool:
        if not self.is_configured:
            return await WhatsAppMock.send_message(phone, message)

        normalized = phone.replace(" ", "").replace("+", "").replace("-", "")
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/{self.phone_number_id}/messages",
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Content-Type": "application/json",
                },
                json={
                    "messaging_product": "whatsapp",
                    "to": normalized,
                    "type": "text",
                    "text": {"body": message},
                },
                timeout=10.0,
            )
            return response.status_code == 200

    async def send_otp(self, phone: str, code: str) -> bool:
        message = f"Ваш код для входа в Logoped: {code}"
        return await self.send_text_message(phone, message)

    async def send_homework(self, phone: str, patient_name: str, homework: str) -> bool:
        message = f"Домашнее задание для {patient_name}:\n\n{homework}\n\n— Logoped App"
        return await self.send_text_message(phone, message)

    async def send_appointment_reminder(
        self, phone: str, patient_name: str, date_str: str, therapist_name: str
    ) -> bool:
        message = f"Напоминание: сеанс для {patient_name}\nДата: {date_str}\nСпециалист: {therapist_name}\n\n— Logoped App"
        return await self.send_text_message(phone, message)


whatsapp_service = WhatsAppService()
