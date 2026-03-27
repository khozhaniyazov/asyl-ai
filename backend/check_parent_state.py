import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.parent import Parent
from datetime import datetime, timezone

async def check_parent():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Parent).where(Parent.phone == "+77005556677"))
        parent = result.scalars().first()
        if parent:
            print(f"Parent found: {parent.phone}")
            print(f"OTP Hash: {parent.otp_code_hash}")
            print(f"OTP Expires At: {parent.otp_expires_at}")
            print(f"Attempts: {parent.otp_attempts}")
            print(f"Current Time (UTC): {datetime.now(timezone.utc)}")
        else:
            print("Parent not found")

if __name__ == "__main__":
    asyncio.run(check_parent())
