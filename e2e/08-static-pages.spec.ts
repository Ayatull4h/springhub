import { test, expect } from "@playwright/test";

test.describe("Static Pages - Content Rendering", () => {
  const staticPages = [
    { path: "/faq", name: "FAQ", expected: ["FAQ", "SpringHub"] },
    { path: "/help", name: "Help Center", expected: ["Help Center", "Cara"] },
    { path: "/privacy", name: "Privacy Policy", expected: ["Privasi", "Privacy"] },
    { path: "/terms", name: "Terms of Service", expected: ["Ketentuan", "Terms"] },
  ];

  for (const pageInfo of staticPages) {
    test(`${pageInfo.name} (${pageInfo.path}) should render content`, async ({ page }) => {
      const response = await page.goto(pageInfo.path);
      expect(response?.status()).toBe(200);

      const body = await page.textContent("body");
      expect(body).toBeTruthy();
      expect(body!.length).toBeGreaterThan(100);

      for (const keyword of pageInfo.expected) {
        expect(body).toContain(keyword);
      }
    });
  }

  test("Footer links should navigate to correct static pages", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const helpLink = page.locator("footer a").filter({ hasText: /Help|Bantuan/i });
    await expect(helpLink.first()).toBeVisible();
    await helpLink.first().click();
    await page.waitForURL("**/help", { timeout: 10000 });
  });
});
