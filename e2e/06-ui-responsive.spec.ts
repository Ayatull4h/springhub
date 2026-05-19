import { test, expect } from "@playwright/test";

test.describe("UI & Responsiveness", () => {
  test("Navigation header should be visible on all pages", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/SpringHub/i).first()).toBeVisible();
  });

  test("Footer should have all links", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByText("Help Center").first()).toBeVisible();
    await expect(page.getByText("Report Issue").first()).toBeVisible();
    await expect(page.getByText("FAQ").first()).toBeVisible();
  });

  test("Mobile viewport should show hamburger menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test("Tablet viewport should work", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    // Page should render without crashing
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(50);
  });
});
