import google.generativeai as genai
import json
from app.core.config import settings

# Configure the Gemini API globally
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

class GeminiIntegration:
    @staticmethod
    async def generate_content(prompt: str, model_name: str = "gemini-1.5-pro") -> str:
        """
        Sends a prompt to Gemini and returns the response string.
        """
        if not settings.GEMINI_API_KEY:
            # Fallback for dev without key
            return json.dumps({
                "subjective": "Mocked subjective from Gemini",
                "objective": "Mocked objective from Gemini",
                "assessment": "Mocked assessment from Gemini",
                "plan": "Mocked plan from Gemini",
                "homework_for_parents": "Mocked homework from Gemini"
            })
            
        model = genai.GenerativeModel(model_name)
        response = await model.generate_content_async(prompt)
        return response.text
