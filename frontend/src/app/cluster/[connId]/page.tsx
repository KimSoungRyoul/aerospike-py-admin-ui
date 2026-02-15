"use client";

import { use, useEffect, useState, useMemo } from "react";
import {
  Activity,
  BookOpen,
  Clock,
  Database,
  HardDrive,
  Network,
  RefreshCw,
  Search,
  Server,
  TrendingUp,
  TrendingDown,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageHeader } from "@/components/common/page-header";
import { FullPageError } from "@/components/common/full-page-error";
import { EmptyState } from "@/components/common/empty-state";
import { CELimitBanner } from "@/components/common/ce-limit-banner";
import { StatusBadge } from "@/components/common/status-badge";
import { StatCard } from "@/components/common/stat-card";
import { ChartTooltipContent } from "@/components/common/chart-tooltip";
import { useAsyncData } from "@/hooks/use-async-data";
import { useMetricsStore } from "@/stores/metrics-store";
import { api } from "@/lib/api/client";
import type { ClusterInfo, ClusterMetrics, MetricPoint, MetricSeries } from "@/lib/api/types";
import {
  formatBytes,
  formatNumber,
  formatUptime,
  formatPercent,
} from "@/lib/formatters";
import { CE_LIMITS, METRIC_INTERVAL_MS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ---------------------------------------------------------------------------
// Chart helpers
// ---------------------------------------------------------------------------

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

function buildTpsChartData(readTps: MetricPoint[], writeTps: MetricPoint[]) {
  return readTps.map((r, i) => ({
    time: formatTimestamp(r.timestamp),
    reads: Math.round(r.value),
    writes: Math.round(writeTps[i]?.value ?? 0),
  }));
}

function buildConnectionChartData(history: MetricPoint[]) {
  return history.map((p) => ({
    time: formatTimestamp(p.timestamp),
    connections: Math.round(p.value),
  }));
}

function buildNsChartData(series: MetricSeries[]) {
  if (series.length === 0) return [];
  const len = series[0].data.length;
  const result = [];
  for (let i = 0; i < len; i++) {
    const point: Record<string, string | number> = {
      time: formatTimestamp(series[0].data[i].timestamp),
    };
    for (const s of series) {
      point[s.label] = Math.round((s.data[i]?.value ?? 0) * 100) / 100;
    }
    result.push(point);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Prometheus mock data generator
// ---------------------------------------------------------------------------

function generatePrometheusMetrics(metrics: ClusterMetrics): string {
  const lines: string[] = [];
  lines.push("# HELP aerospike_node_up Node availability");
  lines.push("# TYPE aerospike_node_up gauge");
  lines.push(`aerospike_node_up{cluster="${metrics.connectionId}"} ${metrics.connected ? 1 : 0}`);
  lines.push("");
  lines.push("# HELP aerospike_node_uptime_seconds Node uptime in seconds");
  lines.push("# TYPE aerospike_node_uptime_seconds gauge");
  lines.push(`aerospike_node_uptime_seconds{cluster="${metrics.connectionId}"} ${metrics.uptime}`);
  lines.push("");
  lines.push("# HELP aerospike_client_connections Current client connections");
  lines.push("# TYPE aerospike_client_connections gauge");
  lines.push(`aerospike_client_connections{cluster="${metrics.connectionId}"} ${metrics.clientConnections}`);
  lines.push("");
  lines.push("# HELP aerospike_read_reqs_total Total read requests");
  lines.push("# TYPE aerospike_read_reqs_total counter");
  lines.push(`aerospike_read_reqs_total{cluster="${metrics.connectionId}"} ${metrics.totalReadReqs}`);
  lines.push("");
  lines.push("# HELP aerospike_write_reqs_total Total write requests");
  lines.push("# TYPE aerospike_write_reqs_total counter");
  lines.push(`aerospike_write_reqs_total{cluster="${metrics.connectionId}"} ${metrics.totalWriteReqs}`);
  lines.push("");
  lines.push("# HELP aerospike_read_success_total Total successful reads");
  lines.push("# TYPE aerospike_read_success_total counter");
  lines.push(`aerospike_read_success_total{cluster="${metrics.connectionId}"} ${metrics.totalReadSuccess}`);
  lines.push("");
  lines.push("# HELP aerospike_write_success_total Total successful writes");
  lines.push("# TYPE aerospike_write_success_total counter");
  lines.push(`aerospike_write_success_total{cluster="${metrics.connectionId}"} ${metrics.totalWriteSuccess}`);

  for (const ns of metrics.namespaces) {
    lines.push("");
    lines.push("# HELP aerospike_namespace_objects Number of objects");
    lines.push("# TYPE aerospike_namespace_objects gauge");
    lines.push(`aerospike_namespace_objects{namespace="${ns.namespace}"} ${ns.objects}`);
    lines.push("");
    lines.push("# HELP aerospike_namespace_memory_used_bytes Memory used in bytes");
    lines.push("# TYPE aerospike_namespace_memory_used_bytes gauge");
    lines.push(`aerospike_namespace_memory_used_bytes{namespace="${ns.namespace}"} ${ns.memoryUsed}`);
    lines.push("");
    lines.push("# HELP aerospike_namespace_memory_total_bytes Total memory");
    lines.push("# TYPE aerospike_namespace_memory_total_bytes gauge");
    lines.push(`aerospike_namespace_memory_total_bytes{namespace="${ns.namespace}"} ${ns.memoryTotal}`);
    lines.push("");
    lines.push("# HELP aerospike_namespace_device_used_bytes Device storage used");
    lines.push("# TYPE aerospike_namespace_device_used_bytes gauge");
    lines.push(`aerospike_namespace_device_used_bytes{namespace="${ns.namespace}"} ${ns.deviceUsed}`);
    lines.push("");
    lines.push("# HELP aerospike_namespace_device_total_bytes Total device storage");
    lines.push("# TYPE aerospike_namespace_device_total_bytes gauge");
    lines.push(`aerospike_namespace_device_total_bytes{namespace="${ns.namespace}"} ${ns.deviceTotal}`);
    lines.push("");
    lines.push("# HELP aerospike_namespace_read_reqs Namespace read requests");
    lines.push("# TYPE aerospike_namespace_read_reqs counter");
    lines.push(`aerospike_namespace_read_reqs{namespace="${ns.namespace}"} ${ns.readReqs}`);
    lines.push("");
    lines.push("# HELP aerospike_namespace_write_reqs Namespace write requests");
    lines.push("# TYPE aerospike_namespace_write_reqs counter");
    lines.push(`aerospike_namespace_write_reqs{namespace="${ns.namespace}"} ${ns.writeReqs}`);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ClusterPage({
  params,
}: {
  params: Promise<{ connId: string }>;
}) {
  const { connId } = use(params);

  // Static cluster data
  const {
    data: cluster,
    loading: clusterLoading,
    error: clusterError,
    refetch: fetchCluster,
  } = useAsyncData(() => api.getCluster(connId), [connId]);

  // Real-time metrics
  const { metrics, loading: metricsLoading, error: metricsError, startPolling, stopPolling, fetchMetrics } =
    useMetricsStore();
  const [promSearch, setPromSearch] = useState("");

  useEffect(() => {
    startPolling(connId);
    return () => stopPolling();
  }, [connId, startPolling, stopPolling]);

  // Memoized chart data
  const tpsData = useMemo(
    () => (metrics ? buildTpsChartData(metrics.readTps, metrics.writeTps) : []),
    [metrics],
  );
  const connData = useMemo(
    () => (metrics ? buildConnectionChartData(metrics.connectionHistory) : []),
    [metrics],
  );
  const memData = useMemo(
    () => (metrics ? buildNsChartData(metrics.memoryUsageByNs) : []),
    [metrics],
  );
  const devData = useMemo(
    () => (metrics ? buildNsChartData(metrics.deviceUsageByNs) : []),
    [metrics],
  );
  const promText = useMemo(
    () => (metrics ? generatePrometheusMetrics(metrics) : ""),
    [metrics],
  );

  // Loading state
  if (clusterLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  // Error state
  if (clusterError) {
    return (
      <FullPageError
        title="Failed to load cluster info"
        message={clusterError}
        onRetry={fetchCluster}
      />
    );
  }

  if (!cluster) return null;

  const firstNode = cluster.nodes[0];
  const edition = firstNode?.edition ?? "Unknown";
  const build = firstNode?.build ?? "Unknown";
  const dataPoints = metrics?.readTps?.length ?? 0;

  const readSuccessRate =
    metrics && metrics.totalReadReqs > 0
      ? Math.min(100, (metrics.totalReadSuccess / metrics.totalReadReqs) * 100).toFixed(1)
      : "100.0";
  const writeSuccessRate =
    metrics && metrics.totalWriteReqs > 0
      ? Math.min(100, (metrics.totalWriteSuccess / metrics.totalWriteReqs) * 100).toFixed(1)
      : "100.0";

  const filteredPromLines = promSearch
    ? promText
        .split("\n")
        .filter((l) => l.toLowerCase().includes(promSearch.toLowerCase()))
        .join("\n")
    : promText;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <PageHeader
        title="Cluster"
        description={<>{edition} &middot; Build {build}</>}
        actions={
          <div className="flex items-center gap-3">
            {metrics && (
              <>
                <StatusBadge
                  status={metrics.connected ? "live" : "disconnected"}
                />
                <Badge variant="outline" className="font-mono text-xs">
                  {METRIC_INTERVAL_MS / 1000}s interval
                </Badge>
              </>
            )}
            <Button variant="outline" size="sm" onClick={fetchCluster}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider font-medium">
              <Server className="h-3.5 w-3.5 text-accent" />
              Nodes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold metric-value">{cluster.nodes.length}</div>
            <p className="mt-1 text-xs text-muted-foreground font-mono">
              {edition} {build}
            </p>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider font-medium">
              <Database className="h-3.5 w-3.5 text-accent" />
              Namespaces
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold metric-value">
              {cluster.namespaces.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {cluster.namespaces.map((n) => n.name).join(", ")}
            </p>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider font-medium">
              <Network className="h-3.5 w-3.5 text-accent" />
              Node Names
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {cluster.nodes.map((node) => (
                <Badge key={node.name} variant="outline" className="font-mono text-[11px]">
                  {node.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="nodes">
        <TabsList>
          <TabsTrigger value="nodes">
            <Server className="mr-1.5 h-3.5 w-3.5" />
            Nodes ({cluster.nodes.length})
          </TabsTrigger>
          <TabsTrigger value="namespaces">
            <Database className="mr-1.5 h-3.5 w-3.5" />
            Namespaces ({cluster.namespaces.length})
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-1">
            <Activity className="mr-1.5 h-3.5 w-3.5" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="prometheus" className="gap-1">
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Prometheus
          </TabsTrigger>
        </TabsList>

        {/* === Nodes Tab === */}
        <TabsContent value="nodes" className="space-y-4 mt-4">
          {cluster.nodes.length === 0 ? (
            <EmptyState
              icon={Server}
              title="No nodes"
              description="No nodes found in this cluster."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {cluster.nodes.map((node, idx) => (
                <Card
                  key={node.name}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: "backwards" }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-mono">
                        {node.name}
                      </CardTitle>
                      <StatusBadge status="connected" label="Active" />
                    </div>
                    <CardDescription className="font-mono text-xs">
                      {node.address}:{node.port}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Build</span>
                        <p className="font-medium mt-0.5">{node.build}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Edition</span>
                        <p className="font-medium mt-0.5">{node.edition}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Uptime</span>
                        <p className="font-medium mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatUptime(node.uptime)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Connections</span>
                        <p className="font-medium mt-0.5 metric-value">
                          {formatNumber(node.clientConnections)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Cluster Size</span>
                        <p className="font-medium mt-0.5 metric-value">{node.clusterSize}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* === Namespaces Tab === */}
        <TabsContent value="namespaces" className="space-y-4 mt-4">
          {cluster.namespaces.length >= CE_LIMITS.MAX_NAMESPACES && (
            <CELimitBanner type="namespaces" />
          )}
          {cluster.namespaces.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No namespaces"
              description="No namespaces found in this cluster."
            />
          ) : (
            <div className="grid gap-4">
              {cluster.namespaces.map((ns, idx) => {
                const memPercent = formatPercent(ns.memoryUsed, ns.memoryTotal);
                const devPercent = formatPercent(ns.deviceUsed, ns.deviceTotal);
                return (
                  <Card
                    key={ns.name}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: "backwards" }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <CardTitle className="text-base">{ns.name}</CardTitle>
                          <Badge variant="secondary" className="text-[11px] font-mono">
                            {formatNumber(ns.objects)} objects
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {ns.stopWrites && (
                            <StatusBadge status="error" label="Stop Writes" />
                          )}
                          {ns.hwmBreached && (
                            <StatusBadge status="warning" label="HWM Breached" />
                          )}
                          {!ns.stopWrites && !ns.hwmBreached && (
                            <StatusBadge status="ready" label="Healthy" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                            <HardDrive className="h-3 w-3" />
                            Memory
                          </span>
                          <span className="font-mono text-xs">
                            {formatBytes(ns.memoryUsed)} / {formatBytes(ns.memoryTotal)} ({memPercent}%)
                          </span>
                        </div>
                        <Progress
                          value={memPercent}
                          className={cn("h-1.5", memPercent > 80 && "[&>div]:bg-red-500")}
                        />
                      </div>
                      {ns.deviceTotal > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                              <HardDrive className="h-3 w-3" />
                              Device
                            </span>
                            <span className="font-mono text-xs">
                              {formatBytes(ns.deviceUsed)} / {formatBytes(ns.deviceTotal)} ({devPercent}%)
                            </span>
                          </div>
                          <Progress
                            value={devPercent}
                            className={cn("h-1.5", devPercent > 80 && "[&>div]:bg-red-500")}
                          />
                        </div>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Replication</span>
                          <p className="font-medium metric-value">{ns.replicationFactor}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">HWM Memory</span>
                          <p className="font-medium metric-value">{ns.highWaterMemoryPct}%</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">HWM Disk</span>
                          <p className="font-medium metric-value">{ns.highWaterDiskPct}%</p>
                        </div>
                      </div>
                      {ns.sets.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="text-xs font-medium mb-2.5 uppercase tracking-wider text-muted-foreground">
                              Sets ({ns.sets.length})
                            </h4>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {ns.sets.map((s) => (
                                <div
                                  key={s.name}
                                  className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm hover:bg-muted/30 transition-colors"
                                >
                                  <span className="font-medium text-sm">{s.name}</span>
                                  <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="text-[11px] font-mono">
                                      {formatNumber(s.objects)} obj
                                    </Badge>
                                    <Badge variant="outline" className="text-[11px] font-mono">
                                      {formatBytes(s.memoryDataBytes)}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* === Metrics Tab === */}
        <TabsContent value="metrics" className="space-y-6 mt-4">
          {!metrics ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[90px] rounded-lg" />
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[280px] rounded-lg" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <StatCard
                  label="Read Requests"
                  value={formatNumber(metrics.totalReadReqs)}
                  icon={TrendingUp}
                  trend="up"
                  subtitle={`${readSuccessRate}% success`}
                />
                <StatCard
                  label="Write Requests"
                  value={formatNumber(metrics.totalWriteReqs)}
                  icon={TrendingDown}
                  trend="up"
                  subtitle={`${writeSuccessRate}% success`}
                />
                <StatCard
                  label="Read Success"
                  value={`${readSuccessRate}%`}
                  icon={Activity}
                  trend={Number(readSuccessRate) > 99 ? "up" : "down"}
                />
                <StatCard
                  label="Write Success"
                  value={`${writeSuccessRate}%`}
                  icon={Activity}
                  trend={Number(writeSuccessRate) > 99 ? "up" : "down"}
                />
                <StatCard
                  label="Client Connections"
                  value={formatNumber(metrics.clientConnections)}
                  icon={Wifi}
                />
                <StatCard
                  label="Uptime"
                  value={formatUptime(metrics.uptime)}
                  icon={Clock}
                />
              </div>

              {/* Charts 2x2 grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Read / Write TPS</CardTitle>
                    <CardDescription>Transactions per second over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={tpsData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="time" tick={{ fontSize: 11 }} className="text-muted-foreground" interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" width={45} />
                          <RechartsTooltip content={<ChartTooltipContent />} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                          <Line type="monotone" dataKey="reads" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name="Reads" />
                          <Line type="monotone" dataKey="writes" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="Writes" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Client Connections</CardTitle>
                    <CardDescription>Active connections over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={connData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="time" tick={{ fontSize: 11 }} className="text-muted-foreground" interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" width={45} />
                          <RechartsTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="connections" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} name="Connections" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Memory Usage by Namespace
                    </CardTitle>
                    <CardDescription>Percentage of memory used per namespace</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={memData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="time" tick={{ fontSize: 11 }} className="text-muted-foreground" interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" width={45} domain={[0, "auto"]} unit="%" />
                          <RechartsTooltip content={<ChartTooltipContent />} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                          {metrics.memoryUsageByNs.map((s) => (
                            <Area key={s.name} type="monotone" dataKey={s.label} stackId="mem" stroke={s.color} fill={s.color} fillOpacity={0.3} strokeWidth={2} name={s.label} />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Device Usage by Namespace
                    </CardTitle>
                    <CardDescription>Percentage of device storage used per namespace</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={devData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="time" tick={{ fontSize: 11 }} className="text-muted-foreground" interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" width={45} domain={[0, "auto"]} unit="%" />
                          <RechartsTooltip content={<ChartTooltipContent />} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                          {metrics.deviceUsageByNs.map((s) => (
                            <Area key={s.name} type="monotone" dataKey={s.label} stackId="dev" stroke={s.color} fill={s.color} fillOpacity={0.3} strokeWidth={2} name={s.label} />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Namespace detail cards */}
              <div>
                <h2 className="text-lg font-semibold mb-3 tracking-tight">Namespace Metrics</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {metrics.namespaces.map((ns) => {
                    const memPct = formatPercent(ns.memoryUsed, ns.memoryTotal);
                    const devPct = formatPercent(ns.deviceUsed, ns.deviceTotal);
                    return (
                      <Card key={ns.namespace}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{ns.namespace}</CardTitle>
                            <Badge variant="secondary" className="font-mono text-xs">
                              {formatNumber(ns.objects)} objects
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Memory</span>
                              <span className="font-mono text-xs">
                                {formatBytes(ns.memoryUsed)} / {formatBytes(ns.memoryTotal)} ({memPct}%)
                              </span>
                            </div>
                            <Progress value={memPct} className={cn("h-2", memPct > 80 && "[&>div]:bg-red-500")} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Device</span>
                              <span className="font-mono text-xs">
                                {formatBytes(ns.deviceUsed)} / {formatBytes(ns.deviceTotal)} ({devPct}%)
                              </span>
                            </div>
                            <Progress value={devPct} className={cn("h-2", devPct > 80 && "[&>div]:bg-red-500")} />
                          </div>
                          <Separator />
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-xs text-muted-foreground uppercase tracking-wider">Reads</span>
                              <p className="font-mono font-medium metric-value">{formatNumber(ns.readReqs)}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground uppercase tracking-wider">Writes</span>
                              <p className="font-mono font-medium metric-value">{formatNumber(ns.writeReqs)}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground uppercase tracking-wider">Read Success</span>
                              <p className="font-mono font-medium metric-value">{formatNumber(ns.readSuccess)}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground uppercase tracking-wider">Write Success</span>
                              <p className="font-mono font-medium metric-value">{formatNumber(ns.writeSuccess)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* === Prometheus Tab === */}
        <TabsContent value="prometheus" className="space-y-4 mt-4">
          {!metrics ? (
            <Skeleton className="h-[500px] rounded-lg" />
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Prometheus Metrics</CardTitle>
                    <CardDescription>OpenMetrics-compatible output from aerospike-py</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter metrics..."
                      value={promSearch}
                      onChange={(e) => setPromSearch(e.target.value)}
                      className="pl-8 h-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all">
                    {filteredPromLines.split("\n").map((line, i) => {
                      const isComment = line.startsWith("#");
                      const isHelp = line.startsWith("# HELP");
                      const isType = line.startsWith("# TYPE");
                      return (
                        <div
                          key={i}
                          className={cn(
                            isHelp && "text-muted-foreground",
                            isType && "text-muted-foreground italic",
                            !isComment && line.trim() && "text-foreground",
                            !line.trim() && "h-2"
                          )}
                        >
                          {line}
                        </div>
                      );
                    })}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
