import { Page } from "@playwright/test";

const BASE_URL = "http://localhost:3100";

export const TEST_CONNECTION = {
  name: "E2E Test Cluster",
  hosts: "aerospike",
  port: "3000",
};

export const TEST_NAMESPACE = "test";
export const TEST_SET = "e2e_records";
export const TEST_INDEX_NAME = "idx_e2e_age";
export const TEST_UDF_FILENAME = "e2e_module.lua";
export const TEST_UDF_CONTENT = `function hello(rec)
  return "Hello from E2E"
end`;

export async function getTestConnectionId(page: Page): Promise<string> {
  const res = await page.request.get(`${BASE_URL}/api/connections`);
  const connections = await res.json();
  const conn = connections.find((c: { name: string }) => c.name === TEST_CONNECTION.name);
  if (!conn) {
    throw new Error(`Test connection "${TEST_CONNECTION.name}" not found`);
  }
  return conn.id;
}

export async function createTestRecord(
  page: Page,
  connId: string,
  pk: string,
  bins: Record<string, unknown> = { name: "e2e-test", age: 25 },
) {
  const res = await page.request.post(`${BASE_URL}/api/records/${connId}`, {
    data: {
      key: { namespace: TEST_NAMESPACE, set: TEST_SET, pk },
      bins,
    },
  });
  if (!res.ok()) {
    throw new Error(`Failed to create test record: ${await res.text()}`);
  }
  return res.json();
}

export async function deleteTestRecord(page: Page, connId: string, pk: string) {
  await page.request.delete(
    `${BASE_URL}/api/records/${connId}?ns=${TEST_NAMESPACE}&set=${TEST_SET}&pk=${pk}`,
  );
}

export async function cleanupTestRecords(page: Page, connId: string, prefix = "e2e-") {
  try {
    const res = await page.request.get(
      `${BASE_URL}/api/records/${connId}?ns=${TEST_NAMESPACE}&set=${TEST_SET}&page=1&pageSize=100`,
    );
    if (!res.ok()) return;
    const data = await res.json();
    for (const record of data.records || []) {
      if (String(record.key.pk).startsWith(prefix)) {
        await deleteTestRecord(page, connId, record.key.pk);
      }
    }
  } catch {
    // ignore cleanup errors
  }
}
