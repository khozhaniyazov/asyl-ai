"""Quick test script for WhatsApp Business API integration.

Usage:
    python scripts/test_whatsapp.py +77001234567

Replace with your verified test phone number.
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.integrations.whatsapp_service import whatsapp_service


async def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_whatsapp.py +77001234567")
        print("Make sure the phone number is verified in Meta's test recipients list.")
        sys.exit(1)

    phone = sys.argv[1]

    print(f"WhatsApp configured: {whatsapp_service.is_configured}")
    print(f"Phone Number ID: {whatsapp_service.phone_number_id}")
    print(f"Token present: {'Yes' if whatsapp_service.token else 'No'}")
    print(f"---")
    print(f"Sending test message to {phone}...")

    result = await whatsapp_service.send_text_message(
        phone, "Тестовое сообщение от Sandar. WhatsApp интеграция работает!"
    )

    if result:
        print("Message sent successfully! Check your WhatsApp.")
    else:
        print("Failed to send message. Check the logs above for errors.")


if __name__ == "__main__":
    asyncio.run(main())
