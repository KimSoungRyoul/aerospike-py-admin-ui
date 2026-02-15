import type { MetricPoint, MetricSeries, ClusterMetrics, NamespaceMetrics } from "@/lib/api/types";
import { mockClusters } from "@/lib/mock/data/clusters";

// ---------------------------------------------------------------------------
// Core generators
// ---------------------------------------------------------------------------

/**
 * Generate a single random metric value between min and max.
 */
export function generateMetricPoint(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Generate a time series of MetricPoint values.
 * Points are spaced 10 seconds apart, ending at the current time.
 */
export function generateTimeSeries(
  points: number,
  min: number,
  max: number,
): MetricPoint[] {
  const now = Date.now();
  const intervalMs = 10_000; // 10 seconds between points
  const series: MetricPoint[] = [];

  // Use a random walk for more realistic-looking data
  let current = min + Math.random() * (max - min);
  const drift = (max - min) * 0.05; // max 5% change per tick

  for (let i = 0; i < points; i++) {
    const delta = (Math.random() - 0.5) * 2 * drift;
    current = Math.max(min, Math.min(max, current + delta));

    series.push({
      timestamp: now - (points - 1 - i) * intervalMs,
      value: Math.round(current * 100) / 100,
    });
  }

  return series;
}

// ---------------------------------------------------------------------------
// Namespace metrics helper
// ---------------------------------------------------------------------------

function generateNamespaceMetrics(
  namespaceName: string,
  memoryUsed: number,
  memoryTotal: number,
  deviceUsed: number,
  deviceTotal: number,
  objects: number,
): NamespaceMetrics {
  return {
    namespace: namespaceName,
    objects,
    memoryUsed,
    memoryTotal,
    deviceUsed,
    deviceTotal,
    readReqs: Math.floor(generateMetricPoint(50_000, 200_000)),
    writeReqs: Math.floor(generateMetricPoint(20_000, 100_000)),
    readSuccess: Math.floor(generateMetricPoint(49_500, 199_500)),
    writeSuccess: Math.floor(generateMetricPoint(19_800, 99_800)),
  };
}

// ---------------------------------------------------------------------------
// Full ClusterMetrics generator
// ---------------------------------------------------------------------------

/**
 * Generate a complete ClusterMetrics snapshot for a connection.
 */
export function generateClusterMetrics(connId: string): ClusterMetrics {
  const cluster = mockClusters[connId];

  // Fallback values if the cluster data is not found
  const nodes = cluster?.nodes ?? [];
  const namespaces = cluster?.namespaces ?? [];

  const totalConnections = nodes.reduce(
    (sum, n) => sum + n.clientConnections,
    0,
  );
  const uptime = nodes.length > 0 ? nodes[0].uptime : 0;

  const timeSeriesPoints = 60; // 10 minutes of data at 10s intervals

  // Build per-namespace metrics and chart series
  const nsMetrics: NamespaceMetrics[] = [];
  const memoryUsageByNs: MetricSeries[] = [];
  const deviceUsageByNs: MetricSeries[] = [];

  const nsColors = ["#0097D3", "#ffe600", "#ff6b35", "#2ecc71", "#9b59b6"];

  for (let i = 0; i < namespaces.length; i++) {
    const ns = namespaces[i];

    nsMetrics.push(
      generateNamespaceMetrics(
        ns.name,
        ns.memoryUsed,
        ns.memoryTotal,
        ns.deviceUsed,
        ns.deviceTotal,
        ns.objects,
      ),
    );

    // Memory usage series: fluctuate around the static memoryUsed value
    const memPctMin = (ns.memoryUsed / ns.memoryTotal) * 100 - 3;
    const memPctMax = (ns.memoryUsed / ns.memoryTotal) * 100 + 3;
    memoryUsageByNs.push({
      name: `memory_${ns.name}`,
      label: `${ns.name} memory`,
      data: generateTimeSeries(timeSeriesPoints, memPctMin, memPctMax),
      color: nsColors[i % nsColors.length],
    });

    // Device usage series
    const devPctMin = (ns.deviceUsed / ns.deviceTotal) * 100 - 2;
    const devPctMax = (ns.deviceUsed / ns.deviceTotal) * 100 + 2;
    deviceUsageByNs.push({
      name: `device_${ns.name}`,
      label: `${ns.name} device`,
      data: generateTimeSeries(timeSeriesPoints, devPctMin, devPctMax),
      color: nsColors[i % nsColors.length],
    });
  }

  // Determine TPS ranges based on connection size
  const isSmallCluster = nodes.length <= 1;
  const readTpsMin = isSmallCluster ? 100 : 300;
  const readTpsMax = isSmallCluster ? 500 : 1500;
  const writeTpsMin = isSmallCluster ? 50 : 150;
  const writeTpsMax = isSmallCluster ? 200 : 800;

  // Aggregate read/write totals from namespace metrics
  const totalReadReqs = nsMetrics.reduce((s, n) => s + n.readReqs, 0);
  const totalWriteReqs = nsMetrics.reduce((s, n) => s + n.writeReqs, 0);
  const totalReadSuccess = nsMetrics.reduce((s, n) => s + n.readSuccess, 0);
  const totalWriteSuccess = nsMetrics.reduce((s, n) => s + n.writeSuccess, 0);

  return {
    connectionId: connId,
    timestamp: Date.now(),
    connected: true,
    uptime,
    clientConnections: totalConnections,
    totalReadReqs,
    totalWriteReqs,
    totalReadSuccess,
    totalWriteSuccess,
    namespaces: nsMetrics,
    readTps: generateTimeSeries(timeSeriesPoints, readTpsMin, readTpsMax),
    writeTps: generateTimeSeries(timeSeriesPoints, writeTpsMin, writeTpsMax),
    connectionHistory: generateTimeSeries(
      timeSeriesPoints,
      isSmallCluster ? 10 : 30,
      isSmallCluster ? 50 : 120,
    ),
    memoryUsageByNs,
    deviceUsageByNs,
  };
}

// ---------------------------------------------------------------------------
// Factory export
// ---------------------------------------------------------------------------

/**
 * Create a metrics generator bound to a specific connection ID.
 * Each call to the returned function produces a fresh snapshot with
 * realistic, slightly randomized values.
 *
 * Usage:
 *   const getMetrics = createMetricsGenerator("conn-1");
 *   const snapshot = getMetrics(); // ClusterMetrics
 */
export function createMetricsGenerator(
  connId: string,
): () => ClusterMetrics {
  return () => generateClusterMetrics(connId);
}
