"""Kaspi Pay API integration with mock fallback."""

import httpx
from app.core.config import settings
from app.integrations.mock_services import KaspiMock


class KaspiPayService:
    """Real Kaspi Pay merchant API client. Falls back to mock when credentials are empty."""

    BASE_URL = "https://kaspi.kz/api/merchant"

    def __init__(self):
        self.merchant_id = getattr(settings, "KASPI_MERCHANT_ID", "")
        self.api_key = getattr(settings, "KASPI_API_KEY", "")
        self.is_configured = bool(self.merchant_id and self.api_key)

    async def generate_payment_link(
        self,
        amount: int,
        appointment_id: int,
        description: str = "Логопедический сеанс",
    ) -> str:
        if not self.is_configured:
            return await KaspiMock.generate_payment_link(amount, appointment_id)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/payments/create",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "merchant_id": self.merchant_id,
                    "amount": amount,
                    "currency": "KZT",
                    "description": description,
                    "external_id": f"apt-{appointment_id}",
                    "return_url": f"{getattr(settings, 'FRONTEND_URL', 'http://localhost')}/",
                },
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("payment_url", f"https://kaspi.kz/pay?id={appointment_id}")

    async def check_payment_status(self, payment_id: str) -> dict:
        if not self.is_configured:
            return {"status": "completed", "payment_id": payment_id}

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/payments/{payment_id}/status",
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=10.0,
            )
            response.raise_for_status()
            return response.json()


kaspi_service = KaspiPayService()
