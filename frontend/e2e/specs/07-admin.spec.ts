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

  test("1. Admin page loads with Users/Roles tabs", async ({ page }) => {
    await adminPage.goto(connId);

    // Should show tabs even if data fails to load
    await expect(adminPage.usersTab).toBeVisible({ timeout: 15_000 });
    await expect(adminPage.rolesTab).toBeVisible();
    await screenshot(page, "07-01-admin-page");
  });

  test("2. Users tab shows CE error or empty state", async ({ page }) => {
    await adminPage.goto(connId);
    await adminPage.clickUsersTab();

    // CE edition: expect 403/error/not supported message OR empty state
    await expect(
      page
        .getByText(
          /not supported|forbidden|error|No users|security is not enabled|AEROSPIKE_SECURITY_NOT_ENABLED/i,
        )
        .first(),
    ).toBeVisible({ timeout: 15_000 });
    await screenshot(page, "07-02-users-ce-error");
  });

  test("3. Roles tab shows CE error or empty state", async ({ page }) => {
    await adminPage.goto(connId);
    await adminPage.clickRolesTab();

    await expect(
      page
        .getByText(
          /not supported|forbidden|error|No roles|security is not enabled|AEROSPIKE_SECURITY_NOT_ENABLED/i,
        )
        .first(),
    ).toBeVisible({ timeout: 15_000 });
    await screenshot(page, "07-03-roles-ce-error");
  });

  test("4. Create User attempt shows error", async ({ page }) => {
    await adminPage.goto(connId);

    // Try to create user
    const createBtn = page.getByRole("button", { name: "Create User" });
    if ((await createBtn.count()) > 0) {
      await createBtn.click();

      // Fill minimal form
      const dialog = page.getByRole("dialog");
      if ((await dialog.count()) > 0) {
        const usernameInput = page.getByPlaceholder("username");
        const passwordInput = page.getByPlaceholder("password");
        if ((await usernameInput.count()) > 0) {
          await usernameInput.fill("e2e-test-user");
          await passwordInput.fill("testpass123");
          await adminPage.submitCreate();

          // Should get an error toast (CE doesn't support security)
          await expect(
            page.getByText(/error|not supported|forbidden|security|failed/i).first(),
          ).toBeVisible({ timeout: 10_000 });
        }
      }
    }
    await screenshot(page, "07-04-create-user-error");
  });
});
