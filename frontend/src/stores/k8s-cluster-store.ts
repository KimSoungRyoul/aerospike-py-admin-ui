import { create } from "zustand";
import type { K8sClusterSummary, K8sClusterDetail, CreateK8sClusterRequest } from "@/lib/api/types";
import { api } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils";

interface K8sClusterState {
  clusters: K8sClusterSummary[];
  selectedCluster: K8sClusterDetail | null;
  loading: boolean;
  error: string | null;
  k8sAvailable: boolean;

  checkAvailability: () => Promise<void>;
  fetchClusters: (namespace?: string) => Promise<void>;
  fetchCluster: (namespace: string, name: string) => Promise<void>;
  createCluster: (data: CreateK8sClusterRequest) => Promise<K8sClusterSummary>;
  deleteCluster: (namespace: string, name: string) => Promise<void>;
  scaleCluster: (namespace: string, name: string, size: number) => Promise<void>;
}

export const useK8sClusterStore = create<K8sClusterState>()((set, get) => ({
  clusters: [],
  selectedCluster: null,
  loading: false,
  error: null,
  k8sAvailable: false,

  checkAvailability: async () => {
    try {
      await api.getK8sClusters();
      set({ k8sAvailable: true });
    } catch {
      set({ k8sAvailable: false });
    }
  },

  fetchClusters: async (namespace?: string) => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const clusters = await api.getK8sClusters(namespace);
      set({ clusters, loading: false, k8sAvailable: true });
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
    }
  },

  fetchCluster: async (namespace: string, name: string) => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const cluster = await api.getK8sCluster(namespace, name);
      set({ selectedCluster: cluster, loading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
    }
  },

  createCluster: async (data: CreateK8sClusterRequest) => {
    if (get().loading) return {} as K8sClusterSummary;
    set({ loading: true, error: null });
    try {
      const result = await api.createK8sCluster(data);
      set({ loading: false });
      await get().fetchClusters();
      return result;
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  deleteCluster: async (namespace: string, name: string) => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      await api.deleteK8sCluster(namespace, name);
      set({ selectedCluster: null, loading: false });
      await get().fetchClusters();
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },

  scaleCluster: async (namespace: string, name: string, size: number) => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      await api.scaleK8sCluster(namespace, name, { size });
      set({ loading: false });
      await get().fetchClusters();
      const { selectedCluster } = get();
      if (selectedCluster?.name === name && selectedCluster?.namespace === namespace) {
        await get().fetchCluster(namespace, name);
      }
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
      throw error;
    }
  },
}));
