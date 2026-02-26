from __future__ import annotations

import asyncio
import logging

from aerospike_py.exception import AdminError, AerospikeError
from fastapi import APIRouter, HTTPException, Query
from starlette.responses import Response

from aerospike_py_admin_ui_api.constants import EE_MSG
from aerospike_py_admin_ui_api.dependencies import AerospikeClient
from aerospike_py_admin_ui_api.models.admin import AerospikeUser, ChangePasswordRequest, CreateUserRequest
from aerospike_py_admin_ui_api.models.common import MessageResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin-users"])


def _query_users_sync(c) -> list[AerospikeUser]:
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


@router.get(
    "/{conn_id}/users",
    summary="List users",
    description="Retrieve all Aerospike users and their roles. Requires Enterprise Edition.",
)
async def get_users(client: AerospikeClient) -> list[AerospikeUser]:
    """Retrieve all Aerospike users and their roles. Requires Enterprise Edition."""
    try:
        return await asyncio.to_thread(_query_users_sync, client)
    except AdminError:
        raise HTTPException(status_code=403, detail=EE_MSG) from None
    except AerospikeError as e:
        if "security" in str(e).lower() or "not enabled" in str(e).lower() or "not supported" in str(e).lower():
            raise HTTPException(status_code=403, detail=EE_MSG) from None
        raise


def _create_user_sync(c, username: str, password: str, roles: list[str]) -> None:
    c.admin_create_user(username, password, roles)


@router.post(
    "/{conn_id}/users",
    status_code=201,
    summary="Create user",
    description="Create a new Aerospike user with specified roles. Requires Enterprise Edition.",
)
async def create_user(body: CreateUserRequest, client: AerospikeClient) -> AerospikeUser:
    """Create a new Aerospike user with specified roles. Requires Enterprise Edition."""
    if not body.username or not body.password:
        raise HTTPException(status_code=400, detail="Missing required fields: username, password")

    try:
        await asyncio.to_thread(_create_user_sync, client, body.username, body.password, body.roles or [])
    except AdminError:
        raise HTTPException(status_code=403, detail=EE_MSG) from None

    return AerospikeUser(
        username=body.username,
        roles=body.roles or [],
        readQuota=0,
        writeQuota=0,
        connections=0,
    )


def _change_password_sync(c, username: str, password: str) -> None:
    c.admin_change_password(username, password)


@router.patch(
    "/{conn_id}/users",
    response_model=MessageResponse,
    summary="Change user password",
    description="Change the password for an existing Aerospike user. Requires Enterprise Edition.",
)
async def change_password(body: ChangePasswordRequest, client: AerospikeClient) -> MessageResponse:
    """Change the password for an existing Aerospike user. Requires Enterprise Edition."""
    if not body.username or not body.password:
        raise HTTPException(status_code=400, detail="Missing required fields: username, password")

    try:
        await asyncio.to_thread(_change_password_sync, client, body.username, body.password)
    except AdminError:
        raise HTTPException(status_code=403, detail=EE_MSG) from None

    return MessageResponse(message="Password updated")


def _drop_user_sync(c, username: str) -> None:
    c.admin_drop_user(username)


@router.delete(
    "/{conn_id}/users",
    status_code=204,
    summary="Delete user",
    description="Delete an Aerospike user by username. Requires Enterprise Edition.",
)
async def delete_user(
    client: AerospikeClient,
    username: str = Query(..., min_length=1),
) -> Response:
    """Delete an Aerospike user by username. Requires Enterprise Edition."""
    try:
        await asyncio.to_thread(_drop_user_sync, client, username)
    except AdminError:
        raise HTTPException(status_code=403, detail=EE_MSG) from None

    return Response(status_code=204)
