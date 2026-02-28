"""Bundled Lua UDF modules for sample data registration.

These files are copies of ``aerospike/lua/*.lua`` — keep in sync when modifying UDFs.
"""

from __future__ import annotations

from pathlib import Path

_LUA_DIR = Path(__file__).parent


def get_lua_modules() -> dict[str, str]:
    """Return ``{filename: content}`` for all bundled ``.lua`` files."""
    return {p.name: p.read_text() for p in sorted(_LUA_DIR.glob("*.lua"))}
