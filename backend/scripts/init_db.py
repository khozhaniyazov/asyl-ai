"""Create all database tables from SQLAlchemy models.
Used for fresh PostgreSQL deployments where incremental Alembic migrations
(built against SQLite) may fail.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from app.core.database import engine, Base
from app.models import *  # noqa: F401, F403 — import all models to register them


async def init_db():
    async with engine.begin() as conn:
        # create_all is safe — only creates tables that don't exist yet
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created/verified successfully.")


if __name__ == "__main__":
    asyncio.run(init_db())
