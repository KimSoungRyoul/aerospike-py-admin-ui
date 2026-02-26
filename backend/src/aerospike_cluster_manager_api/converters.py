"""Convert raw Aerospike tuples to Pydantic models."""

from __future__ import annotations

from typing import Any

from aerospike_cluster_manager_api.models.record import AerospikeRecord, RecordKey, RecordMeta


def raw_to_record(raw: tuple[tuple, dict, dict]) -> AerospikeRecord:
    """Convert ``(key_tuple, meta_dict, bins_dict)`` to :class:`AerospikeRecord`.

    key_tuple: ``(namespace, set, pk, digest_bytes)``
    meta_dict: ``{"gen": int, "ttl": int}``
    bins_dict: ``{bin_name: value, ...}``
    """
    key_tuple, meta, bins = raw

    if key_tuple is None:
        key_tuple = ()

    ns: str = key_tuple[0] if len(key_tuple) > 0 else ""
    set_name: str = key_tuple[1] if len(key_tuple) > 1 else ""
    pk: Any = key_tuple[2] if len(key_tuple) > 2 else ""
    digest: bytes | None = key_tuple[3] if len(key_tuple) > 3 else None

    digest_hex = digest.hex() if isinstance(digest, bytes | bytearray) else None

    meta = meta or {}
    bins = bins or {}

    return AerospikeRecord(
        key=RecordKey(
            namespace=ns,
            set=set_name or "",
            pk=str(pk) if pk is not None else "",
            digest=digest_hex,
        ),
        meta=RecordMeta(
            generation=meta.get("gen", 0),
            ttl=meta.get("ttl", 0),
        ),
        bins=bins,
    )
