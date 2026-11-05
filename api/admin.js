// Admin API. Everything except login needs the signed session cookie.
import { list } from '@vercel/blob';
import { decrypt, sign, safeEqual, readBody } from '../lib/store.mjs';
import { search, template, indexOf, render, STAGES, SEGMENTS, TOTAL } from '../lib/templates.mjs';
import { services, categories } from '../data/services.mjs';

const COOKIE = 'ts_admin'; const TTL = 12 * 3600 * 1000;
const fails = new Map();
const cookieOf = req => (String(req.headers.cookie || '').split(/;\s*/).find(c => c.startsWith(COOKIE + '=')) || '').slice(COOKIE.length + 1);
function authed(req, secret) {
  const [exp, sig] = cookieOf(req).split('.');
  return !!(exp && sig && Number(exp) > Date.now() && safeEqual(sig, sign(exp, secret)));
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-robots-tag', 'noindex');
  const { ADMIN_USER: user, ADMIN_PASS: pass, ADMIN_SECRET: secret } = process.env;
  if (!user || !pass || !secret) return res.status(503).json({ error: 'Admin is not configured' });
  const url = new URL(req.url, 'http://x');
  const action = url.searchParams.get('action') || '';

  if (action === 'login' && req.method === 'POST') {
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x';
    const f = fails.get(ip) || { n: 0, t: 0 };
    if (f.n >= 6 && Date.now() - f.t < 900000) return res.status(429).json({ error: 'Too many attempts. Wait 15 minutes.' });
    const b = await readBody(req);
    if (!(safeEqual(b.user || '', user) && safeEqual(b.pass || '', pass))) {
      fails.set(ip, { n: f.n + 1, t: Date.now() });
      return res.status(401).json({ error: 'Wrong username or password' });
    }
    fails.delete(ip);
    const exp = String(Date.now() + TTL);
    res.setHeader('set-cookie', `${COOKIE}=${exp}.${sign(exp, secret)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${TTL / 1000}`);
    return res.status(200).json({ ok: true });
  }
  if (action === 'logout') {
    res.setHeader('set-cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
    return res.status(200).json({ ok: true });
  }
  if (!authed(req, secret)) return res.status(401).json({ error: 'Not signed in' });

  const p = Object.fromEntries(url.searchParams);
  if (action === 'meta') {
    return res.status(200).json({
      total: TOTAL, services: services.map(s => ({ code: s.code, name: s.name, cat: s.cat })),
      categories: categories.map(c => ({ id: c.id, name: c.name })),
      stages: STAGES.map(s => ({ id: s[0], name: s[1] })), segments: SEGMENTS.map(s => ({ id: s[0], name: s[1] })),
    });
  }
  if (action === 'search') return res.status(200).json(search({ q: p.q, stage: p.stage, segment: p.segment, category: p.category, page: Math.max(0, +p.page || 0), size: Math.min(100, +p.size || 25) }));
  if (action === 'template') {
    const t = template(+p.index);
    return t ? res.status(200).json(t) : res.status(404).json({ error: 'No such template' });
  }
  if (action === 'prompt' && req.method === 'POST') {
    const b = await readBody(req);
    const s = services.findIndex(x => x.code === b.service);
    const st = STAGES.findIndex(x => x[0] === b.stage);
    const sg = SEGMENTS.findIndex(x => x[0] === b.segment);
    if (s < 0 || st < 0 || sg < 0) return res.status(400).json({ error: 'Unknown service, stage or segment' });
    const t = template(indexOf(s, st, sg));
    return res.status(200).json({ id: t.id, prompt: render(t.prompt, b.vars || {}) });
  }
  if (action === 'leads') {
    if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(200).json({ leads: [], configured: false });
    const { blobs } = await list({ prefix: 'leads/', limit: 200 });
    const leads = await Promise.all(blobs.map(async b => {
      try { return decrypt(await (await fetch(b.url)).text(), secret); } catch { return null; }
    }));
    return res.status(200).json({ configured: true, leads: leads.filter(Boolean).sort((a, b) => b.at.localeCompare(a.at)) });
  }
  return res.status(404).json({ error: 'Unknown action' });
}
