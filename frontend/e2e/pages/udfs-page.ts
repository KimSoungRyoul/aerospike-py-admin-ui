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
    await expect(this.page.getByRole("dialog").getByText("Upload UDF Module")).toBeVisible();
  }

  async fillUploadForm(filename: string, content: string) {
    const dialog = this.page.getByRole("dialog");
    await dialog.getByPlaceholder("my_module.lua").fill(filename);

    // Wait for Monaco editor to fully initialize
    const monacoEditor = dialog.locator(".monaco-editor").first();
    await expect(monacoEditor).toBeVisible({ timeout: 15_000 });

    // Set Monaco content via its API to avoid auto-bracket/auto-complete issues
    await this.page.evaluate((text) => {
      const monaco = (globalThis as unknown as Record<string, unknown>).monaco as
        | {
            editor: { getEditors(): { getModel(): { setValue(v: string): void } | null }[] };
          }
        | undefined;
      if (monaco?.editor) {
        const editors = monaco.editor.getEditors();
        if (editors.length > 0) {
          editors[editors.length - 1].getModel()?.setValue(text);
        }
      }
    }, content);

    // Wait for React onChange to propagate
    await this.page.waitForTimeout(500);
  }

  async submitUpload() {
    await this.page.getByRole("dialog").getByRole("button", { name: "Upload" }).click();
  }

  async viewSource(filename: string) {
    const row = this.page.getByTestId("udfs-table-body").locator("tr", { hasText: filename });
    await row.getByRole("button", { name: /View source/i }).click();
  }

  async deleteUdf(filename: string) {
    const row = this.page.getByTestId("udfs-table-body").locator("tr", { hasText: filename });
    await row.getByRole("button", { name: /Delete UDF/i }).click();
  }

  getTable(): Locator {
    return this.page.getByTestId("udfs-table");
  }
}
