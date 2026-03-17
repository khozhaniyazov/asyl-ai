import os
import json
from app.integrations.gemini import GeminiIntegration

class LLMService:
    @staticmethod
    def _load_prompt_template() -> str:
        # Load from backend/prompts/soap_generator.md
        prompt_path = os.path.join(os.path.dirname(__file__), "..", "..", "prompts", "soap_generator.md")
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()

    @staticmethod
    async def generate_soap_note(patient_diagnosis: str, previous_plan: str, raw_transcript: str) -> dict:
        """
        Reads the markdown prompt, injects variables, and calls Gemini.
        """
        template = LLMService._load_prompt_template()
        
        # Inject variables
        prompt = template.replace("{{patient_diagnosis}}", patient_diagnosis or "Not specified")
        prompt = prompt.replace("{{previous_plan}}", previous_plan or "None")
        prompt = prompt.replace("{{raw_transcript}}", raw_transcript)
        
        # Call Gemini
        response_text = await GeminiIntegration.generate_content(prompt)
        
        # Strip potential markdown code blocks (e.g. ```json ... ```)
        clean_json_str = response_text.strip()
        if clean_json_str.startswith("```json"):
            clean_json_str = clean_json_str[7:]
        elif clean_json_str.startswith("```"):
            clean_json_str = clean_json_str[3:]
        if clean_json_str.endswith("```"):
            clean_json_str = clean_json_str[:-3]
            
        clean_json_str = clean_json_str.strip()
        
        try:
            return json.loads(clean_json_str)
        except json.JSONDecodeError:
            # Fallback if AI fails to return strict JSON
            return {
                "subjective": "Error parsing JSON",
                "objective": "Error parsing JSON",
                "assessment": "Error parsing JSON",
                "plan": "Error parsing JSON",
                "homework_for_parents": "Error parsing JSON",
                "raw_response": response_text
            }
