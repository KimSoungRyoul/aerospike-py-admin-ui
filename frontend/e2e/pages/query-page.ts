import { Page, Locator, expect } from "@playwright/test";

export class QueryPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly executeBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText("Query Builder").first();
    this.executeBtn = page.getByRole("button", { name: /Execute/i });
  }

  async goto(connId: string) {
    await this.page.goto(`/query/${connId}`);
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  async selectNamespace(ns: string) {
    // The query page auto-selects the first namespace on load.
    // Wait for the combobox to appear (replaces Skeleton after cluster loads).
    const nsTrigger = this.page.getByRole("combobox").first();
    await expect(nsTrigger).toBeVisible({ timeout: 15_000 });

    // Wait for auto-selection to complete (trigger text changes from placeholder)
    try {
      await expect(nsTrigger).toContainText(ns, { timeout: 10_000 });
      return; // Already auto-selected
    } catch {
      // Not auto-selected, try manual selection
      await nsTrigger.click();
      await this.page.getByRole("option", { name: ns }).first().click();
    }
  }

  async selectSet(set: string) {
    // Second combobox is the set selector
    const setTrigger = this.page.getByRole("combobox").nth(1);
    await setTrigger.click();
    await this.page
      .getByRole("option", { name: new RegExp(set) })
      .first()
      .click();
  }

  async selectQueryType(type: "Scan" | "Index Query" | "PK Query") {
    await this.page.getByRole("button", { name: type }).click();
  }

  async execute() {
    await this.executeBtn.click();
  }

  async waitForResults() {
    await expect(this.page.getByText(/Returned/).first()).toBeVisible({ timeout: 30_000 });
  }

  getResultsTable(): Locator {
    return this.page.getByTestId("query-results-table");
  }

  getExportJsonBtn(): Locator {
    return this.page.getByRole("button", { name: "JSON" });
  }

  getExportCsvBtn(): Locator {
    return this.page.getByRole("button", { name: "CSV" });
  }
}
