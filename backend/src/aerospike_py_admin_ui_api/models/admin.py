from __future__ import annotations

from pydantic import BaseModel, Field


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
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)
    roles: list[str] | None = None


class ChangePasswordRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


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
