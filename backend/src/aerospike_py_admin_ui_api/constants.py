"""Aerospike info command constants."""

from __future__ import annotations

# Info commands
INFO_NAMESPACES = "namespaces"
INFO_STATISTICS = "statistics"
INFO_BUILD = "build"
INFO_EDITION = "edition"
INFO_SERVICE = "service"
INFO_STATUS = "status"
INFO_NODE = "node"
INFO_UDF_LIST = "udf-list"


def info_namespace(ns: str) -> str:
    return f"namespace/{ns}"


def info_sets(ns: str) -> str:
    return f"sets/{ns}"


def info_sindex(ns: str) -> str:
    return f"sindex/{ns}"


def info_bins(ns: str) -> str:
    return f"bins/{ns}"


# Scan/Query limits
MAX_SCAN_RECORDS = 10_000
MAX_QUERY_RECORDS = 10_000
