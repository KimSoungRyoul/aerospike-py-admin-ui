import { test, expect } from "@playwright/test";
import { QueryPage } from "../pages/query-page";
import { screenshot } from "../fixtures/base-page";
import {
  getTestConnectionId,
  TEST_NAMESPACE,
  TEST_SET,
  createTestRecord,
} from "../fixtures/test-data";

test.describe("05 - Query Builder", () => {
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

  test("1. Query page loads with builder and execute button", async ({ page }) => {
    await queryPage.goto(connId);

    await expect(page.getByText("Query Builder").first()).toBeVisible();
    await expect(queryPage.executeBtn).toBeVisible();
    await screenshot(page, "05-01-query-page-load");
  });

  test("2. Namespace dropdown has options", async ({ page }) => {
    await queryPage.goto(connId);

    // Click namespace selector
    const nsSelect = page.locator("select").first();
    await expect(nsSelect).toBeVisible();
    // Should have at least the "test" namespace
    const options = nsSelect.locator("option");
    await expect(options).not.toHaveCount(0);
    await screenshot(page, "05-02-namespace-options");
  });

  test("3. Execute Scan query with results", async ({ page }) => {
    await queryPage.goto(connId);

    // Select namespace
    const nsSelect = page.locator("select").first();
    await nsSelect.selectOption(TEST_NAMESPACE);

    // Select set if available
    const setSelect = page.locator("select").nth(1);
    if ((await setSelect.count()) > 0) {
      try {
        await setSelect.selectOption(TEST_SET, { timeout: 3_000 });
      } catch {
        // Set might not be in the dropdown yet
      }
    }

    // Execute
    await queryPage.execute();

    // Wait for results
    await expect(page.getByText(/Returned/i).first()).toBeVisible({ timeout: 30_000 });

    await screenshot(page, "05-03-scan-results");
  });

  test("4. Scan all (no set filter)", async ({ page }) => {
    await queryPage.goto(connId);

    const nsSelect = page.locator("select").first();
    await nsSelect.selectOption(TEST_NAMESPACE);

    await queryPage.execute();

    // Either results or "No results" should appear
    await expect(page.getByText(/Returned|No results/i).first()).toBeVisible({ timeout: 30_000 });
    await screenshot(page, "05-04-scan-all");
  });

  test("5. SI Query mode shows predicate builder", async ({ page }) => {
    await queryPage.goto(connId);

    // Switch to SI Query mode
    await page.getByRole("button", { name: "SI Query" }).click();

    // Predicate section should appear
    await expect(page.getByText(/Predicate/i).first()).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByPlaceholder("bin_name").first()).toBeVisible();
    await screenshot(page, "05-05-si-query-mode");
  });

  test("6. Execution stats are displayed", async ({ page }) => {
    await queryPage.goto(connId);

    const nsSelect = page.locator("select").first();
    await nsSelect.selectOption(TEST_NAMESPACE);

    await queryPage.execute();
    await queryPage.waitForResults();

    // Stats should be visible
    await expect(page.getByText(/Time/i).first()).toBeVisible();
    await expect(page.getByText(/Scanned/i).first()).toBeVisible();
    await expect(page.getByText(/Returned/i).first()).toBeVisible();
    await screenshot(page, "05-06-execution-stats");
  });

  test("7. Export buttons appear after query results", async ({ page }) => {
    await queryPage.goto(connId);

    const nsSelect = page.locator("select").first();
    await nsSelect.selectOption(TEST_NAMESPACE);

    await queryPage.execute();
    await queryPage.waitForResults();

    // Export buttons
    await expect(queryPage.getExportJsonBtn()).toBeVisible();
    await expect(queryPage.getExportCsvBtn()).toBeVisible();
    await screenshot(page, "05-07-export-buttons");
  });
});
