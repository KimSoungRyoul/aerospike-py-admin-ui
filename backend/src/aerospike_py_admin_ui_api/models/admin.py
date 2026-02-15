from __future__ import annotations

from pydantic import BaseModel


class Privilege(BaseModel):
    code: str
    namespace: str | None = None
    set: str | None = None


class AerospikeUser(BaseModel):
    username: str
    roles: list[str]
    readQuota: int
    writeQuota: int
    connections: int


class CreateUserRequest(BaseModel):
    username: str
    password: str
    roles: list[str] | None = None


class ChangePasswordRequest(BaseModel):
    username: str
    password: str


class AerospikeRole(BaseModel):
    name: str
    privileges: list[Privilege]
    whitelist: list[str]
    readQuota: int
    writeQuota: int


class CreateRoleRequest(BaseModel):
    name: str
    privileges: list[Privilege]
    whitelist: list[str] | None = None
    readQuota: int | None = None
    writeQuota: int | None = None
