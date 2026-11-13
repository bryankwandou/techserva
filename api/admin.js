// Admin API. Every action needs a Neon session (see api/auth.js). Account actions need the master account.
import { list } from '@vercel/blob';
import { decrypt, readBody } from '../lib/store.mjs';
import { q, configured, hashPassword, checkPassword, token, sha } from '../lib/db.mjs';
import { current, audit } from '../lib/auth.mjs';
import { search, template, indexOf, render, STAGES, SEGMENTS, TOTAL } from '../lib/templates.mjs';
import { services, categories } from '../data/services.mjs';

const USER_RE = /^[A-Za-z0-9_.-]{3,32}$/;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const clean = (v, n) => String(v ?? '').trim().slice(0, n);

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-robots-tag', 'noindex');
  if (!configured()) return res.status(503).json({ error: 'Database belum tersambung.' });
  const me = await current(req);
  if (!me) return res.status(401).json({ error: 'Belum masuk' });
  const url = new URL(req.url, 'http://x');
  const action = url.searchParams.get('action') || '';
  const p = Object.fromEntries(url.searchParams);
  const b = req.method === 'POST' ? await readBody(req).catch(() => ({})) : {};
  const secret = process.env.ADMIN_SECRET;

  if (action === 'meta') {
    return res.status(200).json({
      me, total: TOTAL, services: services.map(s => ({ code: s.code, name: s.name, cat: s.cat })),
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
    const s = services.findIndex(x => x.code === b.service);
    const st = STAGES.findIndex(x => x[0] === b.stage);
    const sg = SEGMENTS.findIndex(x => x[0] === b.segment);
    if (s < 0 || st < 0 || sg < 0) return res.status(400).json({ error: 'Unknown service, stage or segment' });
    const t = template(indexOf(s, st, sg));
    return res.status(200).json({ id: t.id, prompt: render(t.prompt, b.vars || {}) });
  }
  if (action === 'leads') {
    const out = [];
    const rows = await q(`select data from leads order by created_at desc limit 500`);
    for (const r of rows) { try { out.push(decrypt(r.data, secret)); } catch { /* wrong key */ } }
    // Requests sent before the move to Neon are still in Blob storage.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { blobs } = await list({ prefix: 'leads/', limit: 200 });
        for (const x of blobs) { try { out.push(decrypt(await (await fetch(x.url)).text(), secret)); } catch { /* skip */ } }
      } catch { /* blob store unavailable */ }
    }
    const seen = new Set();
    return res.status(200).json({ configured: true, leads: out.filter(l => l && !seen.has(l.reference) && seen.add(l.reference)).sort((a, z) => z.at.localeCompare(a.at)) });
  }

  if (action === 'visits') {
    const days = Math.min(365, Math.max(1, +p.days || 30));
    const bySource = await q(`select source, sum(n)::int as n from visits where day > current_date - $1::int group by source order by n desc`, [days]);
    const byDay = await q(`select to_char(day, 'YYYY-MM-DD') as day, source, sum(n)::int as n from visits where day > current_date - $1::int group by day, source order by day desc`, [days]);
    const byCountry = await q(`select country, sum(n)::int as n from visits where day > current_date - $1::int group by country order by n desc limit 15`, [days]);
    return res.status(200).json({ days, bySource, byDay, byCountry });
  }

  /* own account */
  if (action === 'password' && req.method === 'POST') {
    const [a] = await q(`select pass_hash from admins where id = $1`, [me.id]);
    if (a.pass_hash && !checkPassword(b.current || '', a.pass_hash)) return res.status(400).json({ error: 'Password lama salah.' });
    if (String(b.pass || '').length < 8) return res.status(400).json({ error: 'Password minimal 8 karakter.' });
    await q(`update admins set pass_hash = $1 where id = $2`, [hashPassword(b.pass), me.id]);
    await audit(me.id, 'password');
    return res.status(200).json({ ok: true });
  }
  if (action === 'email' && req.method === 'POST') {
    const email = clean(b.email, 190).toLowerCase();
    if (email && !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Masukkan alamat email yang benar.' });
    const taken = email ? await q(`select 1 from admins where lower(email) = $1 and id <> $2`, [email, me.id]) : [];
    if (taken.length) return res.status(409).json({ error: 'Email itu sudah dipakai akun lain.' });
    await q(`update admins set email = $1 where id = $2`, [email || null, me.id]);
    return res.status(200).json({ ok: true });
  }
  if (action === 'unlink-google' && req.method === 'POST') {
    await q(`update admins set google_sub = null where id = $1`, [me.id]);
    return res.status(200).json({ ok: true });
  }
  if (action === 'signout-all' && req.method === 'POST') {
    await q(`delete from sessions where admin_id = $1`, [me.id]);
    return res.status(200).json({ ok: true });
  }

  /* accounts: master only */
  if (['accounts', 'create', 'approve', 'reject', 'disable', 'enable', 'delete', 'reset-link'].includes(action)) {
    if (me.role !== 'master') return res.status(403).json({ error: 'Hanya akun master yang bisa mengelola akun.' });
    const id = +b.id || 0;
    const target = id ? (await q(`select id, role, username from admins where id = $1`, [id]))[0] : null;
    if (action !== 'accounts' && action !== 'create' && (!target || target.role === 'master')) return res.status(400).json({ error: 'Akun itu tidak bisa diubah di sini.' });
    if (action === 'accounts') {
      const accounts = await q(`select id, username, email, role, status, note, google_sub is not null as google, created_at, last_login,
        exists (select 1 from reset_requests r where r.admin_id = admins.id and not r.handled) as wants_reset from admins order by role = 'master' desc, status = 'pending' desc, created_at desc`);
      const log = await q(`select a.action, a.detail, a.created_at, d.username from audit a left join admins d on d.id = a.admin_id order by a.id desc limit 40`);
      return res.status(200).json({ accounts, log });
    }
    if (action === 'create') {
      const username = clean(b.username, 32); const email = clean(b.email, 190).toLowerCase();
      if (!USER_RE.test(username)) return res.status(400).json({ error: 'Username: 3 sampai 32 huruf, angka, titik, strip, atau garis bawah.' });
      if (email && !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Masukkan alamat email yang benar.' });
      if (String(b.pass || '').length < 8) return res.status(400).json({ error: 'Password minimal 8 karakter.' });
      const taken = await q(`select 1 from admins where lower(username) = lower($1) or (lower(email) = $2 and $2 <> '')`, [username, email]);
      if (taken.length) return res.status(409).json({ error: 'Username atau email itu sudah terdaftar.' });
      await q(`insert into admins (username, email, pass_hash, role, status, approved_by) values ($1, $2, $3, 'admin', 'active', $4)`, [username, email || null, hashPassword(b.pass), me.id]);
      await audit(me.id, 'create', username);
      return res.status(200).json({ ok: true });
    }
    if (action === 'approve' || action === 'enable') await q(`update admins set status = 'active', approved_by = $1 where id = $2`, [me.id, id]);
    if (action === 'disable') { await q(`update admins set status = 'disabled' where id = $1`, [id]); await q(`delete from sessions where admin_id = $1`, [id]); }
    if (action === 'reject' || action === 'delete') await q(`delete from admins where id = $1`, [id]);
    if (action === 'reset-link') {
      const t = token();
      await q(`insert into resets (token_hash, admin_id, expires_at) values ($1, $2, now() + interval '2 hours')`, [sha(t), id]);
      await q(`update reset_requests set handled = true where admin_id = $1`, [id]);
      await audit(me.id, 'reset-link', target.username);
      return res.status(200).json({ link: `https://${req.headers['x-forwarded-host'] || req.headers.host}/admin/#reset=${t}`, hours: 2 });
    }
    await audit(me.id, action, target.username);
    return res.status(200).json({ ok: true });
  }
  return res.status(404).json({ error: 'Aksi tidak dikenal' });
}
