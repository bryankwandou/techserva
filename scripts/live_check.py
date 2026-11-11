"""Checks the deployed admin, API, PDF links and headers. Credentials come from a local file and are never printed.
Usage: python scripts/live_check.py https://techserva.vercel.app <credentials file> docs/proof"""
import json, re, sys, tempfile, urllib.request, urllib.error, os
from playwright.sync_api import sync_playwright

BASE, CRED, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
text = open(CRED, encoding="utf-8").read()
USER = re.search(r"username: (\S+)", text).group(1)
PASS = re.search(r"password: (\S+)", text).group(1)
res = []
def check(name, ok, info=""):
    res.append((name, bool(ok), str(info))); print("PASS" if ok else "FAIL", name, info)
def req(path, data=None, headers=None):
    r = urllib.request.Request(BASE + path, data=json.dumps(data).encode() if data is not None else None, headers={"content-type": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(r, timeout=60) as x: return x.status, dict(x.headers), x.read()
    except urllib.error.HTTPError as e: return e.code, dict(e.headers), e.read()

s, h, _ = req("/")
check("home responds", s == 200, s)
low = {k.lower(): v for k, v in h.items()}
for k in ["content-security-policy", "x-content-type-options", "strict-transport-security", "referrer-policy"]:
    check(f"header {k}", k in low)
check("admin API refuses without login", req("/api/admin?action=meta")[0] == 401)
check("admin API search refuses without login", req("/api/admin?action=search")[0] == 401)
check("wrong password refused", req("/api/admin?action=login", {"user": USER, "pass": "wrong"})[0] == 401)
check("forged cookie refused", req("/api/admin?action=meta", headers={"cookie": "ts_admin=99999999999999.abc"})[0] == 401)
check("lead needs agreement", req("/api/lead", {"service": "TS-001", "name": "a", "contact": "b", "brief": "c"})[0] == 400)
check("lead rejects unknown service", req("/api/lead", {"service": "XX", "name": "a", "contact": "b", "brief": "c", "agree": "on"})[0] == 400)
s, _, b = req("/api/lead", {"service": "TS-001", "name": "Automated test", "contact": "test@example.com", "brief": "Automated live check, not a real client.", "agree": "on", "lang": "en"})
ref = json.loads(b).get("reference", "") if s == 200 else ""
check("lead saved", s == 200 and ref, s)
s, _, b = req("/api/lead", {"service": "TS-001", "name": "bot", "contact": "b", "brief": "c", "agree": "on", "website": "spam"})
check("honeypot looks successful", s == 200, s)

s, h, pdf = req("/catalog/pdf/id.pdf")
check("Indonesian PDF downloads", s == 200 and pdf[:4] == b"%PDF", len(pdf))
try:
    import fitz
    d = fitz.open(stream=pdf, filetype="pdf")
    uris = [l.get("uri", "") for p in d for l in p.get_links()]
    terms = sorted({u for u in uris if "/terms/" in u and not u.endswith("/terms/")})
    check("PDF links to 500 different terms pages", len(terms) == 500, len(terms))
    bad = [u for u in terms[:12] + terms[-12:] if req(u.replace("https://techserva.vercel.app", ""))[0] != 200]
    check("sampled PDF terms links open", not bad, bad[:3])
except ImportError:
    check("pymupdf available", False)

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
    ctx = b.new_context(viewport={"width": 1440, "height": 900}, permissions=["clipboard-read", "clipboard-write"])
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "401" not in m.text else None)
    pg.goto(BASE + "/admin/", wait_until="networkidle")
    pg.fill("input[autocomplete=username]", USER); pg.fill("input[type=password]", PASS)
    pg.screenshot(path=f"{OUT}/20-admin-login.jpg", type="jpeg", quality=80, clip={"x": 0, "y": 0, "width": 1440, "height": 300}, mask=[pg.locator("input")])
    pg.click("button[type=submit]"); pg.wait_for_selector("table.data tbody tr")
    info = pg.locator("p.note").first.inner_text()
    check("dashboard shows 50,000 templates", "50,000 of 50,000" in info, info)
    pg.screenshot(path=f"{OUT}/21-admin-templates.jpg", type="jpeg", quality=80)
    pg.fill("input[type=search]", "landing page"); pg.wait_for_timeout(1200)
    check("template search narrows results", "50,000 of" not in pg.locator("p.note").first.inner_text(), pg.locator("p.note").first.inner_text())
    pg.locator("table.data tbody tr").first.click(); pg.wait_for_selector("pre.prompt")
    prompt = pg.locator("pre.prompt").inner_text()
    check("template opens with a real prompt", "{{brief}}" in prompt and "NEXT:" in prompt)
    pg.get_by_role("button", name="Copy for ChatGPT").click(); pg.wait_for_timeout(250)
    check("copy to clipboard works", pg.evaluate("navigator.clipboard.readText()") == prompt.strip() or len(pg.evaluate("navigator.clipboard.readText()")) > 200)
    pg.screenshot(path=f"{OUT}/22-admin-prompt.jpg", type="jpeg", quality=80)

    pg.get_by_role("tab", name="Client loop").click(); pg.wait_for_selector("#load-test")
    pg.click("#load-test")
    pg.wait_for_selector("p.note[data-done='1']", timeout=240000)
    took = pg.locator("p.note[data-done='1']").inner_text()
    check("queue holds 50,000 sample clients", "50,000" in took, took)
    pg.wait_for_timeout(1200)
    check("queue counter shows 50,000", "50,000" in pg.locator(".stat-row").inner_text())
    pg.click("#loop-next"); pg.wait_for_selector("#loop-prompt")
    p1 = pg.locator("#loop-prompt").inner_text()
    check("loop gives step 1 prompt with client filled in", "Sample 1" in p1 and "(none yet)" in p1)
    pg.fill("textarea[aria-label='ChatGPT reply']", "UNIQUE-REPLY-123 from the first step."); pg.click("#loop-save")
    fed = False
    for _ in range(100):
        if pg.locator("#loop-prompt").count() and "UNIQUE-REPLY-123" in pg.locator("#loop-prompt").inner_text(): fed = True; break
        pg.wait_for_timeout(200)
    check("loop feeds the reply into the next step", fed)
    pg.screenshot(path=f"{OUT}/23-admin-loop.jpg", type="jpeg", quality=80)
    pg.get_by_role("button", name="Empty this queue").click(); pg.wait_for_timeout(2500)

    pg.get_by_role("tab", name="Requests").click(); pg.wait_for_selector("table.data tbody tr, #panel p", timeout=30000); pg.wait_for_timeout(1500)
    body = pg.locator("#panel").inner_text()
    check("saved request appears decrypted", ref and ref in body, ref)
    pg.screenshot(path=f"{OUT}/24-admin-requests.jpg", type="jpeg", quality=80)
    check("no admin page errors", not errs, errs[:3])
    b.close()

fails = [r for r in res if not r[1]]
json.dump({"base": BASE, "passed": len(res) - len(fails), "failed": len(fails), "results": res}, open(f"{OUT}/live-check.json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print(f"\n{len(res) - len(fails)} passed, {len(fails)} failed")
sys.exit(1 if fails else 0)
