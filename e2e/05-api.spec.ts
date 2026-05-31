import { test, expect } from "@playwright/test";

test.describe("API Endpoints", () => {
  test("GET /api/forms should return active forms", async ({ request }) => {
    const response = await request.get("/api/forms");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.forms).toBeDefined();
    expect(Array.isArray(data.forms)).toBeTruthy();
  });

  test("GET /api/reports should return approved reports", async ({ request }) => {
    const response = await request.get("/api/reports");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.reports).toBeDefined();
  });

  test("GET /api/courses should return courses", async ({ request }) => {
    const response = await request.get("/api/courses");
    expect(response.ok()).toBeTruthy();
  });

  test("GET /api/leaderboard should return rankings", async ({ request }) => {
    const response = await request.get("/api/leaderboard");
    expect(response.ok()).toBeTruthy();
  });

  test("POST /api/feedback with valid data should succeed", async ({ request }) => {
    // Get CSRF token first
    const csrfRes = await request.get("/api/csrf");
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.token || "";

    const response = await request.post("/api/feedback", {
      headers: { "x-csrf-token": csrfToken },
      data: {
        type: "saran",
        saran: "Test saran untuk testing E2E minimal 10 karakter",
      },
    });
    const data = await response.json();
    expect(response.ok || response.status() === 429).toBeTruthy();
    if (response.ok) {
      expect(data.success).toBeTruthy();
    }
  });

  test("POST /api/auth/register with invalid data should fail", async ({ request }) => {
    const response = await request.post("/api/auth/register", {
      data: {
        email: "invalid-email",
        password: "12",
      },
    });
    expect(response.status()).toBe(400);
  });
});
