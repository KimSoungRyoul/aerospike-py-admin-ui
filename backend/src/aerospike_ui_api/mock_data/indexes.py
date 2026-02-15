from aerospike_ui_api.models.index import SecondaryIndex

mock_indexes: dict[str, list[SecondaryIndex]] = {
    "conn-1": [
        SecondaryIndex(
            name="idx_users_age",
            namespace="test",
            set="users",
            bin="age",
            type="numeric",
            state="ready",
        ),
        SecondaryIndex(
            name="idx_users_email",
            namespace="test",
            set="users",
            bin="email",
            type="string",
            state="ready",
        ),
    ],
    "conn-2": [
        SecondaryIndex(
            name="idx_orders_total",
            namespace="staging",
            set="orders",
            bin="total",
            type="numeric",
            state="ready",
        ),
        SecondaryIndex(
            name="idx_orders_location",
            namespace="staging",
            set="orders",
            bin="location",
            type="geo2dsphere",
            state="ready",
        ),
    ],
}
