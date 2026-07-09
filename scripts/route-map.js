#!/usr/bin/env node
/**
 * SpringHub — API Route Map Generator
 *
 * Scan semua route.ts + Prisma schema, lalu generate HTML visual graph.
 * Output: /root/springhub/api-routes.html
 *
 * Cara pake:
 *   node scripts/route-map.js
 *   # Buka api-routes.html di browser
 *
 * Cara hapus:
 *   rm scripts/route-map.js api-routes.html
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const API_DIR = path.join(ROOT, "app/api");
const PRISMA_SCHEMA = path.join(ROOT, "prisma/schema.prisma");
const OUTPUT = path.join(ROOT, "api-routes.html");

// ─── 1. SCAN PRISMA MODELS ────────────────────────────────────────────────
function scanModels() {
  const schema = fs.readFileSync(PRISMA_SCHEMA, "utf-8");
  const models = [];
  const modelRegex = /^model (\w+) \{/gm;
  let match;
  while ((match = modelRegex.exec(schema)) !== null) {
    const name = match[1];
    // Count fields
    const start = schema.indexOf("{", match.index) + 1;
    const end = schema.indexOf("}", start);
    const body = schema.slice(start, end);
    const fields = body
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("@@") && !l.startsWith("enum") && !l.startsWith("//"));
    models.push({
      name,
      fields: fields.length,
      lines: fields,
    });
  }
  return models;
}

// ─── 2. SCAN API ROUTES ───────────────────────────────────────────────────
function scanRoutes() {
  const routes = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name === "route.ts") {
        const relative = path.relative(API_DIR, dir).replace(/\\/g, "/");
        const routePath = "/api/" + relative.replace(/\[/g, ":").replace(/\]/g, "");
        const content = fs.readFileSync(full, "utf-8");
        routes.push(parseRoute(routePath, content));
      }
    }
  }

  walk(API_DIR);
  return routes;
}

function parseRoute(routePath, content) {
  const methods = [];
  const models = new Set();
  const funcRegex = /export async function (GET|POST|PUT|PATCH|DELETE)/g;
  let m;
  while ((m = funcRegex.exec(content)) !== null) {
    methods.push(m[1]);
  }

  // Detect models used
  const modelPatterns = [
    /prisma\.(\w+)\.(findMany|findUnique|create|update|delete|count|aggregate|groupBy)/g,
  ];
  for (const pattern of modelPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      models.add(match[1]);
    }
  }

  // Detect auth level
  let auth = "public";
  if (content.includes('role !== "admin"') || content.includes('isAdmin(') || content.includes('isAdmin(')) {
    auth = "admin";
  } else if (content.includes("getSession()") && !routePath.includes("/api/auth/")) {
    auth = "user";
  }

  return {
    path: routePath,
    methods,
    models: Array.from(models),
    auth,
  };
}

// ─── 3. DETECT CONNECTIONS ────────────────────────────────────────────────
function detectConnections(routes, models) {
  const connections = [];
  const modelNames = new Set(models.map((m) => m.name.toLowerCase()));

  // Auto-detect: route → model (dari Prisma query)
  for (const route of routes) {
    for (const model of route.models) {
      const ops = route.methods.map((m) => m.toLowerCase()).join(",");
      const label =
        ops.includes("post") ? "create" :
        ops.includes("put") || ops.includes("patch") ? "update" :
        ops.includes("delete") ? "delete" :
        "read";
      connections.push({
        from: route.path,
        to: model,
        label,
        auth: route.auth,
      });
    }
  }

  return connections;
}

// ─── 4. GENERATE HTML ─────────────────────────────────────────────────────
function generateHtml(routes, models, connections) {
  const modelsJson = JSON.stringify(models);
  const routesJson = JSON.stringify(routes);
  const connsJson = JSON.stringify(connections);

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SpringHub — API Route Map</title>
<script src="/vis-network.min.js" onerror="var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/vis-network/9.1.6/standalone/umd/vis-network.min.js';document.head.appendChild(s)"></script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; background: #0b0f15; color: #e2e8f0; }
header { background: #141a22; border-bottom: 1px solid #252b34; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
header h1 { font-size: 18px; font-weight: 700; color: #f5f3ef; }
header span { font-size: 12px; color: #b3b0ab; }
#controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 12px 24px; background: #141a22; border-bottom: 1px solid #252b34; }
#controls input { flex: 1; min-width: 200px; padding: 8px 12px; border-radius: 6px; border: 1px solid #252b34; background: #0b0f15; color: #f5f3ef; font-size: 13px; outline: none; }
#controls input:focus { border-color: #0284c7; }
#controls button { padding: 6px 14px; border-radius: 6px; border: 1px solid #252b34; background: #1c232d; color: #b3b0ab; font-size: 12px; cursor: pointer; transition: all .15s; }
#controls button:hover { background: #252b34; color: #f5f3ef; }
#controls button.active { background: #0284c7; color: #fff; border-color: #0284c7; }
#graph { width: 100%; height: calc(100vh - 130px); position: relative; }
#detail { position: absolute; top: 16px; right: 16px; width: 320px; max-height: 70vh; overflow-y: auto; background: #141a22; border: 1px solid #252b34; border-radius: 12px; padding: 16px; display: none; z-index: 10; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
#detail h3 { font-size: 14px; font-weight: 700; color: #f5f3ef; margin-bottom: 8px; }
#detail .tag { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px; margin: 2px; }
#detail .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; border-bottom: 1px solid #252b34; }
#detail .row:last-child { border: none; }
#detail .key { color: #b3b0ab; }
#detail .val { color: #f5f3ef; font-weight: 500; }
#legend { position: absolute; bottom: 16px; left: 16px; background: #141a22; border: 1px solid #252b34; border-radius: 8px; padding: 12px; z-index: 10; font-size: 11px; }
#legend .item { display: flex; align-items: center; gap: 8px; margin: 3px 0; }
#legend .dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
</style>
</head>
<body>
<header>
  <div><h1>🗺️ SpringHub — Route Map</h1></div>
  <span id="stats">0 routes · 0 models · 0 connections</span>
</header>
<div id="controls">
  <input id="search" type="text" placeholder="Cari route atau model..." oninput="filterGraph(this.value)">
  <button class="active" data-filter="all" onclick="setFilter('all', this)">Semua</button>
  <button data-filter="public" onclick="setFilter('public', this)">🔵 Public</button>
  <button data-filter="user" onclick="setFilter('user', this)">🟡 User</button>
  <button data-filter="admin" onclick="setFilter('admin', this)">🔴 Admin</button>
  <button onclick="fitViewport()">🔍 Fit</button>
  <button onclick="exportPng()">📷 PNG</button>
</div>
<div id="graph">
  <div id="detail"></div>
  <div id="legend">
    <div class="item"><span class="dot" style="background:#3b82f6"></span> Public API</div>
    <div class="item"><span class="dot" style="background:#eab308"></span> Auth Required</div>
    <div class="item"><span class="dot" style="background:#ef4444"></span> Admin Only</div>
    <div class="item"><span class="dot" style="background:#22c55e"></span> Database Model</div>
  </div>
</div>

<script>
const ROUTES = ${routesJson};
const MODELS = ${modelsJson};
const CONNS = ${connsJson};
let network = null;

const colorMap = { public: { bg: "#1e3a5f", border: "#3b82f6" }, user: { bg: "#3d3c00", border: "#eab308" }, admin: { bg: "#3f0f0f", border: "#ef4444" }, model: { bg: "#0a3d1a", border: "#22c55e" } };

function buildGraph(filter, query) {
  const q = (query || "").toLowerCase();

  // Build nodes
  const nodes = [];
  const nodeMap = {};
  const edgeSet = new Set();

  // Model nodes (green)
  for (const m of MODELS) {
    if (q && !m.name.toLowerCase().includes(q)) continue;
    const id = "model:" + m.name;
    nodes.push({ id, label: m.name, title: m.fields + " fields", group: "model", shape: "ellipse", ...colorMap.model, size: Math.min(30, 12 + m.fields * 1.2) });
    nodeMap[id] = { type: "model", name: m.name, fields: m.fields };
  }

  // Route nodes
  for (const r of ROUTES) {
    if (filter !== "all" && r.auth !== filter) continue;
    if (q && !r.path.toLowerCase().includes(q)) continue;
    const col = colorMap[r.auth] || colorMap.public;
    const label = r.methods.join(",");
    const id = "route:" + r.path + ":" + r.methods.join("");
    nodes.push({ id, label, title: r.path, group: r.auth, ...col, size: 8 + r.models.length * 5 });
    nodeMap[id] = { type: "route", path: r.path, methods: r.methods, models: r.models, auth: r.auth };
  }

  // Edges — cocokkan dengan route node yang ada di nodeMap
  for (const c of CONNS) {
    const toId = "model:" + c.to;
    if (!nodeMap[toId]) continue;

    // Cari route node yang path-nya cocok dengan c.from
    const routeLabel = "route:" + c.from + ":";
    let fromId = null;
    for (const nid of Object.keys(nodeMap)) {
      if (nid.startsWith(routeLabel)) { fromId = nid; break; }
    }
    if (!fromId) continue;

    const key = fromId + "→" + toId;
    if (edgeSet.has(key)) continue;
    edgeSet.add(key);
    const edgeColor = c.auth === "admin" ? "#ef4444" : c.auth === "user" ? "#eab308" : "#3b82f6";
    nodes.push({ from: fromId, to: toId, arrows: "to", label: c.label, color: { color: edgeColor }, width: 1, font: { size: 9, color: "#94a3b8" } });
  }

  // Separate nodes from edges
  const nodeItems = nodes.filter(n => n.id);
  const edgeItems = nodes.filter(n => n.from);

  return { nodes: nodeItems, edges: edgeItems };
}

function render(filter, query) {
  const data = buildGraph(filter, query);
  const container = document.getElementById("graph");

  const options = {
    physics: { stabilization: true, solver: "forceAtlas2Based", forceAtlas2Based: { gravitationalConstant: -60, centralGravity: 0.005, springLength: 180, springConstant: 0.02 } },
    layout: { improvedLayout: true },
    edges: { smooth: { type: "curvedCW", roundness: 0.15 } },
    nodes: { font: { color: "#e2e8f0", size: 11, strokeWidth: 0 }, borderWidth: 2, chosen: { node: { borderWidth: 3 } } },
    interaction: { hover: true, tooltipDelay: 200, navigationButtons: true, keyboard: true },
    groups: {
      public: { color: { background: colorMap.public.bg, border: colorMap.public.border }, font: { color: "#93c5fd" } },
      user: { color: { background: colorMap.user.bg, border: colorMap.user.border }, font: { color: "#fde68a" } },
      admin: { color: { background: colorMap.admin.bg, border: colorMap.admin.border }, font: { color: "#fca5a5" } },
      model: { color: { background: colorMap.model.bg, border: colorMap.model.border }, font: { color: "#86efac" }, shape: "ellipse" }
    }
  };

  if (network) network.destroy();
  network = new vis.Network(container, data, options);

  network.on("click", function(params) {
    if (params.nodes.length === 0) { document.getElementById("detail").style.display = "none"; return; }
    const id = params.nodes[0];
    const info = {};
    for (const n of [...ROUTES, ...MODELS, ...CONNS]) {
      // Find by id pattern
    }
    // Route
    for (const r of ROUTES) {
      if ("route:" + r.path + ":" + r.methods.join("") === id) {
        showDetailRoute(r);
        return;
      }
    }
    // Model
    for (const m of MODELS) {
      if ("model:" + m.name === id) {
        showDetailModel(m);
        return;
      }
    }
  });

  document.getElementById("stats").textContent = data.nodes.length + " routes · " + MODELS.length + " models · " + CONNS.length + " connections";
}

function showDetailRoute(r) {
  const d = document.getElementById("detail");
  d.style.display = "block";
  d.innerHTML = \`
    <h3>\${r.path}</h3>
    <div class="row"><span class="key">Methods</span><span class="val">\${r.methods.join(", ")}</span></div>
    <div class="row"><span class="key">Auth</span><span class="tag" style="background:\${r.auth === 'admin' ? '#3f0f0f' : r.auth === 'user' ? '#3d3c00' : '#1e3a5f'};color:\${r.auth === 'admin' ? '#fca5a5' : r.auth === 'user' ? '#fde68a' : '#93c5fd'}">\${r.auth}</span></div>
    <div class="row"><span class="key">Models</span><span class="val">\${r.models.join(", ") || "-"}</span></div>
  \`;
}

function showDetailModel(m) {
  const d = document.getElementById("detail");
  d.style.display = "block";
  d.innerHTML = \`
    <h3>🗄️ \${m.name}</h3>
    <div class="row"><span class="key">Fields</span><span class="val">\${m.fields}</span></div>
    <div class="row" style="flex-wrap:wrap"><span class="key">Columns</span><span class="val" style="font-size:10px">\${m.lines.slice(0,15).map(l => l.split(" ")[0]).join(", ")}\${m.lines.length > 15 ? ", ..." : ""}</span></div>
  \`;
}

function filterGraph(query) { render(currentFilter, query); }
let currentFilter = "all";
function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll("#controls button[data-filter]").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  render(f, document.getElementById("search").value);
}
function fitViewport() { if (network) network.fit(); }
function exportPng() {
  if (!network) return;
  const canvas = document.querySelector("#graph canvas");
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = "springhub-route-map.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

render("all", "");
</script>
</body>
</html>`;
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
console.log("🔍 Scanning Prisma schema...");
const models = scanModels();
console.log(`  ${models.length} models found`);

console.log("🔍 Scanning API routes...");
const routes = scanRoutes();
console.log(`  ${routes.length} routes found`);

console.log("🔗 Detecting connections...");
const connections = detectConnections(routes, models);
console.log(`  ${connections.length} connections found`);

console.log("📄 Generating HTML...");
const html = generateHtml(routes, models, connections);
fs.writeFileSync(OUTPUT, html, "utf-8");

console.log(`\n✅ Done! Buka file:\n   file://${OUTPUT}\n`);
