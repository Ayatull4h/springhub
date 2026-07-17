import { test, expect } from "@playwright/test";

test.describe("User Profile Page", () => {
  test("unauthenticated user should be redirected to sign-in", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/sign-in");
  });

  test("profile page should redirect to sign-in with redirect param", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("redirect=");
  });

  test("profile page should handle auth state gracefully", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    const isSignIn = page.url().includes("/sign-in");
    if (isSignIn) {
      const signInForm = page.locator("#email");
      await expect(signInForm).toBeVisible();
    }
  });

  test("sign-in page should render form with email field", async ({ page }) => {
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator("#password");
    await expect(passwordInput).toBeVisible();
  });
});
