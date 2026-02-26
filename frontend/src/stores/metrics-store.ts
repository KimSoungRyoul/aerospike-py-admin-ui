import { create } from "zustand";
import type { ClusterMetrics } from "@/lib/api/types";
import { api } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils";
import { METRIC_INTERVAL_MS } from "@/lib/constants";

// Module-level variables to avoid storing non-serializable values in Zustand state
let _intervalId: ReturnType<typeof setInterval> | null = null;
let _visibilityCleanup: (() => void) | null = null;

interface MetricsState {
  metrics: ClusterMetrics | null;
  loading: boolean;
  error: string | null;
  _isFetching: boolean;
  _isTabVisible: boolean;

  fetchMetrics: (connId: string) => Promise<void>;
  startPolling: (connId: string) => void;
  stopPolling: () => void;
}

export const useMetricsStore = create<MetricsState>()((set, get) => ({
  metrics: null,
  loading: false,
  error: null,
  _isFetching: false,
  _isTabVisible: true,

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
    if (_intervalId) clearInterval(_intervalId);
    if (_visibilityCleanup) _visibilityCleanup();

    get().fetchMetrics(connId);

    _intervalId = setInterval(() => {
      // Skip polling when tab is not visible
      if (!get()._isTabVisible) return;
      get().fetchMetrics(connId);
    }, METRIC_INTERVAL_MS);

    // Visibility change listener
    const handleVisibilityChange = () => {
      set({ _isTabVisible: !document.hidden });
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    _visibilityCleanup = () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };

    set({ _isTabVisible: !document.hidden });
  },

  stopPolling: () => {
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
    if (_visibilityCleanup) {
      _visibilityCleanup();
      _visibilityCleanup = null;
    }
    set({ _isFetching: false });
  },
}));
