// Site analytics in this site's own Neon database. Counts real page loads (the browser sends them after
// JavaScript runs, so crawlers and prefetches do not count) and WhatsApp button clicks.
// Stored per view: time, page, the address the visitor came in on (web.id, my.id, vercel.app), country,
// and a random visitor id kept in that browser. No IP address is stored.
import { q, ensure, configured, sha } from '../lib/db.mjs';
import { readBody } from '../lib/store.mjs';

const SOURCES = ['web.id', 'my.id', 'vercel.app'];
const clean = (v, n) => String(v ?? '').replace(/[^\w\-./:|]/g, '').slice(0, n);
export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST' || !configured()) return res.status(204).end();
  let b = {};
  try { b = await readBody(req); } catch { return res.status(204).end(); }
  if (/bot|crawl|spider|slurp|preview|lighthouse|headless|prerender/i.test(String(req.headers['user-agent'] || ''))) return res.status(204).end();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  // A visitor sent over from techserva.my.id arrives with ?from=my (see middleware.js).
  const source = b.from === 'my' ? 'my.id' : SOURCES.find(s => host.endsWith(s)) || 'other';
  const country = String(req.headers['x-vercel-ip-country'] || '--').slice(0, 2).toUpperCase();
  const kind = b.kind === 'wa' ? 'wa' : 'view';
  const path = clean(b.path, 160) || '/';
  const vid = b.vid ? sha(`techserva:${clean(b.vid, 64)}`).slice(0, 24) : '';
  try {
    await ensure();
    await q(`insert into views (kind, path, source, country, vid, detail) values ($1, $2, $3, $4, $5, $6)`, [kind, path, source, country, vid, clean(b.detail, 120)]);
  } catch { /* counting must never break the page */ }
  return res.status(204).end();
}
