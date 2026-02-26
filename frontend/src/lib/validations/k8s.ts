import { z } from "zod";

// K8s DNS-compatible name (RFC 1123)
export const k8sNameSchema = z
  .string()
  .min(1, "Name is required")
  .max(63, "Name must be 63 characters or less")
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
    "Must be lowercase alphanumeric with hyphens, starting and ending with alphanumeric",
  );

// K8s CPU resource (e.g., "500m", "1", "2.5")
export const k8sCpuSchema = z
  .string()
  .min(1, "CPU is required")
  .regex(/^[0-9]+(\.[0-9]+)?m?$/, "Invalid CPU format (e.g., '500m', '1', '2.5')");

// K8s memory resource (e.g., "1Gi", "512Mi", "256Mi")
export const k8sMemorySchema = z
  .string()
  .min(1, "Memory is required")
  .regex(/^[0-9]+(\.[0-9]+)?[KMGTPE]i$/, "Invalid memory format (e.g., '512Mi', '1Gi', '4Gi')");

// K8s storage size (e.g., "10Gi", "100Gi")
export const k8sStorageSizeSchema = z
  .string()
  .min(1, "Size is required")
  .regex(/^[0-9]+[KMGTPE]i$/, "Invalid storage size (e.g., '10Gi', '100Gi')");

// Validation helpers
export function validateK8sName(value: string): string | null {
  const result = k8sNameSchema.safeParse(value);
  return result.success ? null : result.error.issues[0].message;
}

export function validateK8sCpu(value: string): string | null {
  const result = k8sCpuSchema.safeParse(value);
  return result.success ? null : result.error.issues[0].message;
}

export function validateK8sMemory(value: string): string | null {
  const result = k8sMemorySchema.safeParse(value);
  return result.success ? null : result.error.issues[0].message;
}

/** Parse K8s CPU string to millicores for comparison. */
export function parseCpuMillis(cpu: string): number {
  if (cpu.endsWith("m")) return parseFloat(cpu.slice(0, -1));
  return parseFloat(cpu) * 1000;
}

const MEMORY_UNITS: Record<string, number> = {
  Ki: 1,
  Mi: 2,
  Gi: 3,
  Ti: 4,
  Pi: 5,
  Ei: 6,
};

/** Parse K8s memory string to bytes for comparison. */
export function parseMemoryBytes(mem: string): number {
  const m = mem.match(/^([0-9]+(?:\.[0-9]+)?)([KMGTPE]i)$/);
  if (!m) return 0;
  const unit = m[2];
  return parseFloat(m[1]) * Math.pow(1024, MEMORY_UNITS[unit] ?? 0);
}
