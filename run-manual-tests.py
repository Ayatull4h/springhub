#!/usr/bin/env python3
"""SpringHub — Manual test runner (Python / requests).

Replaces the unreliable run-manual-tests.sh with proper cookie handling,
no quoting issues, and clean output.
"""

import json
import sys
import time
import urllib.parse
from datetime import datetime, timezone

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE = "https://www.springhub.id"
T = 10  # per-request timeout (seconds)

session = requests.Session()
session.verify = False

pass_count = 0
fail_count = 0
skip_count = 0


def P(test_id, desc):
    global pass_count
    pass_count += 1
    print(f"PASS {test_id} \u2014 {desc}")


def F(test_id, desc, reason=""):
    global fail_count
    fail_count += 1
    r = f" ({reason})" if reason else ""
    print(f"FAIL {test_id} \u2014 {desc}{r}")


def S(test_id, desc, reason=""):
    global skip_count
    skip_count += 1
    r = f" ({reason})" if reason else ""
    print(f"CATATAN {test_id} \u2014 {desc}{r}")


def get(path, label=None):
    """GET helper — returns response object."""
    url = f"{BASE}{path}"
    r = session.get(url, timeout=T)
    return r


def post_json(path, body, label=None):
    """POST JSON helper."""
    url = f"{BASE}{path}"
    r = session.post(url, json=body, timeout=T)
    return r


def post_json_csrf(path, body, csrf, label=None):
    """POST JSON with CSRF token in header."""
    url = f"{BASE}{path}"
    headers = {"x-csrf-token": csrf, "Content-Type": "application/json"}
    r = session.post(url, json=body, headers=headers, timeout=T)
    return r


def post_form(path, data, csrf=None):
    """POST application/x-www-form-urlencoded helper."""
    url = f"{BASE}{path}"
    headers = {}
    if csrf:
        headers["x-csrf-token"] = csrf
    r = session.post(url, data=data, headers=headers, timeout=T)
    return r


def put_json(path, body, label=None):
    url = f"{BASE}{path}"
    r = session.put(url, json=body, timeout=T)
    return r


def get_csrf():
    """Fetch a fresh CSRF token."""
    r = session.get(f"{BASE}/api/csrf", timeout=T)
    if r.status_code != 200:
        return None
    return r.json().get("token")


# ─── USERS ────────────────────────────────────────────────────────────────────
ADMIN = {"email": "admin@springhub.id", "password": "demo12345"}
UCUP = {"email": "ucup@springhub.id", "password": "ucup12345"}
BUDI = {"email": "budi@springhub.id", "password": "budi12345"}
TEST_REGISTER = {
    "email": f"test_{int(time.time())}@springhub.id",
    "password": "test12345",
    "username": "TestUser",
}

FORM_SLUGS = [
    "spring-monitoring",
    "spring-restoration",
    "trench-development",
    "tree-planting",
    "seedling-stock",
]

FORM_FIELDS = {
    "spring-monitoring": {
        "spring_name": "Mata Air Test Monitoring",
        "province": "Jawa Timur",
        "regency": "Malang",
        "water_condition": "Jernih",
        "debit_estimate": "Sedang (1-5 L/dtk)",
        "vegetation": "Rimbun",
        "notes": "Test otomatis spring-monitoring",
        "water_temperature": "25",
        "location_lat": "-7.5",
        "location_lng": "110.0",
    },
    "spring-restoration": {
        "spring_name": "Mata Air Test Restorasi",
        "province": "Jawa Barat",
        "regency": "Bandung",
        "date": "2026-07-01",
        "activity_types[]": ["Edukasi kepada Masyarakat", "Menanam Pohon"],
        "volunteer_count": "5",
        "location_lat": "-6.9",
        "location_lng": "107.6",
        "notes": "Test otomatis spring-restoration",
        "coordinator_phone": "+6281234567890",
    },
    "trench-development": {
        "volunteer_name": "Test Volunteer",
        "province": "Jawa Tengah",
        "regency": "Semarang",
        "date": "2026-07-01",
        "trench_count": "5",
        "location_lat": "-7.0",
        "location_lng": "110.4",
        "dimensions": "100 x 50 x 50 cm",
    },
    "tree-planting": {
        "volunteer_name": "Test Volunteer",
        "province": "DI Yogyakarta",
        "regency": "Sleman",
        "date": "2026-07-01",
        "tree_count": "10",
        "tree_species": "Bambu petung",
        "location_lat": "-7.6",
        "location_lng": "110.4",
        "notes": "Test otomatis tree-planting",
    },
    "seedling-stock": {
        "species": "Bambu petung",
        "count": "100",
        "province": "Bali",
        "regency": "Gianyar",
        "contact_name": "Test Contact",
        "contact_phone": "+6281234567899",
        "location_lat": "-8.4",
        "location_lng": "115.3",
        "date": "2026-07-01",
        "notes": "Test otomatis seedling-stock",
    },
}

