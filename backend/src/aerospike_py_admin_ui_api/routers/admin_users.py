from __future__ import annotations

import asyncio

from aerospike_py.exception import AdminError, AerospikeError
from fastapi import APIRouter, Depends, HTTPException, Query

from aerospike_py_admin_ui_api.client_manager import client_manager
from aerospike_py_admin_ui_api.dependencies import _get_verified_connection
from aerospike_py_admin_ui_api.models.admin import AerospikeUser, ChangePasswordRequest, CreateUserRequest

router = APIRouter(prefix="/api/admin", tags=["admin-users"])

_EE_MSG = "User/role management requires Aerospike Enterprise Edition"


def _query_users_sync(conn_id: str) -> list[AerospikeUser]:
    c = client_manager._get_client_sync(conn_id)
    raw_users = c.admin_query_users_info()
    users: list[AerospikeUser] = []
    for info in raw_users:
        users.append(
            AerospikeUser(
                username=info.get("user", ""),
                roles=info.get("roles", []),
                readQuota=info.get("read_quota", 0),
                writeQuota=info.get("write_quota", 0),
                connections=info.get("connections", 0),
            )
        )
    return users


@router.get("/{conn_id}/users")
async def get_users(conn_id: str = Depends(_get_verified_connection)) -> list[AerospikeUser]:
    try:
        return await asyncio.to_thread(_query_users_sync, conn_id)
    except AdminError:
        raise HTTPException(status_code=403, detail=_EE_MSG) from None
    except AerospikeError as e:
        if "security" in str(e).lower() or "not enabled" in str(e).lower() or "not supported" in str(e).lower():
            raise HTTPException(status_code=403, detail=_EE_MSG) from None
        raise


def _create_user_sync(conn_id: str, username: str, password: str, roles: list[str]) -> None:
    c = client_manager._get_client_sync(conn_id)
    c.admin_create_user(username, password, roles)


@router.post("/{conn_id}/users", status_code=201)
async def create_user(
    body: CreateUserRequest,
    conn_id: str = Depends(_get_verified_connection),
) -> AerospikeUser:
    if not body.username or not body.password:
        raise HTTPException(status_code=400, detail="Missing required fields: username, password")

    try:
        await asyncio.to_thread(_create_user_sync, conn_id, body.username, body.password, body.roles or [])
    except AdminError:
        raise HTTPException(status_code=403, detail=_EE_MSG) from None

    return AerospikeUser(
        username=body.username,
        roles=body.roles or [],
        readQuota=0,
        writeQuota=0,
        connections=0,
    )


def _change_password_sync(conn_id: str, username: str, password: str) -> None:
    c = client_manager._get_client_sync(conn_id)
    c.admin_change_password(username, password)


@router.patch("/{conn_id}/users")
async def change_password(
    body: ChangePasswordRequest,
    conn_id: str = Depends(_get_verified_connection),
) -> dict:
    if not body.username or not body.password:
        raise HTTPException(status_code=400, detail="Missing required fields: username, password")

    try:
        await asyncio.to_thread(_change_password_sync, conn_id, body.username, body.password)
    except AdminError:
        raise HTTPException(status_code=403, detail=_EE_MSG) from None

    return {"message": "Password updated"}


def _drop_user_sync(conn_id: str, username: str) -> None:
    c = client_manager._get_client_sync(conn_id)
    c.admin_drop_user(username)


@router.delete("/{conn_id}/users")
async def delete_user(
    username: str = Query(..., min_length=1),
    conn_id: str = Depends(_get_verified_connection),
) -> dict:
    try:
        await asyncio.to_thread(_drop_user_sync, conn_id, username)
    except AdminError:
        raise HTTPException(status_code=403, detail=_EE_MSG) from None

    return {"message": "User deleted"}
