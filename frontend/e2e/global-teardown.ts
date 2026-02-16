import type { FullConfig } from "@playwright/test";

const BASE_URL = "http://localhost:3100";

export default async function globalTeardown(_config: FullConfig) {
  console.log("\n=== E2E Global Teardown ===");
  console.log("Cleaning up test data...\n");

  try {
    const res = await fetch(`${BASE_URL}/api/connections`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return;

    const connections = (await res.json()) as { id: string; name: string }[];
    const testConnections = connections.filter((c) => c.name.startsWith("E2E"));

    for (const conn of testConnections) {
      try {
        await fetch(`${BASE_URL}/api/connections/${conn.id}`, {
          method: "DELETE",
          signal: AbortSignal.timeout(5_000),
        });
        console.log(`  [DELETED] Connection: ${conn.name} (${conn.id})`);
      } catch {
        console.log(`  [WARN] Failed to delete: ${conn.name}`);
      }
    }

    if (testConnections.length === 0) {
      console.log("  No E2E test connections to clean up.");
    }
  } catch {
    console.log("  [WARN] Could not reach API for cleanup.");
  }

  console.log("\n=== Teardown complete ===\n");
}
