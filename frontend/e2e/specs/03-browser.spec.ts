import { test, expect } from "@playwright/test";
import { BrowserPage } from "../pages/browser-page";
import { screenshot, expectToast } from "../fixtures/base-page";
import { getTestConnectionId, TEST_NAMESPACE } from "../fixtures/test-data";

test.describe("03 - Browser (Namespace/Set)", () => {
  let connId: string;
  let browserPage: BrowserPage;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    connId = await getTestConnectionId(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    browserPage = new BrowserPage(page);
  });

  test("1. Namespace list with memory usage", async ({ page }) => {
    await browserPage.goto(connId);

    // "test" namespace should be visible
    await expect(page.getByText(TEST_NAMESPACE).first()).toBeVisible();
    // Stats should show namespace count
    await expect(page.getByText(/namespace/i).first()).toBeVisible();
    await screenshot(page, "03-01-namespace-list");
  });

  test("2. Sets section is visible", async ({ page }) => {
    await browserPage.goto(connId);

    // Wait for namespace card to load
    const nsCard = browserPage.getNamespaceCard(TEST_NAMESPACE);
    await expect(nsCard).toBeVisible({ timeout: 10_000 });

    // Sets section
    await expect(nsCard.getByText(/Sets/i).first()).toBeVisible();
    await screenshot(page, "03-02-sets-section");
  });

  test("3. Set click navigates to record browser", async ({ page }) => {
    await browserPage.goto(connId);

    // Wait for namespace data
    await expect(browserPage.getNamespaceCard(TEST_NAMESPACE)).toBeVisible({ timeout: 10_000 });

    // Click "Create Set" to create an e2e set
    await browserPage.openCreateSetDialog(TEST_NAMESPACE);
    await browserPage.fillCreateSetForm("e2e_nav_test");
    await browserPage.submitCreate();

    // Should navigate to the record page
    await page.waitForURL(`**/browser/${connId}/${TEST_NAMESPACE}/e2e_nav_test`, {
      timeout: 10_000,
    });
    await expect(page).toHaveURL(new RegExp(`/browser/${connId}/${TEST_NAMESPACE}/e2e_nav_test`));
    await screenshot(page, "03-03-set-navigate");
  });

  test("4. Create Namespace dialog opens and closes", async ({ page }) => {
    await browserPage.goto(connId);
    await browserPage.openCreateNamespaceDialog();

    // Dialog should be visible
    await expect(page.getByPlaceholder("my_namespace")).toBeVisible();

    // Close dialog
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByPlaceholder("my_namespace")).not.toBeVisible();
    await screenshot(page, "03-04-create-ns-dialog");
  });

  test("5. Create Set navigates to record page", async ({ page }) => {
    await browserPage.goto(connId);
    await expect(browserPage.getNamespaceCard(TEST_NAMESPACE)).toBeVisible({ timeout: 10_000 });

    await browserPage.openCreateSetDialog(TEST_NAMESPACE);
    await browserPage.fillCreateSetForm("e2e_new_set");
    await browserPage.submitCreate();

    // Should navigate to the new set
    await page.waitForURL(`**/browser/${connId}/${TEST_NAMESPACE}/e2e_new_set`, {
      timeout: 10_000,
    });
    await screenshot(page, "03-05-create-set");
  });
});
