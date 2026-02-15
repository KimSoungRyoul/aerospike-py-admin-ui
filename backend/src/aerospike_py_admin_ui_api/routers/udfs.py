from __future__ import annotations

from fastapi import APIRouter, HTTPException

from aerospike_py_admin_ui_api import store
from aerospike_py_admin_ui_api.models.udf import UDFModule

router = APIRouter(prefix="/api/udfs", tags=["udfs"])


def _mock_hash(content: str) -> str:
    base = "abcdef0123456789"
    seed = 0
    for ch in content:
        seed = (seed * 31 + ord(ch)) & 0x7FFFFFFF
    result = []
    for _ in range(64):
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        result.append(base[seed % 16])
    return "".join(result)


@router.get("/{conn_id}")
def get_udfs(conn_id: str) -> list[UDFModule]:
    return store.udfs.get(conn_id, [])


@router.post("/{conn_id}", status_code=201)
def upload_udf(conn_id: str, body: dict) -> UDFModule:
    filename = body.get("filename", "")
    content = body.get("content", "")
    udf_type = body.get("type", "LUA")

    if not filename or not content:
        raise HTTPException(
            status_code=400,
            detail="Missing required fields: filename, content",
        )

    if conn_id not in store.udfs:
        store.udfs[conn_id] = []

    module = UDFModule(
        filename=filename,
        type=udf_type,
        hash=_mock_hash(content),
        content=content,
    )

    existing_idx = next((i for i, u in enumerate(store.udfs[conn_id]) if u.filename == filename), -1)
    if existing_idx >= 0:
        store.udfs[conn_id][existing_idx] = module
    else:
        store.udfs[conn_id].append(module)

    return module


@router.delete("/{conn_id}")
def delete_udf(conn_id: str, filename: str = "") -> dict:
    if not filename:
        raise HTTPException(status_code=400, detail="Missing required query param: filename")

    conn_udfs = store.udfs.get(conn_id)
    if not conn_udfs:
        raise HTTPException(status_code=404, detail="UDF not found")

    idx = next((i for i, u in enumerate(conn_udfs) if u.filename == filename), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="UDF not found")

    conn_udfs.pop(idx)
    return {"message": "UDF deleted"}
