"""Renders the sales video from scripts/ad/ad.html, frame by frame, so it never drops frames.
Usage: python scripts/render_ad.py [site_url_for_backgrounds] [--sheet-only]
The two backgrounds are stills of the site's own 3D scene. They are captured once from a running site and kept."""
import os, subprocess, sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
AD = ROOT / "scripts" / "ad"
MEDIA = ROOT / "src" / "media"
SITE = next((a for a in sys.argv[1:] if a.startswith("http")), "")
FPS = 30
HIDE = "body > *:not(#scene) { visibility: hidden !important } html { scrollbar-width: none }"

with sync_playwright() as p:
    if SITE and not ((AD / "bg-hero.jpg").exists() and (AD / "bg-end.jpg").exists()):
        b = p.chromium.launch(channel="chrome", headless=False, args=["--use-angle=d3d11", "--ignore-gpu-blocklist", "--window-position=-2000,0"])
        pg = b.new_context(viewport={"width": 1280, "height": 720}, device_scale_factor=1.5, color_scheme="dark").new_page()
        pg.goto(SITE + "/", wait_until="networkidle"); pg.wait_for_selector("#scene.ready", state="attached", timeout=60000)
        pg.wait_for_timeout(6000); pg.add_style_tag(content=HIDE); pg.wait_for_timeout(400)
        pg.screenshot(path=str(AD / "bg-hero.jpg"), type="jpeg", quality=88)
        pg.evaluate("window.scrollTo(0, document.body.scrollHeight)"); pg.wait_for_timeout(5000)
        pg.screenshot(path=str(AD / "bg-end.jpg"), type="jpeg", quality=88)
        b.close()

    b = p.chromium.launch(channel="chrome")
    pg = b.new_context(viewport={"width": 1280, "height": 720}).new_page()
    pg.goto((AD / "ad.html").as_uri(), wait_until="load"); pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(500)
    dur = pg.evaluate("window.DURATION")
    if "--sheet-only" in sys.argv:
        os.makedirs(ROOT / "docs" / "proof" / "tmp", exist_ok=True)
        for t in [1.6, 4, 7.4, 10, 13, 16.5, 20, 23.5, 27, 31, 35, 38, 40.5, 44, 47, 49.2, 51.5]:
            pg.evaluate("t => window.seek(t)", t)
            pg.screenshot(path=str(ROOT / "docs" / "proof" / "tmp" / f"ad-{int(t * 10):04d}.jpg"), type="jpeg", quality=80)
        b.close(); sys.exit(0)
    out = MEDIA / "ad.mp4"
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-",
                           "-vf", "format=yuv420p", "-c:v", "libx264", "-crf", "23", "-preset", "slow", "-movflags", "+faststart", "-an", str(out)], stdin=subprocess.PIPE)
    n = int(dur * FPS)
    for i in range(n):
        pg.evaluate("t => window.seek(t)", i / FPS)
        ff.stdin.write(pg.screenshot(type="jpeg", quality=95))
        if i % 150 == 0: print("frame", i, "/", n, flush=True)
    ff.stdin.close(); ff.wait(); b.close()

subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "14", "-i", str(out), "-frames:v", "1", "-q:v", "3", str(MEDIA / "ad.jpg")], check=True)
print("MB", round(os.path.getsize(out) / 1e6, 2), "seconds", dur)
