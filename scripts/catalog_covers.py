"""Writes public/catalog/cover/<lang>.jpg (the site's book picture) from page 1 of each catalog PDF.
Usage: python scripts/catalog_covers.py"""
import glob, os
import fitz
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cov = os.path.join(root, "public", "catalog", "cover"); os.makedirs(cov, exist_ok=True)
n = 0
for f in glob.glob(os.path.join(root, "public", "catalog", "pdf", "*.pdf")):
    d = fitz.open(f); z = 760 / d[0].rect.width
    d[0].get_pixmap(matrix=fitz.Matrix(z, z)).save(os.path.join(cov, os.path.basename(f)[:-4] + ".jpg"), jpg_quality=80)
    d.close(); n += 1
print("covers", n)
