"""Tests for aerospike_py_admin_ui_api.db module.

Uses a temporary SQLite database to test CRUD operations on connection profiles.
"""

from __future__ import annotations

import sqlite3
from datetime import UTC, datetime

import pytest

from aerospike_py_admin_ui_api import db
from aerospike_py_admin_ui_api.models.connection import ConnectionProfile

# ---- Sync helpers (testing the _*_sync functions directly) ------------------


class TestInitDb:
    def test_init_creates_table(self, init_test_db):
        """init_db() should create the connections table."""
        conn = db._get_conn()
        cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='connections'")
        assert cur.fetchone() is not None

    def test_init_seeds_default_connection(self, init_test_db):
        """init_db() should seed a default connection if the table is empty."""
        profiles = db._get_all_sync()
        assert len(profiles) >= 1
        assert any(p.id == "conn-default" for p in profiles)

    def test_seed_only_runs_once(self, init_test_db):
        """Calling init_db() again should not duplicate the seed data."""
        # The seed only runs when count == 0; it was already called in init_test_db.
        initial = db._get_all_sync()
        # Calling _seed_if_empty again should be a no-op.
        db._seed_if_empty()
        after = db._get_all_sync()
        assert len(after) == len(initial)


class TestGetAllSync:
    def test_returns_list(self, init_test_db):
        result = db._get_all_sync()
        assert isinstance(result, list)
        for item in result:
            assert isinstance(item, ConnectionProfile)

    def test_ordered_by_created_at(self, init_test_db, sample_connection):
        """Connections should come back ordered by created_at."""
        # Insert a connection with a later timestamp.
        later = ConnectionProfile(
            id="conn-later",
            name="Later Connection",
            hosts=["10.0.0.1"],
            port=3000,
            color="#FF0000",
            createdAt="2099-01-01T00:00:00+00:00",
            updatedAt="2099-01-01T00:00:00+00:00",
        )
        db._insert_sync(later)

        all_profiles = db._get_all_sync()
        ids = [p.id for p in all_profiles]
        assert ids.index("conn-default") < ids.index("conn-later")


class TestGetOneSync:
    def test_existing(self, init_test_db):
        result = db._get_one_sync("conn-default")
        assert result is not None
        assert result.id == "conn-default"
        assert result.name == "Default Aerospike"

    def test_not_found(self, init_test_db):
        result = db._get_one_sync("nonexistent-id")
        assert result is None


class TestInsertSync:
    def test_insert_and_retrieve(self, init_test_db, sample_connection):
        db._insert_sync(sample_connection)

        retrieved = db._get_one_sync(sample_connection.id)
        assert retrieved is not None
        assert retrieved.id == sample_connection.id
        assert retrieved.name == sample_connection.name
        assert retrieved.hosts == sample_connection.hosts
        assert retrieved.port == sample_connection.port
        assert retrieved.color == sample_connection.color

    def test_insert_preserves_optional_fields(self, init_test_db):
        now = datetime.now(UTC).isoformat()
        conn = ConnectionProfile(
            id="conn-full",
            name="Full Connection",
            hosts=["10.0.0.1", "10.0.0.2"],
            port=4000,
            clusterName="my-cluster",
            username="admin",
            password="secret",
            color="#AABBCC",
            createdAt=now,
            updatedAt=now,
        )
        db._insert_sync(conn)

        retrieved = db._get_one_sync("conn-full")
        assert retrieved is not None
        assert retrieved.clusterName == "my-cluster"
        assert retrieved.username == "admin"
        assert retrieved.password == "secret"
        assert retrieved.hosts == ["10.0.0.1", "10.0.0.2"]

    def test_insert_duplicate_id_raises(self, init_test_db, sample_connection):
        db._insert_sync(sample_connection)
        with pytest.raises(sqlite3.IntegrityError):
            db._insert_sync(sample_connection)