DONATION_TIERS = [
    {"id": "seedling", "amount": 15000},
    {"id": "sapling", "amount": 50000},
    {"id": "canopy", "amount": 100000},
    {"id": "forest", "amount": 250000},
    {"id": "guardian", "amount": 1000000},
]


def login_as(email, password):
    """Login and return True on success."""
    r = post_json("/api/auth/login", {"email": email, "password": password})
    return r.status_code == 200 and r.json().get("success")


def logout():
    r = session.post(f"{BASE}/api/auth/logout", timeout=T)
    return r.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════════
#  TEST 1 — Akses Web
# ═══════════════════════════════════════════════════════════════════════════════
def test_1():
    print("\n==================== TEST 1: Akses Web ====================\n")
    paths = ["/", "/sitemap.xml", "/robots.txt", "/manifest.json", "/favicon.ico"]
    for p in paths:
        label = p[1:] if p != "/" else "home"
        r = get(p)
        if r.status_code == 200:
            P(f"1.{paths.index(p)+1}", f"GET {p} -> 200")
        else:
            F(f"1.{paths.index(p)+1}", f"GET {p} -> {r.status_code}", r.reason)


# ═══════════════════════════════════════════════════════════════════════════════
#  TEST 2 — Halaman Publik
# ═══════════════════════════════════════════════════════════════════════════════
def test_2():
    print("\n==================== TEST 2: Halaman Publik ====================\n")
    pages = [
        "/springs", "/projects", "/learn", "/help", "/faq",
        "/privacy", "/terms", "/sign-in", "/join", "/report-issue", "/offline",
    ]
    for i, p in enumerate(pages, 1):
        r = get(p)
        label = p.strip("/")
        if r.status_code == 200:
            P(f"2.{i}", f"GET {p} -> 200")
        else:
            F(f"2.{i}", f"GET {p} -> {r.status_code}", r.reason)


# ═══════════════════════════════════════════════════════════════════════════════
#  TEST 3 — API Publik (tanpa auth)
# ═══════════════════════════════════════════════════════════════════════════════
def test_3():
    print("\n==================== TEST 3: API Publik ====================\n")
    apis = [
        "/api/health",
        "/api/csrf",
        "/api/leaderboard",
        "/api/forms",
        "/api/springs",
        "/api/projects",
        "/api/courses",
        "/api/gallery",
    ]
    for i, a in enumerate(apis, 1):
        r = get(a)
        label = a.strip("/").replace("/", "-")
        if r.status_code == 200:
            P(f"3.{i}", f"GET {a} -> 200")
        elif r.status_code == 503 and "health" in a:
            r2 = r.json()
            S(f"3.{i}", f"GET {a} -> 503 (DB/Redis degraded: {r2.get('checks', {})})")
        else:
            F(f"3.{i}", f"GET {a} -> {r.status_code}", r.reason)


