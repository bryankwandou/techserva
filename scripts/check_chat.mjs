// Runs the assistant's own suggestion chips (and a few typed questions) in every language
// against the real index and reports which ones the assistant cannot answer.
// Usage: node scripts/check_chat.mjs [codes...]
import fs from 'node:fs';
import path from 'node:path';
import { buildIndex, search } from '../src/rag.mjs';
import { ui } from '../data/copy.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const kb = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/assets/kb.json'), 'utf8'));
const langs = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/assets/langs.json'), 'utf8')).map(l => l.code);
const only = process.argv.slice(2);
const load = code => {
  if (code === 'en') return {};
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/i18n', `${code}.json`), 'utf8'));
  const f = path.join(ROOT, 'data/i18n-fix', `${code}.json`);
  if (fs.existsSync(f)) Object.assign(d, JSON.parse(fs.readFileSync(f, 'utf8')));
  return d;
};
// What each chip must find: a word that has to appear in the top answer's English title or text.
const EXPECT = { chip_1: /landing/i, chip_2: /penetration|pen test|security/i, chip_3: /USDT/, chip_4: /revision/i };
const extra = { id: ['saya butuh website toko online', 'berapa harga bot whatsapp', 'bisa bayar pakai usdc?', 'jasa bikin game'] };

let fails = 0; let total = 0; const bad = {};
for (const code of langs.filter(c => !only.length || only.includes(c))) {
  const dict = load(code); const t = s => dict[s] || s;
  const index = buildIndex(kb.map(d => ({ ...d, titleEn: d.title, textEn: d.text, title: t(d.title), text: t(d.text) })));
  const ask = (q, re) => {
    total++;
    const top = search(index, q, 3)[0];
    const ok = top && top.score >= 2.2 && top.coverage >= 0.34 && (!re || re.test(top.doc.textEn + ' ' + top.doc.titleEn));
    if (!ok) { fails++; (bad[code] ||= []).push(`${q} -> ${top ? top.doc.titleEn + ' ' + top.score.toFixed(1) + '/' + top.coverage.toFixed(2) : 'none'}`); }
  };
  for (const [k, re] of Object.entries(EXPECT)) ask(ui[k], re);
  for (const q of extra[code] || []) ask(q);
}
console.log('asked', total, 'failed', fails);
for (const [c, l] of Object.entries(bad).slice(0, 40)) console.log(c, '|', l.join(' || '));
