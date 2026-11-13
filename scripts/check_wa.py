"""Checks every WhatsApp button: it opens wa.me with the admin number and a message that names where it was pressed.
Usage: python scripts/check_wa.py http://localhost:4320 docs/proof/tmp"""
import sys, asyncio, urllib.parse
from playwright.async_api import async_playwright

base, out = sys.argv[1], sys.argv[2]
PAGES = [("/l/id/", "id"), ("/services/", "id"), ("/services/one-page-landing-page/", "id"), ("/terms/one-page-landing-page/", "id"), ("/catalog/", "id"), ("/contact/", "id"), ("/contact/", "en"), ("/l/ja/", "ja")]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", headless=True)
        bad = 0; total = 0
        for path, lang in PAGES:
            ctx = await b.new_context(viewport={"width": 1280, "height": 900})
            await ctx.add_init_script(f"try{{localStorage.setItem('lang','{lang}')}}catch(e){{}}")
            pg = await ctx.new_page(); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.goto(base + path, wait_until="load"); await pg.wait_for_timeout(2500)
            links = await pg.eval_on_selector_all("a[data-wa]", "as => as.map(a => [a.dataset.waSrc, a.href])")
            for src, href in links:
                total += 1
                text = urllib.parse.unquote(href.split("text=", 1)[1]) if "text=" in href else ""
                if not href.startswith("https://wa.me/62895365173030") or f"[{src}" not in text: bad += 1; print("BAD", path, src, href[:80])
            print(path, lang, "buttons", len(links), "errors", errs[:2])
            if links: print("   sample:", urllib.parse.unquote(links[-1][1].split("text=", 1)[1]).replace("\n", " / ")[:230])
            if path == "/contact/" and lang == "id": await pg.screenshot(path=f"{out}/contact-id.png", full_page=True)
            if path == "/services/one-page-landing-page/": await pg.screenshot(path=f"{out}/svc-wa.png")
            if path == "/l/id/":
                await pg.click(".hero [data-open-chat]"); await pg.fill("#chat-input", "bikin aplikasi kasir untuk koperasi desa"); await pg.press("#chat-input", "Enter"); await pg.wait_for_timeout(800)
                h = await pg.eval_on_selector_all("#chat-log a.wa-chat", "as => as.map(a => a.href)")
                print("   assistant WhatsApp links", len(h), urllib.parse.unquote(h[-1].split("text=", 1)[1]).replace("\n", " / ")[:200] if h else "")
                await pg.screenshot(path=f"{out}/chat-wa.png")
            await ctx.close()
        print("buttons checked", total, "bad", bad)
        await b.close()

asyncio.run(main())
