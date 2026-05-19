import { test, expect } from "@playwright/test";
import { ALL_ROUTES, checkMetaTags } from "./helpers";

test.describe("Content Integrity - All Pages", () => {
  for (const route of ALL_ROUTES) {
    test(`${route.name} (${route.path}) should load with 200`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      await checkMetaTags(page);
    });
  }

  test("404 page should show custom not-found", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(50);
  });

  test("Favicon should be accessible", async ({ page }) => {
    const response = await page.goto("/favicon.svg");
    expect(response?.status()).toBe(200);
  });

  test("Manifest should be accessible", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);
  });
});
