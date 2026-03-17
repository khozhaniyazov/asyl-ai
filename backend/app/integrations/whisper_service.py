import asyncio
from app.core.config import settings
import io

# Try to import OpenAI, fallback to None if not installed or configured
try:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
except ImportError:
    client = None

class WhisperService:
    @staticmethod
    async def transcribe(audio_bytes: bytes) -> str:
        if not client:
            # Fallback to mock if API key is not provided
            await asyncio.sleep(1)
            return "Мама жалуется, что ребенок не выговаривает букву Р. Мы делали упражнения на моторику. Получалось неплохо. Звук Р пока не поставлен. На следующий раз будем продолжать делать упражнение грибок. Домашнее задание: делать артикуляционную гимнастику 10 минут каждый день."

        # Real OpenAI Whisper call
        # OpenAI requires a file-like object with a name attribute
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "audio.webm" 
        
        response = await client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
        return response.text
