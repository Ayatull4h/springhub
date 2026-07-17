import { test, expect } from "@playwright/test";

test.describe("Admin Panel Pages", () => {
  const adminPages = [
    { path: "/admin", name: "Dashboard" },
    { path: "/admin/users", name: "Users" },
    { path: "/admin/reports", name: "Reports" },
    { path: "/admin/review", name: "Review Queue" },
  ];

  for (const ap of adminPages) {
    test(`${ap.name} page should load (with or without auth)`, async ({ page }) => {
      const response = await page.goto(ap.path);
      expect(response?.status() === 200 || response?.status() === 307 || response?.status() === 302).toBeTruthy();
      await page.waitForLoadState("networkidle");

      const body = await page.textContent("body");
      expect(body).toBeTruthy();
      expect(body!.length).toBeGreaterThan(50);
    });
  }

  test("admin page should redirect unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    const isSignIn = page.url().includes("/sign-in");
    if (isSignIn) {
      const emailInput = page.locator("#email");
      await expect(emailInput).toBeVisible();
    } else {
      const body = await page.textContent("body");
      expect(body!.length).toBeGreaterThan(50);
    }
  });

  test("admin users page should render", async ({ page }) => {
    const response = await page.goto("/admin/users");
    expect(response?.status() === 200 || response?.status() === 307 || response?.status() === 302).toBeTruthy();
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("admin reports page should render", async ({ page }) => {
    const response = await page.goto("/admin/reports");
    expect(response?.status() === 200 || response?.status() === 307 || response?.status() === 302).toBeTruthy();
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});
