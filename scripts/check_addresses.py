"""Makes sure no page, data file, video label or catalog PDF (any language) still names an old site address.
Allowed: the admin analytics labels, which name techserva.vercel.app as a source of redirected visitors.
Usage: python scripts/check_addresses.py"""
import os, re, glob
import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")
OLD = re.compile(r"techserva\.vercel\.app|techserva\.xyz", re.I)
ALLOW = {os.path.join(PUB, "assets", "admin.js")}
bad, files = [], 0
for dirpath, _, names in os.walk(PUB):
    for n in names:
        p = os.path.join(dirpath, n)
        if p in ALLOW or not n.endswith((".html", ".js", ".json", ".xml", ".txt", ".css", ".webmanifest")):
            continue
        files += 1
        s = open(p, encoding="utf8", errors="ignore").read()
        if OLD.search(s):
            bad.append(os.path.relpath(p, PUB))
pdfs, pbad, nolink = 0, [], []
for f in glob.glob(os.path.join(PUB, "catalog", "pdf", "*.pdf")):
    d = fitz.open(f); pdfs += 1
    text = "".join(pg.get_text() for pg in d)
    uris = [l.get("uri", "") for pg in d for l in pg.get_links()]
    if OLD.search(text) or any(OLD.search(u) for u in uris):
        pbad.append(os.path.basename(f))
    if "techserva.web.id" not in text:
        nolink.append(os.path.basename(f))
    d.close()
print("text files", files, "with old address", len(bad), bad[:10])
print("pdfs", pdfs, "with old address", len(pbad), pbad[:10], "without techserva.web.id", len(nolink), nolink[:10])
print("PASS" if not bad and not pbad and not nolink else "FAIL")
