from __future__ import annotations

import asyncio

from aerospike_py.exception import AdminError, AerospikeError
from fastapi import APIRouter, HTTPException

from aerospike_py_admin_ui_api.client_manager import client_manager
from aerospike_py_admin_ui_api.models.admin import AerospikeRole, CreateRoleRequest, Privilege

router = APIRouter(prefix="/api/admin", tags=["admin-roles"])

_EE_MSG = "User/role management requires Aerospike Enterprise Edition"


def _query_roles_sync(conn_id: str) -> list[AerospikeRole]:
    c = client_manager._get_client_sync(conn_id)
    raw_roles = c.admin_query_roles()
    roles: list[AerospikeRole] = []
    for role_name, info in raw_roles.items():
        privs_raw = info.get("privileges", [])
        privileges: list[Privilege] = []
        for p in privs_raw:
            if isinstance(p, dict):
                privileges.append(
                    Privilege(
                        code=p.get("code", ""),
                        namespace=p.get("ns") or p.get("namespace"),
                        set=p.get("set"),
                    )
                )
            else:
                privileges.append(Privilege(code=str(p)))

        roles.append(
            AerospikeRole(
                name=role_name,
                privileges=privileges,
                whitelist=info.get("whitelist", []),
                readQuota=info.get("read_quota", 0),
                writeQuota=info.get("write_quota", 0),
            )
        )
    return roles


@router.get("/{conn_id}/roles")
async def get_roles(conn_id: str) -> list[AerospikeRole]:
    try:
        return await asyncio.to_thread(_query_roles_sync, conn_id)
    except AdminError:
        raise HTTPException(status_code=403, detail=_EE_MSG) from None
    except AerospikeError as e:
        if "security" in str(e).lower() or "not enabled" in str(e).lower() or "not supported" in str(e).lower():
            raise HTTPException(status_code=403, detail=_EE_MSG) from None
        raise


def _create_role_sync(conn_id: str, body: CreateRoleRequest) -> None:
    c = client_manager._get_client_sync(conn_id)
    privileges = [{"code": p.code, "ns": p.namespace or "", "set": p.set or ""} for p in body.privileges]
    c.admin_create_role(
        body.name,
        privileges,
        whitelist=body.whitelist or [],
        read_quota=body.readQuota or 0,
        write_quota=body.writeQuota or 0,
    )


@router.post("/{conn_id}/roles", status_code=201)
async def create_role(conn_id: str, body: CreateRoleRequest) -> AerospikeRole:
    if not body.name or not body.privileges:
        raise HTTPException(status_code=400, detail="Missing required fields: name, privileges")

    try:
        await asyncio.to_thread(_create_role_sync, conn_id, body)
    except AdminError:
        raise HTTPException(status_code=403, detail=_EE_MSG) from None

    return AerospikeRole(
        name=body.name,
        privileges=body.privileges,
        whitelist=body.whitelist or [],
        readQuota=body.readQuota or 0,
        writeQuota=body.writeQuota or 0,
    )


def _drop_role_sync(conn_id: str, name: str) -> None:
    c = client_manager._get_client_sync(conn_id)
    c.admin_drop_role(name)


@router.delete("/{conn_id}/roles")
async def delete_role(conn_id: str, name: str = "") -> dict:
    if not name:
        raise HTTPException(status_code=400, detail="Missing required query param: name")

    try:
        await asyncio.to_thread(_drop_role_sync, conn_id, name)
    except AdminError:
        raise HTTPException(status_code=403, detail=_EE_MSG) from None

    return {"message": "Role deleted"}
