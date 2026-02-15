import { NextRequest, NextResponse } from "next/server";
import type { ConnectionWithStatus } from "@/lib/api/types";
import { mockConnections as _mockConnections } from "@/lib/mock/data/connections";

// Deep clone so mutations don't affect the original module export
const connections: ConnectionWithStatus[] = JSON.parse(
  JSON.stringify(_mockConnections),
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const connection = connections.find((c) => c.id === id);

  if (!connection) {
    return NextResponse.json(
      { message: `Connection '${id}' not found` },
      { status: 404 },
    );
  }

  return NextResponse.json(connection);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const index = connections.findIndex((c) => c.id === id);

  if (index === -1) {
    return NextResponse.json(
      { message: `Connection '${id}' not found` },
      { status: 404 },
    );
  }

  const body = await request.json();
  const updated: ConnectionWithStatus = {
    ...connections[index],
    ...body,
    id, // prevent id from being overwritten
    updatedAt: new Date().toISOString(),
  };
  connections[index] = updated;

  return NextResponse.json(updated);
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const connection = connections.find((c) => c.id === id);

  if (!connection) {
    return NextResponse.json(
      { message: `Connection '${id}' not found` },
      { status: 404 },
    );
  }

  // Simulate connection test
  return NextResponse.json({
    success: true,
    message: "Connected successfully",
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const index = connections.findIndex((c) => c.id === id);

  if (index === -1) {
    return NextResponse.json(
      { message: `Connection '${id}' not found` },
      { status: 404 },
    );
  }

  connections.splice(index, 1);

  return NextResponse.json({ message: "Connection deleted" });
}
