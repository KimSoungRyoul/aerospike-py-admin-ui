import { Page, Locator, expect } from "@playwright/test";

export class IndexesPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createBtn: Locator;
  readonly refreshBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /Secondary Indexes/i });
    this.createBtn = page.getByRole("button", { name: "Create Index" });
    this.refreshBtn = page.getByRole("button", { name: "Refresh" });
  }

  async goto(connId: string) {
    await this.page.goto(`/indexes/${connId}`);
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  async openCreateDialog() {
    await this.createBtn.click();
    await expect(this.page.getByText("Create Secondary Index")).toBeVisible();
  }

  async fillIndexForm(opts: {
    namespace: string;
    set?: string;
    bin: string;
    name: string;
    type?: string;
  }) {
    // Namespace select
    const nsSelect = this.page.getByRole("dialog").locator("select").first();
    await nsSelect.selectOption(opts.namespace);

    if (opts.set) {
      await this.page.getByPlaceholder("set name").fill(opts.set);
    }
    await this.page.getByPlaceholder("bin name").fill(opts.bin);
    await this.page.getByPlaceholder("idx_my_bin").fill(opts.name);

    if (opts.type) {
      const typeSelect = this.page.getByRole("dialog").locator("select").last();
      await typeSelect.selectOption(opts.type);
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
