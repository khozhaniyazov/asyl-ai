import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.therapist import Therapist
from app.core.security import verify_password


async def check():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Therapist).where(Therapist.email == "admin@samga.ai")
        )
        admin = result.scalars().first()

        if admin:
            print("Admin exists: True")
            print(f"Email: {admin.email}")
            print(f"Is admin: {admin.is_admin}")
            print(f"Has password: {bool(admin.hashed_password)}")
            print(
                f"Password verifies: {verify_password('admin123', admin.hashed_password)}"
            )
        else:
            print("Admin exists: False")


asyncio.run(check())
