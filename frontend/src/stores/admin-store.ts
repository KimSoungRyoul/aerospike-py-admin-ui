import { create } from "zustand";
import type {
  AerospikeUser,
  AerospikeRole,
  CreateUserRequest,
  CreateRoleRequest,
} from "@/lib/api/types";
import { api } from "@/lib/api/client";

interface AdminState {
  users: AerospikeUser[];
  roles: AerospikeRole[];
  loading: boolean;
  error: string | null;

  fetchUsers: (connId: string) => Promise<void>;
  fetchRoles: (connId: string) => Promise<void>;
  createUser: (connId: string, data: CreateUserRequest) => Promise<void>;
  changePassword: (connId: string, username: string, password: string) => Promise<void>;
  deleteUser: (connId: string, username: string) => Promise<void>;
  createRole: (connId: string, data: CreateRoleRequest) => Promise<void>;
  deleteRole: (connId: string, name: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>()((set, get) => ({
  users: [],
  roles: [],
  loading: false,
  error: null,

  fetchUsers: async (connId) => {
    set({ loading: true, error: null });
    try {
      const users = await api.getUsers(connId);
      set({ users, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchRoles: async (connId) => {
    set({ loading: true, error: null });
    try {
      const roles = await api.getRoles(connId);
      set({ roles, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createUser: async (connId, data) => {
    try {
      await api.createUser(connId, data);
      await get().fetchUsers(connId);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  changePassword: async (connId, username, password) => {
    try {
      await api.changePassword(connId, username, password);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteUser: async (connId, username) => {
    try {
      await api.deleteUser(connId, username);
      await get().fetchUsers(connId);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  createRole: async (connId, data) => {
    try {
      await api.createRole(connId, data);
      await get().fetchRoles(connId);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteRole: async (connId, name) => {
    try {
      await api.deleteRole(connId, name);
      await get().fetchRoles(connId);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },
}));
