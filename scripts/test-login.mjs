const res = await fetch("http://localhost:3456/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@test.com", password: "admin123" })
});
const text = await res.text();
console.log("Status:", res.status);
console.log("Body:", text);
console.log("Headers:", [...res.headers.entries()].filter(h => h[0].includes("cookie") || h[0].includes("set")));
