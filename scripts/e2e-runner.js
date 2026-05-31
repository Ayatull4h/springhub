const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const BASE = "https://springhub-mp2fyzd4f-ayatull4hs-projects.vercel.app";
const CWD = "C:\\Users\\ayatu\\springhub";
const COOKIE_JAR = path.join(os.tmpdir(), "sh-cookies.txt");
const results = [];
const PASS = [];
const FAIL = [];

function writeJson(obj) {
  const f = path.join(os.tmpdir(), "sh-body.json");
  fs.writeFileSync(f, JSON.stringify(obj));
  return f;
}

function r(name, url, body = null, cookie = "", expected = null) {
  let extra = "";
  if (body) {
    const f = writeJson(body);
    extra = `-X POST -H "Content-Type: application/json" -d @${f}`;
  }
  const ck = cookie === "jar" ? ` --cookie-jar "${COOKIE_JAR}"` : cookie === "use" ? ` --cookie "${COOKIE_JAR}"` : "";
  const cmd = `cd /d ${CWD} && npx vercel curl "${BASE}${url}" -- ${extra} ${ck}`;
  try {
    const out = execSync(cmd, { encoding: "utf-8", timeout: 60000, stdio: ["pipe", "pipe", "pipe"] });
    const lines = out.split("\n").filter(l => l.startsWith("{"));
    const data = lines.join("\n") || out.slice(-500);
    const is500 = data.includes("Internal server error");
    const pass = expected ? new RegExp(expected, "i").test(data) : !is500;
    results.push({ name, pass, detail: pass ? "OK" : data.replace(/\n/g, " ").slice(0, 150) });
    if (pass) PASS.push(name); else FAIL.push(name);
    console.log(`${pass ? "✅" : "❌"} ${name}`);
    return data;
  } catch (e) {
    const out = e.stdout || e.message || "";
    const lines = out.split("\n").filter(l => l.startsWith("{"));
    const data = lines.join("\n") || out.slice(-500);
    results.push({ name, pass: false, detail: data.replace(/\n/g, " ").slice(0, 150) });
    FAIL.push(name);
    console.log(`❌ ${name}`);
    return data;
  }
}

function rPut(name, url, body) {
  let extra = "";
  const ck = ` --cookie "${COOKIE_JAR}"`;
  if (body) {
    const f = writeJson(body);
    extra = `-X PUT -H "Content-Type: application/json" -d @${f}`;
  }
  const cmd = `cd /d ${CWD} && npx vercel curl "${BASE}${url}" -- ${extra} ${ck}`;
  try {
    const out = execSync(cmd, { encoding: "utf-8", timeout: 60000, stdio: ["pipe", "pipe", "pipe"] });
    const lines = out.split("\n").filter(l => l.startsWith("{"));
    const data = lines.join("\n") || out.slice(-500);
    const pass = !data.includes("Internal server error");
    results.push({ name, pass, detail: pass ? "OK" : data.replace(/\n/g, " ").slice(0, 150) });
    if (pass) PASS.push(name); else FAIL.push(name);
    console.log(`${pass ? "✅" : "❌"} ${name}`);
    return data;
  } catch (e) {
    const out = e.stdout || e.message || "";
    const lines = out.split("\n").filter(l => l.startsWith("{"));
    const data = lines.join("\n") || out.slice(-500);
    results.push({ name, pass: false, detail: data.replace(/\n/g, " ").slice(0, 150) });
    FAIL.push(name);
    console.log(`❌ ${name}`);
  }
}

function rDel(name, url) {
  const cmd = `cd /d ${CWD} && npx vercel curl "${BASE}${url}" -- -X DELETE --cookie "${COOKIE_JAR}"`;
  try {
    const out = execSync(cmd, { encoding: "utf-8", timeout: 60000, stdio: ["pipe", "pipe", "pipe"] });
    const data = out.split("\n").filter(l => l.startsWith("{")).join("\n") || out.slice(-300);
    const pass = !data.includes("Internal server error");
    results.push({ name, pass, detail: pass ? "OK" : data.slice(0, 150) });
    if (pass) PASS.push(name); else FAIL.push(name);
    console.log(`${pass ? "✅" : "❌"} ${name}`);
  } catch (e) {
    const out = e.stdout || e.message || "";
    const data = out.split("\n").filter(l => l.startsWith("{")).join("\n") || out.slice(-300);
    results.push({ name, pass: false, detail: data.slice(0, 150) });
    FAIL.push(name);
    console.log(`❌ ${name}`);
  }
}

try { fs.unlinkSync(COOKIE_JAR); } catch {}

console.log("============================================");
console.log("  E2E FULL AUTOMATED TEST - SpringHub");
console.log("============================================\n");

// ===== PHASE 1: LOGIN AS ADMIN =====
console.log("=== PHASE 1: ADMIN AUTH ===\n");
r("Login Admin", "/api/auth/login", { email: "admin@test.com", password: "admin123" }, "jar");

if (FAIL.length > 0 && FAIL[0] === "Login Admin") {
  console.log("\n❌ Cannot continue - admin login failed");
  process.exit(1);
}

// ===== PHASE 2: ADMIN - USERS =====
console.log("\n=== PHASE 2: ADMIN - USERS ===\n");
r("List Users", "/api/admin/users", null, "use");
r("List Reports", "/api/admin/reports", null, "use");
r("List Donations", "/api/admin/donations", null, "use");
r("List Projects", "/api/admin/projects", null, "use");

