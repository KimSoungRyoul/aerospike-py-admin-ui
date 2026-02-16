import { Page, Locator, expect } from "@playwright/test";

export class ClusterPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly refreshBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /Overview/i }).first();
    this.refreshBtn = page.getByRole("button", { name: "Refresh" });
  }

  async goto(connId: string) {
    await this.page.goto(`/cluster/${connId}`);
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  async getNodeCount(): Promise<string> {
    return (await this.page.locator("text=NODES").locator("..").locator("..").textContent()) ?? "";
  }

  async clickNodesTab() {
    await this.page.getByRole("tab", { name: /Nodes/i }).click();
  }

  async clickDashboardTab() {
    await this.page.getByRole("tab", { name: /Dashboard/i }).click();
  }

  async refresh() {
    await this.refreshBtn.click();
  }
}
