"""Records the walkthrough from the running site and encodes it. Usage: python scripts/record_walkthrough.py http://localhost:4173"""
import glob, os, shutil, subprocess, sys, tempfile
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173"
MEDIA = os.path.join("src", "media")
os.makedirs(MEDIA, exist_ok=True)
tmp = tempfile.mkdtemp()
CAP = """(t) => { let c=document.getElementById('cap'); if(!c){c=document.createElement('div');c.id='cap';
c.style.cssText='position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:99;background:#17170f;color:#f4f1e8;padding:12px 20px;border-radius:8px;font:500 20px Geist,system-ui,sans-serif;max-width:82vw;text-align:center';document.documentElement.append(c)} c.textContent=t }"""

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=False, args=["--use-angle=d3d11", "--ignore-gpu-blocklist", "--window-position=-2000,0"])
    ctx = b.new_context(viewport={"width": 1280, "height": 720}, record_video_dir=tmp, record_video_size={"width": 1280, "height": 720}, locale="en-US", color_scheme="dark")
    pg = ctx.new_page()
    def cap(t):
        for _ in range(5):
            try:
                pg.wait_for_load_state("load"); return pg.evaluate(CAP, t)
            except Exception:
                pg.wait_for_timeout(500)
    wait = pg.wait_for_timeout
    pg.goto(BASE + "/", wait_until="networkidle"); wait(6500)
    cap("A circuit-board city: each cluster of lights is one real service")
    for x, y in [(950, 560), (1120, 430), (300, 600), (640, 640), (1060, 620)]:
        pg.mouse.move(x, y, steps=30); wait(850)
    cap("Search the whole list as you type")
    pg.mouse.move(300, 450); pg.click("#home-search"); pg.keyboard.type("discord", delay=90); wait(1500)
    pg.fill("#home-search", ""); pg.mouse.click(30, 400)
    cap("Scroll: the camera flies low, four towers form, the whole board, then fireflies")
    for sel, off in [("#cats", -0.5), ("#how", -0.25), ("#rules", -0.3), ("#end", 0.0)]:
        y0 = pg.evaluate("scrollY"); y1 = pg.evaluate(f"document.querySelector('{sel}').getBoundingClientRect().top + scrollY + innerHeight * {off}")
        for i in range(1, 41):
            pg.evaluate(f"window.scrollTo(0, {y0 + (y1 - y0) * i / 40})"); wait(55)
        wait(1300)
    cap("One switch for light and dark")
    pg.evaluate("window.scrollTo(0,0)"); wait(500); pg.click("#theme"); wait(1400); pg.click("#theme"); wait(600)
    cap("More than 200 languages, each with its own currency")
    pg.click("#lang"); wait(700); pg.fill("#langs-q", "indo"); wait(700)
    pg.click("#langs-list button[data-code='id']"); pg.wait_for_url("**/l/id/"); pg.wait_for_load_state("networkidle"); cap("Bahasa Indonesia, priced in rupiah"); wait(2200)
    pg.goto(BASE + "/l/ar/", wait_until="networkidle"); cap("Arabic, laid out right to left"); wait(2200)
    pg.evaluate("localStorage.setItem('lang','en')")
    pg.goto(BASE + "/", wait_until="networkidle"); wait(600)
    cap("The assistant answers from the catalog, without an AI model")
    pg.click("#chat-open"); wait(500)
    for q in ["How much is a pen test?", "Can I pay with USDT?", "How many revisions do I get?"]:
        pg.fill("#chat-input", ""); pg.type("#chat-input", q, delay=45); pg.keyboard.press("Enter"); wait(1500)
    pg.click("#chat-close")
    cap("Every service has a price, a scope and a request form")
    pg.goto(BASE + "/services/web-app-penetration-test/", wait_until="networkidle"); wait(2000)
    cap("Every service has its own terms page")
    pg.goto(BASE + "/terms/web-app-penetration-test/", wait_until="networkidle"); wait(1200)
    pg.evaluate("window.scrollTo({top:520,behavior:'smooth'})"); wait(1800)
    cap("The PDF catalog comes in every language, with links to each terms page")
    pg.goto(BASE + "/catalog/", wait_until="networkidle"); wait(2200)
    path = pg.video.path()
    ctx.close(); b.close()

out = os.path.join(MEDIA, "walkthrough.mp4")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-vf", "fps=24,format=yuv420p", "-c:v", "libx264", "-crf", "33", "-preset", "slow", "-movflags", "+faststart", "-an", out], check=True)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "9", "-i", out, "-frames:v", "1", "-q:v", "4", os.path.join(MEDIA, "walkthrough.jpg")], check=True)
shutil.rmtree(tmp, ignore_errors=True)
print("MB", round(os.path.getsize(out) / 1e6, 2))
