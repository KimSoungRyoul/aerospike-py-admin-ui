"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Scale, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { InlineAlert } from "@/components/common/inline-alert";
import { K8sClusterStatusBadge } from "@/components/k8s/k8s-cluster-status-badge";
import { K8sPodTable } from "@/components/k8s/k8s-pod-table";
import { K8sScaleDialog } from "@/components/k8s/k8s-scale-dialog";
import { K8sDeleteDialog } from "@/components/k8s/k8s-delete-dialog";
import { useK8sClusterStore } from "@/stores/k8s-cluster-store";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

export default function K8sClusterDetailPage() {
  const params = useParams<{ namespace: string; name: string }>();
  const router = useRouter();
  const { selectedCluster, loading, error, fetchCluster, scaleCluster, deleteCluster } =
    useK8sClusterStore();
  const [scaleOpen, setScaleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const namespace = params?.namespace || "";
  const name = params?.name || "";

  useEffect(() => {
    if (namespace && name) {
      fetchCluster(namespace, name);
    }
  }, [namespace, name, fetchCluster]);

  const handleScale = async (size: number) => {
    try {
      await scaleCluster(namespace, name, size);
      toast.success(`Cluster scaled to ${size} nodes`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCluster(namespace, name);
      toast.success(`Cluster "${name}" deletion initiated`);
      router.push("/k8s/clusters");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !selectedCluster) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="mb-6 h-8 w-64" />
        <div className="space-y-4">
          <Skeleton className="h-[200px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!selectedCluster) {
    return (
      <div className="p-6 lg:p-8">
        <InlineAlert message={error || "Cluster not found"} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 p-6 lg:p-8">
      <PageHeader
        title={selectedCluster.name}
        description={`${selectedCluster.namespace} / ${selectedCluster.image}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.push("/k8s/clusters")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={() => fetchCluster(namespace, name)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setScaleOpen(true)}>
              <Scale className="mr-2 h-4 w-4" />
              Scale
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </>
        }
      />

      <InlineAlert message={error} />

      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <K8sClusterStatusBadge phase={selectedCluster.phase} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">Size</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{selectedCluster.size}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">Image</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">{selectedCluster.image}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">Age</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{selectedCluster.age || "-"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pods */}
      <Card>
        <CardHeader>
          <CardTitle>Pods</CardTitle>
        </CardHeader>
        <CardContent>
          <K8sPodTable pods={selectedCluster.pods} />
        </CardContent>
      </Card>

      {/* Spec (collapsible JSON) */}
      <Card>
        <CardHeader>
          <CardTitle>Spec</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted max-h-80 overflow-auto rounded-lg p-4 font-mono text-xs">
            {JSON.stringify(selectedCluster.spec, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <K8sScaleDialog
        open={scaleOpen}
        onOpenChange={setScaleOpen}
        clusterName={selectedCluster.name}
        currentSize={selectedCluster.size}
        onScale={handleScale}
      />

      <K8sDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        clusterName={selectedCluster.name}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
