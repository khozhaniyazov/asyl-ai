import asyncio
import hashlib
from datetime import datetime, timedelta, timezone
from sqlalchemy import update
from app.core.database import AsyncSessionLocal
from app.models.parent import Parent

def hash_otp(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()

async def set_otp():
    async with AsyncSessionLocal() as session:
        code = "123456"
        h = hash_otp(code)
        expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
        stmt = update(Parent).where(Parent.phone == "+77005556677").values(
            otp_code_hash=h,
            otp_expires_at=expiry,
            otp_attempts=0
        )
        await session.execute(stmt)
        await session.commit()
        print(f"OTP set to {code} for +77005556677, expires at {expiry}")

if __name__ == "__main__":
    asyncio.run(set_otp())
