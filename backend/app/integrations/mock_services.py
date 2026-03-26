import asyncio


class KaspiMock:
    @staticmethod
    async def generate_payment_link(amount: int, appointment_id: int) -> str:
        await asyncio.sleep(0.5)
        return f"https://kaspi.kz/pay/logoped?amount={amount}&id={appointment_id}"


class WhatsAppMock:
    @staticmethod
    async def send_message(phone: str, message: str) -> bool:
        await asyncio.sleep(0.5)
        print(f"Mock WhatsApp sent to {phone}: {message}")
        return True
