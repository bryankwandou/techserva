// Receives a service request from the public order form.
import crypto from 'node:crypto';
import { put } from '@vercel/blob';
import { encrypt, readBody } from '../lib/store.mjs';
import { services } from '../data/services.mjs';

const hits = new Map();
function limited(ip) {
  const now = Date.now(); const list = (hits.get(ip) || []).filter(t => now - t < 3600000);
  list.push(now); hits.set(ip, list);
  return list.length > 8;
}
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, n);

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'Too many requests' });
  let b;
  try { b = await readBody(req); } catch { return res.status(413).json({ error: 'Too large' }); }
  const reference = `TS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  if (b.website) return res.status(200).json({ reference }); // honeypot: pretend success
  const lead = { reference, service: clean(b.service, 12), name: clean(b.name, 120), contact: clean(b.contact, 160), brief: clean(b.brief, 3000), lang: clean(b.lang, 12), at: new Date().toISOString() };
  if (!services.some(s => s.code === lead.service) || !lead.name || !lead.contact || !lead.brief || !b.agree) return res.status(400).json({ error: 'Missing fields' });
  const secret = process.env.ADMIN_SECRET;
  if (!secret || !process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Requests are not open yet' });
  try {
    await put(`leads/${reference}.txt`, encrypt(lead, secret), { access: 'public', addRandomSuffix: true, contentType: 'text/plain' });
    return res.status(200).json({ reference });
  } catch {
    return res.status(502).json({ error: 'Could not save the request' });
  }
}
