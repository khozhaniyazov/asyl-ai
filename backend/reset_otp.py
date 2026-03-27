import asyncio
from sqlalchemy import update
from app.core.database import AsyncSessionLocal
from app.models.parent import Parent

async def reset_otp_attempts():
    async with AsyncSessionLocal() as session:
        stmt = update(Parent).where(Parent.phone == "+77005556677").values(otp_attempts=0)
        await session.execute(stmt)
        await session.commit()
        print("OTP attempts reset for +77005556677")

if __name__ == "__main__":
    asyncio.run(reset_otp_attempts())
