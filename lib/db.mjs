// Neon Postgres for admin accounts, sessions, password resets and client requests.
import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';

let client = null;
export const configured = () => !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
// q('select ... where id = $1', [id]) returns the rows.
export const q = (text, params = []) => {
  client ||= neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  return client.query(text, params);
};

export const SCHEMA = [
  `create table if not exists admins (
    id serial primary key,
    username text not null,
    email text,
    pass_hash text,
    role text not null default 'admin',
    status text not null default 'pending',
    google_sub text unique,
    note text,
    created_at timestamptz not null default now(),
    approved_by int,
    last_login timestamptz)`,
  `create unique index if not exists admins_username on admins (lower(username))`,
  `create unique index if not exists admins_email on admins (lower(email)) where email is not null`,
  `create unique index if not exists one_master on admins (role) where role = 'master'`,
  `create table if not exists sessions (
    token_hash text primary key,
    admin_id int not null references admins(id) on delete cascade,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    ip text, ua text)`,
  `create table if not exists resets (
    token_hash text primary key,
    admin_id int not null references admins(id) on delete cascade,
    expires_at timestamptz not null,
    used boolean not null default false,
    created_at timestamptz not null default now())`,
  `create table if not exists reset_requests (
    id serial primary key,
    admin_id int not null references admins(id) on delete cascade,
    handled boolean not null default false,
    created_at timestamptz not null default now())`,
  `create table if not exists attempts (
    key text primary key,
    n int not null default 0,
    at timestamptz not null default now())`,
  `create table if not exists leads (
    id serial primary key,
    reference text unique not null,
    data text not null,
    created_at timestamptz not null default now())`,
  `create table if not exists visits (
    day date not null, source text not null, country text not null, n int not null default 0,
    primary key (day, source, country))`,
  `create table if not exists audit (
    id serial primary key,
    admin_id int, action text not null, detail text,
    created_at timestamptz not null default now())`,
];

let ready = null;
export const ensure = () => (ready ||= (async () => { for (const s of SCHEMA) await q(s); })().catch(e => { ready = null; throw e; }));

/* passwords: scrypt, per-user salt */
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const h = crypto.scryptSync(String(pw), salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${h.toString('base64')}`;
}
export function checkPassword(pw, stored) {
  const [kind, s, h] = String(stored || '').split('$');
  if (kind !== 'scrypt' || !s || !h) {
    crypto.scryptSync(String(pw), 'x', 64); // same cost either way
    return false;
  }
  const want = Buffer.from(h, 'base64');
  const got = crypto.scryptSync(String(pw), Buffer.from(s, 'base64'), want.length, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(want, got);
}
export const token = () => crypto.randomBytes(32).toString('base64url');
export const sha = t => crypto.createHash('sha256').update(String(t)).digest('hex');