class TestUpdateSync:
    def test_update_name(self, init_test_db, sample_connection):
        db._insert_sync(sample_connection)

        updated = db._update_sync(sample_connection.id, {"name": "Updated Name"})
        assert updated is not None
        assert updated.name == "Updated Name"
        # Other fields should be preserved.
        assert updated.hosts == sample_connection.hosts
        assert updated.port == sample_connection.port

    def test_update_multiple_fields(self, init_test_db, sample_connection):
        db._insert_sync(sample_connection)

        updated = db._update_sync(
            sample_connection.id,
            {"name": "New Name", "port": 4000, "color": "#FF0000"},
        )
        assert updated is not None
        assert updated.name == "New Name"
        assert updated.port == 4000
        assert updated.color == "#FF0000"

    def test_update_sets_updated_at(self, init_test_db, sample_connection):
        db._insert_sync(sample_connection)
        original_updated_at = sample_connection.updatedAt

        updated = db._update_sync(sample_connection.id, {"name": "Changed"})
        assert updated is not None
        assert updated.updatedAt != original_updated_at

    def test_update_nonexistent_returns_none(self, init_test_db):
        result = db._update_sync("does-not-exist", {"name": "Nope"})
        assert result is None

    def test_update_preserves_id(self, init_test_db, sample_connection):
        """Attempting to change the id via data dict should be overridden."""
        db._insert_sync(sample_connection)

        updated = db._update_sync(sample_connection.id, {"id": "hacked", "name": "Same"})
        assert updated is not None
        assert updated.id == sample_connection.id


class TestDeleteSync:
    def test_delete_existing(self, init_test_db, sample_connection):
        db._insert_sync(sample_connection)
        assert db._get_one_sync(sample_connection.id) is not None

        deleted = db._delete_sync(sample_connection.id)
        assert deleted is True
        assert db._get_one_sync(sample_connection.id) is None

    def test_delete_nonexistent(self, init_test_db):
        deleted = db._delete_sync("no-such-id")
        assert deleted is False

    def test_delete_does_not_affect_others(self, init_test_db, sample_connection):
        db._insert_sync(sample_connection)

        # Delete the sample, not the default seed.
        db._delete_sync(sample_connection.id)

        remaining = db._get_all_sync()
        assert any(p.id == "conn-default" for p in remaining)


# ---- Async public API -------------------------------------------------------


@pytest.mark.asyncio
class TestAsyncApi:
    async def test_get_all_connections(self, init_test_db):
        result = await db.get_all_connections()
        assert isinstance(result, list)
        assert len(result) >= 1

    async def test_get_connection_existing(self, init_test_db):
        result = await db.get_connection("conn-default")
        assert result is not None
        assert result.id == "conn-default"

    async def test_get_connection_not_found(self, init_test_db):
        result = await db.get_connection("nonexistent")
        assert result is None

    async def test_create_and_get(self, init_test_db, sample_connection):
        await db.create_connection(sample_connection)
        result = await db.get_connection(sample_connection.id)
        assert result is not None
        assert result.name == sample_connection.name

    async def test_update_connection(self, init_test_db, sample_connection):
        await db.create_connection(sample_connection)
        updated = await db.update_connection(sample_connection.id, {"name": "Async Updated"})
        assert updated is not None
        assert updated.name == "Async Updated"

    async def test_update_nonexistent(self, init_test_db):
        result = await db.update_connection("ghost", {"name": "X"})
        assert result is None

    async def test_delete_connection(self, init_test_db, sample_connection):
        await db.create_connection(sample_connection)
        deleted = await db.delete_connection(sample_connection.id)
        assert deleted is True

        result = await db.get_connection(sample_connection.id)
        assert result is None

    async def test_delete_nonexistent(self, init_test_db):
        deleted = await db.delete_connection("ghost")
        assert deleted is False


class TestCloseDb:
    def test_close_sets_connection_to_none(self, init_test_db):
        # After init_test_db, the module-level _connection is set.
        assert db._connection is not None
        db.close_db()
        assert db._connection is None

    def test_close_when_already_closed(self):
        """Calling close_db() when already closed should not raise."""
        db._connection = None
        db.close_db()  # Should be a no-op.
        assert db._connection is None


class TestGetConnWithoutInit:
    def test_raises_runtime_error(self):
        """_get_conn() should raise if init_db() was never called."""
        # Save and clear the module-level connection.
        original = db._connection
        db._connection = None
        try:
            with pytest.raises(RuntimeError, match="Database not initialized"):
                db._get_conn()
        finally:
            db._connection = original