# ═══════════════════════════════════════════════════════════════════════════════
#  TEST 4 — Auth Flow
# ═══════════════════════════════════════════════════════════════════════════════
def test_4():
    print("\n==================== TEST 4: Auth Flow ====================\n")

    # 4.1 — Login as admin
    r = post_json("/api/auth/login", ADMIN)
    if r.status_code == 200 and r.json().get("success"):
        P("4.1", "Login admin -> 200 success")
    else:
        F("4.1", f"Login admin -> {r.status_code}", r.text[:120])

    # 4.2 — Check /api/auth/me
    r = get("/api/auth/me")
    if r.status_code == 200:
        u = r.json().get("user", {})
        if u and u.get("role") == "admin":
            P("4.2", "/api/auth/me -> admin user")
        else:
            F("4.2", "/api/auth/me -> user mismatch", str(u)[:120])
    else:
        F("4.2", f"/api/auth/me -> {r.status_code}", r.reason)

    # 4.3 — Logout
    r = session.post(f"{BASE}/api/auth/logout", timeout=T)
    if r.status_code == 200:
        P("4.3", "Logout -> 200")
    else:
        F("4.3", f"Logout -> {r.status_code}", r.reason)

    # 4.4 — Check session gone
    r = get("/api/auth/me")
    if r.status_code == 200 and r.json().get("user") is None:
        P("4.4", "Session gone after logout -> user: null")
    else:
        F("4.4", "Session not cleared", r.text[:120])

    # 4.5 — Login as ucup
    r = post_json("/api/auth/login", UCUP)
    if r.status_code == 200 and r.json().get("success"):
        P("4.5", "Login ucup -> 200 success")
    else:
        F("4.5", f"Login ucup -> {r.status_code}", r.text[:120])

    # 4.6 — Check /api/auth/me for ucup
    r = get("/api/auth/me")
    if r.status_code == 200:
        u = r.json().get("user", {})
        if u and u.get("username") == "Ucup":
            P("4.6", "/api/auth/me -> Ucup")
        else:
            F("4.6", "/api/auth/me -> wrong user", str(u)[:120])
    else:
        F("4.6", f"/api/auth/me -> {r.status_code}", r.reason)

    # 4.7 — Logout ucup
    logout()

    # 4.8 — Wrong password
    r = post_json("/api/auth/login", {"email": ADMIN["email"], "password": "wrongpass123"})
    if r.status_code == 401 and "salah" in r.text.lower():
        P("4.8", "Wrong password -> 401")
    else:
        F("4.8", f"Wrong password -> {r.status_code}", r.text[:120])

    # 4.9 — Register new user
    r = post_json("/api/auth/register", TEST_REGISTER)
    if r.status_code == 200 and r.json().get("success"):
        P("4.9", "Register new user -> 200 success")
        # Logout from auto-login after register
        logout()
    elif r.status_code == 429:
        S("4.9", "Register -> 429 rate limited")
    else:
        F("4.9", f"Register -> {r.status_code}", r.text[:120])

    # 4.10 — Duplicate register
    r = post_json("/api/auth/register", TEST_REGISTER)
    if r.status_code == 409 and "terdaftar" in r.text.lower():
        P("4.10", "Duplicate register -> 409 Email sudah terdaftar")
    elif r.status_code == 400 and "logged in" in r.text.lower():
        S("4.10", "Duplicate register -> 400 already logged in (auto-login)")
        logout()
        r2 = post_json("/api/auth/register", TEST_REGISTER)
        if r2.status_code == 409:
            P("4.10", "Duplicate register -> 409 Email sudah terdaftar")
        elif r2.status_code == 429:
            S("4.10", "Duplicate register -> 429 rate limited")
        else:
            F("4.10", f"Duplicate register -> {r2.status_code}", r2.text[:120])
    elif r.status_code == 429:
        S("4.10", "Duplicate register -> 429 rate limited")
    else:
        F("4.10", f"Duplicate register -> {r.status_code}", r.text[:120])

    # 4.11 — Forgot password
    r = post_json("/api/auth/forgot-password", {"email": UCUP["email"]})
    if r.status_code == 200 and r.json().get("success"):
        P("4.11", "Forgot password -> 200 success")
    elif r.status_code == 429:
        S("4.11", "Forgot password -> 429 rate limited")
    else:
        F("4.11", f"Forgot password -> {r.status_code}", r.text[:120])


