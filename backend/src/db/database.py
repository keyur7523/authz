from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from src.config import settings

# SQLite (tests) rejects queue-pool settings
_pool_args = {} if settings.ASYNC_DATABASE_URL.startswith("sqlite") else dict(
    pool_size=5, max_overflow=10, pool_recycle=300, pool_pre_ping=True, pool_timeout=30
)

engine = create_async_engine(settings.ASYNC_DATABASE_URL, echo=False, **_pool_args)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
