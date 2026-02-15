// === Connection ===
export interface ConnectionProfile {
  id: string;
  name: string;
  hosts: string[];
  port: number;
  clusterName?: string;
  username?: string;
  password?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionStatus {
  connected: boolean;
  nodeCount: number;
  namespaceCount: number;
  build?: string;
  edition?: string;
}

export interface ConnectionWithStatus extends ConnectionProfile {
  status: ConnectionStatus;
}

// === Cluster ===
export interface ClusterNode {
  name: string;
  address: string;
  port: number;
  build: string;
  edition: string;
  clusterSize: number;
  uptime: number;
  clientConnections: number;
  statistics: Record<string, string | number>;
}

export interface NamespaceInfo {
  name: string;
  objects: number;
  memoryUsed: number;
  memoryTotal: number;
  memoryFreePct: number;
  deviceUsed: number;
  deviceTotal: number;
  replicationFactor: number;
  stopWrites: boolean;
  hwmBreached: boolean;
  highWaterMemoryPct: number;
  highWaterDiskPct: number;
  sets: SetInfo[];
}

export interface SetInfo {
  name: string;
  namespace: string;
  objects: number;
  tombstones: number;
  memoryDataBytes: number;
  stopWritesCount: number;
}

export interface ClusterInfo {
  connectionId: string;
  nodes: ClusterNode[];
  namespaces: NamespaceInfo[];
}

// === Records ===
export type BinValue =
  | string
  | number
  | boolean
  | null
  | BinValue[]
  | { [key: string]: BinValue }
  | GeoJSON;

export interface GeoJSON {
  type: "Point" | "Polygon" | "AeroCircle";
  coordinates: number[] | number[][] | number[][][];
}

export interface RecordKey {
  namespace: string;
  set: string;
  pk: string;
  digest?: string;
}

export interface RecordMeta {
  generation: number;
  ttl: number;
  lastUpdateMs?: number;
}

export interface AerospikeRecord {
  key: RecordKey;
  meta: RecordMeta;
  bins: Record<string, BinValue>;
}

export interface RecordListResponse {
  records: AerospikeRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface RecordWriteRequest {
  key: RecordKey;
  bins: Record<string, BinValue>;
  ttl?: number;
}

// === Query ===
export type PredicateOperator =
  | "equals"
  | "between"
  | "contains"
  | "geo_within_region"
  | "geo_contains_point";

export interface QueryPredicate {
  bin: string;
  operator: PredicateOperator;
  value: BinValue;
  value2?: BinValue; // for 'between'
}

export type QueryType = "scan" | "query";

export interface QueryRequest {
  namespace: string;
  set?: string;
  type: QueryType;
  predicate?: QueryPredicate;
  selectBins?: string[];
  expression?: string; // raw JSON expression
  maxRecords?: number;
}

export interface QueryResponse {
  records: AerospikeRecord[];
  executionTimeMs: number;
  scannedRecords: number;
  returnedRecords: number;
}

// === Index ===
export type IndexType = "numeric" | "string" | "geo2dsphere";
export type IndexState = "ready" | "building" | "error";

export interface SecondaryIndex {
  name: string;
  namespace: string;
  set: string;
  bin: string;
  type: IndexType;
  state: IndexState;
}

export interface CreateIndexRequest {
  namespace: string;
  set: string;
  bin: string;
  name: string;
  type: IndexType;
}

// === Admin ===
export interface AerospikeUser {
  username: string;
  roles: string[];
  readQuota: number;
  writeQuota: number;
  connections: number;
}

export interface AerospikeRole {
  name: string;
  privileges: Privilege[];
  whitelist: string[];
  readQuota: number;
  writeQuota: number;
}

export interface Privilege {
  code: string;
  namespace?: string;
  set?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  roles: string[];
}

export interface CreateRoleRequest {
  name: string;
  privileges: Privilege[];
  whitelist?: string[];
  readQuota?: number;
  writeQuota?: number;
}

// === UDF ===
export type UDFType = "LUA";

export interface UDFModule {
  filename: string;
  type: UDFType;
  hash: string;
  content?: string;
}

export interface ApplyUDFRequest {
  key: RecordKey;
  module: string;
  functionName: string;
  args: BinValue[];
}

// === Terminal ===
export interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  timestamp: string;
  success: boolean;
}

// === Metrics ===
export interface MetricPoint {
  timestamp: number;
  value: number;
}

export interface MetricSeries {
  name: string;
  label: string;
  data: MetricPoint[];
  color?: string;
}

export interface NamespaceMetrics {
  namespace: string;
  objects: number;
  memoryUsed: number;
  memoryTotal: number;
  deviceUsed: number;
  deviceTotal: number;
  readReqs: number;
  writeReqs: number;
  readSuccess: number;
  writeSuccess: number;
}

export interface ClusterMetrics {
  connectionId: string;
  timestamp: number;
  connected: boolean;
  uptime: number;
  clientConnections: number;
  totalReadReqs: number;
  totalWriteReqs: number;
  totalReadSuccess: number;
  totalWriteSuccess: number;
  namespaces: NamespaceMetrics[];
  readTps: MetricPoint[];
  writeTps: MetricPoint[];
  connectionHistory: MetricPoint[];
  memoryUsageByNs: MetricSeries[];
  deviceUsageByNs: MetricSeries[];
}

export interface PrometheusMetric {
  name: string;
  type: "counter" | "gauge" | "histogram" | "summary";
  help: string;
  value: number;
  labels: Record<string, string>;
  category: string;
}
