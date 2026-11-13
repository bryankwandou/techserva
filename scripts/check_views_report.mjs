// Runs the admin "visits" report SQL (api/admin.js) against Neon to make sure every query is valid.
import fs from 'node:fs';
import { q } from '../lib/db.mjs';
const src = fs.readFileSync(new URL('../api/admin.js', import.meta.url), 'utf8');
const block = src.slice(src.indexOf("if (action === 'visits')"), src.indexOf('/* own account */'));
const days = 7, since = `now() - make_interval(days => ${days})`;
const sqls = [...block.matchAll(/q\(`([\s\S]*?)`\)/g)].map(m => m[1].replace(/\$\{since\}/g, since).replace(/\$\{days - 1\}/g, days - 1).replace(/\$\{days\}/g, days));
for (const s of sqls) { const r = await q(s); console.log(r.length, 'rows'); }
console.log('PASS', sqls.length, 'queries');
