import { Page, Locator, expect } from "@playwright/test";

export class AdminPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly usersTab: Locator;
  readonly rolesTab: Locator;
  readonly refreshBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /Administration/i });
    this.usersTab = page.getByRole("tab", { name: /Users/i });
    this.rolesTab = page.getByRole("tab", { name: /Roles/i });
    this.refreshBtn = page.getByRole("button", { name: "Refresh" });
  }

  async goto(connId: string) {
    await this.page.goto(`/admin/${connId}`);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async clickUsersTab() {
    await this.usersTab.click();
  }

  async clickRolesTab() {
    await this.rolesTab.click();
  }

  async openCreateUserDialog() {
    await this.page.getByRole("button", { name: "Create User" }).click();
    await expect(this.page.getByText("Create User").nth(1)).toBeVisible();
  }

  async fillUserForm(username: string, password: string) {
    await this.page.getByPlaceholder("username").fill(username);
    await this.page.getByPlaceholder("password").fill(password);
  }

  async submitCreate() {
    await this.page.getByRole("dialog").getByRole("button", { name: "Create" }).click();
  }
}
