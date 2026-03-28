"""Create all database tables from SQLAlchemy models.
Used for fresh PostgreSQL deployments where incremental Alembic migrations
(built against SQLite) may fail.
"""

import asyncio
from app.core.database import engine, Base
from app.models import *  # noqa: F401, F403 — import all models to register them


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully.")


if __name__ == "__main__":
    asyncio.run(init_db())
