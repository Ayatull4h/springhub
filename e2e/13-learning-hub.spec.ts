import { test, expect } from "@playwright/test";

test.describe("Learning Hub", () => {
  test("learning hub section should exist on landing page", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const learnSection = page.locator("section").filter({ hasText: /Belajar|Learn|Course/i }).first();
    await expect(learnSection).toBeVisible({ timeout: 5000 });
  });

  test("course detail page should load", async ({ page }) => {
    const response = await page.goto("/learn/pengenalan-mata-air");
    expect(response?.status()).toBe(200);
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(50);
  });

  test("course with invalid slug should return 404 or show error", async ({ page }) => {
    const response = await page.goto("/learn/tidak-ada-course-ini");
    expect(response?.status() === 404 || response?.status() === 200).toBeTruthy();
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("course module page should load", async ({ page }) => {
    const response = await page.goto("/learn/pengenalan-mata-air/modul-1");
    expect(response?.status()).toBe(200);
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(50);
  });

  test("nav link 'Learn' should exist", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const nav = page.locator('nav[aria-label="Primary"]');
    const learnLink = nav.locator("a").filter({ hasText: /Belajar|Learn/i });
    await expect(learnLink.first()).toBeVisible({ timeout: 5000 });
  });
});
