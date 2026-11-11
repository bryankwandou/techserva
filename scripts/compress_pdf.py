"""Shrinks every generated PDF in place and verifies its links survive. Usage: python scripts/compress_pdf.py public/catalog/pdf"""
import glob, os, sys
import fitz

folder = sys.argv[1]
files = glob.glob(os.path.join(folder, "*.pdf"))
total = 0
bad = []
for f in files:
    d = fitz.open(f)
    d.save(f + ".tmp", garbage=4, deflate=True, deflate_fonts=True, use_objstms=1)
    d.close()
    os.replace(f + ".tmp", f)
    total += os.path.getsize(f)
    d = fitz.open(f)
    terms = {l.get("uri") for p in d for l in p.get_links() if "/terms/" in l.get("uri", "") and not l.get("uri", "").endswith("/terms/")}
    if len(terms) != 500:
        bad.append((os.path.basename(f), len(terms)))
    d.close()
print("files", len(files), "MB", round(total / 1e6, 1), "without 500 terms links", bad[:5])
