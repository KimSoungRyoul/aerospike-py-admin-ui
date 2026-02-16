import { Page, Locator, expect } from "@playwright/test";

export class SettingsPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Settings" });
  }

  async goto() {
    await this.page.goto("/settings");
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  async selectTheme(theme: "Light" | "Dark" | "System") {
    await this.page.getByText(theme, { exact: true }).click();
  }

  async isDarkMode(): Promise<boolean> {
    return this.page
      .locator("html.dark")
      .count()
      .then((c) => c > 0);
  }

  getAppearanceSection(): Locator {
    return this.page.getByText("Appearance").first();
  }

  getCeLimitationsSection(): Locator {
    return this.page.getByText("Aerospike CE Limitations").first();
  }

  getAboutSection(): Locator {
    return this.page.getByText("About").first();
  }

  getKeyboardShortcutsSection(): Locator {
    return this.page.getByText("Keyboard Shortcuts").first();
  }
}
