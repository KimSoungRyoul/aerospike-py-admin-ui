import { NextRequest, NextResponse } from "next/server";
import { createMetricsGenerator } from "@/lib/mock/data/metrics";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ connId: string }> },
) {
  const { connId } = await params;
  const getMetrics = createMetricsGenerator(connId);
  const metrics = getMetrics();

  return NextResponse.json(metrics);
}
