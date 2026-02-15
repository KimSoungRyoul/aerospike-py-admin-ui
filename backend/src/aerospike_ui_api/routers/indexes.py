from __future__ import annotations

from fastapi import APIRouter, HTTPException

from aerospike_ui_api import store
from aerospike_ui_api.models.index import CreateIndexRequest, SecondaryIndex

router = APIRouter(prefix="/api/indexes", tags=["indexes"])


@router.get("/{conn_id}")
def get_indexes(conn_id: str) -> list[SecondaryIndex]:
    return store.indexes.get(conn_id, [])


@router.post("/{conn_id}", status_code=201)
def create_index(conn_id: str, body: CreateIndexRequest) -> SecondaryIndex:
    if conn_id not in store.indexes:
        store.indexes[conn_id] = []

    existing = next((idx for idx in store.indexes[conn_id] if idx.name == body.name), None)
    if existing:
        raise HTTPException(status_code=409, detail=f"Index '{body.name}' already exists")

    new_index = SecondaryIndex(
        name=body.name,
        namespace=body.namespace,
        set=body.set,
        bin=body.bin,
        type=body.type,
        state="ready",
    )
    store.indexes[conn_id].append(new_index)
    return new_index


@router.delete("/{conn_id}")
def delete_index(conn_id: str, name: str = "", ns: str = "") -> dict:
    if not name or not ns:
        raise HTTPException(status_code=400, detail="Missing required query params: name, ns")

    conn_indexes = store.indexes.get(conn_id)
    if not conn_indexes:
        raise HTTPException(status_code=404, detail="Index not found")

    idx = next(
        (i for i, ix in enumerate(conn_indexes) if ix.name == name and ix.namespace == ns),
        -1,
    )
    if idx == -1:
        raise HTTPException(status_code=404, detail="Index not found")

    conn_indexes.pop(idx)
    return {"message": "Index deleted"}
