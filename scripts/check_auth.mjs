// End-to-end check of admin accounts on the real Neon database, without a server: calls the API handlers
// with mock requests. Creates a throwaway account and removes it at the end.
// Usage: MASTER_USER=... MASTER_PASS=... node --env-file=.env.neon scripts/check_auth.mjs
import { Readable } from 'node:stream';
import auth from '../api/auth.js';
import admin from '../api/admin.js';
import { q } from '../lib/db.mjs';

process.env.ADMIN_SECRET ||= 'local-check';
let jar = {};
async function call(handler, path, body, cookies = jar) {
  const req = Readable.from(body ? [JSON.stringify(body)] : []);
  Object.assign(req, { url: path, method: body ? 'POST' : 'GET', headers: { host: 'localhost', 'x-forwarded-for': '10.9.8.7', cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ') } });
  const res = { code: 200, headers: {}, body: null,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, getHeader(k) { return this.headers[k.toLowerCase()]; },
    status(c) { this.code = c; return this; }, json(o) { this.body = o; return this; }, end() { return this; }, set statusCode(c) { this.code = c; }, get statusCode() { return this.code; } };
  await handler(req, res);
  for (const c of [].concat(res.headers['set-cookie'] || [])) { const [kv] = c.split(';'); const i = kv.indexOf('='); cookies[kv.slice(0, i)] = kv.slice(i + 1); }
  return res;
}
const ok = (cond, label) => { console.log(cond ? 'PASS' : 'FAIL', label); if (!cond) process.exitCode = 1; };
const U = `check${Date.now().toString(36)}`;
await q(`delete from attempts where key like '%10.9.8.7%'`);

let r = await call(auth, '/api/auth?action=login', { user: process.env.MASTER_USER, pass: 'wrong-password' });
ok(r.code === 401, 'wrong master password is refused');
r = await call(auth, '/api/auth?action=login', { user: process.env.MASTER_USER, pass: process.env.MASTER_PASS });
ok(r.code === 200 && jar.ts_admin, 'master signs in, session cookie set');
const master = { ...jar };
r = await call(admin, '/api/admin?action=meta');
ok(r.code === 200 && r.body.me.role === 'master', 'session reads back as master');

jar = {};
r = await call(auth, '/api/auth?action=register', { username: U, email: `${U}@example.com`, pass: 'first-pass-123', note: 'check' });
ok(r.code === 200, 'visitor requests an account');
r = await call(auth, '/api/auth?action=login', { user: U, pass: 'first-pass-123' });
ok(r.code === 403, 'pending account cannot sign in');

const [row] = await q(`select id from admins where username = $1`, [U]);
jar = { ...master };
r = await call(admin, '/api/admin?action=approve', { id: row.id });
ok(r.code === 200, 'master approves it');
jar = {};
r = await call(auth, '/api/auth?action=login', { user: U, pass: 'first-pass-123' });
ok(r.code === 200, 'approved account signs in');
r = await call(admin, '/api/admin?action=accounts');
ok(r.code === 403, 'normal admin cannot open account management');
r = await call(admin, '/api/admin?action=create', { username: `${U}x`, pass: 'xxxxxxxxxx' });
ok(r.code === 403, 'normal admin cannot create accounts');

jar = {};
r = await call(auth, '/api/auth?action=forgot', { user: `${U}@example.com` });
ok(r.code === 200, 'forgot password request accepted');
jar = { ...master };
r = await call(admin, '/api/admin?action=accounts');
ok(r.body.accounts.some(a => a.username === U && a.wants_reset), 'master sees the reset request');
r = await call(admin, '/api/admin?action=reset-link', { id: row.id });
const tok = (r.body.link || '').split('#reset=')[1];
ok(!!tok, 'master makes a one-time reset link');
jar = {};
r = await call(auth, '/api/auth?action=reset', { token: tok, pass: 'second-pass-456' });
ok(r.code === 200, 'reset link sets a new password');
r = await call(auth, '/api/auth?action=reset', { token: tok, pass: 'third-pass-789' });
ok(r.code === 400, 'reset link works only once');
r = await call(auth, '/api/auth?action=login', { user: U, pass: 'second-pass-456' });
ok(r.code === 200, 'new password signs in');
r = await call(auth, '/api/auth?action=logout');
r = await call(admin, '/api/admin?action=meta');
ok(r.code === 401, 'after sign out the session is gone');

jar = { ...master };
r = await call(admin, '/api/admin?action=delete', { id: 1 });
ok(r.code === 400, 'master account cannot be deleted');
r = await call(admin, '/api/admin?action=delete', { id: row.id });
ok(r.code === 200, 'throwaway account deleted');
r = await call(auth, '/api/auth?action=google');
ok(r.code === 302, `google button answers (${process.env.GOOGLE_CLIENT_ID ? 'configured' : 'not configured yet'})`);
await call(auth, '/api/auth?action=logout');
await q(`delete from attempts where key like '%10.9.8.7%'`);
