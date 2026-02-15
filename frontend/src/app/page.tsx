"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Import,
  Download,
  Server,
  Pencil,
  Trash2,
  Database,
  Loader2,
  Wifi,
  WifiOff,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { useConnectionStore } from "@/stores/connection-store";
import type { ConnectionProfile, ConnectionWithStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#0097D3",
  "#c4373a",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
];

interface ConnectionFormData {
  name: string;
  hosts: string;
  port: string;
  username: string;
  password: string;
  color: string;
}

const emptyForm: ConnectionFormData = {
  name: "",
  hosts: "127.0.0.1",
  port: "3000",
  username: "",
  password: "",
  color: PRESET_COLORS[0],
};

export default function ConnectionsPage() {
  const router = useRouter();
  const {
    connections,
    loading,
    error,
    fetchConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
  } = useConnectionStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ConnectionFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConnectionWithStatus | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const openCreateDialog = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
    setTestResult(null);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((conn: ConnectionWithStatus) => {
    setEditingId(conn.id);
    setForm({
      name: conn.name,
      hosts: conn.hosts.join(", "),
      port: String(conn.port),
      username: conn.username ?? "",
      password: "",
      color: conn.color,
    });
    setTestResult(null);
    setDialogOpen(true);
  }, []);

  const handleSave = async () => {
    if (!form.name.trim() || !form.hosts.trim()) return;
    setSaving(true);
    try {
      const data: Partial<ConnectionProfile> = {
        name: form.name.trim(),
        hosts: form.hosts.split(",").map((h) => h.trim()).filter(Boolean),
        port: parseInt(form.port, 10) || 3000,
        username: form.username || undefined,
        password: form.password || undefined,
        color: form.color,
      };
      if (editingId) {
        await updateConnection(editingId, data);
        toast.success("Connection updated");
      } else {
        await createConnection(data);
        toast.success("Connection created");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!editingId) {
      setTestResult({
        success: false,
        message: "Save the connection first to test it.",
      });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(editingId);
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteConnection(deleteTarget.id);
      toast.success("Connection deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = useCallback(() => {
    if (!window.confirm("Export connections? Passwords will NOT be included for security.")) return;
    const data = connections.map(({ name, hosts, port, color, username }) => ({
      name,
      hosts,
      port,
      color,
      ...(username ? { username } : {}),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aerospike-connections.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Connections exported (passwords excluded)");
  }, [connections]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (!Array.isArray(imported)) {
          toast.error("Invalid file format");
          return;
        }
        for (const conn of imported) {
          await createConnection(conn);
        }
        toast.success(`Imported ${imported.length} connection(s)`);
      } catch {
        toast.error("Failed to import connections");
      }
    };
    input.click();
  }, [createConnection]);

  const navigateToConnection = useCallback(
    (conn: ConnectionWithStatus) => {
      if (conn.status.connected) {
        router.push(`/browser/${conn.id}`);
      } else {
        router.push(`/cluster/${conn.id}`);
      }
    },
    [router]
  );

  if (loading && connections.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8 flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clusters</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your Aerospike clusters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleImport} className="hidden sm:flex">
            <Import className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={connections.length === 0}
            className="hidden sm:flex"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Connection
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive animate-fade-in">
          {error}
        </div>
      )}

      {connections.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No connections yet"
          description="Create your first connection to start managing Aerospike clusters."
          action={
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New Connection
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {connections.map((conn, idx) => (
            <Card
              key={conn.id}
              className={cn(
                "group cursor-pointer card-interactive animate-fade-in-up",
                "hover:border-accent/30"
              )}
              style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: "backwards" }}
              onClick={() => navigateToConnection(conn)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-3 w-3 rounded-full shrink-0 shadow-sm"
                      style={{
                        backgroundColor: conn.color,
                        boxShadow: `0 0 0 2px var(--color-card), 0 0 0 4px ${conn.color}30`,
                      }}
                    />
                    <CardTitle className="text-base">{conn.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="sr-only">Actions</span>
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                            fill="currentColor"
                          />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(conn);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(conn);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="font-mono text-xs tracking-wide">
                  {conn.hosts.join(", ")}:{conn.port}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge
                    status={conn.status.connected ? "connected" : "disconnected"}
                  />
                  {conn.status.connected && (
                    <>
                      <Badge variant="secondary" className="gap-1 text-[11px]">
                        <Server className="h-3 w-3" />
                        {conn.status.nodeCount} node
                        {conn.status.nodeCount !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="secondary" className="gap-1 text-[11px]">
                        <Database className="h-3 w-3" />
                        {conn.status.namespaceCount} ns
                      </Badge>
                    </>
                  )}
                </div>
                {conn.status.connected && conn.status.build && (
                  <p className="mt-2.5 text-xs text-muted-foreground font-mono">
                    {conn.status.edition} {conn.status.build}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Connection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Connection" : "New Connection"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the connection profile settings."
                : "Create a new Aerospike cluster connection."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="conn-name">Name</Label>
              <Input
                id="conn-name"
                placeholder="My Cluster"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="conn-hosts">Hosts (comma-separated)</Label>
              <Input
                id="conn-hosts"
                placeholder="127.0.0.1, 10.0.0.2"
                value={form.hosts}
                onChange={(e) => setForm({ ...form, hosts: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="conn-port">Port</Label>
              <Input
                id="conn-port"
                type="number"
                placeholder="3000"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="conn-user">Username</Label>
                <Input
                  id="conn-user"
                  placeholder="Optional"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="conn-pass">Password</Label>
                <Input
                  id="conn-pass"
                  type="password"
                  placeholder={editingId ? "••••••••" : "Optional"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full transition-all duration-150",
                      form.color === color
                        ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                        : "hover:scale-110 opacity-70 hover:opacity-100"
                    )}
                    style={{
                      backgroundColor: color,
                      boxShadow: form.color === color ? `0 0 0 2px var(--color-background), 0 0 0 4px ${color}` : undefined,
                    }}
                    onClick={() => setForm({ ...form, color })}
                  />
                ))}
              </div>
            </div>

            {testResult && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm animate-scale-in",
                  testResult.success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300"
                    : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300"
                )}
              >
                {testResult.success ? (
                  <Check className="h-4 w-4 shrink-0" />
                ) : (
                  <WifiOff className="h-4 w-4 shrink-0" />
                )}
                {testResult.message}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={testing}
                className="mr-auto"
              >
                {testing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wifi className="mr-2 h-4 w-4" />
                )}
                Test Connection
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.hosts.trim()}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Connection"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
