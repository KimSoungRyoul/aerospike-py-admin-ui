export const CE_LIMITS = {
  MAX_NODES: 8,
  MAX_NAMESPACES: 2,
  MAX_DATA_TB: 5,
  DURABLE_DELETE: false,
  XDR: false,
} as const;

export const BRAND_COLORS = {
  yellow: "#ffe600",
  blue: "#0097D3",
  navy: "#0D1B32",
  red: "#c4373a",
} as const;

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export const DEFAULT_PAGE_SIZE = 25;

export const METRIC_HISTORY_POINTS = 60;
export const METRIC_INTERVAL_MS = 2000;

export const QUICK_COMMANDS = [
  { label: "namespaces", command: "show namespaces" },
  { label: "sets", command: "show sets" },
  { label: "bins", command: "show bins" },
  { label: "sindex", command: "show sindex" },
  { label: "udfs", command: "show udfs" },
  { label: "config", command: "show config" },
  { label: "statistics", command: "show statistics" },
  { label: "build", command: "build" },
  { label: "node", command: "node" },
  { label: "status", command: "status" },
] as const;

export const BIN_TYPES = [
  "string",
  "integer",
  "float",
  "bool",
  "list",
  "map",
  "bytes",
  "geojson",
] as const;

export type BinType = (typeof BIN_TYPES)[number];
