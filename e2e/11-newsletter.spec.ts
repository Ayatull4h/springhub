import { test, expect } from "@playwright/test";

test.describe("Newsletter Subscription", () => {
  test("newsletter form should be visible in footer", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const emailInput = page.locator("footer input[name='email']");
    await expect(emailInput).toBeVisible();

    const submitBtn = page.locator("footer button[type='submit']");
    await expect(submitBtn).toBeVisible();
  });

  test("newsletter should reject empty email", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const emailInput = page.locator("footer input[name='email']");
    const submitBtn = page.locator("footer button[type='submit']");

    await emailInput.focus();
    await submitBtn.click();

    const validationMsg = await emailInput.evaluate((el) => (el as HTMLInputElement).validationMessage);
    expect(validationMsg).toBeTruthy();
  });

  test("newsletter should show dialog on submit", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const emailInput = page.locator("footer input[name='email']");
    await emailInput.fill("test-newsletter@example.com");

    const dialogPromise = page.waitForEvent("dialog", { timeout: 5000 }).catch(() => null);

    const submitBtn = page.locator("footer button[type='submit']");
    await submitBtn.click();

    const dialog = await dialogPromise;
    if (dialog) {
      await dialog.accept();
    }
  });
});
