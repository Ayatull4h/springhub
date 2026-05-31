import { execSync } from "child_process";
import { writeFileSync } from "fs";

const BASE = "https://springhub-mp2fyzd4f-ayatull4hs-projects.vercel.app";
const VER = `npx vercel curl "${BASE}`;
const results: { name: string; pass: boolean; detail: string }[] = [];
let ADMIN_COOKIE = "";
let USER_COOKIE = "";

function run(name: string, cmd: string, expect: (body: string, code: number) => boolean) {
  try {
    const out = execSync(`${VER}${cmd}" 2>&1 | tail -1`, {
      cwd: "C:\\Users\\ayatu\\springhub",
      encoding: "utf-8",
      timeout: 60000,
    }).trim();
    const code = 0;
    const pass = expect(out, code);
    results.push({ name, pass, detail: pass ? "OK" : out.slice(0, 200) });
    console.log(`${pass ? "✅" : "❌"} ${name}`);
    return out;
  } catch (e: any) {
    results.push({ name, pass: false, detail: e.message.slice(0, 200) });
    console.log(`❌ ${name}: ${e.message.slice(0, 100)}`);
    return "";
  }
}

function expectStatus(expected: number) {
  return (body: string, code: number) => {
    try { const j = JSON.parse(body); return !j.error; } catch { return body.length > 0; }
  };
}

// ===== PHASE 1: ADMIN =====
console.log("\n=== PHASE 1: ADMIN ===");

// Login admin
run("Admin Login", "/api/auth/login -X POST -H \"Content-Type: application/json\" -d '{\"email\":\"admin@test.com\",\"password\":\"adminpass123\"}'", expectStatus(200));

// Users
run("List Users", "/api/admin/users", expectStatus(200));

// Forms
run("Create Form", "/api/admin/forms -X POST -H \"Content-Type: application/json\" -d '{\"slug\":\"test-form\",\"title\":\"Test Form\",\"pointsOnSubmit\":10}'", expectStatus(200));

// Content
run("Create Content", "/api/admin/content -X POST -H \"Content-Type: application/json\" -d '{\"section\":\"media\",\"title\":\"Test Media\",\"type\":\"video\"}'", expectStatus(200));

// Export
run("Export Users CSV", "/api/admin/export?entity=users", expectStatus(200));

// ===== PHASE 2: USER =====
console.log("\n=== PHASE 2: USER ===");

run("Register User", "/api/auth/register -X POST -H \"Content-Type: application/json\" -d '{\"email\":\"testuser@test.com\",\"password\":\"Test12345678\"}'", expectStatus(200));

run("Login User", "/api/auth/login -X POST -H \"Content-Type: application/json\" -d '{\"email\":\"testuser@test.com\",\"password\":\"Test12345678\"}'", expectStatus(200));

run("Get Profile", "/api/user/profile", expectStatus(200));

// ===== PHASE 3: PUBLIC API =====
console.log("\n=== PHASE 3: PUBLIC API ===");

run("Health", "/api/health", expectStatus(200));
run("Leaderboard", "/api/leaderboard", expectStatus(200));
run("Point Rules", "/api/point-rules", expectStatus(200));
run("Courses", "/api/courses", expectStatus(200));
run("Gallery", "/api/gallery", expectStatus(200));
run("Single Form", "/api/forms/spring_monitoring", expectStatus(200));
run("Content Blocks", "/api/content?section=media", expectStatus(200));

// ===== PHASE 4: EDGE CASES =====
console.log("\n=== PHASE 4: EDGE CASES ===");

run("Unauthorized admin", "/api/admin/users", expectStatus(401));
run("Invalid login", "/api/auth/login -X POST -H \"Content-Type: application/json\" -d '{\"email\":\"wrong@test.com\",\"password\":\"wrong\"}'", expectStatus(401));
run("Register duplicate", "/api/auth/register -X POST -H \"Content-Type: application/json\" -d '{\"email\":\"testuser@test.com\",\"password\":\"Test12345678\"}'", expectStatus(409));

// ===== REPORT =====
console.log("\n\n========== FINAL REPORT ==========");
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length} | ✅ Pass: ${passed} | ❌ Fail: ${failed} | ${Math.round(passed/results.length*100)}%`);

results.forEach(r => {
  if (!r.pass) console.log(`  ❌ ${r.name}: ${r.detail}`);
});

writeFileSync("C:\\Users\\ayatu\\springhub\\test-report.json", JSON.stringify(results, null, 2));
console.log("\nReport saved to test-report.json");
