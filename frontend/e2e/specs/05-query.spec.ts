import { test, expect } from "@playwright/test";
import { QueryPage } from "../pages/query-page";
import { screenshot } from "../fixtures/base-page";
import {
  getTestConnectionId,
  TEST_NAMESPACE,
  TEST_SET,
  createTestRecord,
} from "../fixtures/test-data";

test.describe("05 - Query (integrated in Set page)", () => {
  let connId: string;
  let queryPage: QueryPage;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    connId = await getTestConnectionId(page);

    // Seed some records for query
    for (let i = 0; i < 5; i++) {
      await createTestRecord(page, connId, `e2e-query-${i}`, {
        name: `Query${i}`,
        age: 20 + i,
      });
    }
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    queryPage = new QueryPage(page);
  });

  test("1. Set page loads with filter mode select", async ({ page }) => {
    await queryPage.goto(connId, TEST_NAMESPACE, TEST_SET);

    await expect(page.getByTestId("filter-mode-select")).toBeVisible();
    await screenshot(page, "05-01-query-page-load");
  });

  test("2. Browse mode shows records with pagination", async ({ page }) => {
    await queryPage.goto(connId, TEST_NAMESPACE, TEST_SET);

    // Should show records table
    await expect(page.getByTestId("records-table")).toBeVisible({ timeout: 15_000 });
    await screenshot(page, "05-02-namespace-options");
  });

  test("3. Index Query mode shows predicate builder", async ({ page }) => {
    await queryPage.goto(connId, TEST_NAMESPACE, TEST_SET);

    await queryPage.switchToIndexQuery();

    // Predicate fields should appear
    await expect(page.getByPlaceholder("bin_name").first()).toBeVisible({ timeout: 5_000 });
    await expect(queryPage.executeBtn).toBeVisible();
    await screenshot(page, "05-05-si-query-mode");
  });

  test("4. PK Lookup mode shows primary key input", async ({ page }) => {
    await queryPage.goto(connId, TEST_NAMESPACE, TEST_SET);

    await queryPage.switchToPKLookup();

    await expect(page.getByPlaceholder("Primary key...")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: /Search/i })).toBeVisible();
    await screenshot(page, "05-03-scan-results");
  });

  test("5. Execute Index Query and see stats", async ({ page }) => {
    await queryPage.goto(connId, TEST_NAMESPACE, TEST_SET);

    await queryPage.switchToIndexQuery();

    // Fill predicate
    await page.getByPlaceholder("bin_name").fill("age");
    await page.getByPlaceholder("value").fill("20");

    await queryPage.execute();
    await queryPage.waitForResults();

    // Stats should be visible
    await expect(page.getByText(/Time/i).first()).toBeVisible();
    await expect(page.getByText(/Scanned/i).first()).toBeVisible();
    await expect(page.getByText(/Returned/i).first()).toBeVisible();
    await screenshot(page, "05-06-execution-stats");
  });

  test("6. Export buttons appear after query results", async ({ page }) => {
    await queryPage.goto(connId, TEST_NAMESPACE, TEST_SET);

    await queryPage.switchToIndexQuery();

    await page.getByPlaceholder("bin_name").fill("age");
    await page.getByPlaceholder("value").fill("20");

    await queryPage.execute();
    await queryPage.waitForResults();

    // Export buttons
    await expect(queryPage.getExportJsonBtn()).toBeVisible();
    await expect(queryPage.getExportCsvBtn()).toBeVisible();
    await screenshot(page, "05-07-export-buttons");
  });

  test("7. Back to Browse returns to paginated view", async ({ page }) => {
    await queryPage.goto(connId, TEST_NAMESPACE, TEST_SET);

    // Switch to query mode
    await queryPage.switchToIndexQuery();
    await expect(queryPage.executeBtn).toBeVisible();

    // Switch back to browse
    await queryPage.switchToBrowse();

    // Should show records table with pagination
    await expect(page.getByTestId("records-table")).toBeVisible({ timeout: 15_000 });
    await screenshot(page, "05-04-scan-all");
  });
});
