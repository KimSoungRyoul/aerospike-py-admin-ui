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

    // First bin (already present) — fill bin name and value
    const binNames = page.getByPlaceholder("Bin name");
    await binNames.first().fill("name");

    // Fill the value input (placeholder "Value" for string type)
    const valueInput = page.getByRole("dialog").locator('input[placeholder="Value"]').first();
    await valueInput.fill("Alice");

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

    // Find the record row and click the View button (Eye icon)
    const row = page.locator("tr", { hasText: "e2e-view-record" }).first();
    await row.hover();
    // Action buttons: View(Eye), Edit(Pencil), Duplicate(Copy), Delete(Trash)
    // Use tooltip text to find the right button
    await row
      .locator("button")
      .filter({ has: page.locator("svg") })
      .first()
      .click();

    // View dialog should show record detail
    await expect(page.getByRole("dialog").getByText("Record Detail").first()).toBeVisible({
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
    // Click edit button (second action button with svg)
    const actionButtons = row.locator("button").filter({ has: page.locator("svg") });
    await actionButtons.nth(1).click();

    // Edit dialog
    await expect(page.getByRole("dialog").getByText("Edit Record").first()).toBeVisible({
      timeout: 5_000,
    });

    // PK field should be disabled
    const pkInput = page.getByPlaceholder("Record key");
    await expect(pkInput).toBeDisabled();

    await screenshot(page, "04-04-edit-record");

    // Submit update
    await page.getByRole("dialog").getByRole("button", { name: "Update" }).click();
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
    // Click duplicate button (third action button with svg)
    const actionButtons = row.locator("button").filter({ has: page.locator("svg") });
    await actionButtons.nth(2).click();

    // Duplicate dialog — PK should be empty
    await expect(
      page
        .getByRole("dialog")
        .getByText(/Duplicate Record/i)
        .first(),
    ).toBeVisible({
      timeout: 5_000,
    });

    const pkInput = page.getByPlaceholder("Record key");
    await expect(pkInput).toBeEnabled();

    // Fill new PK
    await pkInput.fill("e2e-dup-copy");
    await page.getByRole("dialog").getByRole("button", { name: "Create" }).click();
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
    const actionButtons = row.locator("button").filter({ has: page.locator("svg") });
    await actionButtons.last().click();

    // Confirm dialog
    await confirmDialog(page, "Delete");
    await expectToast(page, /Record deleted/i);
    await screenshot(page, "04-07-record-deleted");
  });

  test("8. Pagination with 30+ records", async ({ page }) => {
    // Create 30 records sequentially (concurrent requests can overwhelm the backend)
    for (let i = 0; i < 30; i++) {
      await createTestRecord(page, connId, `e2e-page-${i.toString().padStart(2, "0")}`, {
        idx: i,
      });
    }

    await recordsPage.goto(connId, TEST_NAMESPACE, TEST_SET);
    await page.waitForTimeout(3_000);

    // Table should show records
    await expect(page.getByTestId("records-table")).toBeVisible({ timeout: 10_000 });

    // Pagination should be visible (page size select has data-compact attribute)
    await expect(page.locator("[data-compact]").first()).toBeVisible({ timeout: 10_000 });
    await screenshot(page, "04-08-pagination");
  });

  test("9. Page size change", async ({ page }) => {
    await recordsPage.goto(connId, TEST_NAMESPACE, TEST_SET);

    // Wait for pagination to be visible (requires enough records from test 8)
    const pageSizeTrigger = page.locator("[data-compact]").first();
    await expect(pageSizeTrigger).toBeVisible({ timeout: 15_000 });

    // Click the page size selector and choose 50
    await pageSizeTrigger.click();
    await page.getByRole("option", { name: "50" }).click();
    await page.waitForTimeout(2_000);
    await screenshot(page, "04-09-page-size");
  });

  test("10. Empty set shows EmptyState", async ({ page }) => {
    // Navigate to a set that doesn't exist
    await recordsPage.goto(connId, TEST_NAMESPACE, "empty_set_e2e");
    await page.waitForTimeout(3_000);

    await expect(page.getByText(/No Records/i).first()).toBeVisible({
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
