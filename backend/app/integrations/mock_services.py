import asyncio

class WhisperMock:
    @staticmethod
    async def transcribe(audio_bytes: bytes) -> str:
        # Simulate network delay
        await asyncio.sleep(1)
        return "Мама жалуется, что ребенок не выговаривает букву Р. Мы делали упражнения на моторику. Получалось неплохо. Звук Р пока не поставлен. На следующий раз будем продолжать делать упражнение грибок. Домашнее задание: делать артикуляционную гимнастику 10 минут каждый день."

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
