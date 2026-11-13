// Counts visits per day, per address the visitor came in on (techserva.web.id, techserva.my.id, vercel.app)
// and per country. No IP address and no cookie is stored: only daily totals.
import { q, ensure, configured } from '../lib/db.mjs';
import { readBody } from '../lib/store.mjs';

const SOURCES = ['web.id', 'my.id', 'vercel.app'];
export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST' || !configured()) return res.status(204).end();
  let b = {};
  try { b = await readBody(req); } catch { return res.status(204).end(); }
  if (/bot|crawl|spider|slurp|preview|lighthouse|headless/i.test(String(req.headers['user-agent'] || ''))) return res.status(204).end();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  // A visitor sent over from techserva.my.id arrives with ?from=my (see middleware.js).
  const source = b.from === 'my' ? 'my.id' : SOURCES.find(s => host.endsWith(s)) || 'other';
  const country = String(req.headers['x-vercel-ip-country'] || '--').slice(0, 2).toUpperCase();
  try {
    await ensure();
    await q(`insert into visits (day, source, country, n) values (current_date, $1, $2, 1)
      on conflict (day, source, country) do update set n = visits.n + 1`, [source, country]);
  } catch { /* counting must never break the page */ }
  return res.status(204).end();
}
