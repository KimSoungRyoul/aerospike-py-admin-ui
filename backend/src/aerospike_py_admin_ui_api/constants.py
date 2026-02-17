"""Aerospike info command and client policy constants."""

from __future__ import annotations

import aerospike_py

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


# Per-node command classification
PER_NODE_PREFIXES = ("sets/", "bins/", "namespace/")
PER_NODE_COMMANDS = frozenset({INFO_STATISTICS})


def is_per_node_command(cmd: str) -> bool:
    """Return True if the info command returns per-node (non-cluster-wide) data."""
    return cmd in PER_NODE_COMMANDS or cmd.startswith(PER_NODE_PREFIXES)


# Scan/Query limits
MAX_SCAN_RECORDS = 10_000
MAX_QUERY_RECORDS = 10_000

# Client policies
POLICY_READ = {"key": aerospike_py.POLICY_KEY_SEND}
POLICY_WRITE = {"key": aerospike_py.POLICY_KEY_SEND}
POLICY_SCAN = {"total_timeout": 30000, "key": aerospike_py.POLICY_KEY_SEND}
POLICY_QUERY = {"total_timeout": 30000, "key": aerospike_py.POLICY_KEY_SEND}
