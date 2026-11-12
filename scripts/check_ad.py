"""Checks the live sales video page: frames per language, no overflow, sound start, and the assistant panel scroll.
Usage: python scripts/check_ad.py <site_url> <out_dir> [lang ...]"""
import sys, os, json
from playwright.sync_api import sync_playwright
SITE, OUT = sys.argv[1].rstrip("/"), sys.argv[2]
LANGS = sys.argv[3:] or ["en", "id", "ar", "ja", "de", "ta"]
TIMES = [3.5, 8, 14, 22, 34, 42, 50]
os.makedirs(OUT, exist_ok=True)
res = {}
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", args=["--autoplay-policy=no-user-gesture-required"])
    for lang in LANGS:
        pg = b.new_context(viewport={"width": 1280, "height": 720}).new_page()
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.goto(f"{SITE}/ad/?l={lang}", wait_until="networkidle"); pg.wait_for_function("typeof window.seek === \"function\"")
        over = []
        for t in TIMES:
            pg.evaluate("t => window.seek(t)", t); pg.wait_for_timeout(120)
            pg.screenshot(path=f"{OUT}/ad-{lang}-{int(t*10):03d}.jpg", type="jpeg", quality=70)
            # anything visible that pokes out of the 1280x720 stage or is clipped inside its own box
            over += pg.evaluate("""t => { const s = document.querySelector('#stage').getBoundingClientRect(); const bad = [];
              document.querySelectorAll('.scene').forEach(sc => { if (getComputedStyle(sc).visibility === 'hidden') return;
                sc.querySelectorAll('h1,h2,h3,p,.reply,.cta,.fact span,.terms span,.ask,.name,.url').forEach(e => { const r = e.getBoundingClientRect(); if (!r.width) return;
                  if (r.left < s.left - 2 || r.right > s.right + 2 || r.bottom > s.bottom + 2 || r.top < s.top - 2) bad.push(t + ' ' + sc.id + ' ' + e.tagName + '.' + e.className); }); });
              return bad; }""", t)
        # sound: click, let it run, read the clock and the voice element
        pg.evaluate("window.seek(0)"); pg.click("#snd"); pg.wait_for_timeout(2500)
        snd = pg.evaluate("({on: document.querySelector('#snd').classList.contains('on')})")
        res[lang] = {"overflow": over, "errors": errs, "sound_on": snd["on"]}
        pg.context.close()
    # assistant panel: wheel inside the log must scroll the log, not the page
    pg = b.new_context(viewport={"width": 1366, "height": 700}).new_page()
    pg.goto(SITE + "/", wait_until="networkidle"); pg.wait_for_timeout(2500)
    res["fab_hidden_on_hero"] = pg.evaluate("getComputedStyle(document.querySelector('#chat-open')).visibility") == "hidden"
    pg.screenshot(path=f"{OUT}/hero-no-fab.jpg", type="jpeg", quality=70)
    pg.click("[data-open-chat]"); pg.wait_for_selector("#chat:not([hidden])")
    for q in ["landing page", "pen test", "discord bot", "hosting", "mobile app", "audit"]:
        pg.fill("#chat-input", q); pg.press("#chat-input", "Enter"); pg.wait_for_timeout(350)
    box = pg.locator("#chat-log").bounding_box()
    pg.evaluate("document.querySelector('#chat-log').scrollTop = 0"); y0 = pg.evaluate("scrollY")
    pg.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    for _ in range(6): pg.mouse.wheel(0, 200); pg.wait_for_timeout(120)
    pg.wait_for_timeout(600)
    res["chat_log_scrolled"] = pg.evaluate("document.querySelector('#chat-log').scrollTop")
    res["page_moved"] = pg.evaluate("scrollY") - y0
    pg.screenshot(path=f"{OUT}/chat-scroll.jpg", type="jpeg", quality=70)
    pg.evaluate("document.querySelector('#chat-close').click(); window.scrollTo(0, document.body.scrollHeight * .5)"); pg.wait_for_timeout(900)
    res["fab_visible_below_hero"] = pg.evaluate("getComputedStyle(document.querySelector('#chat-open')).visibility") == "visible"
    pg.evaluate("document.querySelector('#demo').scrollIntoView()"); pg.wait_for_timeout(2500)
    pg.screenshot(path=f"{OUT}/demo-player.jpg", type="jpeg", quality=70)
    b.close()
print(json.dumps(res, indent=1, ensure_ascii=False))
