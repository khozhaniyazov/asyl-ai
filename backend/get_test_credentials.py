import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.therapist import Therapist
from app.models.parent import Parent

async def get_test_users():
    async with AsyncSessionLocal() as session:
        # Get last therapist
        therapist_stmt = select(Therapist).order_by(Therapist.id.desc()).limit(1)
        therapist_result = await session.execute(therapist_stmt)
        therapist = therapist_result.scalar_one_or_none()
        
        # Get last parent
        parent_stmt = select(Parent).order_by(Parent.id.desc()).limit(1)
        parent_result = await session.execute(parent_stmt)
        parent = parent_result.scalar_one_or_none()
        
        print(f"Therapist: {therapist.email if therapist else 'None'}")
        print(f"Parent: {parent.phone if parent else 'None'}")

if __name__ == "__main__":
    asyncio.run(get_test_users())
