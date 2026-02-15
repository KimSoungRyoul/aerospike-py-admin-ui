"""In-memory mutable store.

Deep-copies mock data at import time so that mutations (create / update /
delete) never affect the original module-level constants.
"""

from __future__ import annotations

import copy

from aerospike_ui_api.mock_data.clusters import mock_clusters  # read-only, no copy needed
from aerospike_ui_api.mock_data.connections import mock_connections
from aerospike_ui_api.mock_data.indexes import mock_indexes
from aerospike_ui_api.mock_data.records import mock_records
from aerospike_ui_api.mock_data.udfs import mock_udfs
from aerospike_ui_api.mock_data.users import mock_roles, mock_users
from aerospike_ui_api.models.admin import AerospikeRole, AerospikeUser, Privilege
from aerospike_ui_api.models.connection import ConnectionWithStatus
from aerospike_ui_api.models.index import SecondaryIndex
from aerospike_ui_api.models.record import AerospikeRecord
from aerospike_ui_api.models.udf import UDFModule

# --- Mutable stores (deep-copied) -----------------------------------------

connections: list[ConnectionWithStatus] = copy.deepcopy(mock_connections)

records: dict[str, dict[str, list[AerospikeRecord]]] = copy.deepcopy(mock_records)

indexes: dict[str, list[SecondaryIndex]] = copy.deepcopy(mock_indexes)

users: dict[str, list[AerospikeUser]] = copy.deepcopy(mock_users)

roles: dict[str, list[AerospikeRole]] = copy.deepcopy(mock_roles)

udfs: dict[str, list[UDFModule]] = copy.deepcopy(mock_udfs)

# --- Read-only stores (no copy) -------------------------------------------

clusters = mock_clusters

# --- Defaults for new connections ------------------------------------------

DEFAULT_USERS: list[AerospikeUser] = [
    AerospikeUser(username="admin", roles=["superuser"], readQuota=0, writeQuota=0, connections=1),
]

DEFAULT_ROLES: list[AerospikeRole] = [
    AerospikeRole(
        name="superuser",
        privileges=[
            Privilege(code="read"),
            Privilege(code="write"),
            Privilege(code="sys-admin"),
            Privilege(code="user-admin"),
            Privilege(code="data-admin"),
        ],
        whitelist=[],
        readQuota=0,
        writeQuota=0,
    ),
]
