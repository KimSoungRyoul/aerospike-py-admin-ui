import { create } from "zustand";
import type { AerospikeRecord, RecordListResponse, RecordWriteRequest } from "@/lib/api/types";
import { api } from "@/lib/api/client";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

interface BrowserState {
  records: AerospikeRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;

  selectedNamespace: string | null;
  selectedSet: string | null;

  setNamespace: (ns: string | null) => void;
  setSet: (set: string | null) => void;
  fetchRecords: (
    connId: string,
    ns: string,
    set: string,
    page?: number,
    pageSize?: number,
  ) => Promise<void>;
  putRecord: (connId: string, data: RecordWriteRequest) => Promise<void>;
  deleteRecord: (connId: string, ns: string, set: string, pk: string) => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  reset: () => void;
}

export const useBrowserStore = create<BrowserState>()((set, get) => ({
  records: [],
  total: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  hasMore: false,
  loading: false,
  error: null,
  selectedNamespace: null,
  selectedSet: null,

  setNamespace: (ns) => set({ selectedNamespace: ns, selectedSet: null, records: [], page: 1 }),
  setSet: (setName) => set({ selectedSet: setName, records: [], page: 1 }),

  fetchRecords: async (connId, ns, setName, page, pageSize) => {
    const p = page ?? get().page;
    const ps = pageSize ?? get().pageSize;
    set({ loading: true, error: null });
    try {
      const result: RecordListResponse = await api.getRecords(connId, ns, setName, p, ps);
      set({
        records: result.records,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasMore: result.hasMore,
        loading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  putRecord: async (connId, data) => {
    try {
      await api.putRecord(connId, data);
      const { selectedNamespace, selectedSet, page, pageSize } = get();
      if (selectedNamespace && selectedSet) {
        await get().fetchRecords(connId, selectedNamespace, selectedSet, page, pageSize);
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteRecord: async (connId, ns, setName, pk) => {
    try {
      await api.deleteRecord(connId, ns, setName, pk);
      const { page, pageSize } = get();
      await get().fetchRecords(connId, ns, setName, page, pageSize);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  reset: () =>
    set({
      records: [],
      total: 0,
      page: 1,
      hasMore: false,
      selectedNamespace: null,
      selectedSet: null,
      error: null,
    }),
}));
