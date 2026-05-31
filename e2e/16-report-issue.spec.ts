import { test, expect } from "@playwright/test";

test.describe("Report Issue Page", () => {
  test("report issue page should load", async ({ page }) => {
    const response = await page.goto("/report-issue");
    expect(response?.status()).toBe(200);
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(50);
  });

  test("report issue form should have text fields", async ({ page }) => {
    await page.goto("/report-issue");
    await page.waitForLoadState("networkidle");

    const textareas = page.locator("main textarea, textarea");
    const count = await textareas.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("report issue should have submit button in main content", async ({ page }) => {
    await page.goto("/report-issue");
    await page.waitForLoadState("networkidle");

    const kirimBtn = page.getByRole("button", { name: /Kirim|Submit|Send/i }).first();
    await expect(kirimBtn).toBeVisible();
  });

  test("report issue form can fill textarea", async ({ page }) => {
    await page.goto("/report-issue");
    await page.waitForLoadState("networkidle");

    // Fill bug description textarea
    const textarea = page.locator("#bugDescription");
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.click();
    await textarea.fill("Test report issue from E2E test - please ignore");
    const value = await textarea.inputValue();
    expect(value).toContain("Test report issue");
  });
});
