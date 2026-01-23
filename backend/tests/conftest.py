import os
import sys

# Set test database URL BEFORE importing any app modules
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Now we can safely import the app modules
from src.db.models.base import Base
# Import all models to ensure they're registered with Base.metadata
from src.db.models import (  # noqa
    User, Organization, OrgMembership, OrgMemberRole,
    Permission, Role, RolePermission, UserRole,
    Policy, AccessRequest, ApprovalAction, AuditLog,
    OrgInvite,
)


# Test database URL - using SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """Create a test engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def test_session_factory(test_engine):
    """Create a session factory for the test database."""
    TestSessionLocal = sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    yield TestSessionLocal


@pytest_asyncio.fixture(scope="function")
async def test_db(test_session_factory):
    """Create a fresh database session for each test."""
    async with test_session_factory() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def client(test_session_factory):
    """Create a test client with the test database."""
    # Import app here to ensure environment is set
    from src.main import app
    from src.db.database import get_db

    # Each request gets a fresh session from the factory
    async def override_get_db():
        async with test_session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient):
    """Register a user and return auth headers."""
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "name": "Test User",
            "password": "testpassword123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    return {"Authorization": f"Bearer {data['tokens']['access_token']}"}


@pytest_asyncio.fixture
async def org_with_auth(client: AsyncClient, auth_headers: dict):
    """Create an organization and return org_id with auth headers."""
    response = await client.post(
        "/api/orgs",
        json={"name": "Test Org", "slug": "test-org"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    org_data = response.json()
    return {"org_id": org_data["id"], "headers": auth_headers}
