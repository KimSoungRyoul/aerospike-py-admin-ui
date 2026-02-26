import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { K8sClusterPhase } from "@/lib/api/types";

const phaseConfig: Record<K8sClusterPhase, { label: string; className: string }> = {
  InProgress: {
    label: "In Progress",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  Completed: {
    label: "Running",
    className: "bg-success/10 text-success border-success/20",
  },
  Error: {
    label: "Error",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  Unknown: {
    label: "Unknown",
    className: "bg-muted text-muted-foreground border-muted",
  },
};

export function K8sClusterStatusBadge({ phase }: { phase: K8sClusterPhase }) {
  const config = phaseConfig[phase] || phaseConfig.Unknown;
  return (
    <Badge variant="outline" className={cn("text-[11px]", config.className)}>
      {config.label}
    </Badge>
  );
}
