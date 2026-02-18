import { Page, Locator, expect } from "@playwright/test";

export class BrowserPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly refreshBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /Namespaces/i }).first();
    this.refreshBtn = page.getByRole("button", { name: "Refresh" });
  }

  async goto(connId: string) {
    await this.page.goto(`/browser/${connId}`);
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  getNamespaceCard(ns: string): Locator {
    return this.page.locator("[class*=card]", { hasText: ns }).first();
  }

  async clickSet(setName: string) {
    await this.page
      .getByRole("button", { name: new RegExp(setName) })
      .first()
      .click();
  }

  async openConfigureNamespaceDialog(ns: string) {
    const card = this.getNamespaceCard(ns);
    await card.locator("button[aria-label*='Configure']").click();
    await expect(this.page.getByRole("dialog").getByText("Configure Namespace")).toBeVisible();
  }

  async openCreateSetDialog(ns: string) {
    const card = this.getNamespaceCard(ns);
    await card.getByRole("button", { name: "Create Set" }).click();
    await expect(this.page.getByRole("dialog").getByText("Create Set")).toBeVisible();
  }

  async fillCreateSetForm(setName: string) {
    await this.page.getByPlaceholder("my_set").fill(setName);
  }

  async submitCreate() {
    await this.page.getByRole("dialog").getByRole("button", { name: "Create" }).click();
  }
}
