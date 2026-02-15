"""SQLite persistence layer for connection profiles.

Uses stdlib sqlite3 with asyncio.to_thread() to avoid blocking the event loop.
"""

from __future__ import annotations

import asyncio
import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path

from aerospike_py_admin_ui_api import config
from aerospike_py_admin_ui_api.models.connection import ConnectionProfile

_connection: sqlite3.Connection | None = None

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS connections (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    hosts       TEXT NOT NULL,
    port        INTEGER NOT NULL DEFAULT 3000,
    cluster_name TEXT,
    username    TEXT,
    password    TEXT,
    color       TEXT NOT NULL DEFAULT '#0097D3',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);
"""


def _get_conn() -> sqlite3.Connection:
    if _connection is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return _connection


def init_db() -> None:
    global _connection
    db_path = Path(config.DATABASE_PATH)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    _connection = sqlite3.connect(str(db_path), check_same_thread=False)
    _connection.row_factory = sqlite3.Row
    _connection.execute("PRAGMA journal_mode=WAL;")
    _connection.execute(CREATE_TABLE_SQL)
    _connection.commit()
    _seed_if_empty()


def close_db() -> None:
    global _connection
    if _connection:
        _connection.close()
        _connection = None


# ---------------------------------------------------------------------------
# Row ↔ Model helpers
# ---------------------------------------------------------------------------


def _row_to_profile(row: sqlite3.Row) -> ConnectionProfile:
    return ConnectionProfile(
        id=row["id"],
        name=row["name"],
        hosts=json.loads(row["hosts"]),
        port=row["port"],
        clusterName=row["cluster_name"],
        username=row["username"],
        password=row["password"],
        color=row["color"],
        createdAt=row["created_at"],
        updatedAt=row["updated_at"],
    )


# ---------------------------------------------------------------------------
# Sync helpers (run inside asyncio.to_thread)
# ---------------------------------------------------------------------------


def _get_all_sync() -> list[ConnectionProfile]:
    cur = _get_conn().execute("SELECT * FROM connections ORDER BY created_at")
    return [_row_to_profile(row) for row in cur.fetchall()]


def _get_one_sync(conn_id: str) -> ConnectionProfile | None:
    cur = _get_conn().execute("SELECT * FROM connections WHERE id = ?", (conn_id,))
    row = cur.fetchone()
    return _row_to_profile(row) if row else None


def _insert_sync(conn: ConnectionProfile) -> None:
    _get_conn().execute(
        """INSERT INTO connections (id, name, hosts, port, cluster_name, username, password, color, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            conn.id,
            conn.name,
            json.dumps(conn.hosts),
            conn.port,
            conn.clusterName,
            conn.username,
            conn.password,
            conn.color,
            conn.createdAt,
            conn.updatedAt,
        ),
    )
    _get_conn().commit()


def _update_sync(conn_id: str, data: dict) -> ConnectionProfile | None:
    existing = _get_one_sync(conn_id)
    if not existing:
        return None

    merged = existing.model_dump()
    merged.update(data)
    merged["id"] = conn_id
    merged["updatedAt"] = datetime.now(UTC).isoformat()

    _get_conn().execute(
        """UPDATE connections
           SET name = ?, hosts = ?, port = ?, cluster_name = ?, username = ?, password = ?, color = ?, updated_at = ?
           WHERE id = ?""",
        (
            merged["name"],
            json.dumps(merged["hosts"]),
            merged["port"],
            merged.get("clusterName"),
            merged.get("username"),
            merged.get("password"),
            merged["color"],
            merged["updatedAt"],
            conn_id,
        ),
    )
    _get_conn().commit()
    return _get_one_sync(conn_id)


def _delete_sync(conn_id: str) -> bool:
    cur = _get_conn().execute("DELETE FROM connections WHERE id = ?", (conn_id,))
    _get_conn().commit()
    return cur.rowcount > 0


# ---------------------------------------------------------------------------
# Async public API
# ---------------------------------------------------------------------------


async def get_all_connections() -> list[ConnectionProfile]:
    return await asyncio.to_thread(_get_all_sync)


async def get_connection(conn_id: str) -> ConnectionProfile | None:
    return await asyncio.to_thread(_get_one_sync, conn_id)


async def create_connection(conn: ConnectionProfile) -> None:
    await asyncio.to_thread(_insert_sync, conn)


async def update_connection(conn_id: str, data: dict) -> ConnectionProfile | None:
    return await asyncio.to_thread(_update_sync, conn_id, data)


async def delete_connection(conn_id: str) -> bool:
    return await asyncio.to_thread(_delete_sync, conn_id)


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------


def _seed_if_empty() -> None:
    cur = _get_conn().execute("SELECT COUNT(*) FROM connections")
    count = cur.fetchone()[0]
    if count > 0:
        return

    from aerospike_py_admin_ui_api.mock_data.connections import mock_connections

    for mc in mock_connections:
        profile = ConnectionProfile(
            id=mc.id,
            name=mc.name,
            hosts=mc.hosts,
            port=mc.port,
            clusterName=mc.clusterName,
            username=mc.username,
            password=mc.password,
            color=mc.color,
            createdAt=mc.createdAt,
            updatedAt=mc.updatedAt,
        )
        _insert_sync(profile)
