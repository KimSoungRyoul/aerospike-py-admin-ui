import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}

export const StatCard = React.memo(function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  subtitle,
}: StatCardProps) {
  return (
    <Card className="card-interactive">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight metric-value">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              trend === "up" && "bg-green-500/10 text-green-500",
              trend === "down" && "bg-red-500/10 text-red-500",
              (!trend || trend === "neutral") && "bg-accent/10 text-accent",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
