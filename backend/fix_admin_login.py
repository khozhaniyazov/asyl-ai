"""Test actual login with admin credentials"""

import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.therapist import Therapist
from app.core.security import verify_password, get_password_hash


async def fix_admin():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Therapist).where(Therapist.email == "admin@samga.ai")
        )
        admin = result.scalars().first()

        if not admin:
            print("Creating admin user...")
            admin = Therapist(
                email="admin@samga.ai",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin User",
                clinic_name="Samga AI",
                is_admin=True,
                onboarding_completed=True,
            )
            db.add(admin)
            await db.commit()
            print("Admin created")
        else:
            # Force reset password and admin flag
            admin.hashed_password = get_password_hash("admin123")
            admin.is_admin = True
            admin.onboarding_completed = True
            await db.commit()
            print("Admin password and flags reset")

        # Verify
        await db.refresh(admin)
        print(f"Email: {admin.email}")
        print(f"Is admin: {admin.is_admin}")
        print(
            f"Password verifies: {verify_password('admin123', admin.hashed_password)}"
        )


asyncio.run(fix_admin())
