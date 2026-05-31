const BASE = "http://localhost:3456";
const results = [];
const cookies = new Map();

function cookieStr() {
  return Array.from(cookies.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
}

async function req(name, url, opts = {}) {
  const headers = { "Content-Type": "application/json", ...opts.headers };
  if (cookies.size > 0) headers["Cookie"] = cookieStr();

  try {
    const res = await fetch(`${BASE}${url}`, { ...opts, headers, redirect: "manual" });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      setCookie.split(",").forEach(c => {
        const m = c.match(/([^=]+)=([^;]+)/);
        if (m) cookies.set(m[1].trim(), m[2].trim());
      });
    }
    let text = await res.text();
    if (!text || text.length === 0) text = `{empty}`;
    const is500 = text.includes("Internal server error") && res.status >= 500;
    const pass = is500 ? false : opts.expectFail ? text.includes(opts.expectFail) : opts.expect ? new RegExp(opts.expect, "i").test(text) : res.status < 500;
    results.push({ name, pass, status: res.status, detail: pass ? "OK" : text.slice(0, 150) });
    console.log(`${pass ? "✅" : "❌"} [${res.status}] ${name}`);
    return { res, text };
  } catch (e) {
    results.push({ name, pass: false, status: 0, detail: e.message });
    console.log(`❌ [ERR] ${name}: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log("============================================");
  console.log("  E2E FINAL TEST - LOCALHOST");
  console.log("============================================\n");

  // ===== PHASE 1: ADMIN AUTH + CRUD =====
  console.log("=== PHASE 1: ADMIN AUTH ===\n");
  await req("Login Admin", "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@test.com", password: "admin123" })
  });

  console.log("\n=== PHASE 2: ADMIN - USERS ===");
  await req("List Users", "/api/admin/users");
  await req("List Reports", "/api/admin/reports");
  await req("List Donations", "/api/admin/donations");
  await req("List Projects", "/api/admin/projects");
  await req("List Feedback", "/api/admin/feedback");

  console.log("\n=== PHASE 3: ADMIN - FORMS ===");
  await req("List Forms", "/api/admin/forms");
  const fRes = await req("Create Form", "/api/admin/forms", {
    method: "POST",
    body: JSON.stringify({ slug: "e2e-test-" + Date.now(), title: "E2E Test", description: "test", pointsOnSubmit: 10, contributionType: "monitoring" })
  });

  // Extract form ID and test add field
  let formId = "";
  try { formId = JSON.parse(fRes.text).form?.id || ""; } catch {}
  if (formId) {
    console.log(`   Form ID: ${formId}`);
    await req("Add Field", `/api/admin/forms/${formId}/fields`, {
      method: "POST",
      body: JSON.stringify({ fieldId: "test_f1", label: "Test Field", type: "text", required: true })
    });
    await req("Edit Form", `/api/admin/forms/${formId}`, {
      method: "PUT",
      body: JSON.stringify({ title: "E2E Updated Form" })
    });
    await req("Delete Form", `/api/admin/forms/${formId}`, { method: "DELETE" });
  }

  console.log("\n=== PHASE 4: ADMIN - COURSES ===");
  await req("List Courses", "/api/admin/courses");
  const cRes = await req("Create Course", "/api/admin/courses", {
    method: "POST",
    body: JSON.stringify({ slug: "e2e-course-" + Date.now(), title: "E2E Course", description: "test", level: "Beginner", duration: "10m", icon: "Book" })
  });
  let courseId = "";
  try { courseId = JSON.parse(cRes.text).course?.id || ""; } catch {}
  if (courseId) {
    await req("Edit Course", `/api/admin/courses/${courseId}`, {
      method: "PUT",
      body: JSON.stringify({ title: "E2E Updated Course" })
    });
    await req("Delete Course", `/api/admin/courses/${courseId}`, { method: "DELETE" });
  }

  console.log("\n=== PHASE 5: ADMIN - CONTENT & EXPORT ===");
  await req("Create Content", "/api/admin/content", {
    method: "POST",
    body: JSON.stringify({ section: "media", title: "E2E Media", type: "video", description: "Auto test" })
  });
  await req("Export Users CSV", "/api/admin/export?entity=users", { expect: "ID" });
  await req("Export Reports CSV", "/api/admin/export?entity=reports", { expect: "ID" });
  await req("Export Donations CSV", "/api/admin/export?entity=donations", { expect: "ID" });

  // ===== PHASE 6: USER FLOW =====
  console.log("\n=== PHASE 6: USER FLOW ===");
  await req("Login Volunteer", "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "volunteer@test.com", password: "vol123456" })
  });
  await req("Get Profile", "/api/user/profile");
  await req("Get Points", "/api/user/points");
  await req("Get Notifications", "/api/user/notifications");

  // Submit report with CSRF
  const csrfRes = await req("Get CSRF", "/api/csrf");
  let csrfToken = "";
  try { csrfToken = JSON.parse(csrfRes.text).token || ""; } catch {}
  if (csrfToken) {
    await req("Submit Report", "/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      body: JSON.stringify({ form_slug: "spring_monitoring", location_lat: -7.5, location_lng: 110.0, water_condition: "good" })
    });
  }

  // ===== PHASE 7: COURSE PROGRESS =====
  console.log("\n=== PHASE 7: COURSE ===");
  await req("Get Courses", "/api/courses");
  await req("Get Course Detail", "/api/courses/spring-conservation-basics");
  await req("Start Course", "/api/courses/progress", {
    method: "PUT",
    body: JSON.stringify({ courseId: "course-1", courseSlug: "spring-conservation-basics", completedModules: 5, totalModules: 5 })
  });

  // ===== PHASE 8: PROPOSAL =====
  console.log("\n=== PHASE 8: PROPOSAL ===");
  await req("List Projects", "/api/projects");
  await req("Create Project", "/api/projects", {
    method: "POST",
    body: JSON.stringify({ title: "E2E Test Project", summary: "Automated test project for e2e testing purposes", region: "Jawa Tengah", typeId: "restoration", goalAmount: 5000000, contactName: "E2E Tester", contactEmail: "volunteer@test.com", contactPhone: "08123456789" })
  });

  // ===== PHASE 9: GUEST FLOW =====
  console.log("\n=== PHASE 9: GUEST ===");
  const csrfRes2 = await req("Guest CSRF", "/api/csrf");
  let csrfToken2 = "";
  try { csrfToken2 = JSON.parse(csrfRes2.text).token || ""; } catch {}
  if (csrfToken2) {
    await req("Guest Submit Report", "/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken2, "_submit_time": String(Date.now() - 10000) },
      body: JSON.stringify({ form_slug: "spring_monitoring", location_lat: -6.5, location_lng: 107.0, water_quality: "good" })
    });
  }

  // ===== PHASE 10: EDGE CASES =====
  console.log("\n=== PHASE 10: EDGE CASES ===");
  await req("Invalid Login", "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "wrong@test.com", password: "wrong" }),
    expectFail: "salah"
  });
  await req("Unauthorized Admin", "/api/admin/users", { expectFail: "Unauthorized" });
  await req("Register Duplicate", "/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: "admin@test.com", password: "test123456" }),
    expectFail: "sudah"
  });
  await req("Guest Access Admin", "/api/admin/users", { expectFail: "Unauthorized" });

  // ===== FINAL REPORT =====
  console.log("\n============================================");
  console.log("           FINAL TEST REPORT");
  console.log("============================================");
  const pass = results.filter(r => r.pass).length;
  const fail = results.filter(r => !r.pass).length;
  console.log(`  Total: ${results.length}`);
  console.log(`  ✅ Pass: ${pass}`);
  console.log(`  ❌ Fail: ${fail}`);
  console.log(`  Rate: ${Math.round(pass/results.length*100)}%`);

  if (fail > 0) {
    console.log("\n  FAILED:");
    results.filter(r => !r.pass).forEach(r => console.log(`    ❌ ${r.name}: [${r.status}] ${r.detail.slice(0,200)}`));
  }
  console.log("\n  ALL PASSED:");
  results.filter(r => r.pass).forEach(r => console.log(`    ✅ ${r.name}`));
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
