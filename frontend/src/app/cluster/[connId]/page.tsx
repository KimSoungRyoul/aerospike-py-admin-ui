"use client";

import { use, useEffect, useMemo } from "react";
import {
  Activity,
  Clock,
  Database,
  HardDrive,
  Network,
  RefreshCw,
  Server,
  TrendingUp,
  TrendingDown,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common/page-header";
import { FullPageError } from "@/components/common/full-page-error";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { StatCard } from "@/components/common/stat-card";
import { ChartTooltipContent } from "@/components/common/chart-tooltip";
import { useAsyncData } from "@/hooks/use-async-data";
import { useMetricsStore } from "@/stores/metrics-store";
import { api } from "@/lib/api/client";
import type { MetricPoint, MetricSeries } from "@/lib/api/types";
import { formatBytes, formatNumber, formatUptime, formatPercent } from "@/lib/formatters";
import { METRIC_INTERVAL_MS } from "@/lib/constants";
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
// Page
// ---------------------------------------------------------------------------

export default function ClusterPage({ params }: { params: Promise<{ connId: string }> }) {
  const { connId } = use(params);

  // Static cluster data
  const {
    data: cluster,
    loading: clusterLoading,
    error: clusterError,
    refetch: fetchCluster,
  } = useAsyncData(() => api.getCluster(connId), [connId]);

  // Real-time metrics
  const { metrics, startPolling, stopPolling } = useMetricsStore();

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

  // Loading state
  if (clusterLoading) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
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
  const readSuccessRate =
    metrics && metrics.totalReadReqs > 0
      ? Math.min(100, (metrics.totalReadSuccess / metrics.totalReadReqs) * 100).toFixed(1)
      : "100.0";
  const writeSuccessRate =
    metrics && metrics.totalWriteReqs > 0
      ? Math.min(100, (metrics.totalWriteSuccess / metrics.totalWriteReqs) * 100).toFixed(1)
      : "100.0";

  return (
    <div className="animate-fade-in space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Overview"
        description={
          <>
            {edition} &middot; Build {build}
          </>
        }
        actions={
          <div className="flex items-center gap-3">
            {metrics && (
              <>
                <StatusBadge status={metrics.connected ? "live" : "disconnected"} />
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
            <CardDescription className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase">
              <Server className="text-accent h-3.5 w-3.5" />
              Nodes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="metric-value text-3xl font-bold">{cluster.nodes.length}</div>
            <p className="text-muted-foreground mt-1 font-mono text-xs">
              {edition} {build}
            </p>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase">
              <Database className="text-accent h-3.5 w-3.5" />
              Namespaces
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="metric-value text-3xl font-bold">{cluster.namespaces.length}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {cluster.namespaces.map((n) => n.name).join(", ")}
            </p>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase">
              <Network className="text-accent h-3.5 w-3.5" />
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
            <span className="hidden sm:inline">Nodes ({cluster.nodes.length})</span>
            <span className="sm:hidden">{cluster.nodes.length}</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-1">
            <Activity className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
        </TabsList>

        {/* === Nodes Tab === */}
        <TabsContent value="nodes" className="mt-4 space-y-4">
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
                      <CardTitle className="font-mono text-base">{node.name}</CardTitle>
                      <StatusBadge status="connected" label="Active" />
                    </div>
                    <CardDescription className="font-mono text-xs">
                      {node.address}:{node.port}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs tracking-wider uppercase">
                          Build
                        </span>
                        <p className="mt-0.5 font-medium">{node.build}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs tracking-wider uppercase">
                          Edition
                        </span>
                        <p className="mt-0.5 font-medium">{node.edition}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs tracking-wider uppercase">
                          Uptime
                        </span>
                        <p className="mt-0.5 flex items-center gap-1 font-medium">
                          <Clock className="text-muted-foreground h-3 w-3" />
                          {formatUptime(node.uptime)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs tracking-wider uppercase">
                          Connections
                        </span>
                        <p className="metric-value mt-0.5 font-medium">
                          {formatNumber(node.clientConnections)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs tracking-wider uppercase">
                          Cluster Size
                        </span>
                        <p className="metric-value mt-0.5 font-medium">{node.clusterSize}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* === Dashboard Tab === */}
        <TabsContent value="dashboard" className="mt-4 space-y-6">
          {!metrics ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
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
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
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
                <StatCard label="Uptime" value={formatUptime(metrics.uptime)} icon={Clock} />
              </div>

              {/* Charts 2x2 grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Read / Write TPS</CardTitle>
                    <CardDescription>Transactions per second over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[180px] sm:h-[220px] lg:h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={tpsData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis
                            dataKey="time"
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                            width={45}
                          />
                          <RechartsTooltip content={<ChartTooltipContent />} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                          <Line
                            type="monotone"
                            dataKey="reads"
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={2}
                            dot={false}
                            name="Reads"
                          />
                          <Line
                            type="monotone"
                            dataKey="writes"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={2}
                            dot={false}
                            name="Writes"
                          />
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
                    <div className="h-[180px] sm:h-[220px] lg:h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={connData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis
                            dataKey="time"
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                            width={45}
                          />
                          <RechartsTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="connections"
                            stroke="hsl(var(--chart-3))"
                            strokeWidth={2}
                            dot={false}
                            name="Connections"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Database className="h-4 w-4" />
                      Memory Usage by Namespace
                    </CardTitle>
                    <CardDescription>Percentage of memory used per namespace</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[180px] sm:h-[220px] lg:h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={memData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis
                            dataKey="time"
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                            width={45}
                            domain={[0, "auto"]}
                            unit="%"
                          />
                          <RechartsTooltip content={<ChartTooltipContent />} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                          {metrics.memoryUsageByNs.map((s) => (
                            <Area
                              key={s.name}
                              type="monotone"
                              dataKey={s.label}
                              stackId="mem"
                              stroke={s.color}
                              fill={s.color}
                              fillOpacity={0.3}
                              strokeWidth={2}
                              name={s.label}
                            />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <HardDrive className="h-4 w-4" />
                      Device Usage by Namespace
                    </CardTitle>
                    <CardDescription>
                      Percentage of device storage used per namespace
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[180px] sm:h-[220px] lg:h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={devData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis
                            dataKey="time"
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                            width={45}
                            domain={[0, "auto"]}
                            unit="%"
                          />
                          <RechartsTooltip content={<ChartTooltipContent />} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                          {metrics.deviceUsageByNs.map((s) => (
                            <Area
                              key={s.name}
                              type="monotone"
                              dataKey={s.label}
                              stackId="dev"
                              stroke={s.color}
                              fill={s.color}
                              fillOpacity={0.3}
                              strokeWidth={2}
                              name={s.label}
                            />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Namespace detail cards */}
              <div>
                <h2 className="mb-3 text-lg font-semibold tracking-tight">Namespace Detail</h2>
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
                                {formatBytes(ns.memoryUsed)} / {formatBytes(ns.memoryTotal)} (
                                {memPct}%)
                              </span>
                            </div>
                            <Progress
                              value={memPct}
                              className={cn("h-2", memPct > 80 && "[&>div]:bg-destructive")}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Device</span>
                              <span className="font-mono text-xs">
                                {formatBytes(ns.deviceUsed)} / {formatBytes(ns.deviceTotal)} (
                                {devPct}%)
                              </span>
                            </div>
                            <Progress
                              value={devPct}
                              className={cn("h-2", devPct > 80 && "[&>div]:bg-destructive")}
                            />
                          </div>
                          <Separator />
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground text-xs tracking-wider uppercase">
                                Reads
                              </span>
                              <p className="metric-value font-mono font-medium">
                                {formatNumber(ns.readReqs)}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs tracking-wider uppercase">
                                Writes
                              </span>
                              <p className="metric-value font-mono font-medium">
                                {formatNumber(ns.writeReqs)}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs tracking-wider uppercase">
                                Read Success
                              </span>
                              <p className="metric-value font-mono font-medium">
                                {formatNumber(ns.readSuccess)}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs tracking-wider uppercase">
                                Write Success
                              </span>
                              <p className="metric-value font-mono font-medium">
                                {formatNumber(ns.writeSuccess)}
                              </p>
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
      </Tabs>
    </div>
  );
}
