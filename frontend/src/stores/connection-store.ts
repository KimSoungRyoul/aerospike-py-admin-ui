import { create } from "zustand";
import type { ConnectionWithStatus, ConnectionProfile } from "@/lib/api/types";
import { api } from "@/lib/api/client";

interface ConnectionState {
  connections: ConnectionWithStatus[];
  selectedConnectionId: string | null;
  loading: boolean;
  error: string | null;

  fetchConnections: () => Promise<void>;
  selectConnection: (id: string | null) => void;
  createConnection: (data: Partial<ConnectionProfile>) => Promise<void>;
  updateConnection: (id: string, data: Partial<ConnectionProfile>) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  testConnection: (id: string) => Promise<{ success: boolean; message: string }>;
}

export const useConnectionStore = create<ConnectionState>()((set, get) => ({
  connections: [],
  selectedConnectionId: null,
  loading: false,
  error: null,

  fetchConnections: async () => {
    set({ loading: true, error: null });
    try {
      const connections = await api.getConnections();
      set({ connections, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  selectConnection: (id) => set({ selectedConnectionId: id }),

  createConnection: async (data) => {
    try {
      await api.createConnection(data);
      await get().fetchConnections();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateConnection: async (id, data) => {
    try {
      await api.updateConnection(id, data);
      await get().fetchConnections();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteConnection: async (id) => {
    try {
      await api.deleteConnection(id);
      const { selectedConnectionId } = get();
      if (selectedConnectionId === id) {
        set({ selectedConnectionId: null });
      }
      await get().fetchConnections();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  testConnection: async (id) => {
    try {
      return await api.testConnection(id);
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  },
}));
