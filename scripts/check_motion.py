"""Checks the hero motion: headline words, the arrow dive (smooth scroll + warp), console errors.
Usage: python scripts/check_motion.py http://localhost:4320 docs/proof/tmp"""
import sys, asyncio
from playwright.async_api import async_playwright

base, out = sys.argv[1], sys.argv[2]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", headless=False, args=["--use-angle=d3d11", "--window-position=-2400,0"])
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        await ctx.add_cookies([{"name": "lang", "value": "id.ID", "url": base}])
        pg = await ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        await pg.goto(base + "/l/id/", wait_until="load")
        await pg.wait_for_timeout(4500)
        print("words", await pg.evaluate("document.querySelectorAll('.hero h1 .w').length"),
              "scene", await pg.evaluate("document.documentElement.dataset.scene3d"),
              "hint", await pg.evaluate("!!document.querySelector('.hint')"))
        await pg.screenshot(path=f"{out}/m-hero.jpg", type="jpeg", quality=70)
        await pg.mouse.move(300, 300)
        await pg.click(".down")
        ys = []
        for i in range(6):
            await pg.wait_for_timeout(400)
            ys.append(await pg.evaluate("Math.round(scrollY)"))
            if i in (0, 2): await pg.screenshot(path=f"{out}/m-dive-{i}.jpg", type="jpeg", quality=70)
        print("scroll after click", ys, "fired", await pg.evaluate("document.querySelector('.down').classList.contains('fired')"))
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f"{out}/m-cats.jpg", type="jpeg", quality=70)
        print("errors", errs[:5])
        await b.close()

asyncio.run(main())