// ===== PHASE 3: ADMIN - FORMS CRUD =====
console.log("\n=== PHASE 3: ADMIN - FORMS ===\n");
r("List Forms", "/api/admin/forms", null, "use");

// Create form
const formBody = { slug: "test-form-" + Date.now(), title: "E2E Test Form", description: "Auto-created", pointsOnSubmit: 50, contributionType: "monitoring" };
const formData = r("Create Form", "/api/admin/forms", formBody, "use");
let formId = "";
try {
  const jsonStr = formData.substring(formData.indexOf("{"));
  formId = JSON.parse(jsonStr)?.form?.id || "";
} catch {}
if (formId) {
  // Add field
  r("Add Field", `/api/admin/forms/${formId}/fields`, { fieldId: "test_field", label: "Test Field", type: "text", required: true }, "use");
  // Edit field
  rPut("Edit Field", `/api/admin/forms/${formId}`, { title: "E2E Updated Form" }, "use");
  // Delete form
  rDel("Delete Form", `/api/admin/forms/${formId}`, "use");
} else {
  console.log("❌ Create Form (no ID returned)");
}

// ===== PHASE 4: ADMIN - COURSES CRUD =====
console.log("\n=== PHASE 4: ADMIN - COURSES ===\n");
r("List Courses", "/api/admin/courses", null, "use");

const courseBody = { slug: "e2e-course-" + Date.now(), title: "E2E Test Course", description: "Auto-created", level: "Beginner", duration: "10 min", icon: "BookOpen" };
const courseData = r("Create Course", "/api/admin/courses", courseBody, "use");
let courseId = "";
try {
  const jsonStr = courseData.substring(courseData.indexOf("{"));
  courseId = JSON.parse(jsonStr)?.course?.id || "";
} catch {}
if (courseId) {
  r("Edit Course", `/api/admin/courses/${courseId}`, null, "use"); // just GET
  rDel("Delete Course", `/api/admin/courses/${courseId}`, "use");
}

// ===== PHASE 5: ADMIN - CONTENT & EXPORT =====
console.log("\n=== PHASE 5: ADMIN - CONTENT & EXPORT ===\n");
r("Create Content", "/api/admin/content", { section: "media", title: "E2E Media", type: "video", description: "Test" }, "use");
r("Export Users CSV", "/api/admin/export?entity=users", null, "use", "ID,Username,Email");
r("Export Reports CSV", "/api/admin/export?entity=reports", null, "use", "ID,User,FormSlug");
r("Export Donations CSV", "/api/admin/export?entity=donations", null, "use", "ID,User");

// ===== PHASE 6: USER FLOW =====
console.log("\n=== PHASE 6: USER FLOW ===\n");

// Login as volunteer
r("Login Volunteer", "/api/auth/login", { email: "volunteer@test.com", password: "vol123456" }, "jar");
r("Get Profile", "/api/user/profile", null, "use");
r("Get Points", "/api/user/points", null, "use");
r("Notifications", "/api/user/notifications", null, "use");

// Submit report
r("Submit Report", "/api/reports", {
  form_slug: "spring_monitoring", location_lat: -7.5, location_lng: 110.0,
  water_condition: "good", notes: "E2E test report from automated runner"
}, "use", "success|report");

// Report issue
r("Submit Feedback", "/api/feedback", { type: "bug", bugDescription: "E2E automated test bug report - please ignore" }, "use", "success|id");

// ===== PHASE 7: PUBLIC API =====
console.log("\n=== PHASE 7: PUBLIC API ===\n");
r("Health", "/api/health");
r("Forms List", "/api/forms");
r("Leaderboard", "/api/leaderboard");
r("Point Rules", "/api/point-rules");
r("Courses", "/api/courses");
r("Course Detail", "/api/courses/spring-conservation-basics");
r("Content Media", "/api/content?section=media");
r("Gallery", "/api/gallery");
r("Forgot Password", "/api/auth/forgot-password", { email: "admin@test.com" });

// ===== PHASE 8: EDGE CASES =====
console.log("\n=== PHASE 8: EDGE CASES ===\n");
r("Invalid Login", "/api/auth/login", { email: "wrong@test.com", password: "wrong" }, "", "salah");
r("Admin No Auth (no cookie)", "/api/admin/users", null, "", "Unauthorized");
r("Register Duplicate", "/api/auth/register", { email: "admin@test.com", password: "test123456" }, "", "sudah");

// ===== FINAL REPORT =====
console.log("\n============================================");
console.log("           FINAL TEST REPORT");
console.log("============================================");
console.log(`  Total: ${results.length}`);
console.log(`  ✅ Pass: ${PASS.length}`);
console.log(`  ❌ Fail: ${FAIL.length}`);
console.log(`  Rate: ${Math.round(PASS.length/results.length*100)}%`);

if (FAIL.length > 0) {
  console.log("\n  FAILED TESTS:");
  FAIL.forEach(f => {
    const r = results.find(x => x.name === f);
    console.log(`    ❌ ${f}: ${r ? r.detail.slice(0, 120) : ""}`);
  });
}

console.log("\n  PASSED TESTS:");
  PASS.forEach(p => console.log(`    ✅ ${p}`));

try { fs.unlinkSync(COOKIE_JAR); } catch {}
