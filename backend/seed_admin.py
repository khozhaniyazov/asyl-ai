"""Seed default admin user: admin@samga.ai / admin123"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.therapist import Therapist
from app.core.security import get_password_hash


async def seed_admin():
    async with AsyncSessionLocal() as db:
        # Check if admin exists
        result = await db.execute(
            select(Therapist).where(Therapist.email == "admin@samga.ai")
        )
        existing = result.scalars().first()

        if existing:
            print("Admin user already exists")
            if not existing.is_admin:
                existing.is_admin = True
                await db.commit()
                print("Updated existing user to admin")
            return

        # Create admin
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
        print("Created admin user: admin@samga.ai / admin123")


if __name__ == "__main__":
    asyncio.run(seed_admin())