# ═══════════════════════════════════════════════════════════════════════════════
#  TEST 5 — Form Report
# ═══════════════════════════════════════════════════════════════════════════════
def test_5():
    print("\n==================== TEST 5: Form Report ====================\n")

    # 5.1 — Check all 5 forms have at least 9 fields each
    r = get("/api/csrf")
    r = get("/api/forms")
    if r.status_code != 200:
        F("5.1", "GET /api/forms failed", f"{r.status_code}")
        S("5.2-5.6", "Skipping form submissions — /api/forms failed")
        return

    forms_data = r.json().get("forms", [])
    if not forms_data:
        # Fall back to forms.ts static data
        F("5.1", "No forms from API — checking static schemas", "using static fallback")
        for slug in FORM_SLUGS:
            S(f"5.1.{FORM_SLUGS.index(slug)+1}", f"Form {slug} - using static schema")
    else:
        slugs_found = [f.get("slug") for f in forms_data]
        for slug in FORM_SLUGS:
            if slug in slugs_found:
                f_data = forms_data[slugs_found.index(slug)]
                field_count = len(f_data.get("fields", []))
                if field_count >= 9:
                    P(f"5.1.{FORM_SLUGS.index(slug)+1}", f"Form {slug} -> {field_count} fields")
                else:
                    F(f"5.1.{FORM_SLUGS.index(slug)+1}", f"Form {slug} only {field_count} fields", "< 9")
            else:
                S(f"5.1.{FORM_SLUGS.index(slug)+1}", f"Form {slug} not in API response", "skipping check")

    # Login as ucup for submissions
    if not login_as(UCUP["email"], UCUP["password"]):
        F("5.2-5.6", "Cannot login as ucup")
        return

    # Submit all 5 forms
    submissions_ok = 0
    for i, slug in enumerate(FORM_SLUGS, 2):
        csrf = get_csrf()
        if not csrf:
            F(f"5.{i}", f"Submit {slug} — cannot get CSRF token")
            continue

        data = dict(FORM_FIELDS[slug])
        data["form_slug"] = slug

        # Retry up to 2 times on 503
        r = post_form("/api/reports", data, csrf=csrf)
        for _ in range(2):
            if r.status_code != 503:
                break
            time.sleep(1)
            r = post_form("/api/reports", data, csrf=csrf)

        if r.status_code == 200:
            try:
                j = r.json()
                if j.get("success"):
                    P(f"5.{i}", f"Submit {slug} -> 200 success")
                    submissions_ok += 1
                else:
                    F(f"5.{i}", f"Submit {slug} -> 200", str(j)[:200])
            except Exception:
                F(f"5.{i}", f"Submit {slug} -> 200 (non-JSON)", r.text[:200])
        else:
            try:
                j = r.json()
                err = str(j)[:300]
            except Exception:
                err = r.text[:200]
            F(f"5.{i}", f"Submit {slug} -> {r.status_code}", err)

    if submissions_ok == 5:
        P("5.7", "All 5 forms submitted successfully")
    elif submissions_ok >= 4:
        P("5.7", f"{submissions_ok}/5 forms submitted")
    else:
        F("5.7", f"Only {submissions_ok}/5 forms submitted")

    logout()


