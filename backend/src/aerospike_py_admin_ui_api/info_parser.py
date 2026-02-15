"""Utilities for parsing Aerospike info protocol responses."""

from __future__ import annotations


def parse_kv_pairs(response: str, sep: str = ";") -> dict[str, str]:
    """Parse ``"key=val;key2=val2"`` into a dict."""
    result: dict[str, str] = {}
    if not response:
        return result
    for part in response.strip().split(sep):
        if "=" in part:
            k, v = part.split("=", 1)
            result[k.strip()] = v.strip()
    return result


def parse_list(response: str, sep: str = ";") -> list[str]:
    """Parse ``"item1;item2;item3"`` into a list."""
    if not response or not response.strip():
        return []
    return [item.strip() for item in response.strip().split(sep) if item.strip()]


def parse_records(response: str, record_sep: str = ";", field_sep: str = ":") -> list[dict[str, str]]:
    """Parse multi-record info response into a list of dicts.

    Each record is separated by *record_sep*, and fields within a record
    are ``key=value`` pairs separated by *field_sep*.
    """
    records: list[dict[str, str]] = []
    if not response or not response.strip():
        return records
    for record_str in response.strip().split(record_sep):
        if not record_str.strip():
            continue
        record: dict[str, str] = {}
        for field in record_str.strip().split(field_sep):
            if "=" in field:
                k, v = field.split("=", 1)
                record[k.strip()] = v.strip()
        if record:
            records.append(record)
    return records


def safe_int(value: str | None, default: int = 0) -> int:
    """Convert string to int safely."""
    if value is None:
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def safe_bool(value: str | None) -> bool:
    """Convert ``"true"``/``"false"`` string to bool."""
    if value is None:
        return False
    return value.strip().lower() == "true"
