
import asyncio
from app.core.database import SessionLocal
from app.models.user import User
from sqlalchemy import select

async def get_last_user():
    async with SessionLocal() as session:
        result = await session.execute(select(User).order_by(User.id.desc()).limit(1))
        user = result.scalar_one_or_none()
        if user:
            print(f"LAST_USER_EMAIL: {user.email}")
            print(f"LAST_USER_NAME: {user.full_name}")
        else:
            print("No user found")

if __name__ == "__main__":
    asyncio.run(get_last_user())
