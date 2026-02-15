import { test, expect } from "@playwright/test";

const CONN_ID = "conn-1";

test.describe("Aerospike UI - All Pages Test", () => {
  // ── 1. Connections Page (Home) ──
  test("01. Connections page load", async ({ page }) => {
    await page.goto("/");
    const main = page.locator("main");
    await expect(main.getByText("Local Docker")).toBeVisible({ timeout: 15000 });
    await expect(main.getByText("Staging", { exact: true })).toBeVisible();
    await expect(main.getByText("Connected").first()).toBeVisible();
    await page.screenshot({ path: "e2e/screenshots/01-connections.png", fullPage: true });
  });

  // ── 2. Browser Page ──
  test("02. Browser page - record table", async ({ page }) => {
    await page.goto(`/browser/${CONN_ID}/test/users`);
    await expect(page.locator("table").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("50 records")).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: "e2e/screenshots/02-browser.png", fullPage: true });
  });

  // ── 3. Cluster Page ──
  test("03. Cluster page - nodes/namespaces", async ({ page }) => {
    await page.goto(`/cluster/${CONN_ID}`);
    await expect(page.getByRole("heading", { name: "Cluster" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("BB9060016AE4202").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("test").first()).toBeVisible();
    await page.screenshot({ path: "e2e/screenshots/03-cluster.png", fullPage: true });
  });

  // ── 4. Query Page ──
  test("04. Query page - query builder", async ({ page }) => {
    await page.goto(`/query/${CONN_ID}`);
    await expect(page.getByText("Query Builder")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Execute").first()).toBeVisible();
    await page.screenshot({ path: "e2e/screenshots/04-query.png", fullPage: true });
  });

  // ── 5. Indexes Page ──
  test("05. Indexes page - index list", async ({ page }) => {
    await page.goto(`/indexes/${CONN_ID}`);
    await expect(page.getByRole("heading", { name: "Secondary Indexes" })).toBeVisible({
      timeout: 15000,
    });
    await page.screenshot({ path: "e2e/screenshots/05-indexes.png", fullPage: true });
  });

  // ── 6. Admin Page ──
  test("06. Admin page - User/Role management", async ({ page }) => {
    await page.goto(`/admin/${CONN_ID}`);
    await expect(page.getByRole("tab", { name: /Users/i })).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: "e2e/screenshots/06-admin.png", fullPage: true });
  });

  // ── 7. UDFs Page ──
  test("07. UDFs page - module list", async ({ page }) => {
    await page.goto(`/udfs/${CONN_ID}`);
    await expect(page.getByText(/UDF Modules|UDF/i).first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: "e2e/screenshots/07-udfs.png", fullPage: true });
  });

  // ── 8. Terminal Page ──
  test("08. Terminal page - command input", async ({ page }) => {
    await page.goto(`/terminal/${CONN_ID}`);
    await expect(page.getByText("Quick:")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("namespaces").first()).toBeVisible();
    await page.screenshot({ path: "e2e/screenshots/08-terminal.png", fullPage: true });
  });

  // ── 9. Cluster Metrics tab ──
  test("09. Cluster Metrics tab - metrics dashboard", async ({ page }) => {
    await page.goto(`/cluster/${CONN_ID}`);
    await expect(page.getByRole("heading", { name: "Cluster" })).toBeVisible({ timeout: 15000 });
    await page.getByRole("tab", { name: /Metrics/i }).click();
    await expect(page.getByText("Read Requests")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Live")).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: "e2e/screenshots/09-metrics.png", fullPage: true });
  });

  // ── 10. Settings Page ──
  test("10. Settings page - theme/info", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Appearance")).toBeVisible();
    await expect(page.getByText("Aerospike CE Limitations")).toBeVisible();
    await page.screenshot({ path: "e2e/screenshots/10-settings.png", fullPage: true });
  });

  // ── 11. Dark Mode toggle ──
  test("11. Dark mode toggle", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText("Appearance")).toBeVisible({ timeout: 15000 });
    await page.getByText("Dark", { exact: true }).click();
    // Wait for theme transition to complete
    await page.waitForSelector("html.dark", { timeout: 3000 });
    await page.screenshot({ path: "e2e/screenshots/11-dark-mode.png", fullPage: true });
  });

  // ── 12. Prometheus Metrics tab ──
  test("12. Prometheus Metrics tab", async ({ page }) => {
    await page.goto(`/cluster/${CONN_ID}`);
    await expect(page.getByRole("heading", { name: "Cluster" })).toBeVisible({ timeout: 15000 });
    await page.getByRole("tab", { name: /Metrics/i }).click();
    await expect(page.getByText("Read Requests")).toBeVisible({ timeout: 15000 });
    await page.getByRole("tab", { name: /Prometheus/i }).click();
    await expect(page.getByText("aerospike_node_up").first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: "e2e/screenshots/12-prometheus.png", fullPage: true });
  });

  // ── 13. TabBar tab switching ──
  test("13. TabBar tab switching", async ({ page }) => {
    await page.goto(`/cluster/${CONN_ID}`);
    await expect(page.getByRole("heading", { name: "Cluster" })).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "Indexes" }).last().click();
    await page.waitForURL(`**/indexes/${CONN_ID}`, { timeout: 10000 });
    await expect(page).toHaveURL(new RegExp(`/indexes/${CONN_ID}`));
    await page.screenshot({ path: "e2e/screenshots/13-tabbar-nav.png", fullPage: true });
  });

  // ── 14. Sidebar connection tree ──
  test("14. Sidebar connection tree", async ({ page }) => {
    await page.goto(`/cluster/${CONN_ID}`);
    await expect(page.getByRole("heading", { name: "Cluster" })).toBeVisible({ timeout: 15000 });
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("Local Docker")).toBeVisible({ timeout: 5000 });
    await expect(sidebar.getByText("Staging").first()).toBeVisible();
    await page.screenshot({ path: "e2e/screenshots/14-sidebar.png", fullPage: true });
  });
});
