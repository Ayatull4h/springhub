import { test, expect } from "@playwright/test";
import { TEST_USERS } from "./helpers";

test.describe("Admin Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill("#email", TEST_USERS.admin.email);
    await page.fill("#password", TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    // Wait for redirect to home after successful login
    await page.waitForURL("**/", { timeout: 15000 });
    await page.waitForLoadState("networkidle");
  });

  const adminPages = [
    { path: "/admin", name: "Dashboard" },
    { path: "/admin/users", name: "Users" },
    { path: "/admin/reports", name: "Reports" },
    { path: "/admin/donations", name: "Donations" },
    { path: "/admin/projects", name: "Projects" },
    { path: "/admin/review", name: "Review Queue" },
    { path: "/admin/points", name: "Points" },
    { path: "/admin/courses", name: "Courses" },
    { path: "/admin/forms", name: "Forms" },
    { path: "/admin/feedback", name: "Feedback" },
  ];

  for (const ap of adminPages) {
    test(`${ap.name} page should load`, async ({ page }) => {
      const response = await page.goto(ap.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("body")).toBeVisible();
    });
  }

  test("Admin sidebar should have menu items", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    // Wait for sidebar to appear (admin layout fetches /api/auth/me)
    const sidebar = page.locator('[data-testid="admin-sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // Check key items that should always be present
    const keyItems = ["Dashboard", "Reports", "Users"];
    for (const item of keyItems) {
      await expect(sidebar.getByText(item).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
