from __future__ import annotations

import copy

from fastapi import APIRouter, HTTPException

from aerospike_py_admin_ui_api import store
from aerospike_py_admin_ui_api.models.admin import AerospikeUser, ChangePasswordRequest, CreateUserRequest

router = APIRouter(prefix="/api/admin", tags=["admin-users"])


@router.get("/{conn_id}/users")
def get_users(conn_id: str) -> list[AerospikeUser]:
    return store.users.get(conn_id, copy.deepcopy(store.DEFAULT_USERS))


@router.post("/{conn_id}/users", status_code=201)
def create_user(conn_id: str, body: CreateUserRequest) -> AerospikeUser:
    if not body.username or not body.password:
        raise HTTPException(
            status_code=400,
            detail="Missing required fields: username, password",
        )

    if conn_id not in store.users:
        store.users[conn_id] = copy.deepcopy(store.DEFAULT_USERS)

    existing = next((u for u in store.users[conn_id] if u.username == body.username), None)
    if existing:
        raise HTTPException(status_code=409, detail=f"User '{body.username}' already exists")

    new_user = AerospikeUser(
        username=body.username,
        roles=body.roles or [],
        readQuota=0,
        writeQuota=0,
        connections=0,
    )
    store.users[conn_id].append(new_user)
    return new_user


@router.patch("/{conn_id}/users")
def change_password(conn_id: str, body: ChangePasswordRequest) -> dict:
    if not body.username or not body.password:
        raise HTTPException(status_code=400, detail="Missing required fields: username, password")

    conn_users = store.users.get(conn_id)
    if not conn_users:
        raise HTTPException(status_code=404, detail="User not found")

    user = next((u for u in conn_users if u.username == body.username), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "Password updated"}


@router.delete("/{conn_id}/users")
def delete_user(conn_id: str, username: str = "") -> dict:
    if not username:
        raise HTTPException(status_code=400, detail="Missing required query param: username")

    conn_users = store.users.get(conn_id)
    if not conn_users:
        raise HTTPException(status_code=404, detail="User not found")

    idx = next((i for i, u in enumerate(conn_users) if u.username == username), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="User not found")

    conn_users.pop(idx)
    return {"message": "User deleted"}
