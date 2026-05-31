const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const BASE = "https://springhub-mp2fyzd4f-ayatull4hs-projects.vercel.app";
const CWD = "C:\\Users\\ayatu\\springhub";
const COOKIE_JAR = path.join(os.tmpdir(), "sh-cookies.txt");
const results = [];

function writeJson(obj) {
  const f = path.join(os.tmpdir(), "sh-body.json");
  fs.writeFileSync(f, JSON.stringify(obj));
  return f;
}

function r(name, url, body = null, cookie = "", expected = null) {
  let extra = "";
  if (body) {
    const f = writeJson(body);
    extra = `-- -X POST -H "Content-Type: application/json" -d @${f}`;
  }
  const ck = cookie === "jar" ? ` --cookie-jar "${COOKIE_JAR}"` : cookie === "use" ? ` --cookie "${COOKIE_JAR}"` : "";
  const cmd = `cd /d ${CWD} && npx vercel curl "${BASE}${url}" ${ck} ${extra}`;
  try {
    const out = execSync(cmd, { encoding: "utf-8", timeout: 60000, stdio: ["pipe", "pipe", "pipe"] });
    const lines = out.split("\n").filter(l => l.startsWith("{"));
    const data = lines.join("\n") || out.slice(-500);
    const isError = data.includes("Internal server error");
    const pass = expected ? new RegExp(expected, "i").test(data) : !isError;
    results.push({ name, pass, detail: pass ? "OK" : data.replace(/\n/g, " ").slice(0, 150) });
    console.log(`${pass ? "✅" : "❌"} ${name}`);
    if (!pass) console.log(`  ${data.replace(/\n/g, " ").slice(0, 150)}`);
    return data;
  } catch (e) {
    const out = e.stdout || e.message || "";
    const lines = out.split("\n").filter(l => l.startsWith("{"));
    const data = lines.join("\n") || out.slice(-500);
    results.push({ name, pass: false, detail: data.replace(/\n/g, " ").slice(0, 150) });
    console.log(`❌ ${name}: ${data.replace(/\n/g, " ").slice(0, 150)}`);
    return data;
  }
}

console.log("\n===== PHASE 1: PUBLIC API =====\n");
r("Health", "/api/health");
r("Forms List", "/api/forms");
r("Leaderboard", "/api/leaderboard");
r("Point Rules", "/api/point-rules");
r("Courses", "/api/courses");
r("Course Detail", "/api/courses/spring-conservation-basics");
r("Content Media", "/api/content?section=media");
r("Gallery", "/api/gallery");

console.log("\n===== PHASE 2: AUTH =====\n");

try { fs.unlinkSync(COOKIE_JAR); } catch {}
const email = "e2e-" + Date.now() + "@test.com";

r("Register User", "/api/auth/register", { email, password: "E2eTest123!", username: "E2ETester" });
r("Register Duplicate", "/api/auth/register", { email, password: "E2eTest123!" }, "", "sudah terdaftar");

console.log("\n[LOGIN]");
const loginRes = r("Login User", "/api/auth/login", { email, password: "E2eTest123!" }, "jar");

if (loginRes && loginRes.includes("success")) {
  console.log("\n===== PHASE 3: AUTHENTICATED =====\n");
  r("Get Profile", "/api/user/profile", null, "use");
  r("Submit Report", "/api/reports", {
    form_slug: "spring_monitoring", location_lat: -7.5, location_lng: 110.0,
    water_condition: "good", notes: "E2E test from automated runner"
  }, "use");
}

console.log("\n===== PHASE 4: EDGE CASES =====\n");
r("Invalid Login", "/api/auth/login", { email: "wrong@test.com", password: "wrong" }, "", "Email atau password salah");
r("Forgot Password", "/api/auth/forgot-password", { email });
r("Admin No Auth", "/api/admin/users", null, "", "Unauthorized");

console.log("\n===== FINAL REPORT =====\n");
const pass = results.filter(r => r.pass).length;
const fail = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length} | ✅ Pass: ${pass} | ❌ Fail: ${fail} | ${Math.round(pass/results.length*100)}%\n`);
results.filter(r => !r.pass).forEach(r => console.log(`  ❌ ${r.name}: ${r.detail}`));
try { fs.unlinkSync(COOKIE_JAR); } catch {}
console.log("\nDone.");
