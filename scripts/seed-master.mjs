// Creates the tables and the one master account. The password is read from the environment and
// only its scrypt hash is stored. Usage: MASTER_USER=... MASTER_PASS=... node --env-file=.env.neon scripts/seed-master.mjs
import { q, ensure, hashPassword } from '../lib/db.mjs';

const user = process.env.MASTER_USER; const pass = process.env.MASTER_PASS;
if (!user || !pass) { console.error('MASTER_USER and MASTER_PASS are required'); process.exit(1); }
await ensure();
const hash = hashPassword(pass);
const found = await q(`select id from admins where role = 'master' or lower(username) = lower($1)`, [user]);
if (found.length) {
  await q(`update admins set username = $1, pass_hash = $2, role = 'master', status = 'active' where id = $3`, [user, hash, found[0].id]);
  console.log('master updated, id', found[0].id);
} else {
  const [r] = await q(`insert into admins (username, pass_hash, role, status) values ($1, $2, 'master', 'active') returning id`, [user, hash]);
  console.log('master created, id', r.id);
}
const t = await q(`select table_name from information_schema.tables where table_schema = 'public' order by 1`);
console.log('tables', t.map(x => x.table_name).join(' '));
