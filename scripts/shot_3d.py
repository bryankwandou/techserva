"""Photographs the 3D world on the real GPU and measures its frame rate.
Usage: python scripts/shot_3d.py http://localhost:4173 docs/proof"""
import json, sys
from playwright.sync_api import sync_playwright

BASE, OUT = sys.argv[1], sys.argv[2]
FPS = """() => new Promise(ok => { let n = 0; const t0 = performance.now(); const f = () => { n++; performance.now() - t0 < 2500 ? requestAnimationFrame(f) : ok(n / 2.5); }; requestAnimationFrame(f); })"""
report = {}
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=False, args=["--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--window-position=-2000,0"])
    pg = b.new_context(viewport={"width": 1440, "height": 900}).new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type in ("error", "warning") and ("THREE" in m.text or "GL" in m.text or m.type == "error") else None)
    pg.goto(BASE + "/", wait_until="load"); pg.wait_for_selector("#scene.ready", timeout=60000, state="attached"); pg.wait_for_timeout(1200)
    pg.screenshot(path=f"{OUT}/30-3d-intro.jpg", type="jpeg", quality=85)
    pg.wait_for_timeout(3600)
    pg.mouse.move(980, 620, steps=8); pg.wait_for_timeout(1400)
    pg.screenshot(path=f"{OUT}/31-3d-hero-dark.jpg", type="jpeg", quality=88)
    report["fps_hero"] = pg.evaluate(FPS)
    pg.mouse.move(400, 700, steps=10); pg.wait_for_timeout(1400)
    pg.screenshot(path=f"{OUT}/32-3d-hero-light-moved.jpg", type="jpeg", quality=85)
    stops = [("33-3d-flight", "#cats", -0.5), ("34-3d-towers", "#how", -0.25), ("35-3d-map", "#rules", -0.3), ("36-3d-fireflies", "#end", -0.2)]
    for name, sel, off in stops:
        y = pg.evaluate(f"document.querySelector('{sel}').getBoundingClientRect().top + scrollY + innerHeight * {off}")
        pg.evaluate(f"window.scrollTo(0, {y})"); pg.wait_for_timeout(2600)
        pg.screenshot(path=f"{OUT}/{name}.jpg", type="jpeg", quality=85)
        report["fps_" + name] = pg.evaluate(FPS)
    pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(1500)
    pg.click("#theme"); pg.wait_for_timeout(1500)
    pg.screenshot(path=f"{OUT}/37-3d-hero-light.jpg", type="jpeg", quality=85)
    pg.click("#theme")
    pg.goto(BASE + "/services/web-app-penetration-test/", wait_until="load"); pg.wait_for_timeout(3500)
    pg.screenshot(path=f"{OUT}/38-3d-service.jpg", type="jpeg", quality=85)
    report["quality"] = pg.evaluate("document.documentElement.dataset.sceneQuality || '0'")
    report["renderer"] = pg.evaluate("(()=>{const c=document.createElement('canvas').getContext('webgl2');const e=c.getExtension('WEBGL_debug_renderer_info');return c.getParameter(e.UNMASKED_RENDERER_WEBGL)})()")
    report["errors"] = errs[:6]
    m = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True).new_page()
    m.goto(BASE + "/", wait_until="load"); m.wait_for_selector("#scene.ready", timeout=60000, state="attached"); m.wait_for_timeout(5000)
    m.screenshot(path=f"{OUT}/39-3d-mobile.jpg", type="jpeg", quality=82)
    b.close()
print(json.dumps(report, indent=1))
