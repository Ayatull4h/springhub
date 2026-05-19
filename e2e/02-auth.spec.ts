import { test, expect } from "@playwright/test";
import { TEST_USERS } from "./helpers";

test.describe("Authentication", () => {
  test("Sign-in page should render login form", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByText("Sign In").first()).toBeVisible();
  });

  test("Join page should render registration form", async ({ page }) => {
    await page.goto("/join");
    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("Should show error with wrong credentials", async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill("#email", "wrong@email.com");
    await page.fill("#password", "wrongpass");
    await page.click('button[type="submit"]');
    await expect(page.locator(".bg-red-50")).toBeVisible();
  });

  test("Should login as admin successfully", async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill("#email", TEST_USERS.admin.email);
    await page.fill("#password", TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/");
    expect(page.url()).not.toContain("/sign-in");
  });

  test("Admin should access /admin without redirect", async ({ page }) => {
    // Login
    await page.goto("/sign-in");
    await page.fill("#email", TEST_USERS.admin.email);
    await page.fill("#password", TEST_USERS.admin.password);
    await page.click('button[type="submit"]');

    // Wait for redirect to complete and session cookie to set
    await page.waitForURL((url) => !url.pathname.includes("/sign-in"), { timeout: 15000 });
    await page.waitForTimeout(1000); // Let cookie propagate

    // Now try admin
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/sign-in");
  });

  test("Unauthenticated user should be redirected from /profile", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/sign-in");
  });

  test("Unauthenticated user should be redirected from /projects/new", async ({ page }) => {
    await page.goto("/projects/new");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/sign-in");
  });
});
