from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, Query

from aerospike_py_admin_ui_api.client_manager import client_manager
from aerospike_py_admin_ui_api.constants import INFO_NAMESPACES, info_sindex
from aerospike_py_admin_ui_api.dependencies import _get_verified_connection
from aerospike_py_admin_ui_api.info_parser import parse_list, parse_records
from aerospike_py_admin_ui_api.models.index import CreateIndexRequest, SecondaryIndex

router = APIRouter(prefix="/api/indexes", tags=["indexes"])

_STATE_MAP = {"RW": "ready", "WO": "building", "D": "error"}
_TYPE_MAP = {"numeric": "numeric", "string": "string", "geo2dsphere": "geo2dsphere"}


def _list_indexes_sync(conn_id: str) -> list[SecondaryIndex]:
    c = client_manager._get_client_sync(conn_id)
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


@router.get("/{conn_id}")
async def get_indexes(conn_id: str = Depends(_get_verified_connection)) -> list[SecondaryIndex]:
    return await asyncio.to_thread(_list_indexes_sync, conn_id)


def _create_index_sync(conn_id: str, body: CreateIndexRequest) -> None:
    c = client_manager._get_client_sync(conn_id)
    if body.type == "numeric":
        c.index_integer_create(body.namespace, body.set, body.bin, body.name)
    elif body.type == "string":
        c.index_string_create(body.namespace, body.set, body.bin, body.name)
    elif body.type == "geo2dsphere":
        c.index_geo2dsphere_create(body.namespace, body.set, body.bin, body.name)
    else:
        raise ValueError(f"Unsupported index type: {body.type}")


@router.post("/{conn_id}", status_code=201)
async def create_index(
    body: CreateIndexRequest,
    conn_id: str = Depends(_get_verified_connection),
) -> SecondaryIndex:
    await asyncio.to_thread(_create_index_sync, conn_id, body)
    return SecondaryIndex(
        name=body.name,
        namespace=body.namespace,
        set=body.set,
        bin=body.bin,
        type=body.type,
        state="building",
    )


def _delete_index_sync(conn_id: str, ns: str, name: str) -> None:
    c = client_manager._get_client_sync(conn_id)
    c.index_remove(ns, name)


@router.delete("/{conn_id}")
async def delete_index(
    name: str = Query(..., min_length=1),
    ns: str = Query(..., min_length=1),
    conn_id: str = Depends(_get_verified_connection),
) -> dict:
    await asyncio.to_thread(_delete_index_sync, conn_id, ns, name)
    return {"message": "Index deleted"}