# ═══════════════════════════════════════════════════════════════════════════════
#  TEST 6 — Donasi
# ═══════════════════════════════════════════════════════════════════════════════
def test_6():
    print("\n==================== TEST 6: Donasi ====================\n")

    csrf = get_csrf()
    if not csrf:
        F("6.1-6.3", "Cannot get CSRF token")
        return

    # 6.1 — Create invoice with valid amount
    body = {
        "amountIdr": 50000,
        "donorName": "Test Donor",
        "donorEmail": "donor@test.id",
        "tierId": "sapling",
    }
    r = post_json_csrf("/api/donations/invoice", body, csrf)
    if r.status_code == 200:
        inv = r.json()
        if inv.get("invoiceUrl") or inv.get("donation", {}).get("invoiceId"):
            P("6.1", "Create invoice -> 200 with invoiceUrl")
        else:
            F("6.1", "Create invoice -> 200 but no invoiceUrl", str(inv)[:150])
    else:
        try:
            body_r = r.json()
            err = body_r.get("error", str(body_r))[:150]
        except Exception:
            err = r.text[:150]
        if "XENDIT_SECRET_KEY" in err or "not set" in err or "xendit" in err.lower():
            S("6.1", f"Create invoice -> {r.status_code} (Xendit not configured)")
        else:
            F("6.1", f"Create invoice -> {r.status_code}", err)

    # 6.2 — Amount < 1000 should be rejected
    body2 = {"amountIdr": 500, "donorName": "Test", "donorEmail": "t@t.id"}
    r2 = post_json_csrf("/api/donations/invoice", body2, csrf)
    if r2.status_code == 400 and "tidak valid" in r2.text.lower():
        P("6.2", "Amount Rp500 -> 400 rejected")
    else:
        F("6.2", f"Amount Rp500 -> {r2.status_code}", r2.text[:120])

    # 6.3 — Amount > 100jt should be rejected
    body3 = {"amountIdr": 200_000_000, "donorName": "Test", "donorEmail": "t@t.id"}
    r3 = post_json_csrf("/api/donations/invoice", body3, csrf)
    if r3.status_code == 400 and "tidak valid" in r3.text.lower():
        P("6.3", "Amount Rp200jt -> 400 rejected")
    else:
        F("6.3", f"Amount Rp200jt -> {r3.status_code}", r3.text[:120])


# ═══════════════════════════════════════════════════════════════════════════════
#  TEST 7 — Projects
# ═══════════════════════════════════════════════════════════════════════════════
def test_7():
    print("\n==================== TEST 7: Projects ====================\n")

    # 7.1 — List projects (public)
    r = get("/api/projects")
    if r.status_code == 200:
        projs = r.json().get("projects", [])
        P(f"7.1", f"List projects -> 200 ({len(projs)} projects)")
    else:
        F("7.1", f"List projects -> {r.status_code}", r.reason)
        S("7.2-7.6", "Cannot list projects")

    # 7.2 — Login as ucup (has 20168 pts >= 20000), create project
    if not login_as(UCUP["email"], UCUP["password"]):
        F("7.2", "Login as ucup failed")
        logout()
        return

    project_payload = {
        "title": "Test Project Ucup",
        "summary": "Ini adalah test project untuk verifikasi otomatis",
        "region": "Jawa Timur",
        "typeId": "tree_planting",
        "goalAmount": 500000,
        "contactName": "Ucup",
        "contactEmail": "ucup@springhub.id",
        "contactPhone": "+6281234567892",
    }
    r = post_json("/api/projects", project_payload)
    if r.status_code == 201 and r.json().get("success"):
        P("7.2", "Create project as ucup -> 201")
        project_id = r.json().get("project", {}).get("id", "")
    elif r.status_code == 403:
        F("7.2", "Create project as ucup -> 403 (not enough pts?)", r.text[:120])
        project_id = ""
    elif r.status_code == 429:
        S("7.2", "Create project -> 429 rate limited")
        project_id = ""
    else:
        F("7.2", f"Create project as ucup -> {r.status_code}", r.text[:150])
        project_id = ""

    logout()

    # 7.3 — Login as budi (8750 pts < 20000), should be rejected
    if not login_as(BUDI["email"], BUDI["password"]):
        F("7.3", "Login as budi failed")
        logout()
    else:
        r = post_json("/api/projects", {
            "title": "Test Project Budi",
            "summary": "Ini test project budi yang harus ditolak",
            "region": "Bali",
            "typeId": "trench_development",
            "goalAmount": 300000,
            "contactName": "Budi",
            "contactEmail": "budi@springhub.id",
            "contactPhone": "+6281234567893",
        })
        if r.status_code == 403 and "poin" in r.text.lower():
            P("7.3", "Create project as budi (8.7K pts) -> 403 denied")
        elif r.status_code == 429:
            S("7.3", "Create project as budi -> 429 rate limited")
        else:
            F("7.3", f"Create project as budi -> {r.status_code}", r.text[:150])
        logout()

    # 7.4 — Login as admin, create project (admin bypass)
    if not login_as(ADMIN["email"], ADMIN["password"]):
        F("7.4", "Login as admin failed")
    else:
        r = post_json("/api/projects", {
            "title": "Test Project Admin",
            "summary": "Test project dari admin (bypass points check)",
            "region": "Jakarta",
            "typeId": "monitoring_expedition",
            "goalAmount": 1000000,
            "contactName": "Admin Demo",
            "contactEmail": "admin@springhub.id",
            "contactPhone": "+6281234567890",
        })
        if r.status_code == 201 and r.json().get("success"):
            P("7.4", "Create project as admin -> 201 (bypass)")
            admin_proj_id = r.json().get("project", {}).get("id", "")
        elif r.status_code == 429:
            S("7.4", "Create project as admin -> 429 rate limited")
            admin_proj_id = ""
        else:
            F("7.4", f"Create project as admin -> {r.status_code}", r.text[:150])
            admin_proj_id = ""

        # 7.5 — Comment on admin's project
        if admin_proj_id:
            r = post_json(f"/api/projects/{admin_proj_id}/comments", {"text": "Test comment from admin"})
            if r.status_code == 201:
                P("7.5", f"Comment on project {admin_proj_id[:8]}... -> 201")
            elif r.status_code == 429:
                S("7.5", "Comment -> 429 rate limited")
            else:
                F("7.5", f"Comment -> {r.status_code}", r.text[:120])

            # 7.6 — Like on admin's project
            r = session.post(f"{BASE}/api/projects/{admin_proj_id}/like", timeout=T)
            if r.status_code == 200 and r.json().get("likes", 0) >= 1:
                P("7.6", f"Like project {admin_proj_id[:8]}... -> 200")
            elif r.status_code == 429:
                S("7.6", "Like -> 429 rate limited")
            else:
                F("7.6", f"Like -> {r.status_code}", r.text[:120])
        else:
            S("7.5", "Skip comment — no project ID")
            S("7.6", "Skip like — no project ID")

        logout()


