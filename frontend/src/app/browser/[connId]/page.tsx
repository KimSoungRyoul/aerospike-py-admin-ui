"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { Database, RefreshCw, ChevronRight, HardDrive, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { InlineAlert } from "@/components/common/inline-alert";
import { StatusBadge } from "@/components/common/status-badge";
import { useAsyncData } from "@/hooks/use-async-data";
import { api } from "@/lib/api/client";
import { formatNumber, formatBytes, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default function BrowserSetListPage({ params }: { params: Promise<{ connId: string }> }) {
  const { connId } = use(params);
  const router = useRouter();
  const {
    data: clusterInfo,
    loading,
    error,
    refetch: fetchData,
  } = useAsyncData(() => api.getCluster(connId), [connId]);

  const namespaces = clusterInfo?.namespaces ?? [];
  const totalSets = namespaces.reduce((sum, ns) => sum + ns.sets.length, 0);

  return (
    <div className="animate-fade-in space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Data"
        description="Select a set to browse records"
        actions={
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* Stats */}
      {!loading && clusterInfo && (
        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            <span>
              <span className="text-foreground font-semibold">{namespaces.length}</span> namespaces
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="h-4 w-4" />
            <span>
              <span className="text-foreground font-semibold">{totalSets}</span> sets
            </span>
          </div>
        </div>
      )}

      <InlineAlert message={error} />

      {/* Content */}
      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Separator />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : namespaces.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No namespaces"
          description="No namespaces found in this cluster."
        />
      ) : (
        <div className="grid gap-4">
          {namespaces.map((ns, idx) => {
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
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        {formatNumber(ns.objects)} objects
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {ns.stopWrites && <StatusBadge status="error" label="Stop Writes" />}
                      {ns.hwmBreached && <StatusBadge status="warning" label="HWM Breached" />}
                      {!ns.stopWrites && !ns.hwmBreached && (
                        <StatusBadge status="ready" label="Healthy" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Memory */}
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

                  {/* Device */}
                  {ns.deviceTotal > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <HardDrive className="h-3 w-3" />
                          Device
                        </span>
                        <span className="font-mono text-xs">
                          {formatBytes(ns.deviceUsed)} / {formatBytes(ns.deviceTotal)} ({devPercent}
                          %)
                        </span>
                      </div>
                      <Progress
                        value={devPercent}
                        className={cn("h-1.5", devPercent > 80 && "[&>div]:bg-red-500")}
                      />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs tracking-wider uppercase">
                        Replication
                      </span>
                      <p className="metric-value font-medium">{ns.replicationFactor}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs tracking-wider uppercase">
                        HWM Memory
                      </span>
                      <p className="metric-value font-medium">{ns.highWaterMemoryPct}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs tracking-wider uppercase">
                        HWM Disk
                      </span>
                      <p className="metric-value font-medium">{ns.highWaterDiskPct}%</p>
                    </div>
                  </div>

                  {/* Sets */}
                  <Separator />
                  <div>
                    <h4 className="text-muted-foreground mb-2.5 text-xs font-medium tracking-wider uppercase">
                      Sets ({ns.sets.length})
                    </h4>
                    {ns.sets.length === 0 ? (
                      <p className="text-muted-foreground py-3 text-center text-xs">
                        No sets in this namespace
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {ns.sets.map((s) => (
                          <button
                            key={s.name}
                            onClick={() =>
                              router.push(
                                `/browser/${connId}/${encodeURIComponent(ns.name)}/${encodeURIComponent(s.name)}`,
                              )
                            }
                            className="group border-border/60 hover:border-accent/40 hover:bg-accent/5 flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all"
                          >
                            <span className="text-sm font-medium">{s.name}</span>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="font-mono text-[11px]">
                                {formatNumber(s.objects)} obj
                              </Badge>
                              {s.memoryDataBytes > 0 && (
                                <Badge variant="outline" className="font-mono text-[11px]">
                                  {formatBytes(s.memoryDataBytes)}
                                </Badge>
                              )}
                              <ChevronRight className="text-muted-foreground/40 group-hover:text-accent h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
