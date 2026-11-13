"""Chooses one variant per service so the catalog pictures differ from each other.
The measure of scripts/illus_similarity.py at a quarter of the size (60x30): two pictures share a pixel
when both are drawn there in colours less than 60 apart (sum over red, green, blue). Similarity = shared pixels / pixels drawn in either. Writes data/illus-variants.json.
scripts/illus_similarity.py then checks the result with the full measure.
Usage: python scripts/illus_pick.py docs/proof/tmp/cand data/illus-variants.json [rounds]"""
import sys, json
import numpy as np
from PIL import Image

d, out = sys.argv[1], sys.argv[2]; rounds = int(sys.argv[3]) if len(sys.argv) > 3 else 4
meta = json.load(open(f"{d}/index.json"))
W, H, COLS = meta['W'], meta['H'], meta['COLS']
S = 4; w, h = W // S, H // S
labels = []
for sh in meta['sheets']:
    img = np.asarray(Image.open(sh['file']).convert('RGB')).astype(np.int16)
    for i in range(sh['count']):
        r, c = divmod(i, COLS)
        t = img[r * H:(r + 1) * H, c * W:(c + 1) * W].reshape(h, S, w, S, 3).mean(axis=(1, 3))
        bg = np.median(np.concatenate([t[0], t[-1], t[:, 0], t[:, -1]]), axis=0)
        drawn = np.abs(t - bg).sum(axis=2) > 36
        labels.append((t.reshape(-1, 3).astype(np.int16), drawn.reshape(-1)))
RGB = np.stack([x[0] for x in labels]); D = np.stack([x[1] for x in labels])
items = meta['items']; codes = meta['codes']
fixed = [i for i, it in enumerate(items) if it is None]
cands = {}
for i, it in enumerate(items):
    if it is not None: cands.setdefault(it[0], []).append(i)

def sims(ci, others):
    same = (D[others] & D[ci] & (np.abs(RGB[others] - RGB[ci]).sum(axis=2) < 60)).sum(axis=1)
    union = (D[others] | D[ci]).sum(axis=1)
    return same / np.maximum(union, 1)

# Pictures can only share pixels in the same colour when they share the frame hue or the fill hue
# (see colors() in lib/illus.mjs), so each candidate is compared with those, plus the category pictures.
# Hues on one 16-step circle: frame hues on even steps, fill hues on odd steps.
HF = np.array([-9 if it is None else (it[1] % 8) * 2 for it in items]); HC = np.array([-9 if it is None else ((it[1] // 8) % 8) * 2 + 1 for it in items])
near = lambda x, y: (np.abs((x - y + 8) % 16 - 8) <= 1)
FIX = np.array(fixed, dtype=int)
def rivals(ci, others):
    o = others[near(HF[others], HF[ci]) | near(HC[others], HC[ci]) | near(HF[others], HC[ci]) | near(HC[others], HF[ci]) | (HF[others] < 0)]
    return o
order = list(cands.keys())
pick = {si: cands[si][0] for si in order}
for rnd in range(rounds):
    for n, si in enumerate(order):
        others = np.array(fixed + [pick[o] for o in order if o != si and (rnd > 0 or o < si)], dtype=int)
        best = None
        for ci in cands[si]:
            o = rivals(ci, others) if len(others) else others
            s = sims(ci, o) if len(o) else np.zeros(1)
            score = (round(float(s.max()), 3), float(s.mean()))
            if best is None or score < best[0]: best = (score, ci)
        pick[si] = best[1]
    allp = np.array(fixed + [pick[s] for s in order])
    worst = 0; over = 0
    for k, c in enumerate(allp):
        s = sims(c, allp[k + 1:]) if k + 1 < len(allp) else np.zeros(1)
        worst = max(worst, float(s.max())); over += int((s > 0.10).sum())
    print(f"round {rnd + 1}: worst pair {worst:.1%}, pairs over 10%: {over}", flush=True)
    if over == 0: break
json.dump({codes[si]: items[pick[si]][1] for si in order}, open(out, 'w'), indent=0)
print('written', out)
