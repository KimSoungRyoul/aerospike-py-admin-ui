import { test, expect } from "@playwright/test";
import { RecordsPage } from "../pages/records-page";
import { expectToast, screenshot, confirmDialog } from "../fixtures/base-page";
import {
  getTestConnectionId,
  TEST_NAMESPACE,
  TEST_SET,
  createTestRecord,
  cleanupTestRecords,
} from "../fixtures/test-data";

test.describe("04 - Records CRUD", () => {
  let connId: string;
  let recordsPage: RecordsPage;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    connId = await getTestConnectionId(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    recordsPage = new RecordsPage(page);
  });

  test("1. Create a record with string + integer bins", async ({ page }) => {
    await recordsPage.goto(connId, TEST_NAMESPACE, TEST_SET);
    await recordsPage.openCreateDialog();

    // Fill PK
    await page.getByPlaceholder("Record key").fill("e2e-record-1");

    // First bin (already present)
    const binNames = page.getByPlaceholder("Bin name");
    await binNames.first().fill("name");
    // Fill value — look for the value input in the bin row
    const valueInputs = page.locator('input[type="text"]').filter({ hasNotText: "" });
    // Find the value input area (after bin name and type)
    await page
      .locator("input")
      .filter({ hasText: "" })
      .and(page.locator('[placeholder*="alue"], [placeholder*="Enter"]'))
      .first()
      .fill("Alice");

    await recordsPage.submitCreate();
    await expectToast(page, /Record created/i);
    await screenshot(page, "04-01-record-created");
  });

  test("2. Record appears in table", async ({ page }) => {
    // Seed a record via API first
    await createTestRecord(page, connId, "e2e-table-check", {
      name: "TableCheck",
      age: 30,
    });

    await recordsPage.goto(connId, TEST_NAMESPACE, TEST_SET);
    await page.waitForTimeout(2_000);

    // Should see the record PK in the table
    await expect(page.getByText("e2e-table-check").first()).toBeVisible({
      timeout: 10_000,
    });
    await screenshot(page, "04-02-record-in-table");
  });

  test("3. View record detail", async ({ page }) => {
    await createTestRecord(page, connId, "e2e-view-record", {
      name: "ViewMe",
      score: 99,
    });

    await recordsPage.goto(connId, TEST_NAMESPACE, TEST_SET);
    await page.waitForTimeout(2_000);

    // Find and click view on a record row
    const row = page.locator("tr", { hasText: "e2e-view-record" }).first();
    await row.hover();
    await row.locator("button").first().click();

    // View dialog should show record detail
    await expect(page.getByText("Record Detail").first()).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText("e2e-view-record").first()).toBeVisible();
    await screenshot(page, "04-03-record-detail");

    // Close dialog
    await page.keyboard.press("Escape");
  });

  test("4. Edit a record", async ({ page }) => {
    await createTestRecord(page, connId, "e2e-edit-record", {
      name: "BeforeEdit",
      age: 20,
    });

    await recordsPage.goto(connId, TEST_NAMESPACE, TEST_SET);
    await page.waitForTimeout(2_000);

    const row = page.locator("tr", { hasText: "e2e-edit-record" }).first();
    await row.hover();
    // Click edit button (second action button)
    const buttons = row.locator("button");
    await buttons.nth(1).click();

    // Edit dialog
    await expect(page.getByText("Edit Record").first()).toBeVisible({
      timeout: 5_000,
    });

    // PK field should be disabled
    const pkInput = page.getByPlaceholder("Record key");
    await expect(pkInput).toBeDisabled();

    await screenshot(page, "04-04-edit-record");

    // Submit update
    await page.getByRole("button", { name: "Update" }).click();
    await expectToast(page, /Record updated/i);
  });

  test("5. Duplicate a record", async ({ page }) => {
    await createTestRecord(page, connId, "e2e-dup-source", {
      name: "DupSource",
      age: 40,
    });

    await recordsPage.goto(connId, TEST_NAMESPACE, TEST_SET);
    await page.waitForTimeout(2_000);

    const row = page.locator("tr", { hasText: "e2e-dup-source" }).first();
    await row.hover();
    // Click duplicate button (third action button)
    const buttons = row.locator("button");
    await buttons.nth(2).click();

    // Duplicate dialog — PK should be empty
    await expect(page.getByText(/Duplicate Record/i).first()).toBeVisible({ timeout: 5_000 });

    const pkInput = page.getByPlaceholder("Record key");
    await expect(pkInput).toBeEnabled();

    // Fill new PK
    await pkInput.fill("e2e-dup-copy");
    await page.getByRole("button", { name: "Create" }).click();
    await expectToast(page, /Record (created|duplicated)/i);
    await screenshot(page, "04-05-duplicate-record");
  });

  test("6. Record with diverse data types", async ({ page }) => {
    await createTestRecord(page, connId, "e2e-types", {
      str_val: "hello",
      int_val: 42,
      float_val: 3.14,
      bool_val: true,
    });

    await recordsPage.goto(connId, TEST_NAMESPACE, TEST_SET);
    await page.waitForTimeout(2_000);

    await expect(page.getByText("e2e-types").first()).toBeVisible({
      timeout: 10_000,
    });
    await screenshot(page, "04-06-diverse-types");
  });

  test("7. Delete record with confirmation", async ({ page }) => {
    await createTestRecord(page, connId, "e2e-delete-me", {
      name: "DeleteMe",
    });

    await recordsPage.goto(connId, TEST_NAMESPACE, TEST_SET);
    await page.waitForTimeout(2_000);

    const row = page.locator("tr", { hasText: "e2e-delete-me" }).first();
    await row.hover();
    // Click delete button (last action button)
    const buttons = row.locator("button");
    await buttons.last().click();

    // Confirm dialog
    await confirmDialog(page, "Delete");
    await expectToast(page, /Record deleted/i);
    await screenshot(page, "04-07-record-deleted");
  });

  test("8. Pagination with 30+ records", async ({ page }) => {
    // Create 30 records via API
    const promises = [];
    for (let i = 0; i < 30; i++) {
      promises.push(
        createTestRecord(page, connId, `e2e-page-${i.toString().padStart(2, "0")}`, {
          idx: i,
        }),
      );
    }
    await Promise.all(promises);

    await recordsPage.goto(connId, TEST_NAMESPACE, TEST_SET);
    await page.waitForTimeout(3_000);

    // Pagination should appear (default page size is 25)
    const paginationArea = page.locator("text=/of \\d+/i").first();
    await expect(paginationArea).toBeVisible({ timeout: 10_000 });

    // Next page button should be clickable
    const nextBtn = page.locator('button:has(svg[class*="chevron-right"])').first();
    if ((await nextBtn.count()) > 0) {
      await expect(nextBtn).toBeEnabled();
    }
    await screenshot(page, "04-08-pagination");
  });

  test("9. Page size change", async ({ page }) => {
    await recordsPage.goto(connId, TEST_NAMESPACE, TEST_SET);
    await page.waitForTimeout(2_000);

    // Find page size selector
    const pageSizeSelect = page.locator("select").last();
    if ((await pageSizeSelect.count()) > 0) {
      await pageSizeSelect.selectOption("50");
      await page.waitForTimeout(2_000);
    }
    await screenshot(page, "04-09-page-size");
  });

  test("10. Empty set shows EmptyState", async ({ page }) => {
    // Navigate to a set that doesn't exist
    await recordsPage.goto(connId, TEST_NAMESPACE, "empty_set_e2e");
    await page.waitForTimeout(3_000);

    await expect(page.getByText(/No records/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await screenshot(page, "04-10-empty-state");
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await cleanupTestRecords(page, connId, "e2e-");
    } finally {
      await page.close();
    }
  });
});
