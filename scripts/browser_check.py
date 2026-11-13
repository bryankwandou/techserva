"""Drives the site in Chromium and records evidence. Usage: python scripts/browser_check.py [base_url] [proof_dir]"""
import json, sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173"
OUT = sys.argv[2] if len(sys.argv) > 2 else "docs/proof"
results = []
def check(name, ok, info=""):
    results.append((name, bool(ok), str(info)))
    print(("PASS" if ok else "FAIL"), name, info)

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=False, args=["--use-angle=d3d11", "--ignore-gpu-blocklist", "--window-position=-2000,0"])
    errs = []
    def page(w=1440, h=900, **kw):
        ctx = b.new_context(viewport={"width": w, "height": h}, locale="en-US", **kw)
        pg = ctx.new_page()
        pg.on("pageerror", lambda e: errs.append(f"{pg.url}: {e}"))
        pg.on("console", lambda m: errs.append(f"{pg.url}: {m.text}") if m.type == "error" and "api/" not in m.text else None)
        return pg

    pg = page()
    pg.goto(BASE + "/", wait_until="networkidle")
    pg.wait_for_timeout(2500)
    check("english is default", pg.evaluate("document.documentElement.lang") == "en")
    check("3D scene running", pg.evaluate("document.documentElement.dataset.scene3d") == "on")
    painted = pg.evaluate("""() => { const c=document.getElementById('scene'); return c.width>0 && c.height>0 }""")
    check("3D canvas has size", painted)
    pg.wait_for_selector("#scene.ready", timeout=60000, state="attached"); pg.wait_for_timeout(3500)
    clip = {"x": 40, "y": 620, "width": 400, "height": 240}
    a = pg.screenshot(clip=clip, type="png"); pg.wait_for_timeout(1500); c = pg.screenshot(clip=clip, type="png")
    check("3D is moving on screen", a != c)
    from PIL import Image
    import io
    px = list(Image.open(io.BytesIO(c)).convert("L").resize((40, 24)).getdata())
    check("3D paints a visible world, not a flat colour", max(px) - min(px) > 40, max(px) - min(px))
    check("default theme is dark", pg.evaluate("document.documentElement.dataset.theme") == "dark")
    pg.screenshot(path=f"{OUT}/02-home-dark.jpg", quality=80, type="jpeg")
    pg.click("#theme"); pg.wait_for_timeout(1200)
    check("theme toggle goes light", pg.evaluate("document.documentElement.dataset.theme") == "light")
    pg.screenshot(path=f"{OUT}/01-home-light.jpg", quality=80, type="jpeg")
    pg.reload(wait_until="load"); pg.wait_for_load_state("networkidle"); pg.wait_for_selector("#theme")
    check("theme persists after reload", pg.evaluate("document.documentElement.dataset.theme") == "light")
    pg.click("#theme"); pg.wait_for_timeout(500)

    pg.fill("#home-search", "pen test"); pg.wait_for_timeout(400)
    pg.fill("#home-search", "penetration"); pg.wait_for_timeout(500)
    n = pg.locator("#home-results a").count()
    check("live search finds services", n >= 3, n)
    pg.screenshot(path=f"{OUT}/03-search.jpg", quality=80, type="jpeg")
    pg.fill("#home-search", "")
    pg.mouse.click(5, 500)

    for frac, name in [(0.22, "04-scroll-catalog"), (0.42, "05-scroll-steps"), (0.55, "06-scroll-rules")]:
        pg.evaluate(f"window.scrollTo(0, document.body.scrollHeight*{frac})"); pg.wait_for_timeout(1600)
        pg.screenshot(path=f"{OUT}/{name}.jpg", quality=80, type="jpeg")
    pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(600)

    pg.click("#lang"); pg.wait_for_timeout(200)
    rows = pg.locator("#langs-list button").count()
    check("language toggle lists 200+", rows >= 200, rows)
    pg.screenshot(path=f"{OUT}/07-language-picker.jpg", quality=80, type="jpeg")
    pg.fill("#langs-q", "indones"); pg.wait_for_timeout(150)
    pg.click("#langs-list button[data-code='id']")
    pg.wait_for_url("**/l/id/"); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(900)
    check("indonesian page loads", pg.evaluate("document.documentElement.lang") == "id")
    txt = pg.locator(".ticket .t-amount").inner_text()
    check("indonesian prices are in rupiah", "Rp" in txt, ascii(txt))
    pg.screenshot(path=f"{OUT}/08-home-indonesian.jpg", quality=80, type="jpeg")

    pg.goto(BASE + "/services/", wait_until="networkidle"); pg.wait_for_timeout(700)
    check("language carries to services page", "Rp" in pg.locator(".price").first.inner_text())
    pg.evaluate("localStorage.setItem('lang','en')")

    pg.goto(BASE + "/l/ar/", wait_until="networkidle"); pg.wait_for_timeout(1000)
    check("arabic is right to left", pg.evaluate("document.documentElement.dir") == "rtl")
    over = pg.evaluate("document.documentElement.scrollWidth - innerWidth")
    check("arabic has no sideways overflow", over <= 1, over)
    pg.screenshot(path=f"{OUT}/09-home-arabic.jpg", quality=80, type="jpeg")
    for code, needle in [("ja", "JP"), ("hi", ""), ("sw", ""), ("my", ""), ("am", ""), ("zh-CN", "")]:
        r = pg.goto(f"{BASE}/l/{code}/", wait_until="domcontentloaded")
        check(f"{code} home responds", r.status == 200, r.status)
    pg.evaluate("localStorage.setItem('lang','en')")

    pg = page()
    pg.goto(BASE + "/", wait_until="networkidle")
    pg.click("#chat-open"); pg.wait_for_timeout(500)
    qa = [("I need a landing page", "landing page"), ("How much is a pen test?", "penetration"), ("Can I pay with USDT?", "USDT"), ("How many revisions do I get?", "stage 1"), ("zzqq xxyy", "could not find")]
    for q, want in qa:
        before = pg.locator("#chat-log .msg.bot").count()
        pg.fill("#chat-input", q); pg.keyboard.press("Enter")
        for _ in range(60):
            if pg.locator("#chat-log .msg.bot").count() > before: break
            pg.wait_for_timeout(200)
        last = pg.locator("#chat-log .msg.bot").last.inner_text()
        check(f"assistant: {q}", want.lower() in last.lower(), last[:80].replace("\n", " "))
    pg.screenshot(path=f"{OUT}/10-assistant.jpg", quality=80, type="jpeg")

    for path_, q, want in [("/l/id/", "berapa harga logo", "Rp"), ("/l/ja/", "ロゴデザイン", "ロゴ")]:
        pg = page()
        pg.goto(BASE + path_, wait_until="networkidle")
        pg.click("#chat-open"); pg.wait_for_timeout(300)
        before = pg.locator("#chat-log .msg.bot").count()
        pg.fill("#chat-input", q); pg.keyboard.press("Enter")
        for _ in range(60):
            if pg.locator("#chat-log .msg.bot").count() > before: break
            pg.wait_for_timeout(200)
        last = pg.locator("#chat-log .msg.bot").last.inner_text()
        check(f"assistant answers in {path_}", want in last, ascii(last[:70]))

    pg = page()
    pg.goto(BASE + "/services/", wait_until="networkidle")
    check("1000 services listed", pg.locator(".svc-list li").count() == 1000, pg.locator(".svc-list li").count())
    pg.fill("#svc-filter", "discord"); pg.wait_for_timeout(300)
    check("service filter works", 3 <= int(pg.locator("#svc-count").inner_text()) <= 8, pg.locator("#svc-count").inner_text())
    pg.screenshot(path=f"{OUT}/11-services.jpg", quality=80, type="jpeg")
    pg.goto(BASE + "/services/web-app-penetration-test/", wait_until="networkidle"); pg.wait_for_timeout(900)
    pg.screenshot(path=f"{OUT}/12-service-page.jpg", quality=80, type="jpeg")
    pg.click("a[href='/terms/web-app-penetration-test/']"); pg.wait_for_load_state("networkidle")
    body = pg.locator("main").inner_text()
    check("terms page has the core rules", all(x in body for x in ["Written permission", "must be paid before", "does not include a domain", "only in stage 1", "USDT or USDC"]))
    pg.screenshot(path=f"{OUT}/13-terms-page.jpg", quality=80, type="jpeg")
    a = pg.goto(BASE + "/terms/logo-design/", wait_until="domcontentloaded"); t1 = pg.locator("main").inner_text()
    pg.goto(BASE + "/terms/web-app-penetration-test/", wait_until="domcontentloaded"); t2 = pg.locator("main").inner_text()
    check("terms differ between services", a.status == 200 and t1 != t2)
    pg.goto(BASE + "/catalog/", wait_until="networkidle")
    check("catalog lists 200+ PDFs", pg.locator(".lang-grid a").count() >= 200, pg.locator(".lang-grid a").count())
    pg.screenshot(path=f"{OUT}/14-catalog.jpg", quality=80, type="jpeg")

    m = page(390, 844, device_scale_factor=2, is_mobile=True, has_touch=True)
    for path_, shot in [("/", "15-mobile-home"), ("/services/", "16-mobile-services"), ("/services/one-page-landing-page/", "17-mobile-service")]:
        m.goto(BASE + path_, wait_until="networkidle"); m.wait_for_timeout(900)
        over = m.evaluate("document.documentElement.scrollWidth - innerWidth")
        check(f"mobile {path_} has no sideways overflow", over <= 1, over)
        m.screenshot(path=f"{OUT}/{shot}.jpg", quality=75, type="jpeg")

    rm = page(reduced_motion="reduce")
    rm.goto(BASE + "/", wait_until="networkidle"); rm.wait_for_timeout(800)
    check("reduced motion skips gsap", rm.evaluate("typeof window.gsap") == "undefined")

    check("no page or console errors", not errs, errs[:5])
    b.close()

fails = [r for r in results if not r[1]]
with open(f"{OUT}/browser-check.json", "w", encoding="utf-8") as f:
    json.dump({"base": BASE, "passed": len(results) - len(fails), "failed": len(fails), "results": results}, f, indent=1, ensure_ascii=False)
print(f"\n{len(results) - len(fails)} passed, {len(fails)} failed")
sys.exit(1 if fails else 0)
