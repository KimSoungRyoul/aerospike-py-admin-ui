import { test, expect } from "@playwright/test";
import { TerminalPage } from "../pages/terminal-page";
import { screenshot } from "../fixtures/base-page";
import { getTestConnectionId } from "../fixtures/test-data";

test.describe("09 - AQL Terminal", () => {
  let connId: string;
  let terminalPage: TerminalPage;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    connId = await getTestConnectionId(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    terminalPage = new TerminalPage(page);
  });

  test("1. Terminal page loads with input and quick buttons", async ({ page }) => {
    await terminalPage.goto(connId);

    await expect(terminalPage.input).toBeVisible();
    await expect(page.getByText("Quick:")).toBeVisible();
    await expect(page.getByRole("button", { name: "namespaces", exact: true })).toBeVisible();
    await screenshot(page, "09-01-terminal-page");
  });

  test("2. Quick command — namespaces", async ({ page }) => {
    await terminalPage.goto(connId);
    await terminalPage.clickQuickCommand("namespaces");

    // Should see some output
    const output = terminalPage.getOutputArea();
    await expect(output.getByText(/namespaces|test/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await screenshot(page, "09-02-quick-namespaces");
  });

  test("3. Custom command execution — show sets", async ({ page }) => {
    await terminalPage.goto(connId);
    await terminalPage.executeCommand("show sets");

    // Wait for output
    const output = terminalPage.getOutputArea();
    await expect(output.getByText(/show sets/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await screenshot(page, "09-03-custom-command");
  });

  test("4. History navigation with ArrowUp", async ({ page }) => {
    await terminalPage.goto(connId);

    // Execute a command first
    await terminalPage.executeCommand("show namespaces");
    await page.waitForTimeout(1_000);

    // Clear input and press ArrowUp
    await terminalPage.input.clear();
    await terminalPage.pressArrowUp();

    // Input should now have the previous command
    const inputValue = await terminalPage.input.inputValue();
    expect(inputValue).toContain("show namespaces");
    await screenshot(page, "09-04-history-navigation");
  });

  test("5. Clear history", async ({ page }) => {
    await terminalPage.goto(connId);

    // Execute a command
    await terminalPage.clickQuickCommand("namespaces");
    await page.waitForTimeout(1_000);

    // Clear
    await terminalPage.clearHistory();
    await page.waitForTimeout(500);

    // Should show empty state or no history items
    await expect(page.getByText(/Type a command|Enter aql/i).first()).toBeVisible({
      timeout: 5_000,
    });
    await screenshot(page, "09-05-clear-history");
  });

  test("6. Invalid command shows in history", async ({ page }) => {
    await terminalPage.goto(connId);
    await terminalPage.executeCommand("invalid_command_xyz");

    // Should show the command in history (possibly with error styling)
    const output = terminalPage.getOutputArea();
    await expect(output.getByText("invalid_command_xyz").first()).toBeVisible({ timeout: 10_000 });
    await screenshot(page, "09-06-invalid-command");
  });

  test("7. Multiple quick commands create history entries", async ({ page }) => {
    await terminalPage.goto(connId);

    await terminalPage.clickQuickCommand("namespaces");
    await page.waitForTimeout(1_500);
    await terminalPage.clickQuickCommand("sets");
    await page.waitForTimeout(1_500);
    await terminalPage.clickQuickCommand("build");
    await page.waitForTimeout(1_500);

    // Should see multiple command entries in the output
    const output = terminalPage.getOutputArea();
    const dollarSigns = output.locator("text=$");
    const count = await dollarSigns.count();
    expect(count).toBeGreaterThanOrEqual(3);
    await screenshot(page, "09-07-multiple-commands");
  });
});
