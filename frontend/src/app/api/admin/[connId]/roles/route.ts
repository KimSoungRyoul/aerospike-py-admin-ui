import { NextRequest, NextResponse } from "next/server";
import type { AerospikeRole } from "@/lib/api/types";
import { mockRoles as _mockRoles } from "@/lib/mock/data/users";

// Deep clone so mutations don't affect the original module export
const roles: Record<string, AerospikeRole[]> = JSON.parse(
  JSON.stringify(_mockRoles),
);

const defaultRoles: AerospikeRole[] = [
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
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;

  return NextResponse.json(roles[connId] ?? defaultRoles);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;
  const body = await request.json();

  const { name, privileges } = body;
  if (!name || !privileges) {
    return NextResponse.json(
      { message: "Missing required fields: name, privileges" },
      { status: 400 },
    );
  }

  if (!roles[connId]) {
    roles[connId] = JSON.parse(JSON.stringify(defaultRoles));
  }

  // Check for duplicate
  const existing = roles[connId].find((r) => r.name === name);
  if (existing) {
    return NextResponse.json(
      { message: `Role '${name}' already exists` },
      { status: 409 },
    );
  }

  const newRole: AerospikeRole = {
    name,
    privileges,
    whitelist: body.whitelist ?? [],
    readQuota: body.readQuota ?? 0,
    writeQuota: body.writeQuota ?? 0,
  };

  roles[connId].push(newRole);

  return NextResponse.json(newRole, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name") ?? "";

  if (!name) {
    return NextResponse.json(
      { message: "Missing required query param: name" },
      { status: 400 },
    );
  }

  const connRoles = roles[connId];
  if (!connRoles) {
    return NextResponse.json(
      { message: "Role not found" },
      { status: 404 },
    );
  }

  const index = connRoles.findIndex((r) => r.name === name);

  if (index === -1) {
    return NextResponse.json(
      { message: "Role not found" },
      { status: 404 },
    );
  }

  connRoles.splice(index, 1);

  return NextResponse.json({ message: "Role deleted" });
}
