// Admin sessions on Neon. The cookie holds a random token; the database holds only its hash.
import { q, ensure, token, sha } from './db.mjs';

export const COOKIE = 'ts_admin';
export const TTL = 12 * 3600;
const cookies = req => Object.fromEntries(String(req.headers.cookie || '').split(/;\s*/).filter(Boolean).map(c => { const i = c.indexOf('='); return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))]; }));
export const readCookie = (req, name) => cookies(req)[name] || '';
export const ipOf = req => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
export const setCookie = (res, name, value, maxAge) => {
  const prev = res.getHeader('set-cookie'); const list = prev ? [].concat(prev) : [];
  list.push(`${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`);
  res.setHeader('set-cookie', list);
};

export async function startSession(req, res, admin) {
  const t = token();
  await q(`insert into sessions (token_hash, admin_id, expires_at, ip, ua) values ($1, $2, now() + make_interval(secs => $3), $4, $5)`,
    [sha(t), admin.id, TTL, ipOf(req), String(req.headers['user-agent'] || '').slice(0, 200)]);
  await q(`update admins set last_login = now() where id = $1`, [admin.id]);
  await q(`delete from sessions where expires_at < now()`);
  setCookie(res, COOKIE, t, TTL);
}

export async function current(req) {
  const t = readCookie(req, COOKIE);
  if (!t) return null;
  await ensure();
  const [a] = await q(`select a.id, a.username, a.email, a.role, a.status, a.google_sub is not null as google
    from sessions s join admins a on a.id = s.admin_id where s.token_hash = $1 and s.expires_at > now()`, [sha(t)]);
  return a && a.status === 'active' ? a : null;
}

export async function endSession(req, res) {
  const t = readCookie(req, COOKIE);
  if (t) await q(`delete from sessions where token_hash = $1`, [sha(t)]);
  setCookie(res, COOKIE, '', 0);
}

// Counts failures per key in Neon, so the limit holds across function instances.
export async function tooMany(key, limit = 6, windowSec = 900) {
  const [r] = await q(`select n, extract(epoch from now() - at) as age from attempts where key = $1`, [key]);
  return !!(r && r.n >= limit && r.age < windowSec);
}
export const fail = key => q(`insert into attempts (key, n, at) values ($1, 1, now())
  on conflict (key) do update set n = case when extract(epoch from now() - attempts.at) > 900 then 1 else attempts.n + 1 end, at = now()`, [key]);
export const clearFails = key => q(`delete from attempts where key = $1`, [key]);
export const audit = (id, action, detail = '') => q(`insert into audit (admin_id, action, detail) values ($1, $2, $3)`, [id, action, String(detail).slice(0, 300)]);
