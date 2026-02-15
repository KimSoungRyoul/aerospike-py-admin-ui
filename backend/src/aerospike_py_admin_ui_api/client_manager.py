"""Aerospike client pool manager.

Manages one Client per connection-id, with thread-safe caching and
asyncio.to_thread() wrappers so callers never block the event loop.
"""

from __future__ import annotations

import asyncio
import contextlib
import threading
from collections.abc import Callable
from typing import Any

import aerospike_py

from aerospike_py_admin_ui_api import db


class ClientManager:
    def __init__(self) -> None:
        self._clients: dict[str, aerospike_py.Client] = {}
        self._lock = threading.Lock()

    # ------------------------------------------------------------------
    # Internal sync helpers
    # ------------------------------------------------------------------

    def _get_client_sync(self, conn_id: str) -> aerospike_py.Client:
        with self._lock:
            client = self._clients.get(conn_id)
            if client is not None and client.is_connected():
                return client

        profile = db._get_one_sync(conn_id)
        if profile is None:
            raise ValueError(f"Connection profile '{conn_id}' not found")

        hosts = [(h, profile.port) for h in profile.hosts]
        config: dict[str, Any] = {"hosts": hosts}
        if profile.username and profile.password:
            config["user"] = profile.username
            config["password"] = profile.password

        client = aerospike_py.client(config).connect()

        with self._lock:
            old = self._clients.get(conn_id)
            if old is not None:
                with contextlib.suppress(Exception):
                    old.close()
            self._clients[conn_id] = client

        return client

    def _close_client_sync(self, conn_id: str) -> None:
        with self._lock:
            client = self._clients.pop(conn_id, None)
        if client is not None:
            with contextlib.suppress(Exception):
                client.close()

    def _close_all_sync(self) -> None:
        with self._lock:
            clients = list(self._clients.values())
            self._clients.clear()
        for client in clients:
            with contextlib.suppress(Exception):
                client.close()

    # ------------------------------------------------------------------
    # Async public API
    # ------------------------------------------------------------------

    async def get_client(self, conn_id: str) -> aerospike_py.Client:
        return await asyncio.to_thread(self._get_client_sync, conn_id)

    async def close_client(self, conn_id: str) -> None:
        await asyncio.to_thread(self._close_client_sync, conn_id)

    async def close_all(self) -> None:
        await asyncio.to_thread(self._close_all_sync)

    async def run(self, conn_id: str, fn: Callable[..., Any], *args: Any) -> Any:
        """Get client for *conn_id* and execute ``fn(client, *args)`` in a thread."""
        client = await asyncio.to_thread(self._get_client_sync, conn_id)
        return await asyncio.to_thread(fn, client, *args)


client_manager = ClientManager()
