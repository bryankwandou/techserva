// Live check of api/visit.js and the admin "visits" report against Neon. Removes its own test rows.
// Usage: node --env-file=.env.neon scripts/check_views.mjs
import { Readable } from 'node:stream';
import { q, ensure } from '../lib/db.mjs';
import visit from '../api/visit.js';

await q('drop table if exists visits');
await ensure();
const send = (host, body, ua = 'Mozilla/5.0') => new Promise(done => {
  const req = Readable.from([JSON.stringify(body)]);
  Object.assign(req, { method: 'POST', headers: { host, 'user-agent': ua, 'x-vercel-ip-country': 'ID', 'content-type': 'application/json' } });
  const res = { setHeader() {}, status(c) { this.c = c; return this; }, end() { done(this.c); }, json() { done(this.c); } };
  visit(req, res);
});
const tag = '/__check__/' + Date.now();
await send('techserva.web.id', { kind: 'view', path: tag, vid: 'a' });
await send('techserva.web.id', { kind: 'view', path: tag, vid: 'a', from: 'my' });
await send('techserva.vercel.app', { kind: 'view', path: tag, vid: 'b' });
await send('techserva.vercel.app', { kind: 'wa', path: tag, vid: 'b', detail: 'contact/number' });
await send('techserva.web.id', { kind: 'view', path: tag, vid: 'c' }, 'Googlebot/2.1');
const rows = await q('select kind, source, country, detail, length(vid) as vl from views where path = $1 order by id', [tag]);
console.log(rows);
const ok = rows.length === 4 && rows[0].source === 'web.id' && rows[1].source === 'my.id' && rows[2].source === 'vercel.app' && rows[3].kind === 'wa' && rows[3].detail === 'contact/number';
await q('delete from views where path = $1', [tag]);
console.log(ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
