"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "connected"
  | "disconnected"
  | "checking"
  | "ready"
  | "building"
  | "error"
  | "live"
  | "warning";

const statusConfig: Record<StatusType, { label: string; className: string; dotColor: string }> = {
  connected: {
    label: "Connected",
    className: "bg-success/10 text-success border-success/20",
    dotColor: "bg-success",
  },
  disconnected: {
    label: "Disconnected",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    dotColor: "bg-destructive",
  },
  checking: {
    label: "Checking...",
    className: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20",
    dotColor: "bg-muted-foreground",
  },
  ready: {
    label: "Ready",
    className: "bg-success/10 text-success border-success/20",
    dotColor: "bg-success",
  },
  building: {
    label: "Building",
    className: "bg-warning/10 text-warning border-warning/20",
    dotColor: "bg-warning",
  },
  error: {
    label: "Error",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    dotColor: "bg-destructive",
  },
  live: {
    label: "Live",
    className: "bg-success/10 text-success border-success/20",
    dotColor: "bg-success",
  },
  warning: {
    label: "Warning",
    className: "bg-warning/10 text-warning border-warning/20",
    dotColor: "bg-warning",
  },
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
  pulse?: boolean;
}

export function StatusBadge({ status, label, className, pulse }: StatusBadgeProps) {
  const config = statusConfig[status];
  const showPulse =
    pulse ||
    status === "connected" ||
    status === "live" ||
    status === "ready" ||
    status === "checking";

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 py-0.5 text-[11px] font-medium", config.className, className)}
    >
      <span className="relative flex h-1.5 w-1.5">
        {showPulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
              config.dotColor,
            )}
          />
        )}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", config.dotColor)} />
      </span>
      {label || config.label}
    </Badge>
  );
}