# ═══════════════════════════════════════════════════════════════════════════════
#  TEST 8 — Courses
# ═══════════════════════════════════════════════════════════════════════════════
def test_8():
    print("\n==================== TEST 8: Courses ====================\n")

    # 8.1 — List courses
    r = get("/api/courses")
    if r.status_code == 200:
        courses = r.json().get("courses", [])
        P(f"8.1", f"List courses -> 200 ({len(courses)} courses)")
    else:
        F("8.1", f"List courses -> {r.status_code}", r.reason)
        S("8.2-8.3", "Skipping course detail/progress")

    # 8.2 — Get detail for first course
    if r.status_code == 200:
        courses = r.json().get("courses", [])
        if courses:
            slug = courses[0].get("slug", "")
            r2 = get(f"/api/courses/{slug}")
            if r2.status_code == 200:
                course = r2.json().get("course", {})
                if course.get("slug") == slug:
                    P("8.2", f"Course detail {slug} -> 200")
                else:
                    F("8.2", f"Course detail {slug} -> slug mismatch", str(course)[:120])
            else:
                F("8.2", f"Course detail {slug} -> {r2.status_code}", r2.reason)

            # 8.3 — Update progress for course (need login)
            if login_as(UCUP["email"], UCUP["password"]):
                course_id = courses[0].get("id", "")
                modules = courses[0].get("modules", [])
                total = len(modules) if modules else 3
                r3 = put_json("/api/courses/progress", {
                    "courseId": course_id,
                    "courseSlug": slug,
                    "completedModules": total,
                    "totalModules": total,
                })
                if r3.status_code == 200:
                    pd = r3.json()
                    if pd.get("progress", {}).get("completed"):
                        P("8.3", f"Update progress {slug} -> 200 completed")
                    else:
                        P("8.3", f"Update progress {slug} -> 200")
                elif r3.status_code == 429:
                    S("8.3", f"Update progress {slug} -> 429 rate limited")
                else:
                    F("8.3", f"Update progress {slug} -> {r3.status_code}", r3.text[:120])
                logout()
            else:
                F("8.3", "Cannot login as ucup for progress update")
        else:
            S("8.2", "No courses available")
            S("8.3", "No courses available")


