"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useAsyncData } from "@/hooks/use-async-data";
import { Plus, Trash2, RefreshCw, ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { InlineAlert } from "@/components/common/inline-alert";
import { LoadingButton } from "@/components/common/loading-button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { api } from "@/lib/api/client";
import type { SecondaryIndex, IndexType, ClusterInfo } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";

const INDEX_TYPES: { value: IndexType; label: string }[] = [
  { value: "numeric", label: "Numeric" },
  { value: "string", label: "String" },
  { value: "geo2dsphere", label: "Geo2DSphere" },
];

function indexTypeBadgeVariant(type: IndexType): "default" | "secondary" | "outline" {
  switch (type) {
    case "numeric":
      return "default";
    case "string":
      return "secondary";
    case "geo2dsphere":
      return "outline";
    default:
      return "secondary";
  }
}

export default function IndexesPage({ params }: { params: Promise<{ connId: string }> }) {
  const { connId } = use(params);
  const {
    data: indexes,
    loading,
    error,
    refetch: fetchIndexes,
  } = useAsyncData(() => api.getIndexes(connId), [connId]);

  // Cluster info for namespace dropdown
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [formNamespace, setFormNamespace] = useState("");
  const [formSet, setFormSet] = useState("");
  const [formBin, setFormBin] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<IndexType>("numeric");
  const [creating, setCreating] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<SecondaryIndex | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCluster = useCallback(async () => {
    try {
      const info = await api.getCluster(connId);
      setClusterInfo(info);
      if (info.namespaces.length > 0) {
        setFormNamespace((prev) => prev || info.namespaces[0].name);
      }
    } catch {
      // Cluster info is optional for this page
    }
  }, [connId]);

  useEffect(() => {
    fetchCluster();
  }, [fetchCluster]);

  const handleCreate = async () => {
    if (!formNamespace || !formBin.trim() || !formName.trim()) {
      toast.error("All fields are required");
      return;
    }
    setCreating(true);
    try {
      await api.createIndex(connId, {
        namespace: formNamespace,
        set: formSet.trim(),
        bin: formBin.trim(),
        name: formName.trim(),
        type: formType,
      });
      toast.success("Index created");
      setCreateOpen(false);
      setFormSet("");
      setFormBin("");
      setFormName("");
      await fetchIndexes();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteIndex(connId, deleteTarget.name, deleteTarget.namespace);
      toast.success("Index deleted");
      setDeleteTarget(null);
      await fetchIndexes();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const namespaces = clusterInfo?.namespaces ?? [];

  return (
    <div className="animate-fade-in space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Secondary Indexes"
        description="Manage secondary indexes for faster queries"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchIndexes}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Index
            </Button>
          </>
        }
      />

      <InlineAlert message={error} />

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !error && (!indexes || indexes.length === 0) ? (
        <EmptyState
          icon={ListTree}
          title="No secondary indexes"
          description="Create an index to speed up queries on specific bins."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Index
            </Button>
          }
        />
      ) : (
        <div className="border-border/60 overflow-x-auto rounded-xl border">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Namespace</th>
                <th className="hidden md:table-cell">Set</th>
                <th>Bin</th>
                <th>Type</th>
                <th className="hidden md:table-cell">State</th>
                <th className="w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {indexes?.map((index) => (
                <tr
                  key={`${index.namespace}-${index.name}`}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="font-mono font-medium">{index.name}</td>
                  <td>{index.namespace}</td>
                  <td className="hidden md:table-cell">
                    {index.set || <span className="text-muted-foreground italic">all</span>}
                  </td>
                  <td className="font-mono">{index.bin}</td>
                  <td>
                    <Badge variant={indexTypeBadgeVariant(index.type)}>{index.type}</Badge>
                  </td>
                  <td className="hidden md:table-cell">
                    <StatusBadge
                      status={
                        index.state === "ready"
                          ? "ready"
                          : index.state === "building"
                            ? "building"
                            : "error"
                      }
                    />
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-8 w-8 p-0"
                      onClick={() => setDeleteTarget(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Index Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Create Secondary Index</DialogTitle>
            <DialogDescription>Create a new secondary index on a bin.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Namespace</Label>
              <Select value={formNamespace} onValueChange={setFormNamespace}>
                <SelectTrigger>
                  <SelectValue placeholder="Select namespace" />
                </SelectTrigger>
                <SelectContent>
                  {namespaces.map((ns) => (
                    <SelectItem key={ns.name} value={ns.name}>
                      {ns.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Set (optional)</Label>
              <Input
                placeholder="set name"
                value={formSet}
                onChange={(e) => setFormSet(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Bin</Label>
              <Input
                placeholder="bin name"
                value={formBin}
                onChange={(e) => setFormBin(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Index Name</Label>
              <Input
                placeholder="idx_my_bin"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v as IndexType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDEX_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <LoadingButton
              onClick={handleCreate}
              disabled={creating || !formNamespace || !formBin.trim() || !formName.trim()}
              loading={creating}
            >
              Create
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Index"
        description={`Are you sure you want to delete index "${deleteTarget?.name}"? This may impact query performance.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
