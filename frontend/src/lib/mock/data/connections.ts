import type { ConnectionWithStatus } from "@/lib/api/types";

export const mockConnections: ConnectionWithStatus[] = [
  {
    id: "conn-1",
    name: "Local Docker",
    hosts: ["localhost"],
    port: 3000,
    color: "#ffe600",
    createdAt: "2025-12-01T10:00:00Z",
    updatedAt: "2026-01-15T08:30:00Z",
    status: {
      connected: true,
      nodeCount: 1,
      namespaceCount: 1,
      build: "8.1.0.0",
      edition: "Aerospike Community Edition",
    },
  },
  {
    id: "conn-2",
    name: "Staging",
    hosts: [
      "staging-1.example.com",
      "staging-2.example.com",
      "staging-3.example.com",
    ],
    port: 3000,
    color: "#0097D3",
    createdAt: "2025-11-20T14:00:00Z",
    updatedAt: "2026-02-01T12:00:00Z",
    status: {
      connected: true,
      nodeCount: 3,
      namespaceCount: 1,
      build: "7.2.0.2",
      edition: "Aerospike Enterprise Edition",
    },
  },
];