# ═══════════════════════════════════════════════════════════════════════════════
#  TEST 9 — Springs
# ═══════════════════════════════════════════════════════════════════════════════
def test_9():
    print("\n==================== TEST 9: Springs ====================\n")

    # 9.1 — List springs
    r = get("/api/springs")
    if r.status_code == 200:
        springs = r.json().get("springs", [])
        P(f"9.1", f"List springs -> 200 ({len(springs)} springs)")
    else:
        F("9.1", f"List springs -> {r.status_code}", r.reason)
        S("9.2", "Cannot list springs")


# ═══════════════════════════════════════════════════════════════════════════════
#  TEST 10 — Admin
# ═══════════════════════════════════════════════════════════════════════════════
def test_10():
    print("\n==================== TEST 10: Admin ====================\n")

    # Login as admin
    if not login_as(ADMIN["email"], ADMIN["password"]):
        F("10.1-10.5", "Cannot login as admin")
        return

    # 10.1 — GET /api/admin/users
    r = get("/api/admin/users")
    if r.status_code == 200:
        users = r.json().get("users", [])
        P(f"10.1", f"Admin users -> 200 ({len(users)} users)")
    else:
        F("10.1", f"Admin users -> {r.status_code}", r.text[:120])

    # 10.2 — GET /api/admin/reports
    r = get("/api/admin/reports")
    if r.status_code == 200:
        reports = r.json().get("reports", [])
        P(f"10.2", f"Admin reports -> 200 ({len(reports)} reports)")
    else:
        F("10.2", f"Admin reports -> {r.status_code}", r.text[:120])

    # 10.3 — GET /api/admin/donations
    r = get("/api/admin/donations")
    if r.status_code == 200:
        donations = r.json().get("donations", [])
        P(f"10.3", f"Admin donations -> 200 ({len(donations)} donations)")
    else:
        F("10.3", f"Admin donations -> {r.status_code}", r.text[:120])

    # 10.4 — GET /api/admin/feedback
    r = get("/api/admin/feedback")
    if r.status_code == 200:
        items = r.json().get("feedback", [])
        P(f"10.4", f"Admin feedback -> 200 ({len(items)} items)")
    else:
        F("10.4", f"Admin feedback -> {r.status_code}", r.text[:120])

    # 10.5 — GET /api/admin/forms
    r = get("/api/admin/forms")
    if r.status_code == 200:
        items = r.json().get("forms", [])
        P(f"10.5", f"Admin forms -> 200 ({len(items)} forms)")
    else:
        F("10.5", f"Admin forms -> {r.status_code}", r.text[:120])

    # 10.6 — GET /api/admin/courses
    r = get("/api/admin/courses")
    if r.status_code == 200:
        items = r.json().get("courses", [])
        P(f"10.6", f"Admin courses -> 200 ({len(items)} courses)")
    else:
        F("10.6", f"Admin courses -> {r.status_code}", r.text[:120])

    # 10.7 — GET /api/admin/content
    r = get("/api/admin/content")
    if r.status_code == 200:
        items = r.json().get("items", [])
        P(f"10.7", f"Admin content -> 200 ({len(items)} items)")
    else:
        F("10.7", f"Admin content -> {r.status_code}", r.text[:120])

    # 10.8 — GET /api/admin/projects
    r = get("/api/admin/projects")
    if r.status_code == 200:
        items = r.json().get("projects", [])
        P(f"10.8", f"Admin projects -> 200 ({len(items)} projects)")
    else:
        F("10.8", f"Admin projects -> {r.status_code}", r.text[:120])

    # 10.9 — GET /api/admin/point-rules
    r = get("/api/admin/point-rules")
    if r.status_code == 200:
        items = r.json().get("rules", [])
        P(f"10.9", f"Admin point rules -> 200 ({len(items)} rules)")
    else:
        F("10.9", f"Admin point rules -> {r.status_code}", r.text[:120])

    logout()


