// Admin sign-in on Neon: username and password, Google, account requests, forgotten passwords.
// New accounts stay "pending" until the master account approves them.
import { q, ensure, configured, hashPassword, checkPassword, token, sha } from '../lib/db.mjs';
import { startSession, current, endSession, tooMany, fail, clearFails, audit, ipOf, readCookie, setCookie } from '../lib/auth.mjs';
import { readBody } from '../lib/store.mjs';

const USER_RE = /^[A-Za-z0-9_.-]{3,32}$/;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const clean = (v, n) => String(v ?? '').trim().slice(0, n);
const google = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const origin = req => `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
const back = (res, hash) => { res.statusCode = 302; res.setHeader('location', `/admin/#${hash}`); res.end(); };

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-robots-tag', 'noindex');
  if (!configured()) return res.status(503).json({ error: 'Database belum tersambung.' });
  await ensure();
  const url = new URL(req.url, 'http://x');
  const action = url.searchParams.get('action') || '';
  const post = req.method === 'POST';
  const b = post ? await readBody(req).catch(() => ({})) : {};
  const ip = ipOf(req);

  if (action === 'config') return res.status(200).json({ google: google() });

  if (action === 'me') {
    const me = await current(req);
    return me ? res.status(200).json({ me }) : res.status(401).json({ error: 'Belum masuk' });
  }

  if (action === 'login' && post) {
    const user = clean(b.user, 190);
    const key = `login:${ip}`;
    if (await tooMany(key)) return res.status(429).json({ error: 'Terlalu banyak percobaan. Tunggu 15 menit.' });
    const [a] = await q(`select id, pass_hash, status from admins where lower(username) = lower($1) or lower(email) = lower($1)`, [user]);
    const ok = checkPassword(b.pass || '', a?.pass_hash);
    if (!a || !ok) { await fail(key); return res.status(401).json({ error: 'Username atau password salah' }); }
    if (a.status === 'pending') return res.status(403).json({ error: 'Akun ini menunggu persetujuan akun master.' });
    if (a.status !== 'active') return res.status(403).json({ error: 'Akun ini dinonaktifkan.' });
    await clearFails(key);
    await startSession(req, res, a);
    await audit(a.id, 'login', ip);
    return res.status(200).json({ ok: true });
  }

  if (action === 'logout') { await endSession(req, res); return res.status(200).json({ ok: true }); }

  if (action === 'register' && post) {
    const username = clean(b.username, 32); const email = clean(b.email, 190).toLowerCase(); const pass = String(b.pass || '');
    if (await tooMany(`register:${ip}`, 5, 3600)) return res.status(429).json({ error: 'Terlalu banyak permintaan. Coba lagi satu jam lagi.' });
    if (!USER_RE.test(username)) return res.status(400).json({ error: 'Username: 3 sampai 32 huruf, angka, titik, strip, atau garis bawah.' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Masukkan alamat email yang benar.' });
    if (pass.length < 8) return res.status(400).json({ error: 'Password minimal 8 karakter.' });
    const taken = await q(`select 1 from admins where lower(username) = lower($1) or lower(email) = $2`, [username, email]);
    if (taken.length) return res.status(409).json({ error: 'Username atau email itu sudah terdaftar.' });
    await fail(`register:${ip}`);
    const [r] = await q(`insert into admins (username, email, pass_hash, role, status, note) values ($1, $2, $3, 'admin', 'pending', $4) returning id`,
      [username, email, hashPassword(pass), clean(b.note, 300)]);
    await audit(r.id, 'register', ip);
    return res.status(200).json({ ok: true });
  }

  if (action === 'forgot' && post) {
    const who = clean(b.user, 190);
    if (await tooMany(`forgot:${ip}`, 5, 3600)) return res.status(429).json({ error: 'Terlalu banyak permintaan. Coba lagi satu jam lagi.' });
    await fail(`forgot:${ip}`);
    const [a] = await q(`select id from admins where (lower(username) = lower($1) or lower(email) = lower($1)) and status <> 'disabled'`, [who]);
    // Same answer whether or not the account exists.
    if (a) {
      const open = await q(`select 1 from reset_requests where admin_id = $1 and not handled`, [a.id]);
      if (!open.length) await q(`insert into reset_requests (admin_id) values ($1)`, [a.id]);
      await audit(a.id, 'forgot', ip);
    }
    return res.status(200).json({ ok: true });
  }

  if (action === 'reset' && post) {
    const pass = String(b.pass || '');
    if (pass.length < 8) return res.status(400).json({ error: 'Password minimal 8 karakter.' });
    const [r] = await q(`select admin_id from resets where token_hash = $1 and not used and expires_at > now()`, [sha(b.token || '')]);
    if (!r) return res.status(400).json({ error: 'Link reset ini tidak berlaku atau sudah kedaluwarsa.' });
    await q(`update resets set used = true where token_hash = $1`, [sha(b.token)]);
    await q(`update admins set pass_hash = $1 where id = $2`, [hashPassword(pass), r.admin_id]);
    await q(`delete from sessions where admin_id = $1`, [r.admin_id]);
    await q(`update reset_requests set handled = true where admin_id = $1`, [r.admin_id]);
    await audit(r.admin_id, 'reset', ip);
    return res.status(200).json({ ok: true });
  }

  if (action === 'google') {
    if (!google()) return back(res, 'login=google-off');
    const state = token();
    setCookie(res, 'ts_oauth', state, 600);
    const p = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: `${origin(req)}/api/auth?action=google-cb`, response_type: 'code', scope: 'openid email', state, prompt: 'select_account' });
    res.statusCode = 302; res.setHeader('location', `https://accounts.google.com/o/oauth2/v2/auth?${p}`); return res.end();
  }

  if (action === 'google-cb') {
    const state = url.searchParams.get('state') || ''; const code = url.searchParams.get('code') || '';
    const saved = readCookie(req, 'ts_oauth'); setCookie(res, 'ts_oauth', '', 0);
    if (!google() || !code || !saved || saved !== state) return back(res, 'login=google-failed');
    const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: `${origin(req)}/api/auth?action=google-cb`, grant_type: 'authorization_code' }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.id_token) return back(res, 'login=google-failed');
    // The token came straight from Google over TLS, so its payload can be read without a signature check.
    const claims = JSON.parse(Buffer.from(j.id_token.split('.')[1], 'base64url').toString('utf8'));
    if (claims.aud !== process.env.GOOGLE_CLIENT_ID || !claims.email_verified || !claims.email) return back(res, 'login=google-failed');
    const email = String(claims.email).toLowerCase();
    let [a] = await q(`select id, status, google_sub from admins where google_sub = $1 or lower(email) = $2 order by coalesce(google_sub = $1, false) desc limit 1`, [claims.sub, email]);
    if (!a) {
      const base = email.split('@')[0].replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 24) || 'user';
      const [n] = await q(`insert into admins (username, email, role, status, google_sub, note) values ($1, $2, 'admin', 'pending', $3, 'Google sign-in') returning id`, [`${base}-${claims.sub.slice(-4)}`, email, claims.sub]);
      await audit(n.id, 'register-google', ip);
      return back(res, 'login=pending');
    }
    if (!a.google_sub) await q(`update admins set google_sub = $1 where id = $2`, [claims.sub, a.id]);
    if (a.status === 'pending') return back(res, 'login=pending');
    if (a.status !== 'active') return back(res, 'login=disabled');
    await startSession(req, res, a);
    await audit(a.id, 'login-google', ip);
    return back(res, '');
  }

  return res.status(404).json({ error: 'Aksi tidak dikenal' });
}
