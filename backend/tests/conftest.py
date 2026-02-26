"""Shared fixtures for backend tests."""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import patch

import pytest

from aerospike_py_admin_ui_api.models.connection import ConnectionProfile


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
def tmp_db_path(tmp_path: Path) -> str:
    """Return a temporary database file path."""
    return str(tmp_path / "test_connections.db")


@pytest.fixture()
def init_test_db(tmp_db_path: str):
    """Initialize a temporary database for testing and clean up after.

    Patches config.DATABASE_PATH so that init_db() creates the database
    at the temporary location.
    """
    from aerospike_py_admin_ui_api import db

    with patch("aerospike_py_admin_ui_api.config.DATABASE_PATH", tmp_db_path):
        db.init_db()
        yield tmp_db_path
        db.close_db()