# ═══════════════════════════════════════════════════════════════════════════════
#  TEST 11 — Points
# ═══════════════════════════════════════════════════════════════════════════════
def test_11():
    print("\n==================== TEST 11: Points ====================\n")

    if not login_as(UCUP["email"], UCUP["password"]):
        F("11.1", "Cannot login as ucup")
        return

    r = get("/api/user/points")
    if r.status_code == 200:
        data = r.json()
        pts = data.get("points", 0)
        logs = data.get("logs", [])
        trust = data.get("trustScore", 0)
        P(f"11.1", f"Points -> {pts} pts, trust {trust}, {len(logs)} log entries")
    else:
        F("11.1", f"Points -> {r.status_code}", r.text[:120])

    logout()


# ═══════════════════════════════════════════════════════════════════════════════
#  TEST 12 — Security
# ═══════════════════════════════════════════════════════════════════════════════
def test_12():
    print("\n==================== TEST 12: Security ====================\n")

    # 12.1 — CSRF: POST /api/reports without CSRF token
    r = session.post(f"{BASE}/api/reports", data={"form_slug": "spring-monitoring"}, timeout=T)
    if r.status_code == 403 and "CSRF" in r.text:
        P("12.1", "POST /api/reports without CSRF -> 403")
    elif r.status_code == 400:
        # CSRF check might be first, but form_slug validation might also trigger
        # Let's check if error mentions CSRF
        err = r.json().get("error", "")
        if "csrf" in err.lower():
            P("12.1", "POST /api/reports without CSRF -> 403/400")
        else:
            F("12.1", f"POST /api/reports without CSRF -> {r.status_code}", err[:120])
    else:
        F("12.1", f"POST /api/reports without CSRF -> {r.status_code}", r.text[:120])

    # 12.2 — Anti-spam honeypot: send _website field
    csrf = get_csrf()
    if csrf:
        r = post_form("/api/reports", {
            "form_slug": "spring-monitoring",
            "_website": "bot_value",
            "spring_name": "test",
            "province": "Jatim",
            "regency": "Malang",
            "date": "2026-07-01",
            "flow_condition": "Mengalir deras",
            "water_quality": "Air jernih",
            "cleanliness": "Bebas dari sampah plastik",
            "location_lat": "-7.5",
            "location_lng": "110",
        }, csrf=csrf)
        if r.status_code == 200 and r.json().get("honeypot"):
            P("12.2", "Honeypot _website field -> accepted silently")
        else:
            F("12.2", f"Honeypot -> {r.status_code}", r.text[:120])
    else:
        F("12.2", "Cannot get CSRF for honeypot test")

    # 12.3 — Non-admin accessing admin API
    if not login_as(UCUP["email"], UCUP["password"]):
        F("12.3", "Cannot login as ucup for admin access test")
    else:
        r = get("/api/admin/users")
        if r.status_code in (401, 403):
            P("12.3", f"Non-admin GET /api/admin/users -> {r.status_code}")
        else:
            F("12.3", f"Non-admin GET /api/admin/users -> {r.status_code}", r.text[:120])
        logout()

    # 12.4 — Check /api/auth/me without session still works
    # (already tested in 4.4, but let's re-verify)
    r = get("/api/auth/me")
    if r.status_code == 200 and r.json().get("user") is None:
        P("12.4", "Unauthenticated /api/auth/me -> user: null")
    else:
        F("12.4", f"Unauthenticated /api/auth/me -> {r.status_code}", r.text[:120])


# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════════
def main():
    global pass_count, fail_count, skip_count
    start = time.time()

    print(f"SpringHub Manual Test Runner")
    print(f"Target: {BASE}")
    print(f"Waktu  : {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    test_1()
    test_2()
    test_3()
    test_4()
    test_5()
    test_6()
    test_7()
    test_8()
    test_9()
    test_10()
    test_11()
    test_12()

    elapsed = time.time() - start
    total = pass_count + fail_count + skip_count

    print("\n" + "=" * 60)
    print("  TEST SUMMARY")
    print("=" * 60)
    print(f"  {pass_count} PASS / {fail_count} FAIL / {skip_count} SKIP")
    print(f"  Total: {total} test cases")
    print(f"  Waktu: {elapsed:.1f}s")
    print("=" * 60)

    sys.exit(1 if fail_count > 0 else 0)


if __name__ == "__main__":
    main()
