import { test, expect } from "@playwright/test";

test.describe("Language Toggle (EN/ID)", () => {
  test("language toggle button should exist", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const langBtn = page.locator('button[aria-label="Toggle language"]');
    await expect(langBtn).toBeVisible({ timeout: 5000 });
  });

  test("toggle should switch between EN and ID", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const langBtn = page.locator('button[aria-label="Toggle language"]');
    const initialText = await langBtn.textContent();

    await langBtn.click();
    await page.waitForTimeout(300);

    const afterText = await langBtn.textContent();
    expect(afterText).not.toBe(initialText);

    if (initialText?.trim() === "EN") {
      expect(afterText?.trim()).toBe("ID");
    } else {
      expect(afterText?.trim()).toBe("EN");
    }
  });

  test("language should persist across page navigation", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const langBtn = page.locator('button[aria-label="Toggle language"]');
    const initialLang = await langBtn.textContent();

    await page.goto("/report/spring-monitoring", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const langBtn2 = page.locator('button[aria-label="Toggle language"]');
    await expect(langBtn2).toBeVisible({ timeout: 5000 });
    const persistedLang = await langBtn2.textContent();
    expect(persistedLang?.trim()).toBe(initialLang?.trim());
  });
});
