import { Page, expect } from "@playwright/test";

export async function waitForPageLoad(page: Page, heading?: string | RegExp) {
  await page.waitForLoadState("domcontentloaded");
  if (heading) {
    await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible({
      timeout: 15_000,
    });
  }
}

export async function expectToast(page: Page, message: string | RegExp) {
  const toast = page.locator("[data-sonner-toast]", { hasText: message }).first();
  await expect(toast).toBeVisible({ timeout: 10_000 });
}

export async function confirmDialog(page: Page, confirmLabel = "Delete") {
  const dialog = page.getByRole("alertdialog").or(page.getByRole("dialog"));
  await expect(dialog.first()).toBeVisible({ timeout: 5_000 });
  await dialog.getByRole("button", { name: confirmLabel }).first().click();
}

export async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: `e2e/screenshots/${name}.png`,
    fullPage: true,
  });
}

export async function waitForApiResponse(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse(
    (res) =>
      (typeof urlPattern === "string"
        ? res.url().includes(urlPattern)
        : urlPattern.test(res.url())) && res.status() < 500,
    { timeout: 15_000 },
  );
}
