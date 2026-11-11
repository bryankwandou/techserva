import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { services, categories } from '../data/services.mjs';
import { faq, general, catTerms, ui } from '../data/copy.mjs';
import { template, TOTAL, search as searchT, render, indexOf } from '../lib/templates.mjs';
import { priceIn, usdBase, nice, formatPrice } from '../lib/pricing.mjs';
import { buildIndex, search } from '../src/rag.mjs';
import { encrypt, decrypt, sign, safeEqual } from '../lib/store.mjs';

test('catalog has 500 unique services across 20 categories', () => {
  assert.equal(services.length, 500); assert.equal(categories.length, 20);
  assert.equal(new Set(services.map(s => s.slug)).size, 500);
  assert.equal(new Set(services.map(s => s.name.toLowerCase())).size, 500);
  for (const c of categories) { assert.equal(services.filter(s => s.cat === c.id).length, 25); assert.ok(catTerms[c.id], c.id); }
  assert.ok(services.every(s => s.idr > 0));
});

test('50,000 templates exist with unique ids and no broken text', () => {
  assert.equal(TOTAL, 50000);
  const ids = new Set(); const prompts = new Set();
  for (let i = 0; i < TOTAL; i++) {
    const t = template(i); ids.add(t.id); prompts.add(t.prompt);
    assert.ok(!t.prompt.includes('undefined'));
    assert.ok(t.prompt.includes('{{brief}}'));
  }
  assert.equal(ids.size, 50000); assert.equal(prompts.size, 50000);
  assert.equal(template(50000), null); assert.equal(template(-1), null);
});

test('template search filters and pages correctly', () => {
  assert.equal(searchT({}).total, 50000);
  assert.equal(searchT({ stage: 'qa' }).total, 5000);
  assert.equal(searchT({ q: 'TS-001', stage: 'qa', segment: 'clinic' }).total, 1);
  const a = searchT({ page: 1999, size: 25 }); assert.equal(a.items.length, 25);
  assert.equal(searchT({ page: 2000, size: 25 }).items.length, 0);
  const pick = template(indexOf(0, 1, 2)); assert.equal(pick.id, 'TS-001-framework-retail');
});

test('rendering fills variables and leaves unknown ones visible', () => {
  const out = render('Hi {{client_name}} {{previous_output}} {{deadline}}', { client_name: 'Ana' });
  assert.equal(out, 'Hi Ana (none yet) {{deadline}}');
});

test('pricing', () => {
  assert.equal(nice(156.25), 160); assert.equal(nice(1000), 1000);
  assert.equal(usdBase(500000), 160);
  assert.deepEqual(priceIn(500000, 'IDR', {}), { amount: 500000, currency: 'IDR' });
  assert.deepEqual(priceIn(500000, 'USD', {}), { amount: 160, currency: 'USD' });
  assert.equal(priceIn(500000, 'NOPE', {}).currency, 'USD');
  const eur = priceIn(500000, 'EUR', { EUR: 0.9 }); assert.equal(eur.currency, 'EUR'); assert.equal(eur.amount, 150);
  assert.ok(priceIn(500000, 'INR', { INR: 90 }).amount < 160 * 90);
  assert.ok(formatPrice({ amount: 500000, currency: 'IDR' }, 'id').includes('500'));
  assert.ok(formatPrice({ amount: 160, currency: 'USD' }, 'not-a-locale!').includes('160'));
});

test('each service gets terms that differ by category and state the core rules', () => {
  const text = general.flat().join(' ');
  assert.match(text, /whole invoice must be paid before/);
  assert.match(text, /does not include a domain/);
  assert.match(text, /only in stage 1/);
  assert.match(text, /counts as one new service/);
  assert.match(text, /USDT or USDC/);
  assert.equal(new Set(Object.values(catTerms).map(t => t.rule)).size, 20);
  assert.match(catTerms.security.need, /Written permission/);
});

const kb = [
  ...faq.map(([title, text]) => ({ type: 'faq', title, text })),
  ...general.map(([title, text]) => ({ type: 'terms', title, text })),
  ...services.map(s => ({ type: 'service', cat: s.cat, title: s.name, text: categories.find(c => c.id === s.cat).blurb, slug: s.slug })),
];
const index = buildIndex(kb);
const cases = [
  ['I need a landing page', 'service', /landing page/i],
  ['how much is a penetration test', 'service', /penetration test/i],
  ['web app pen test', 'service', /penetration test/i],
  ['How much is a pen test?', 'service', /penetration test/i],
  ['can I pay with USDT', null, /USDT/],
  ['how many revisions do I get', null, /revisions/i],
  ['is the domain included', null, /domain/i],
  ['refund', null, /refund/i],
  ['discord bot', 'service', /discord/i],
  ['telegram game', 'service', /telegram/i],
  ['build a game in unity', 'service', /unity/i],
  ['pitch deck', 'service', /pitch deck/i],
  ['hosting setup', 'service', /hosting/i],
  ['roast my idea', 'service', /roast/i],
  ['my website was hacked', 'service', /hacked/i],
  ['whatsapp bot', 'service', /whatsapp/i],
  ['saya butuh landing page', 'service', /landing page/i],
  ['berapa harga logo', 'service', /logo design/i],
  ['logo roast', 'service', /logo roast/i],
  ['bisa bayar pakai usdt', null, /USDT/],
  ['rag chatbot', 'service', /rag chatbot/i],
  ['3d website', 'service', /3d/i],
  ['load test', 'service', /load test/i],
  ['who owns the source code', null, /source code|own/i],
];
for (const [q, type, re] of cases) {
  test(`assistant: ${q}`, () => {
    const top = search(index, q, 5)[0];
    assert.ok(top, 'no result');
    if (type) assert.equal(top.doc.type, type, top.doc.title);
    assert.match(`${top.doc.title} ${top.doc.text}`, re, top.doc.title);
  });
}
test('assistant stays quiet on nonsense', () => {
  const top = search(index, 'zzqq xxyy', 3);
  assert.equal(top.length, 0);
});

test('encryption round trip, tamper detection, signing', () => {
  const box = encrypt({ a: 1 }, 'k'); assert.deepEqual(decrypt(box, 'k'), { a: 1 });
  assert.throws(() => decrypt(box, 'other'));
  assert.ok(!Buffer.from(box, 'base64').toString().includes('"a"'));
  assert.ok(safeEqual('x', 'x')); assert.ok(!safeEqual('x', 'y'));
  assert.notEqual(sign('1', 'a'), sign('1', 'b'));
});

test('no banned filler or secrets in source copy', () => {
  const all = JSON.stringify({ ui, faq, general, catTerms });
  for (const w of ['seamless', 'leverage', 'cutting-edge', 'world-class', 'unlock', 'empower', 'revolutionize', 'elevate', '—']) assert.ok(!all.toLowerCase().includes(w), w);
  assert.ok(!/ghp_|vcp_|gsk_|sk-[a-z0-9]{10}/i.test(fs.readFileSync(new URL('../src/site.js', import.meta.url), 'utf8')));
});
