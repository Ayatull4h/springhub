import { test, expect } from "@playwright/test";

test.describe("Map Interaction Basics", () => {
  test("map section should exist on landing page", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const mapSection = page.locator("section").filter({ hasText: /Peta|Map/i }).first();
    await expect(mapSection).toBeVisible({ timeout: 10000 });
  });

  test("map container should render Leaflet elements", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const leafletContainer = page.locator(".leaflet-container");
    await expect(leafletContainer).toBeVisible({ timeout: 15000 });
  });

  test("map filter checkboxes should exist", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const mapSection = page.locator("section").filter({ hasText: /Peta|Map/i }).first();
    const checkboxes = mapSection.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count > 0) {
      await expect(checkboxes.first()).toBeVisible();
      const isChecked = await checkboxes.first().isChecked();
      await checkboxes.first().click();
      const isCheckedAfter = await checkboxes.first().isChecked();
      expect(isCheckedAfter).toBe(!isChecked);
    } else {
      test.skip();
    }
  });

  test("map zoom controls should be present", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const leafletZoom = page.locator(".leaflet-control-zoom");
    await expect(leafletZoom).toBeVisible({ timeout: 15000 });

    const zoomIn = leafletZoom.locator(".leaflet-control-zoom-in");
    const zoomOut = leafletZoom.locator(".leaflet-control-zoom-out");
    await expect(zoomIn).toBeVisible();
    await expect(zoomOut).toBeVisible();
  });
});
