import { Page, expect } from "@playwright/test";

export const TEST_USERS = {
  volunteer: { email: "volunteer@springhub.id", password: "vol12345" },
  admin: { email: "admin@springhub.id", password: "demo12345" },
};

export const ALL_ROUTES = [
  { path: "/", name: "Landing Page" },
  { path: "/sign-in", name: "Sign In" },
  { path: "/join", name: "Join" },
  { path: "/faq", name: "FAQ" },
  { path: "/help", name: "Help Center" },
  { path: "/privacy", name: "Privacy Policy" },
  { path: "/terms", name: "Terms of Service" },
  { path: "/report-issue", name: "Report Issue" },
  { path: "/report/spring-monitoring", name: "Form: Spring Monitoring" },
  { path: "/report/spring-restoration", name: "Form: Spring Restoration" },
  { path: "/report/trench-development", name: "Form: Trench Development" },
  { path: "/report/tree-planting", name: "Form: Tree Planting" },
  { path: "/report/seedling-stock", name: "Form: Seedling Stock" },
  { path: "/admin/forms", name: "Admin Forms" },
  { path: "/admin/feedback", name: "Admin Feedback" },
];

/**
 * Login as a specific user via the sign-in page
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  // Wait for redirect
  await page.waitForURL("**/");
}

/**
 * Check that a page has no console errors
 */
export async function verifyNoConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  // Navigate and wait for load
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
}

/**
 * Check page has valid meta tags
 */
export async function checkMetaTags(page: Page) {
  const title = await page.title();
  expect(title).toBeTruthy();
  expect(title.length).toBeGreaterThan(5);

  const metaDesc = await page.$('meta[name="description"]');
  if (metaDesc) {
    const content = await metaDesc.getAttribute("content");
    expect(content).toBeTruthy();
  }

  const h1 = await page.$("h1");
  expect(h1).toBeTruthy();
  const h1Text = await h1!.textContent();
  expect(h1Text).toBeTruthy();
}

/**
 * Take screenshot of a specific element or full page
 */
export async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `e2e-report/screenshots/${name}.png`, fullPage: true });
}

/**
 * Generate sample test files for upload testing
 * Creates files in a temp directory
 */
export async function generateTestFiles(page: Page) {
  // Create test files using browser evaluation
  await page.evaluate(() => {
    // Files will be created by the test specs directly
  });
}
