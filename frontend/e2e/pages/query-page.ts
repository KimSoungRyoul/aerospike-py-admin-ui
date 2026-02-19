import { Page, Locator, expect } from "@playwright/test";

/**
 * Page object for the integrated query toolbar on the set browser page.
 * Query functionality is now embedded in /browser/[connId]/[ns]/[set].
 */
export class QueryPage {
  readonly page: Page;
  readonly executeBtn: Locator;
  readonly filterModeSelect: Locator;

  constructor(page: Page) {
    this.page = page;
    this.executeBtn = page.getByRole("button", { name: /Execute/i });
    this.filterModeSelect = page.getByTestId("filter-mode-select");
  }

  async goto(connId: string, ns: string, set: string) {
    await this.page.goto(`/browser/${connId}/${ns}/${set}`);
    // Wait for the page and filter bar to load
    await expect(this.filterModeSelect).toBeVisible({
      timeout: 15_000,
    });
  }

  async switchToIndexQuery() {
    await this.filterModeSelect.click();
    await this.page.getByRole("option", { name: "Index Query" }).click();
  }

  async switchToPKLookup() {
    await this.filterModeSelect.click();
    await this.page.getByRole("option", { name: "PK Lookup" }).click();
  }

  async switchToBrowse() {
    await this.filterModeSelect.click();
    await this.page.getByRole("option", { name: "Scan All" }).click();
  }

  async execute() {
    await this.executeBtn.click();
  }

  async waitForResults() {
    await expect(this.page.getByText(/Returned/).first()).toBeVisible({ timeout: 30_000 });
  }

  getExportJsonBtn(): Locator {
    return this.page.getByRole("button", { name: "JSON" });
  }

  getExportCsvBtn(): Locator {
    return this.page.getByRole("button", { name: "CSV" });
  }
}
