import { test, expect } from "@playwright/test";
import { SettingsPage } from "../pages/settings-page";
import { screenshot } from "../fixtures/base-page";

test.describe("10 - Settings", () => {
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
  });

  test("1. Settings page shows all sections", async ({ page }) => {
    await settingsPage.goto();

    await expect(settingsPage.getAppearanceSection()).toBeVisible();
    await expect(settingsPage.getCeLimitationsSection()).toBeVisible();
    await expect(settingsPage.getAboutSection()).toBeVisible();
    await screenshot(page, "10-01-settings-sections");
  });

  test("2. Dark mode toggle", async ({ page }) => {
    await settingsPage.goto();
    await settingsPage.selectTheme("Dark");

    // Wait for theme change
    await page.waitForSelector("html.dark", { timeout: 3_000 });
    const isDark = await settingsPage.isDarkMode();
    expect(isDark).toBe(true);
    await screenshot(page, "10-02-dark-mode");
  });

  test("3. Light mode toggle", async ({ page }) => {
    await settingsPage.goto();
    await settingsPage.selectTheme("Light");

    // Wait for theme change
    await page.waitForTimeout(1_000);
    const isDark = await settingsPage.isDarkMode();
    expect(isDark).toBe(false);
    await screenshot(page, "10-03-light-mode");
  });

  test("4. CE limitations info", async ({ page }) => {
    await settingsPage.goto();

    await expect(page.getByText("Max Nodes per Cluster").first()).toBeVisible();
    await expect(page.getByText("8").first()).toBeVisible();
    await expect(page.getByText("Max Namespaces").first()).toBeVisible();
    await expect(page.getByText("Not Supported").first()).toBeVisible();
    await screenshot(page, "10-04-ce-limitations");
  });

  test("5. About version info", async ({ page }) => {
    await settingsPage.goto();

    await expect(page.getByText("0.1.0").first()).toBeVisible();
    await expect(page.getByText("Next.js 16").first()).toBeVisible();
    await expect(page.getByText("aerospike-py").first()).toBeVisible();
    await screenshot(page, "10-05-about-info");
  });

  test("6. Keyboard shortcuts section", async ({ page }) => {
    await settingsPage.goto();

    await expect(settingsPage.getKeyboardShortcutsSection()).toBeVisible();
    await expect(page.getByText("Toggle Sidebar").first()).toBeVisible();
    await screenshot(page, "10-06-keyboard-shortcuts");
  });
});
