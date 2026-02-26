"use client";

import { ConfirmDialog } from "@/components/common/confirm-dialog";

interface K8sDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clusterName: string;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export function K8sDeleteDialog({
  open,
  onOpenChange,
  clusterName,
  onConfirm,
  loading,
}: K8sDeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Cluster"
      description={`Are you sure you want to delete "${clusterName}"? This will destroy all data in the cluster. This action cannot be undone.`}
      confirmLabel="Delete Cluster"
      variant="destructive"
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}
