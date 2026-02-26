from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Query
from starlette.responses import Response

from aerospike_cluster_manager_api.constants import INFO_NAMESPACES, info_sindex
from aerospike_cluster_manager_api.dependencies import AerospikeClient
from aerospike_cluster_manager_api.info_parser import parse_list, parse_records
from aerospike_cluster_manager_api.models.index import CreateIndexRequest, SecondaryIndex

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/indexes", tags=["indexes"])

_STATE_MAP = {"RW": "ready", "WO": "building", "D": "error"}
_TYPE_MAP = {"numeric": "numeric", "string": "string", "geo2dsphere": "geo2dsphere"}


def _list_indexes_sync(c) -> list[SecondaryIndex]:
    ns_raw = c.info_random_node(INFO_NAMESPACES)
    ns_names = parse_list(ns_raw)

    indexes: list[SecondaryIndex] = []
    for ns in ns_names:
        sindex_raw = c.info_random_node(info_sindex(ns))
        for rec in parse_records(sindex_raw):
            raw_type = rec.get("type", rec.get("bin_type", "string")).lower()
            idx_type = _TYPE_MAP.get(raw_type, "string")
            raw_state = rec.get("state", "RW")
            state = _STATE_MAP.get(raw_state, "ready")

            indexes.append(
                SecondaryIndex(
                    name=rec.get("indexname", rec.get("index_name", "")),
                    namespace=ns,
                    set=rec.get("set", rec.get("set_name", "")),
                    bin=rec.get("bin", rec.get("bin_name", "")),
                    type=idx_type,
                    state=state,
                )
            )
    return indexes


@router.get(
    "/{conn_id}",
    summary="List secondary indexes",
    description="Retrieve all secondary indexes across all namespaces in the cluster.",
)
async def get_indexes(client: AerospikeClient) -> list[SecondaryIndex]:
    """Retrieve all secondary indexes across all namespaces in the cluster."""
    return await asyncio.to_thread(_list_indexes_sync, client)


def _create_index_sync(c, body: CreateIndexRequest) -> None:
    if body.type == "numeric":
        c.index_integer_create(body.namespace, body.set, body.bin, body.name)
    elif body.type == "string":
        c.index_string_create(body.namespace, body.set, body.bin, body.name)
    elif body.type == "geo2dsphere":
        c.index_geo2dsphere_create(body.namespace, body.set, body.bin, body.name)
    else:
        raise ValueError(f"Unsupported index type: {body.type}")


@router.post(
    "/{conn_id}",
    status_code=201,
    summary="Create secondary index",
    description="Create a new secondary index on a specified namespace, set, and bin.",
)
async def create_index(body: CreateIndexRequest, client: AerospikeClient) -> SecondaryIndex:
    """Create a new secondary index on a specified namespace, set, and bin."""
    await asyncio.to_thread(_create_index_sync, client, body)
    return SecondaryIndex(
        name=body.name,
        namespace=body.namespace,
        set=body.set,
        bin=body.bin,
        type=body.type,
        state="building",
    )


def _delete_index_sync(c, ns: str, name: str) -> None:
    c.index_remove(ns, name)


@router.delete(
    "/{conn_id}",
    status_code=204,
    summary="Delete secondary index",
    description="Remove a secondary index by name from the specified namespace.",
)
async def delete_index(
    client: AerospikeClient,
    name: str = Query(..., min_length=1),
    ns: str = Query(..., min_length=1),
) -> Response:
    """Remove a secondary index by name from the specified namespace."""
    await asyncio.to_thread(_delete_index_sync, client, ns, name)
    return Response(status_code=204)
