"""Shared utility functions."""

from __future__ import annotations


def parse_host_port(host_str: str, default_port: int) -> tuple[str, int]:
    """Parse a host string that may contain an optional ':port' suffix."""
    if ":" in host_str:
        host, port_str = host_str.rsplit(":", 1)
        try:
            return (host, int(port_str))
        except ValueError:
            return (host_str, default_port)
    return (host_str, default_port)
