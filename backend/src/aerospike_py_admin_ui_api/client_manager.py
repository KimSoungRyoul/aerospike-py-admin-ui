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
from aerospike_py.exception import AerospikeError

from aerospike_py_admin_ui_api import db
from aerospike_py_admin_ui_api.utils import parse_host_port


class ClientManager:
    def __init__(self) -> None:
        self._clients: dict[str, aerospike_py.Client] = {}
        self._lock = threading.Lock()

    # ------------------------------------------------------------------
    # Internal sync helpers (blocking Aerospike operations only)
    # ------------------------------------------------------------------

    def _connect_sync(self, conn_id: str, hosts: list[tuple[str, int]], config: dict[str, Any]) -> aerospike_py.Client:
        """Create and connect an Aerospike client (blocking)."""
        client = aerospike_py.client(config).connect()

        with self._lock:
            old = self._clients.get(conn_id)
            if old is not None:
                with contextlib.suppress(AerospikeError, OSError):
                    old.close()
            self._clients[conn_id] = client

        return client

    def _close_client_sync(self, conn_id: str) -> None:
        with self._lock:
            client = self._clients.pop(conn_id, None)
        if client is not None:
            with contextlib.suppress(AerospikeError, OSError):
                client.close()

    def _close_all_sync(self) -> None:
        with self._lock:
            clients = list(self._clients.values())
            self._clients.clear()
        for client in clients:
            with contextlib.suppress(AerospikeError, OSError):
                client.close()

    # ------------------------------------------------------------------
    # Async public API
    # ------------------------------------------------------------------

    async def get_client(self, conn_id: str) -> aerospike_py.Client:
        with self._lock:
            client = self._clients.get(conn_id)
            if client is not None and client.is_connected():
                return client

        profile = await db.get_connection(conn_id)
        if profile is None:
            raise ValueError(f"Connection profile '{conn_id}' not found")

        hosts = [parse_host_port(h, profile.port) for h in profile.hosts]
        as_config: dict[str, Any] = {"hosts": hosts}
        if profile.username and profile.password:
            as_config["user"] = profile.username
            as_config["password"] = profile.password

        return await asyncio.to_thread(self._connect_sync, conn_id, hosts, as_config)

    async def close_client(self, conn_id: str) -> None:
        await asyncio.to_thread(self._close_client_sync, conn_id)

    async def close_all(self) -> None:
        await asyncio.to_thread(self._close_all_sync)

    async def run(self, conn_id: str, fn: Callable[..., Any], *args: Any) -> Any:
        """Get client for *conn_id* and execute ``fn(client, *args)`` in a thread."""
        client = await self.get_client(conn_id)
        return await asyncio.to_thread(fn, client, *args)


client_manager = ClientManager()
