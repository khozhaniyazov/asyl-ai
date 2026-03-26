import asyncio
import random
from datetime import datetime, timezone, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.therapist import Therapist
from app.models.therapist_profile import TherapistProfile, VerificationStatus

CITIES = ["Алматы", "Астана", "Шымкент", "Караганда", "Актобе", "Тараз", "Павлодар", "Усть-Каменогорск"]
SPECIALIZATIONS = [
    "dysarthria", "stuttering", "speech_delay", "articulation", 
    "language_delay", "autism_spectrum", "phonological_disorders", 
    "fluency", "voice_disorders", "bilingual_therapy", "alalia"
]

async def mass_seed():
    async with AsyncSessionLocal() as db:
        for i in range(1, 51):
            email = f"expert_{i}@samga.ai"
            # Check if exists
            result = await db.execute(select(Therapist).where(Therapist.email == email))
            if result.scalars().first():
                continue
                
            # Create Therapist
            t = Therapist(
                email=email,
                hashed_password=get_password_hash("test123"),
                full_name=f"Expert Specialist {i}",
                onboarding_completed=True,
            )
            db.add(t)
            await db.flush()
            
            # Create Profile
            profile = TherapistProfile(
                therapist_id=t.id,
                bio=f"Mass-seeded expert profile {i}. Specialized in various speech therapy techniques.",
                specializations=random.sample(SPECIALIZATIONS, random.randint(1, 4)),
                education="Local University, Defectology Department",
                city=random.choice(CITIES),
                languages=["ru", "kk"] if i % 2 == 0 else ["ru"],
                gender="female" if i % 3 != 0 else "male",
                years_of_experience=random.randint(1, 20),
                price_range_min=random.randint(5000, 10000),
                price_range_max=random.randint(11000, 25000),
                online_available=i % 2 == 0,
                is_published=True,
                session_duration=random.choice([30, 45, 60]),
                license_number=f"KZ-MASS-{i:04d}",
                verification_status=random.choice([
                    VerificationStatus.VERIFIED, 
                    VerificationStatus.PENDING, 
                    VerificationStatus.UNVERIFIED
                ]),
                age_groups=random.sample(["children", "adolescents", "adults"], random.randint(1, 2)),
            )
            db.add(profile)
            print(f"+ Seeded specialist {i}: {email}")
            
        await db.commit()
        print("\nMass seed complete: 50 specialists added.")

if __name__ == "__main__":
    asyncio.run(mass_seed())
