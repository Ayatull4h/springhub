const BASE = "https://springhub-mp2fyzd4f-ayatull4hs-projects.vercel.app";
const log = [];

async function t(name, url, opts = {}) {
  try {
    const res = await fetch(`${BASE}${url}`, {
      ...opts,
      headers: { "Content-Type": "application/json", ...opts.headers },
      redirect: "manual",
    });
    const body = await res.text();
    const ok = res.status < 500 && !body.includes("error") && body.length > 0;
    log.push({ name, pass: ok, status: res.status, detail: ok ? "OK" : body.slice(0, 100) });
    console.log(`${ok ? "✅" : "❌"} [${res.status}] ${name}`);
    return { res, body, cookies: res.headers.getSetCookie?.() || [] };
  } catch (e) {
    log.push({ name, pass: false, status: 0, detail: e.message });
    console.log(`❌ [ERR] ${name}: ${e.message}`);
    return null;
  }
}

async function main() {
  // ===== PHASE 1: PUBLIC API =====
  console.log("\n=== PUBLIC API ===");
  await t("Health", "/api/health");
  await t("Forms List", "/api/forms");
  await t("Single Form", "/api/forms/spring_monitoring");
  await t("Leaderboard", "/api/leaderboard");
  await t("Point Rules", "/api/point-rules");
  await t("Courses", "/api/courses");
  await t("Content Media", "/api/content?section=media");
  await t("Gallery", "/api/gallery");
  await t("Single Course", "/api/courses/spring-conservation");

  // ===== PHASE 2: AUTH =====
  console.log("\n=== AUTH ===");
  const reg = await t("Register User", "/api/auth/register", {
    method: "POST", body: JSON.stringify({ email: "test@test.com", password: "Test12345678", username: "Tester" })
  });
  await t("Register Duplicate", "/api/auth/register", {
    method: "POST", body: JSON.stringify({ email: "test@test.com", password: "Test12345678" })
  });

  // ===== PHASE 3: USER FLOW =====
  console.log("\n=== USER FLOW ===");
  await t("Submit Report", "/api/reports", {
    method: "POST", body: JSON.stringify({ form_slug: "spring_monitoring", fieldData: { test: "data" } })
  });

  // ===== PHASE 4: ADMIN =====
  console.log("\n=== ADMIN ===");
  await t("Admin Users (no auth)", "/api/admin/users");

  // ===== PHASE 5: EDGE CASES =====
  console.log("\n=== EDGE CASES ===");
  await t("Invalid Login", "/api/auth/login", {
    method: "POST", body: JSON.stringify({ email: "wrong@test.com", password: "wrong" })
  });
  await t("Missing CSRF", "/api/reports", {
    method: "POST", body: JSON.stringify({ form_slug: "test" })
  });
  await t("Forgot Password", "/api/auth/forgot-password", {
    method: "POST", body: JSON.stringify({ email: "test@test.com" })
  });

  // ===== REPORT =====
  console.log("\n=============== FINAL REPORT ===============");
  const pass = log.filter(r => r.pass).length;
  const fail = log.filter(r => !r.pass).length;
  console.log(`Total: ${log.length} | ✅ Pass: ${pass} | ❌ Fail: ${fail} | ${Math.round(pass/log.length*100)}%`);
  log.filter(r => !r.pass).forEach(r => console.log(`  ❌ [${r.status}] ${r.name}: ${r.detail}`));
}

main().catch(console.error);
