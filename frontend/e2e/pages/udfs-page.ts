import { Page, Locator, expect } from "@playwright/test";

export class UdfsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newUdfBtn: Locator;
  readonly refreshBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText(/UDF Modules/i).first();
    this.newUdfBtn = page.getByRole("button", { name: /New UDF/i });
    this.refreshBtn = page.getByRole("button", { name: "Refresh" });
  }

  async goto(connId: string) {
    await this.page.goto(`/udfs/${connId}`);
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  async openUploadDialog() {
    await this.newUdfBtn.click();
    await expect(this.page.getByText("Upload UDF Module")).toBeVisible();
  }

  async fillUploadForm(filename: string, content: string) {
    await this.page.getByPlaceholder("my_module.lua").fill(filename);
    // CodeEditor - use Monaco if available, otherwise textarea
    const editor = this.page.locator(".monaco-editor").first();
    if ((await editor.count()) > 0) {
      await editor.click();
      await this.page.keyboard.press("Meta+a");
      await this.page.keyboard.type(content);
    } else {
      const textarea = this.page.getByRole("dialog").locator("textarea").first();
      await textarea.fill(content);
    }
  }

  async submitUpload() {
    await this.page.getByRole("dialog").getByRole("button", { name: "Upload" }).click();
  }

  async viewSource(filename: string) {
    const row = this.page.locator("tr", { hasText: filename });
    // Click the view (eye) button
    await row.getByRole("button").first().click();
  }

  async deleteUdf(filename: string) {
    const row = this.page.locator("tr", { hasText: filename });
    await row.getByRole("button").last().click();
  }

  getTable(): Locator {
    return this.page.locator("table").first();
  }
}
