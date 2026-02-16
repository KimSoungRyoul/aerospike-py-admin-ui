import { Page, Locator, expect } from "@playwright/test";

export class TerminalPage {
  readonly page: Page;
  readonly input: Locator;
  readonly clearBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.getByPlaceholder("Enter aql command...");
    this.clearBtn = page.getByRole("button", { name: /Clear/i });
  }

  async goto(connId: string) {
    await this.page.goto(`/terminal/${connId}`);
    await expect(this.page.getByText("Quick:")).toBeVisible({ timeout: 15_000 });
  }

  async executeCommand(command: string) {
    await this.input.fill(command);
    await this.input.press("Enter");
    // Wait for output to appear
    await this.page.waitForTimeout(2_000);
  }

  async clickQuickCommand(name: string) {
    await this.page.getByRole("button", { name, exact: true }).click();
    await this.page.waitForTimeout(2_000);
  }

  async pressArrowUp() {
    await this.input.press("ArrowUp");
  }

  async clearHistory() {
    await this.clearBtn.click();
  }

  getHistoryEntries(): Locator {
    return this.page.locator("[class*='bg-zinc-950'] >> text=$").locator("..");
  }

  getOutputArea(): Locator {
    return this.page.locator("[class*='bg-zinc-950']").first();
  }
}
