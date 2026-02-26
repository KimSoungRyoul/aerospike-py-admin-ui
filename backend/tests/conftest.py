"""Shared fixtures for backend tests."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import patch

import pytest
from testcontainers.postgres import PostgresContainer

from aerospike_py_admin_ui_api.models.connection import ConnectionProfile


@pytest.fixture(scope="session")
def postgres_url() -> str:
    """Start a PostgreSQL container once per test session and return its URL."""
    with PostgresContainer("postgres:17-alpine") as pg:
        url = pg.get_connection_url()
        # testcontainers returns psycopg2-style URL; convert to asyncpg format
        yield url.replace("postgresql+psycopg2://", "postgresql://")


@pytest.fixture()
def sample_connection() -> ConnectionProfile:
    """Return a sample ConnectionProfile for testing."""
    now = datetime.now(UTC).isoformat()
    return ConnectionProfile(
        id="conn-test-1",
        name="Test Aerospike",
        hosts=["localhost"],
        port=3000,
        clusterName="test-cluster",
        username=None,
        password=None,
        color="#0097D3",
        createdAt=now,
        updatedAt=now,
    )


@pytest.fixture()
async def init_test_db(postgres_url: str):
    """Initialize a temporary database for testing and clean up after.

    Patches config.DATABASE_URL so that init_db() connects to the
    testcontainers PostgreSQL instance.
    """
    from aerospike_py_admin_ui_api import db

    with patch("aerospike_py_admin_ui_api.config.DATABASE_URL", postgres_url):
        await db.init_db()
        yield postgres_url
        # Clean up: drop all rows so each test starts fresh
        if db._pool is not None:
            await db._pool.execute("DELETE FROM connections")
            await db.close_db()
