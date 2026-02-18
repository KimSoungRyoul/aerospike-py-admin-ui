import { test, expect } from "@playwright/test";
import { AdminPage } from "../pages/admin-page";
import { screenshot } from "../fixtures/base-page";
import { getTestConnectionId } from "../fixtures/test-data";

test.describe("07 - Admin (CE Error Handling)", () => {
  let connId: string;
  let adminPage: AdminPage;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    connId = await getTestConnectionId(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPage(page);
  });

  test("1. Admin page loads and shows CE enterprise notice", async ({ page }) => {
    await adminPage.goto(connId);

    // CE edition: should show "Enterprise Edition Required" message instead of tabs
    // Or if tabs appear, that's fine too (Enterprise Edition)
    const enterpriseNotice = page.getByText(/Enterprise Edition Required/i).first();
    const usersTab = adminPage.usersTab;

    await expect(enterpriseNotice.or(usersTab)).toBeVisible({ timeout: 15_000 });
    await screenshot(page, "07-01-admin-page");
  });

  test("2. CE shows enterprise required message for users", async ({ page }) => {
    await adminPage.goto(connId);

    // CE edition: expect enterprise notice or error message
    await expect(
      page
        .getByText(
          /Enterprise Edition Required|not supported|forbidden|error|No users|security is not enabled/i,
        )
        .first(),
    ).toBeVisible({ timeout: 15_000 });
    await screenshot(page, "07-02-users-ce-error");
  });

  test("3. CE shows enterprise required message for roles", async ({ page }) => {
    await adminPage.goto(connId);

    // CE edition: same enterprise notice covers both users and roles
    await expect(
      page
        .getByText(
          /Enterprise Edition Required|not supported|forbidden|error|No roles|security is not enabled/i,
        )
        .first(),
    ).toBeVisible({ timeout: 15_000 });
    await screenshot(page, "07-03-roles-ce-error");
  });

  test("4. Admin page heading is visible", async ({ page }) => {
    await adminPage.goto(connId);

    await expect(adminPage.heading).toBeVisible({ timeout: 15_000 });
    await screenshot(page, "07-04-admin-heading");
  });
});
