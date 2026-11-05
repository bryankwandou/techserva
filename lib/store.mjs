// Request storage. Each request is AES-256-GCM encrypted before it leaves the function,
// so the blob store only ever holds ciphertext.
import crypto from 'node:crypto';

const keyFrom = secret => crypto.createHash('sha256').update(String(secret)).digest();

export function encrypt(obj, secret) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', keyFrom(secret), iv);
  const data = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), data]).toString('base64');
}
export function decrypt(b64, secret) {
  const raw = Buffer.from(b64, 'base64');
  const d = crypto.createDecipheriv('aes-256-gcm', keyFrom(secret), raw.subarray(0, 12));
  d.setAuthTag(raw.subarray(12, 28));
  return JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8'));
}
export const sign = (value, secret) => crypto.createHmac('sha256', String(secret)).update(value).digest('base64url');
export function safeEqual(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}
export function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((ok, no) => {
    let s = '';
    req.on('data', d => { s += d; if (s.length > 20000) { no(new Error('too large')); req.destroy(); } });
    req.on('end', () => { try { ok(s ? JSON.parse(s) : {}); } catch { ok({}); } });
    req.on('error', no);
  });
}
