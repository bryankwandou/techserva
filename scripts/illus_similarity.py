"""Pairwise similarity of all catalog illustrations.
Usage: python scripts/illus_similarity.py docs/proof/tmp/illus-sheet.png [limit]

Similarity is measured on what a reader sees, not on the shared paper background:
each image is reduced to its drawn content (pixels that differ from the card background),
then two images are compared by color-aware overlap of that content (intersection over union).
Pixels count as the same only when both are drawn there AND their colors are close.
0% = nothing drawn in common, 100% = identical picture."""
import sys, json
import numpy as np
from PIL import Image

sheet = sys.argv[1]; limit = float(sys.argv[2]) if len(sys.argv) > 2 else 0.10
meta = json.load(open(sheet.replace('.png', '.json')))
W, H, COLS, N = meta['W'], meta['H'], meta['COLS'], meta['n']
img = np.asarray(Image.open(sheet).convert('RGB')).astype(np.int16)
S = int(sys.argv[3]) if len(sys.argv) > 3 else 1  # 1 = full size; a bigger step blurs thin lines into pale colour that every picture shares
tiles = []
for i in range(N):
    r, c = divmod(i, COLS)
    t = img[r * H:(r + 1) * H, c * W:(c + 1) * W]
    t = t.reshape(H // S, S, W // S, S, 3).mean(axis=(1, 3))
    bg = np.median(np.concatenate([t[0], t[-1], t[:, 0], t[:, -1]]), axis=0)  # the card's paper color
    mask = np.abs(t - bg).sum(axis=2) > 36
    tiles.append((t, mask))

def sim(a, b):
    (ta, ma), (tb, mb) = a, b
    union = (ma | mb).sum()
    if union == 0: return 1.0
    same = ma & mb & (np.abs(ta - tb).sum(axis=2) < 60)
    return same.sum() / union

names = [f"{c} {n}" for c, n, _ in meta['services']] + [f"category art {i}" for i in range(N - len(meta['services']))]
pairs = []
for i in range(N):
    for j in range(i + 1, N):
        s = sim(tiles[i], tiles[j])
        if s > limit: pairs.append((s, i, j))
pairs.sort(reverse=True)
allv = np.array([sim(tiles[i], tiles[j]) for i in range(0, N, 7) for j in range(i + 1, N, 5)])
print(f"images {N}  pairs over {limit:.0%}: {len(pairs)}  sampled median {np.median(allv):.1%}  sampled max {allv.max():.1%}")
for s, i, j in pairs[:40]: print(f"{s:6.1%}  {names[i]}  <>  {names[j]}")
json.dump([[round(s, 4), i, j] for s, i, j in pairs], open(sheet.replace('.png', '-pairs.json'), 'w'))
