import asyncio
import sys
import os
sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal
from app.models.therapist_profile import TherapistProfile
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(TherapistProfile))
        profiles = res.scalars().all()
        for p in profiles:
            print(f"ID: {p.id}, TherapistID: {p.therapist_id}, Published: {p.is_published}, Status: {p.verification_status}, City: {p.city}")

if __name__ == "__main__":
    asyncio.run(check())
