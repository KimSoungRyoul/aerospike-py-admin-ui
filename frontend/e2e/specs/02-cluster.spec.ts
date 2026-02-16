import { test, expect } from "@playwright/test";
import { ClusterPage } from "../pages/cluster-page";
import { screenshot } from "../fixtures/base-page";
import { getTestConnectionId } from "../fixtures/test-data";

test.describe("02 - Cluster Overview", () => {
  let connId: string;
  let clusterPage: ClusterPage;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    connId = await getTestConnectionId(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    clusterPage = new ClusterPage(page);
  });

  test("1. Cluster nodes are displayed", async ({ page }) => {
    await clusterPage.goto(connId);

    // At least one node should be visible
    await expect(page.getByText("NODES").first()).toBeVisible();
    await expect(page.getByText(/node/i).first()).toBeVisible();
    await screenshot(page, "02-01-cluster-nodes");
  });

  test("2. Namespace info shows 'test' namespace", async ({ page }) => {
    await clusterPage.goto(connId);

    await expect(page.getByText("NAMESPACES").first()).toBeVisible();
    await expect(page.getByText("test").first()).toBeVisible();
    await screenshot(page, "02-02-namespace-info");
  });

  test("3. Dashboard tab shows metric charts", async ({ page }) => {
    await clusterPage.goto(connId);
    await clusterPage.clickDashboardTab();

    // Verify metric cards/charts are rendered
    await expect(page.getByText("Read Requests").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Write Requests").first()).toBeVisible();

    // Verify Recharts SVG is rendered
    const charts = page.locator(".recharts-wrapper, svg.recharts-surface");
    await expect(charts.first()).toBeVisible({ timeout: 10_000 });
    await screenshot(page, "02-03-dashboard-metrics");
  });

  test("4. Refresh button reloads data", async ({ page }) => {
    await clusterPage.goto(connId);

    // Click refresh
    await clusterPage.refresh();

    // Data should still be visible after refresh
    await expect(page.getByText("NODES").first()).toBeVisible({ timeout: 10_000 });
    await screenshot(page, "02-04-refresh");
  });

  test("5. Node detail shows Build, Edition, Uptime", async ({ page }) => {
    await clusterPage.goto(connId);
    await clusterPage.clickNodesTab();

    // Node card fields
    await expect(page.getByText(/Build/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Edition/i).first()).toBeVisible();
    await expect(page.getByText(/Uptime/i).first()).toBeVisible();
    await expect(page.getByText(/Connections/i).first()).toBeVisible();
    await screenshot(page, "02-05-node-detail");
  });
});
