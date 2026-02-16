import { Page, Locator, expect } from "@playwright/test";

export class ConnectionsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newClusterBtn: Locator;
  readonly importBtn: Locator;
  readonly exportBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText("Clusters").first();
    this.newClusterBtn = page.getByRole("button", { name: "New Cluster" });
    this.importBtn = page.getByRole("button", { name: "Import" });
    this.exportBtn = page.getByRole("button", { name: "Export" });
  }

  async goto() {
    await this.page.goto("/");
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  async openCreateDialog() {
    await this.newClusterBtn.click();
    await expect(this.page.getByText("New Cluster").nth(1)).toBeVisible();
  }

  async fillConnectionForm(name: string, hosts: string, port: string) {
    await this.page.locator("#conn-name").fill(name);
    await this.page.locator("#conn-hosts").fill(hosts);
    await this.page.locator("#conn-port").fill(port);
  }

  async submitCreate() {
    await this.page.getByRole("button", { name: "Create" }).click();
  }

  async submitUpdate() {
    await this.page.getByRole("button", { name: "Update" }).click();
  }

  getCard(name: string): Locator {
    return this.page.locator("[class*=card]", { hasText: name }).first();
  }

  async openEditDialog(name: string) {
    const card = this.getCard(name);
    await card.getByRole("button").filter({ hasText: "" }).last().click();
    await this.page.getByRole("menuitem", { name: /Edit/i }).click();
    await expect(this.page.getByText("Edit Cluster")).toBeVisible();
  }

  async deleteConnection(name: string) {
    const card = this.getCard(name);
    await card.getByRole("button").filter({ hasText: "" }).last().click();
    await this.page.getByRole("menuitem", { name: /Delete/i }).click();
  }

  async testCluster() {
    await this.page.getByRole("button", { name: "Test Cluster" }).click();
  }

  async clickCard(name: string) {
    await this.getCard(name).click();
  }
}
