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
    # Cover thumbnail for the site's book picture, one per language.
    cov = os.path.join(os.path.dirname(os.path.abspath(folder)), "cover"); os.makedirs(cov, exist_ok=True)
    d = fitz.open(f); pix = d[0].get_pixmap(matrix=fitz.Matrix(380 / d[0].rect.width, 380 / d[0].rect.width)); d.close()
    pix.save(os.path.join(cov, os.path.basename(f)[:-4] + ".jpg"), jpg_quality=78)
    total += os.path.getsize(f)
    d = fitz.open(f)
    terms = {l.get("uri") for p in d for l in p.get_links() if "/terms/" in l.get("uri", "") and not l.get("uri", "").endswith("/terms/")}
    if len(terms) != 1000:
        bad.append((os.path.basename(f), len(terms)))
    d.close()
print("files", len(files), "MB", round(total / 1e6, 1), "without 1000 terms links", bad[:5])
