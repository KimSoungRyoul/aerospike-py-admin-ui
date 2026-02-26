"use client";

import { PageHeader } from "@/components/common/page-header";
import { K8sClusterWizard } from "@/components/k8s/k8s-cluster-wizard";

export default function CreateK8sClusterPage() {
  return (
    <div className="animate-fade-in space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Create Cluster"
        description="Deploy a new Aerospike CE cluster on Kubernetes"
      />
      <K8sClusterWizard />
    </div>
  );
}
