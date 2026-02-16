import type { FullConfig } from "@playwright/test";

const BASE_URL = "http://localhost:3100";
const MAX_WAIT_MS = 120_000;
const POLL_INTERVAL_MS = 3_000;

async function waitForService(url: string, label: string): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT_MS) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (res.ok) {
        console.log(`  [OK] ${label} is reachable (${Date.now() - start}ms)`);
        return;
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`${label} did not become reachable within ${MAX_WAIT_MS / 1000}s at ${url}`);
}

export default async function globalSetup(_config: FullConfig) {
  console.log("\n=== E2E Global Setup ===");
  console.log("Checking service availability...\n");

  await waitForService(`${BASE_URL}/`, "Frontend");
  await waitForService(`${BASE_URL}/api/health`, "Backend API");

  console.log("\n=== All services ready ===\n");
}
