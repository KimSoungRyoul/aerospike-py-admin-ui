from __future__ import annotations

import asyncio
import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException

from aerospike_py_admin_ui_api.client_manager import client_manager
from aerospike_py_admin_ui_api.info_parser import parse_records
from aerospike_py_admin_ui_api.models.udf import UDFModule

router = APIRouter(prefix="/api/udfs", tags=["udfs"])


def _list_udfs_sync(conn_id: str) -> list[UDFModule]:
    c = client_manager._get_client_sync(conn_id)
    raw = c.info_random_node("udf-list")
    records = parse_records(raw, field_sep=",")
    modules: list[UDFModule] = []
    for rec in records:
        modules.append(
            UDFModule(
                filename=rec.get("filename", ""),
                type=rec.get("type", "LUA").upper(),
                hash=rec.get("hash", rec.get("content_hash", "")),
            )
        )
    return modules


@router.get("/{conn_id}")
async def get_udfs(conn_id: str) -> list[UDFModule]:
    return await asyncio.to_thread(_list_udfs_sync, conn_id)


def _upload_udf_sync(conn_id: str, filename: str, content: str) -> None:
    c = client_manager._get_client_sync(conn_id)
    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".lua", delete=False) as tmp:
            tmp.write(content)
            tmp.flush()
            tmp_path = tmp.name
        c.udf_put(tmp_path)
    finally:
        if tmp_path:
            Path(tmp_path).unlink(missing_ok=True)


@router.post("/{conn_id}", status_code=201)
async def upload_udf(conn_id: str, body: dict) -> UDFModule:
    filename = body.get("filename", "")
    content = body.get("content", "")

    if not filename or not content:
        raise HTTPException(status_code=400, detail="Missing required fields: filename, content")

    await asyncio.to_thread(_upload_udf_sync, conn_id, filename, content)

    # Re-fetch to get actual hash
    modules = await asyncio.to_thread(_list_udfs_sync, conn_id)
    uploaded = next((m for m in modules if m.filename == filename), None)
    if uploaded:
        return uploaded
    return UDFModule(filename=filename, type="LUA", hash="", content=content)


def _delete_udf_sync(conn_id: str, module_name: str) -> None:
    c = client_manager._get_client_sync(conn_id)
    c.udf_remove(module_name)


@router.delete("/{conn_id}")
async def delete_udf(conn_id: str, filename: str = "") -> dict:
    if not filename:
        raise HTTPException(status_code=400, detail="Missing required query param: filename")

    await asyncio.to_thread(_delete_udf_sync, conn_id, filename)
    return {"message": "UDF deleted"}
