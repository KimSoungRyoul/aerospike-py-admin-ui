"""Shared FastAPI dependencies."""

from __future__ import annotations

from typing import Annotated

from fastapi import HTTPException, Path

from aerospike_py_admin_ui_api import db


async def _get_verified_connection(conn_id: str = Path()) -> str:
    """Verify that a connection profile exists and return its id."""
    conn = await db.get_connection(conn_id)
    if not conn:
        raise HTTPException(status_code=404, detail=f"Connection '{conn_id}' not found")
    return conn_id


VerifiedConnId = Annotated[str, Path()]
"""Type alias used when the dependency is injected via Depends()."""
