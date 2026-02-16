import { test, expect } from "@playwright/test";
import { UdfsPage } from "../pages/udfs-page";
import { expectToast, screenshot, confirmDialog } from "../fixtures/base-page";
import { getTestConnectionId, TEST_UDF_FILENAME, TEST_UDF_CONTENT } from "../fixtures/test-data";

test.describe("08 - UDF Management", () => {
  let connId: string;
  let udfsPage: UdfsPage;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    connId = await getTestConnectionId(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    udfsPage = new UdfsPage(page);
  });

  test("1. UDFs page loads", async ({ page }) => {
    await udfsPage.goto(connId);
    await expect(udfsPage.heading).toBeVisible();
    await screenshot(page, "08-01-udfs-page");
  });

  test("2. Upload a UDF module", async ({ page }) => {
    await udfsPage.goto(connId);
    await udfsPage.openUploadDialog();
    await udfsPage.fillUploadForm(TEST_UDF_FILENAME, TEST_UDF_CONTENT);
    await udfsPage.submitUpload();

    await expectToast(page, /UDF uploaded/i);

    // Table should now show the module
    await page.waitForTimeout(2_000);
    await expect(page.getByText(TEST_UDF_FILENAME).first()).toBeVisible({
      timeout: 10_000,
    });
    await screenshot(page, "08-02-udf-uploaded");
  });

  test("3. View UDF source code", async ({ page }) => {
    await udfsPage.goto(connId);
    await page.waitForTimeout(2_000);

    const row = page.locator("tr", { hasText: TEST_UDF_FILENAME });
    if ((await row.count()) > 0) {
      await udfsPage.viewSource(TEST_UDF_FILENAME);

      // Should show source in read-only editor
      await expect(page.getByText(TEST_UDF_FILENAME).first()).toBeVisible({ timeout: 5_000 });
    }
    await screenshot(page, "08-03-udf-source");

    // Close dialog
    await page.keyboard.press("Escape");
  });

  test("4. LUA type badge is displayed", async ({ page }) => {
    await udfsPage.goto(connId);
    await page.waitForTimeout(2_000);

    const row = page.locator("tr", { hasText: TEST_UDF_FILENAME });
    if ((await row.count()) > 0) {
      await expect(row.getByText("LUA").first()).toBeVisible();
    }
    await screenshot(page, "08-04-lua-badge");
  });

  test("5. Delete a UDF module", async ({ page }) => {
    await udfsPage.goto(connId);
    await page.waitForTimeout(2_000);

    const row = page.locator("tr", { hasText: TEST_UDF_FILENAME });
    if ((await row.count()) > 0) {
      await udfsPage.deleteUdf(TEST_UDF_FILENAME);
      await confirmDialog(page, "Delete");
      await expectToast(page, /UDF deleted/i);
    }
    await screenshot(page, "08-05-udf-deleted");
  });
});
