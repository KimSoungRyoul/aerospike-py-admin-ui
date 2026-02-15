import type { AerospikeUser, AerospikeRole } from "@/lib/api/types";

export const mockUsers: Record<string, AerospikeUser[]> = {
  "conn-1": [
    {
      username: "admin",
      roles: ["superuser"],
      readQuota: 0,
      writeQuota: 0,
      connections: 5,
    },
    {
      username: "reader",
      roles: ["read-only"],
      readQuota: 5000,
      writeQuota: 0,
      connections: 2,
    },
    {
      username: "writer",
      roles: ["read-write"],
      readQuota: 5000,
      writeQuota: 2000,
      connections: 3,
    },
  ],
  "conn-2": [
    {
      username: "admin",
      roles: ["superuser"],
      readQuota: 0,
      writeQuota: 0,
      connections: 8,
    },
    {
      username: "reader",
      roles: ["read-only"],
      readQuota: 10000,
      writeQuota: 0,
      connections: 4,
    },
    {
      username: "writer",
      roles: ["read-write"],
      readQuota: 10000,
      writeQuota: 5000,
      connections: 6,
    },
  ],
};

export const mockRoles: Record<string, AerospikeRole[]> = {
  "conn-1": [
    {
      name: "superuser",
      privileges: [
        { code: "read" },
        { code: "write" },
        { code: "sys-admin" },
        { code: "user-admin" },
        { code: "data-admin" },
      ],
      whitelist: [],
      readQuota: 0,
      writeQuota: 0,
    },
    {
      name: "read-only",
      privileges: [
        { code: "read", namespace: "test" },
      ],
      whitelist: [],
      readQuota: 5000,
      writeQuota: 0,
    },
    {
      name: "read-write",
      privileges: [
        { code: "read", namespace: "test" },
        { code: "write", namespace: "test" },
      ],
      whitelist: [],
      readQuota: 5000,
      writeQuota: 2000,
    },
    {
      name: "data-admin",
      privileges: [
        { code: "read" },
        { code: "write" },
        { code: "data-admin" },
      ],
      whitelist: [],
      readQuota: 0,
      writeQuota: 0,
    },
  ],
  "conn-2": [
    {
      name: "superuser",
      privileges: [
        { code: "read" },
        { code: "write" },
        { code: "sys-admin" },
        { code: "user-admin" },
        { code: "data-admin" },
      ],
      whitelist: [],
      readQuota: 0,
      writeQuota: 0,
    },
    {
      name: "read-only",
      privileges: [
        { code: "read", namespace: "staging" },
      ],
      whitelist: ["10.0.0.0/8"],
      readQuota: 10000,
      writeQuota: 0,
    },
    {
      name: "read-write",
      privileges: [
        { code: "read", namespace: "staging" },
        { code: "write", namespace: "staging" },
      ],
      whitelist: ["10.0.0.0/8"],
      readQuota: 10000,
      writeQuota: 5000,
    },
    {
      name: "data-admin",
      privileges: [
        { code: "read" },
        { code: "write" },
        { code: "data-admin" },
        { code: "sys-admin" },
      ],
      whitelist: ["10.0.0.0/8"],
      readQuota: 0,
      writeQuota: 0,
    },
  ],
};
