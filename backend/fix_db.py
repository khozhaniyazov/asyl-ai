import asyncio
import sys
import os
sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal
from app.models.therapist_profile import TherapistProfile, VerificationStatus
from app.models.therapist import Therapist
from app.core.security import get_password_hash
from sqlalchemy import select, update

async def fix():
    async with AsyncSessionLocal() as db:
        # 1. Publish all profiles
        await db.execute(update(TherapistProfile).values(is_published=True))
        
        # 2. Ensure we have an admin user
        res = await db.execute(select(Therapist).where(Therapist.email == "admin@samga.ai"))
        admin = res.scalars().first()
        if not admin:
            admin = Therapist(
                full_name="Admin",
                email="admin@samga.ai",
                hashed_password=get_password_hash("admin123"),
                is_admin=True
            )
            db.add(admin)
        else:
            admin.is_admin = True
            admin.hashed_password = get_password_hash("admin123")
        
        await db.commit()
        print("Updated profiles to Published=True and ensured admin@samga.ai (pass: admin123) is admin.")

if __name__ == "__main__":
    asyncio.run(fix())
