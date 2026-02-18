import { test, expect } from "@playwright/test";
import { ConnectionsPage } from "../pages/connections-page";
import { expectToast, screenshot } from "../fixtures/base-page";
import { TEST_CONNECTION } from "../fixtures/test-data";

test.describe("01 - Connection CRUD", () => {
  let connectionsPage: ConnectionsPage;

  test.beforeEach(async ({ page }) => {
    connectionsPage = new ConnectionsPage(page);
  });

  test("1. Page load — shows Clusters header", async ({ page }) => {
    await connectionsPage.goto();
    await expect(page.getByText("Clusters").first()).toBeVisible();
    await expect(page.getByText("Manage your Aerospike clusters")).toBeVisible();
    await screenshot(page, "01-01-connection-page-load");
  });

  test("2. Create a new connection", async ({ page }) => {
    await connectionsPage.goto();
    await connectionsPage.openCreateDialog();
    await connectionsPage.fillConnectionForm(
      TEST_CONNECTION.name,
      TEST_CONNECTION.hosts,
      TEST_CONNECTION.port,
    );
    await connectionsPage.submitCreate();

    await expectToast(page, /Cluster created/i);
    await expect(connectionsPage.getCard(TEST_CONNECTION.name)).toBeVisible({
      timeout: 10_000,
    });
    await screenshot(page, "01-02-connection-created");
  });

  test("3. Health check shows Connected status", async ({ page }) => {
    await connectionsPage.goto();
    // Wait for health check to complete
    const card = connectionsPage.getCard(TEST_CONNECTION.name);
    await expect(card).toBeVisible({ timeout: 10_000 });
    // Health check runs automatically, wait for Connected status
    await expect(card.getByText(/Connected/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await screenshot(page, "01-03-connection-healthy");
  });

  test("4. Edit connection name", async ({ page }) => {
    await connectionsPage.goto();
    await expect(connectionsPage.getCard(TEST_CONNECTION.name)).toBeVisible({
      timeout: 10_000,
    });
    await connectionsPage.openEditDialog(TEST_CONNECTION.name);

    // Change name temporarily
    const nameInput = page.locator("#conn-name");
    await nameInput.clear();
    await nameInput.fill("E2E Test Cluster Renamed");
    await connectionsPage.submitUpdate();
    await expectToast(page, /Cluster updated/i);

    // Verify updated name
    await expect(connectionsPage.getCard("E2E Test Cluster Renamed")).toBeVisible({
      timeout: 10_000,
    });

    // Revert name back
    await connectionsPage.openEditDialog("E2E Test Cluster Renamed");
    await nameInput.clear();
    await nameInput.fill(TEST_CONNECTION.name);
    await connectionsPage.submitUpdate();
    await expectToast(page, /Cluster updated/i);

    await screenshot(page, "01-04-connection-edited");
  });

  test("5. Test Cluster button", async ({ page }) => {
    await connectionsPage.goto();
    await expect(connectionsPage.getCard(TEST_CONNECTION.name)).toBeVisible({
      timeout: 10_000,
    });
    await connectionsPage.openEditDialog(TEST_CONNECTION.name);
    await connectionsPage.testCluster();

    // Expect success message
    await expect(page.getByText(/Connected successfully|success/i).first()).toBeVisible({
      timeout: 10_000,
    });

    // Close dialog
    await page.getByRole("button", { name: "Cancel" }).click();
    await screenshot(page, "01-05-test-cluster");
  });

  test("6. Card click navigates to browser", async ({ page }) => {
    await connectionsPage.goto();
    const card = connectionsPage.getCard(TEST_CONNECTION.name);
    await expect(card).toBeVisible({ timeout: 10_000 });

    // Click the card body (avoid buttons)
    // Connected → /browser/, Disconnected → /cluster/
    await card.click({ position: { x: 50, y: 50 } });
    await page.waitForURL("**/browser/**", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/browser\//);
    await screenshot(page, "01-06-card-navigate");
  });

  test("7. Validation — empty name disables Create", async ({ page }) => {
    await connectionsPage.goto();
    await connectionsPage.openCreateDialog();

    // Leave name empty
    await page.locator("#conn-hosts").fill("localhost");
    await page.locator("#conn-port").fill("3000");

    const createBtn = page.getByRole("button", { name: "Create" });
    // Name is required — button should be disabled when name is empty
    await page.locator("#conn-name").fill("");
    await expect(createBtn).toBeDisabled();

    // Close dialog
    await page.getByRole("button", { name: "Cancel" }).click();
    await screenshot(page, "01-07-validation");
  });

  test("8. Import/Export buttons are visible", async ({ page }) => {
    await connectionsPage.goto();
    await expect(connectionsPage.importBtn).toBeVisible();
    await expect(connectionsPage.exportBtn).toBeVisible();
    await screenshot(page, "01-08-import-export");
  });
});
