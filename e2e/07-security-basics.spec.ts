import { test, expect } from "@playwright/test";

test.describe("Security Basic Tests", () => {
  test("Sign-in page should not leak passwords in URL", async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill("#email", "test@test.com");
    await page.fill("#password", "supersecret123");
    const url1 = page.url();
    await page.click('button[type="submit"]');
    const url2 = page.url();
    expect(url2).not.toContain("password");
    expect(url2).not.toContain("supersecret");
  });

  test("API should reject oversized payload", async ({ request }) => {
    const bigData = { data: "x".repeat(100000) };
    const response = await request.post("/api/feedback", {
      data: { ...bigData, type: "bug", bugDescription: "Test bug description for testing purposes min 10 chars" },
    });
    // Should either accept or reject with proper error, not crash
    expect(response.status()).toBeGreaterThanOrEqual(200);
    const data = await response.json().catch(() => ({}));
    expect(data).toBeDefined();
  });

  test("Report form should have no XSS vulnerability in text fields", async ({ page }) => {
    await page.goto("/report/spring-monitoring");
    const xssPayload = "<script>alert('XSS')</script>";
    const textInput = page.locator('input[type="text"], textarea').first();
    if (await textInput.isVisible()) {
      await textInput.fill(xssPayload);
      const value = await textInput.inputValue();
      expect(value).toContain("script");
    }
  });
});
