import { create } from "zustand";
import type { ClusterMetrics } from "@/lib/api/types";
import { api } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils";
import { METRIC_INTERVAL_MS } from "@/lib/constants";

interface MetricsState {
  metrics: ClusterMetrics | null;
  loading: boolean;
  error: string | null;
  intervalId: ReturnType<typeof setInterval> | null;
  _isFetching: boolean;
  _isTabVisible: boolean;
  _visibilityCleanup: (() => void) | null;

  fetchMetrics: (connId: string) => Promise<void>;
  startPolling: (connId: string) => void;
  stopPolling: () => void;
}

export const useMetricsStore = create<MetricsState>()((set, get) => ({
  metrics: null,
  loading: false,
  error: null,
  intervalId: null,
  _isFetching: false,
  _isTabVisible: true,
  _visibilityCleanup: null,

  fetchMetrics: async (connId) => {
    // Prevent concurrent requests
    if (get()._isFetching) return;

    const isInitialLoad = get().metrics === null;
    set({ _isFetching: true, ...(isInitialLoad ? { loading: true } : {}), error: null });
    try {
      const metrics = await api.getMetrics(connId);
      set({ metrics, loading: false, _isFetching: false });
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false, _isFetching: false });
    }
  },

  startPolling: (connId) => {
    const { intervalId, _visibilityCleanup } = get();
    if (intervalId) clearInterval(intervalId);
    if (_visibilityCleanup) _visibilityCleanup();

    get().fetchMetrics(connId);

    const id = setInterval(() => {
      // Skip polling when tab is not visible
      if (!get()._isTabVisible) return;
      get().fetchMetrics(connId);
    }, METRIC_INTERVAL_MS);

    // Visibility change listener
    const handleVisibilityChange = () => {
      set({ _isTabVisible: !document.hidden });
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    set({
      intervalId: id,
      _isTabVisible: !document.hidden,
      _visibilityCleanup: () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      },
    });
  },

  stopPolling: () => {
    const { intervalId, _visibilityCleanup } = get();
    if (intervalId) {
      clearInterval(intervalId);
    }
    if (_visibilityCleanup) {
      _visibilityCleanup();
    }
    set({ intervalId: null, _visibilityCleanup: null });
  },
}));
