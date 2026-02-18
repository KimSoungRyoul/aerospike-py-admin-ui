import { Page, Locator, expect } from "@playwright/test";

export class IndexesPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createBtn: Locator;
  readonly refreshBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use level=1 to avoid matching "No secondary indexes" (h3)
    this.heading = page.getByRole("heading", { name: /Secondary Indexes/i, level: 1 });
    this.createBtn = page.getByRole("main").getByRole("button", { name: "Create Index" }).first();
    this.refreshBtn = page.getByRole("button", { name: "Refresh" });
  }

  async goto(connId: string) {
    await this.page.goto(`/indexes/${connId}`);
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  async openCreateDialog() {
    await this.createBtn.click();
    await expect(this.page.getByRole("dialog").getByText("Create Secondary Index")).toBeVisible();
  }

  async fillIndexForm(opts: {
    namespace: string;
    set?: string;
    bin: string;
    name: string;
    type?: string;
  }) {
    const dialog = this.page.getByRole("dialog");

    // Namespace select (Radix Select / combobox)
    const nsCombobox = dialog.getByRole("combobox").first();
    await nsCombobox.click();
    await this.page.getByRole("option", { name: opts.namespace }).first().click();

    if (opts.set) {
      await dialog.getByPlaceholder("set name").fill(opts.set);
    }
    await dialog.getByPlaceholder("bin name").fill(opts.bin);
    await dialog.getByPlaceholder("idx_my_bin").fill(opts.name);

    if (opts.type) {
      // Type select (second combobox in dialog)
      const typeCombobox = dialog.getByRole("combobox").last();
      await typeCombobox.click();
      await this.page
        .getByRole("option", { name: new RegExp(opts.type, "i") })
        .first()
        .click();
    }
  }

  async submitCreate() {
    await this.page.getByRole("dialog").getByRole("button", { name: "Create" }).click();
  }

  async deleteIndex(name: string) {
    const row = this.page.getByTestId("indexes-table-body").locator("tr", { hasText: name });
    await row.getByRole("button", { name: /Delete index/i }).click();
  }

  getTable(): Locator {
    return this.page.getByTestId("indexes-table");
  }
}
