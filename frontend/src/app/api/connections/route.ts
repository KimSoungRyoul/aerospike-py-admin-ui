import { NextRequest, NextResponse } from "next/server";
import type { ConnectionWithStatus } from "@/lib/api/types";
import { mockConnections as _mockConnections } from "@/lib/mock/data/connections";

// Deep clone so mutations don't affect the original module export
const connections: ConnectionWithStatus[] = JSON.parse(
  JSON.stringify(_mockConnections),
);

export async function GET() {
  return NextResponse.json(connections);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const newConnection: ConnectionWithStatus = {
    id: `conn-${Date.now()}`,
    name: body.name ?? "New Connection",
    hosts: body.hosts ?? ["localhost"],
    port: body.port ?? 3000,
    clusterName: body.clusterName,
    username: body.username,
    password: body.password,
    color: body.color ?? "#0097D3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: {
      connected: false,
      nodeCount: 0,
      namespaceCount: 0,
    },
  };

  connections.push(newConnection);

  return NextResponse.json(newConnection, { status: 201 });
}
