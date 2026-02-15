import type { SecondaryIndex } from "@/lib/api/types";

export const mockIndexes: Record<string, SecondaryIndex[]> = {
  "conn-1": [
    {
      name: "idx_users_age",
      namespace: "test",
      set: "users",
      bin: "age",
      type: "numeric",
      state: "ready",
    },
    {
      name: "idx_users_email",
      namespace: "test",
      set: "users",
      bin: "email",
      type: "string",
      state: "ready",
    },
  ],
  "conn-2": [
    {
      name: "idx_orders_total",
      namespace: "staging",
      set: "orders",
      bin: "total",
      type: "numeric",
      state: "ready",
    },
    {
      name: "idx_orders_location",
      namespace: "staging",
      set: "orders",
      bin: "location",
      type: "geo2dsphere",
      state: "ready",
    },
  ],
};
