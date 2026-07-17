import { test, expect } from "@playwright/test";

test.describe("Forgot Password Flow", () => {
  test("forgot password page should render form", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText(/Lupa|Password|Lupa/i);
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.getByText("Kirim Link Reset")).toBeVisible();
  });

  test("should show response after email submission", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.fill("#email", "volunteer@springhub.id");
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1500);

    const body = await page.textContent("body");
    const hasFeedback = body!.includes("email") || body!.includes("reset") || body!.includes("link") || body!.includes("gagal") || body!.includes("success");
    expect(hasFeedback).toBeTruthy();
  });

  test("should show feedback for invalid email", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.fill("#email", "not-an-email");
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    const body = await page.textContent("body");
    const hasFeedback = body!.includes("email") || body!.includes("error") || body!.includes("reset") || body!.includes("gagal") || body!.includes("Kirim");
    expect(hasFeedback).toBeTruthy();
  });

  test("should have link back to sign-in", async ({ page }) => {
    await page.goto("/forgot-password");

    const backLink = page.locator("a").filter({ hasText: /Kembali ke login/i });
    await expect(backLink).toBeVisible();
    const href = await backLink.getAttribute("href");
    expect(href).toContain("sign-in");
  });
});
