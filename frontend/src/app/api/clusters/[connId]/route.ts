import { NextRequest, NextResponse } from "next/server";
import { mockClusters } from "@/lib/mock/data/clusters";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;
  const cluster = mockClusters[connId];

  if (!cluster) {
    return NextResponse.json(
      { message: `Cluster info for connection '${connId}' not found` },
      { status: 404 },
    );
  }

  return NextResponse.json(cluster);
}
