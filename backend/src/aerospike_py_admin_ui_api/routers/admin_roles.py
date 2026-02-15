from __future__ import annotations

import copy

from fastapi import APIRouter, HTTPException

from aerospike_py_admin_ui_api import store
from aerospike_py_admin_ui_api.models.admin import AerospikeRole, CreateRoleRequest

router = APIRouter(prefix="/api/admin", tags=["admin-roles"])


@router.get("/{conn_id}/roles")
def get_roles(conn_id: str) -> list[AerospikeRole]:
    return store.roles.get(conn_id, copy.deepcopy(store.DEFAULT_ROLES))


@router.post("/{conn_id}/roles", status_code=201)
def create_role(conn_id: str, body: CreateRoleRequest) -> AerospikeRole:
    if not body.name or not body.privileges:
        raise HTTPException(
            status_code=400,
            detail="Missing required fields: name, privileges",
        )

    if conn_id not in store.roles:
        store.roles[conn_id] = copy.deepcopy(store.DEFAULT_ROLES)

    existing = next((r for r in store.roles[conn_id] if r.name == body.name), None)
    if existing:
        raise HTTPException(status_code=409, detail=f"Role '{body.name}' already exists")

    new_role = AerospikeRole(
        name=body.name,
        privileges=body.privileges,
        whitelist=body.whitelist or [],
        readQuota=body.readQuota or 0,
        writeQuota=body.writeQuota or 0,
    )
    store.roles[conn_id].append(new_role)
    return new_role


@router.delete("/{conn_id}/roles")
def delete_role(conn_id: str, name: str = "") -> dict:
    if not name:
        raise HTTPException(status_code=400, detail="Missing required query param: name")

    conn_roles = store.roles.get(conn_id)
    if not conn_roles:
        raise HTTPException(status_code=404, detail="Role not found")

    idx = next((i for i, r in enumerate(conn_roles) if r.name == name), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Role not found")

    conn_roles.pop(idx)
    return {"message": "Role deleted"}
