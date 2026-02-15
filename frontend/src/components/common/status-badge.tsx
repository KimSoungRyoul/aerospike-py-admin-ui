"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "connected"
  | "disconnected"
  | "ready"
  | "building"
  | "error"
  | "live"
  | "warning";

const statusConfig: Record<StatusType, { label: string; className: string; dotColor: string }> = {
  connected: {
    label: "Connected",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-500/20",
    dotColor: "bg-emerald-500",
  },
  disconnected: {
    label: "Disconnected",
    className: "bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-red-500/20",
    dotColor: "bg-red-500",
  },
  ready: {
    label: "Ready",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-500/20",
    dotColor: "bg-emerald-500",
  },
  building: {
    label: "Building",
    className:
      "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-500/20",
    dotColor: "bg-amber-500",
  },
  error: {
    label: "Error",
    className: "bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-red-500/20",
    dotColor: "bg-red-500",
  },
  live: {
    label: "Live",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-500/20",
    dotColor: "bg-emerald-500",
  },
  warning: {
    label: "Warning",
    className:
      "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-500/20",
    dotColor: "bg-amber-500",
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
  const showPulse = pulse || status === "connected" || status === "live" || status === "ready";

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
