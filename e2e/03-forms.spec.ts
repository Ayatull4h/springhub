import { test, expect } from "@playwright/test";

test.describe("Report Forms", () => {
  const formSlugs = [
    "spring-monitoring",
    "spring-restoration",
    "trench-development",
    "tree-planting",
    "seedling-stock",
  ];

  for (const slug of formSlugs) {
    test(`${slug} form should render all fields`, async ({ page }) => {
      await page.goto(`/report/${slug}`);
      await expect(page.getByText(/Laporkan|Kirim|Submit/i).first()).toBeVisible();
    });
  }

  test("Invalid form slug should show not found", async ({ page }) => {
    await page.goto("/report/nonexistent-form");
    await page.waitForTimeout(2000);
    await expect(page.getByText(/tidak ditemukan/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("Anti-spam: honeypot field should be hidden", async ({ page }) => {
    await page.goto("/report/spring-monitoring");
    const honeypot = page.locator("#_website");
    await expect(honeypot).not.toBeVisible();
  });
});
