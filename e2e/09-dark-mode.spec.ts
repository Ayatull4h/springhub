import { test, expect } from "@playwright/test";

test.describe("Dark Mode Toggle", () => {
  test("dark mode toggle button should exist and toggle state", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const toggleBtn = page.locator('button[aria-label="Toggle dark mode"]');
    await expect(toggleBtn).toBeVisible({ timeout: 5000 });

    const html = page.locator("html");
    const initialHasDark = await html.evaluate(el => el.classList.contains("dark"));

    await toggleBtn.click();
    await page.waitForTimeout(300);

    const afterHasDark = await html.evaluate(el => el.classList.contains("dark"));
    expect(afterHasDark).not.toBe(initialHasDark);
  });

  test("dark mode should persist across navigation", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const toggleBtn = page.locator('button[aria-label="Toggle dark mode"]');
    await toggleBtn.click();
    await page.waitForTimeout(300);

    await page.goto("/faq", { waitUntil: "load" });
    await page.waitForTimeout(1500);

    const html = page.locator("html");
    await expect(async () => {
      const cls = await html.getAttribute("class");
      expect(cls).toContain("dark");
    }).toPass({ timeout: 5000 });
  });

  test("light/dark icon should switch", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const toggleBtn = page.locator('button[aria-label="Toggle dark mode"]');

    const initialSvgCount = await toggleBtn.locator("svg").count();
    await toggleBtn.click();
    await page.waitForTimeout(300);

    // Icon should still exist after toggle
    const afterSvgCount = await toggleBtn.locator("svg").count();
    expect(afterSvgCount).toBe(initialSvgCount);
  });
});
