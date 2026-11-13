"""Signs in to the live admin page with the master account and screenshots each screen.
Usage: MASTER_USER=... MASTER_PASS=... python scripts/check_admin_live.py https://techserva.vercel.app docs/proof/tmp"""
import os, sys, asyncio
from playwright.async_api import async_playwright

base, out = sys.argv[1], sys.argv[2]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", headless=True)
        pg = await b.new_page(viewport={"width": 1280, "height": 860})
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(base + "/admin/"); await pg.wait_for_selector(".auth-card")
        await pg.screenshot(path=f"{out}/admin-login.png")
        await pg.click("text=Buat akun"); await pg.wait_for_selector("text=Buat akun admin"); await pg.screenshot(path=f"{out}/admin-register.png")
        await pg.click("text=Sudah punya akun? Masuk"); await pg.wait_for_selector("text=Lupa password")
        await pg.click("text=Lupa password"); await pg.wait_for_selector("text=Minta link reset"); await pg.screenshot(path=f"{out}/admin-forgot.png")
        await pg.click("text=Kembali ke halaman masuk"); await pg.wait_for_selector("input[autocomplete=username]")
        await pg.fill("input[autocomplete=username]", os.environ["MASTER_USER"]); await pg.fill("input[type=password]", os.environ["MASTER_PASS"])
        await pg.click("button[type=submit]"); await pg.wait_for_selector("text=Techserva admin", timeout=20000)
        print("signed in as", await pg.inner_text(".row-gap .note"))
        await pg.click("role=tab[name='Akun']"); await pg.wait_for_selector("text=Semua akun"); await pg.wait_for_timeout(800)
        await pg.screenshot(path=f"{out}/admin-accounts.png", full_page=True)
        await pg.click("text=Keluar"); await pg.wait_for_selector(".auth-card")
        print("signed out, errors", errs)
        await b.close()

asyncio.run(main())
