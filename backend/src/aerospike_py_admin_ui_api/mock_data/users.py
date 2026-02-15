from aerospike_py_admin_ui_api.models.admin import AerospikeRole, AerospikeUser, Privilege

mock_users: dict[str, list[AerospikeUser]] = {
    "conn-1": [
        AerospikeUser(username="admin", roles=["superuser"], readQuota=0, writeQuota=0, connections=5),
        AerospikeUser(username="reader", roles=["read-only"], readQuota=5000, writeQuota=0, connections=2),
        AerospikeUser(username="writer", roles=["read-write"], readQuota=5000, writeQuota=2000, connections=3),
    ],
    "conn-2": [
        AerospikeUser(username="admin", roles=["superuser"], readQuota=0, writeQuota=0, connections=8),
        AerospikeUser(username="reader", roles=["read-only"], readQuota=10000, writeQuota=0, connections=4),
        AerospikeUser(username="writer", roles=["read-write"], readQuota=10000, writeQuota=5000, connections=6),
    ],
}

mock_roles: dict[str, list[AerospikeRole]] = {
    "conn-1": [
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
        AerospikeRole(
            name="read-only",
            privileges=[Privilege(code="read", namespace="test")],
            whitelist=[],
            readQuota=5000,
            writeQuota=0,
        ),
        AerospikeRole(
            name="read-write",
            privileges=[
                Privilege(code="read", namespace="test"),
                Privilege(code="write", namespace="test"),
            ],
            whitelist=[],
            readQuota=5000,
            writeQuota=2000,
        ),
        AerospikeRole(
            name="data-admin",
            privileges=[
                Privilege(code="read"),
                Privilege(code="write"),
                Privilege(code="data-admin"),
            ],
            whitelist=[],
            readQuota=0,
            writeQuota=0,
        ),
    ],
    "conn-2": [
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
        AerospikeRole(
            name="read-only",
            privileges=[Privilege(code="read", namespace="staging")],
            whitelist=["10.0.0.0/8"],
            readQuota=10000,
            writeQuota=0,
        ),
        AerospikeRole(
            name="read-write",
            privileges=[
                Privilege(code="read", namespace="staging"),
                Privilege(code="write", namespace="staging"),
            ],
            whitelist=["10.0.0.0/8"],
            readQuota=10000,
            writeQuota=5000,
        ),
        AerospikeRole(
            name="data-admin",
            privileges=[
                Privilege(code="read"),
                Privilege(code="write"),
                Privilege(code="data-admin"),
                Privilege(code="sys-admin"),
            ],
            whitelist=["10.0.0.0/8"],
            readQuota=0,
            writeQuota=0,
        ),
    ],
}
