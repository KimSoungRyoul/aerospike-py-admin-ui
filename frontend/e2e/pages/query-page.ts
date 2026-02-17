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
    await this.page.getByText("Select namespace").first().click();
    await this.page.getByRole("option", { name: ns }).first().click();
  }

  async selectSet(set: string) {
    await this.page.locator("select, [role=combobox]").nth(1).click();
    await this.page
      .getByRole("option", { name: new RegExp(set) })
      .first()
      .click();
  }

  async selectQueryType(type: "Scan" | "SI Query") {
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
