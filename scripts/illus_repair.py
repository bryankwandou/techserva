"""Gives each service a picture variant so that no two catalog pictures share more than 10% of their
drawn shapes in the same colour (the measure of scripts/illus_similarity.py, at full size).
Repeats: find every pair over the limit, re-draw one picture of each pair with fresh variants, keep the
variant whose worst similarity to all other pictures is lowest. Writes data/illus-variants.json.
Usage: python scripts/illus_repair.py [rounds] [tries]"""
import sys, json, os, random, subprocess
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(ROOT, 'docs', 'proof', 'tmp', 'repair'); os.makedirs(TMP, exist_ok=True)
OUT = os.path.join(ROOT, 'data', 'illus-variants.json')
rounds = int(sys.argv[1]) if len(sys.argv) > 1 else 12; tries = int(sys.argv[2]) if len(sys.argv) > 2 else 40
LIMIT = 0.10; W, H, COLS = 240, 120, 20
meta = json.loads(subprocess.check_output(['node', '-e', "import('./data/services.mjs').then(m=>console.log(JSON.stringify({s:m.services.map(x=>[x.code,x.slug]),c:m.categories.map(c=>c.id)})))"], cwd=ROOT))
codes = [c for c, _ in meta['s']]; cats = ['cat:' + c for c in meta['c']]
VARIANTS = int(subprocess.check_output(['node', '-e', "import('./lib/illus.mjs').then(m=>console.log(m.VARIANTS))"], cwd=ROOT))
rng = random.Random(11)
chosen = json.load(open(OUT)) if os.path.exists(OUT) else {}
for c in codes: chosen.setdefault(c, rng.randrange(VARIANTS))

def render(items):
    lf = os.path.join(TMP, 'list.json'); pf = os.path.join(TMP, 'sheet.png')
    json.dump(items, open(lf, 'w'))
    subprocess.check_call(['node', 'scripts/illus-render.mjs', lf, pf], cwd=ROOT)
    img = np.asarray(Image.open(pf).convert('RGB')).astype(np.int16)
    out = []
    for i in range(len(items)):
        r, c = divmod(i, COLS)
        t = img[r * H:(r + 1) * H, c * W:(c + 1) * W]
        bg = np.median(np.concatenate([t[0], t[-1], t[:, 0], t[:, -1]]), axis=0)
        out.append((t.reshape(-1, 3), (np.abs(t - bg).sum(axis=2) > 36).reshape(-1)))
    return out

def sim_many(a, RGB, M):
    ra, ma = a
    same = (M & ma & (np.abs(RGB - ra).sum(axis=2) < 60)).sum(axis=1)
    return same / np.maximum((M | ma).sum(axis=1), 1)

names = cats + codes
tiles = render([[n, None] for n in cats] + [[c, chosen[c]] for c in codes])
RGB = np.stack([t[0] for t in tiles]); M = np.stack([t[1] for t in tiles])
for rnd in range(rounds):
    bad = []
    for i in range(len(names)):
        s = sim_many((RGB[i], M[i]), RGB[i + 1:], M[i + 1:])
        for j in np.nonzero(s > LIMIT)[0]: bad.append((float(s[j]), i, i + 1 + int(j)))
    print(f"round {rnd + 1}: pairs over 10%: {len(bad)}, worst {max([b[0] for b in bad], default=0):.1%}", flush=True)
    json.dump({c: chosen[c] for c in codes}, open(OUT, 'w'), indent=0)
    if not bad: break
    # Re-draw the service that appears in the most bad pairs first; category pictures stay as they are.
    count = {}
    for _, i, j in bad:
        for k in (i, j):
            if k >= len(cats): count[k] = count.get(k, 0) + 1
    todo = sorted(count, key=lambda k: -count[k])
    fixed_now = set()
    for k in todo:
        if any((i == k and j in fixed_now) or (j == k and i in fixed_now) for _, i, j in bad) and k not in count: continue
        code = names[k]
        vs = rng.sample(range(VARIANTS), tries)
        cand = render([[code, v] for v in vs])
        mask = np.ones(len(names), bool); mask[k] = False
        best = None
        for v, t in zip(vs, cand):
            s = sim_many(t, RGB[mask], M[mask]); score = (float(s.max()), float(s.mean()))
            if best is None or score < best[0]: best = (score, v, t)
        chosen[code] = best[1]; RGB[k] = best[2][0]; M[k] = best[2][1]; fixed_now.add(k)
json.dump({c: chosen[c] for c in codes}, open(OUT, 'w'), indent=0)
print('written', OUT)
