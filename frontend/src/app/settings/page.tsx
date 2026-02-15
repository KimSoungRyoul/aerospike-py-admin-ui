"use client";

import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Info,
  Database,
  AlertTriangle,
  Server,
  HardDrive,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUIStore, type Theme } from "@/stores/ui-store";
import { CE_LIMITS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const themeOptions: { value: Theme; label: string; icon: React.ElementType; description: string }[] = [
  { value: "light", label: "Light", icon: Sun, description: "Clean, bright interface" },
  { value: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes" },
  { value: "system", label: "System", icon: Monitor, description: "Follow OS preference" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-2xl p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Application preferences and information
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200",
                  theme === opt.value
                    ? "border-accent bg-accent/5 shadow-sm"
                    : "border-border/60 hover:border-accent/40 hover:bg-muted/30"
                )}
              >
                <opt.icon
                  className={cn(
                    "h-6 w-6 transition-colors",
                    theme === opt.value
                      ? "text-accent"
                      : "text-muted-foreground"
                  )}
                />
                <div className="text-center">
                  <span
                    className={cn(
                      "text-sm font-medium block",
                      theme === opt.value
                        ? "text-accent"
                        : "text-foreground"
                    )}
                  >
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    {opt.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CE Limitations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Aerospike CE Limitations
          </CardTitle>
          <CardDescription>
            Community Edition restrictions to be aware of
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <Server className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Max Nodes per Cluster</p>
                  <p className="text-xs text-muted-foreground">
                    Cluster cannot exceed this node count
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="font-mono">
                {CE_LIMITS.MAX_NODES}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Max Namespaces</p>
                  <p className="text-xs text-muted-foreground">
                    Maximum number of namespaces per cluster
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="font-mono">
                {CE_LIMITS.MAX_NAMESPACES}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Max Data Capacity</p>
                  <p className="text-xs text-muted-foreground">
                    Approximately 5TB total (2.5TB unique data)
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="font-mono">
                ~{CE_LIMITS.MAX_DATA_TB} TB
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Durable Deletes</p>
                  <p className="text-xs text-muted-foreground">
                    Deletes not persistent across cold restarts
                  </p>
                </div>
              </div>
              <Badge variant="destructive" className="text-[11px]">Not Supported</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <Server className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    XDR (Cross Datacenter Replication)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enterprise-only feature
                  </p>
                </div>
              </div>
              <Badge variant="destructive" className="text-[11px]">Not Supported</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-accent" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Application</span>
              <span className="font-medium">Aerospike Desktop Manager</span>
            </div>
            <Separator className="bg-border/50" />
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono text-xs">0.1.0</span>
            </div>
            <Separator className="bg-border/50" />
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Framework</span>
              <span className="font-mono text-xs">Next.js 16</span>
            </div>
            <Separator className="bg-border/50" />
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">UI Library</span>
              <span className="font-mono text-xs">shadcn/ui + Tailwind CSS</span>
            </div>
            <Separator className="bg-border/50" />
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Backend Client</span>
              <span className="font-mono text-xs">aerospike-py</span>
            </div>
            <Separator className="bg-border/50" />
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Observability</span>
              <span className="font-mono text-xs">OpenTelemetry / Prometheus</span>
            </div>
            <Separator className="bg-border/50" />
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Desktop</span>
              <span className="font-mono text-xs">Tauri 2 (planned)</span>
            </div>
          </div>

          <div className="rounded-lg bg-muted/40 p-3.5 text-xs text-muted-foreground leading-relaxed dark:bg-muted/20">
            This application is designed for managing Aerospike Community Edition
            clusters. It provides data browsing, query building, index management,
            user/role administration, UDF management, and OTel-based observability
            through a modern web interface.
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Keyboard Shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-0.5">
              <span className="text-muted-foreground">Toggle Sidebar</span>
              <div className="flex gap-1">
                <kbd className="rounded-md border bg-muted/50 px-2 py-0.5 text-[11px] font-mono shadow-sm">
                  Cmd
                </kbd>
                <kbd className="rounded-md border bg-muted/50 px-2 py-0.5 text-[11px] font-mono shadow-sm">
                  B
                </kbd>
              </div>
            </div>
            <Separator className="bg-border/50" />
            <div className="flex items-center justify-between py-0.5">
              <span className="text-muted-foreground">Toggle Terminal</span>
              <div className="flex gap-1">
                <kbd className="rounded-md border bg-muted/50 px-2 py-0.5 text-[11px] font-mono shadow-sm">
                  Cmd
                </kbd>
                <kbd className="rounded-md border bg-muted/50 px-2 py-0.5 text-[11px] font-mono shadow-sm">
                  `
                </kbd>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
