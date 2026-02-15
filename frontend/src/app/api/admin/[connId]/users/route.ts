import { NextRequest, NextResponse } from "next/server";
import type { AerospikeUser } from "@/lib/api/types";
import { mockUsers as _mockUsers } from "@/lib/mock/data/users";

// Deep clone so mutations don't affect the original module export
const users: Record<string, AerospikeUser[]> = JSON.parse(
  JSON.stringify(_mockUsers),
);

const defaultUsers: AerospikeUser[] = [
  {
    username: "admin",
    roles: ["superuser"],
    readQuota: 0,
    writeQuota: 0,
    connections: 1,
  },
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;

  return NextResponse.json(users[connId] ?? defaultUsers);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;
  const body = await request.json();

  const { username, password, roles } = body;
  if (!username || !password) {
    return NextResponse.json(
      { message: "Missing required fields: username, password" },
      { status: 400 },
    );
  }

  if (!users[connId]) {
    users[connId] = JSON.parse(JSON.stringify(defaultUsers));
  }

  // Check for duplicate
  const existing = users[connId].find((u) => u.username === username);
  if (existing) {
    return NextResponse.json(
      { message: `User '${username}' already exists` },
      { status: 409 },
    );
  }

  const newUser: AerospikeUser = {
    username,
    roles: roles ?? [],
    readQuota: body.readQuota ?? 0,
    writeQuota: body.writeQuota ?? 0,
    connections: 0,
  };

  users[connId].push(newUser);

  return NextResponse.json(newUser, { status: 201 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;
  const body = await request.json();

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json(
      { message: "Missing required fields: username, password" },
      { status: 400 },
    );
  }

  const connUsers = users[connId];
  if (!connUsers) {
    return NextResponse.json(
      { message: "User not found" },
      { status: 404 },
    );
  }

  const user = connUsers.find((u) => u.username === username);
  if (!user) {
    return NextResponse.json(
      { message: "User not found" },
      { status: 404 },
    );
  }

  // In a real implementation, the password would be hashed and stored
  return NextResponse.json({ message: "Password updated" });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username") ?? "";

  if (!username) {
    return NextResponse.json(
      { message: "Missing required query param: username" },
      { status: 400 },
    );
  }

  const connUsers = users[connId];
  if (!connUsers) {
    return NextResponse.json(
      { message: "User not found" },
      { status: 404 },
    );
  }

  const index = connUsers.findIndex((u) => u.username === username);

  if (index === -1) {
    return NextResponse.json(
      { message: "User not found" },
      { status: 404 },
    );
  }

  connUsers.splice(index, 1);

  return NextResponse.json({ message: "User deleted" });
}
