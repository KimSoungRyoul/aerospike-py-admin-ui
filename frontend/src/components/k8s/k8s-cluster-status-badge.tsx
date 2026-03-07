import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/status-colors";
import type { K8sClusterPhase } from "@/lib/api/types";

const phaseConfig = {
  InProgress: {
    label: "In Progress",
    className: STATUS_COLORS.warning,
  },
  Completed: {
    label: "Running",
    className: STATUS_COLORS.success,
  },
  Error: {
    label: "Error",
    className: STATUS_COLORS.error,
  },
  ScalingUp: {
    label: "Scaling Up",
    className: STATUS_COLORS.info,
  },
  ScalingDown: {
    label: "Scaling Down",
    className: STATUS_COLORS.info,
  },
  WaitingForMigration: {
    label: "Migrating",
    className: STATUS_COLORS.warning,
  },
  RollingRestart: {
    label: "Restarting",
    className: STATUS_COLORS.warning,
  },
  ACLSync: {
    label: "ACL Sync",
    className: STATUS_COLORS.info,
  },
  Paused: {
    label: "Paused",
    className: STATUS_COLORS.neutral,
  },
  Deleting: {
    label: "Deleting",
    className: STATUS_COLORS.error,
  },
  Unknown: {
    label: "Unknown",
    className: STATUS_COLORS.neutral,
  },
} satisfies Partial<Record<K8sClusterPhase, { label: string; className: string }>>;

export function K8sClusterStatusBadge({ phase }: { phase: K8sClusterPhase | string }) {
  const config = phaseConfig[phase as K8sClusterPhase] ?? phaseConfig.Unknown;
  return (
    <Badge variant="outline" className={cn("text-[11px]", config.className)}>
      {config.label}
    </Badge>
  );
}
