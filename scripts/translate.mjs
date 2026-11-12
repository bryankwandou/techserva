// Machine translates all source copy into every language, with a per-language cache.
// Usage: node scripts/translate.mjs [--probe]
import fs from 'node:fs';
import path from 'node:path';
import { languagePool } from '../data/languages.mjs';
import { categories, services } from '../data/services.mjs';
import { ui, faq, general, catTerms, privacy } from '../data/copy.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, 'data', 'i18n');
fs.mkdirSync(CACHE, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

export function sourceStrings() {
  const s = new Set();
  Object.values(ui).forEach(v => s.add(v));
  faq.flat().forEach(v => s.add(v));
  general.flat().forEach(v => s.add(v));
  privacy.flat().forEach(v => s.add(v));
  categories.forEach(c => { s.add(c.name); s.add(c.blurb); });
  Object.values(catTerms).forEach(t => { s.add(t.need); s.add(t.out); s.add(t.rule); t.scope.forEach(x => s.add(x)); });
  services.forEach(x => s.add(x.name));
  return [...s];
}

// English that machine translation reads literally. The translator gets a clearer wording.
const CLEARER = [
  [/\bRoasts\b/g, 'Critiques'], [/\broasts\b/g, 'critiques'], [/\bRoast\b/g, 'Critique'], [/\broast\b/g, 'critique'],
  [/\bpen test\b/gi, 'penetration test'], [/^Make workflow$/, 'Make.com workflow'], [/^Fractional CTO/, 'Part-time CTO'],
  [/^Fix pack after a test$/, 'Bug fix package after a security test'], [/^Link-in-bio page$/, 'Social media profile link page'],
  [/\b3D hero scene\b/, '3D scene for the top of a homepage'], [/^Animated hero illustration$/, 'Animated illustration for the top of a homepage'],
  [/\bpolish pass\b/, 'polish round'], [/^Micro-interaction pass$/, 'Small interface animations, one round'], [/\btest pass\b/g, 'test round'],
  [/^Prompt library for a team$/, 'Library of AI prompts for a team'], [/^Prompt and chatbot audit$/, 'Audit of AI prompts and a chatbot'], [/^Prompt writing workshop$/, 'Workshop on writing AI prompts'],
  [/^Lead follow-up automation$/, 'Automated follow-up of sales leads'], [/^Staging environment$/, 'Staging environment for testing before release'],
  [/^Launch video$/, 'Product launch video'], [/^Launch post pack$/, 'Product launch social media posts'], [/^Build or buy advice$/, 'Advice on whether to build or buy software'],
  [/^Backup and restore drill$/, 'Backup and restore test run'], [/^Marketplace MVP$/, 'Online marketplace MVP'], [/^Save and login system$/, 'Player login and game save system'],
  [/^Crypto payment checkout app$/, 'Checkout app that takes crypto payments'], [/^Prototype to production rebuild$/, 'Rebuilding a prototype into a production app'],
  [/^Legacy jQuery to React migration$/, 'Migrating old jQuery code to React'], [/^Report by email every week$/, 'Weekly report sent by email'],
  [/^Support ticket classifier$/, 'Automatic sorting of support tickets'], [/^Review summary with AI$/, 'AI summary of customer reviews'],
  [/^Secrets and leaked key scan$/, 'Scan for leaked passwords and API keys'], [/^Human proofreading handoff kit$/, 'Kit for sending translations to human proofreaders'],
  [/human handoff/gi, 'handover to a human agent'], [/\bWeb scraping\b/, 'Web data collection'], [/^Rate limiting and API keys$/, 'Request limits and API keys'],
  [/\bstarter\b/g, 'starter kit'], [/^Full-stack web applications$/, 'Full-stack web application development'],
];
// Product and brand names stay as they are in every language. Each is swapped for a code the
// translator leaves alone (tested: XQ1X survives id, ja, ar, ru, hi, th) and swapped back after.
const BRANDS = ['React Three Fiber', 'React Native', 'Next.js', 'React', 'Vue', 'Svelte', 'Webflow', 'Framer', 'Figma', 'Tailwind', 'jQuery', 'GraphQL',
  'Flutter', 'Discord', 'Slack', 'LINE', 'Stripe', 'Docker Compose', 'Docker', 'Playwright', 'Cypress', 'Looker Studio', 'Metabase', 'Power BI', 'Unity',
  'Godot', 'Blender', 'Lottie', 'Rive', 'Three.js', 'GSAP', 'WhatsApp', 'Instagram', 'Telegram Mini App', 'Telegram', 'Facebook Messenger', 'Microsoft Teams',
  'Zapier', 'n8n', 'Make.com', 'Shopify', 'WooCommerce', 'Google Sheets', 'Google Calendar', 'Google Analytics 4', 'Supabase', 'Firebase', 'Laravel', 'FastAPI',
  'Node.js', 'Vercel', 'Netlify', 'Cloudflare', 'Kubernetes', 'GitHub Actions', 'GitHub', 'Git', 'AWS', 'OpenAPI', 'Hreflang', 'Core Web Vitals', 'Headless CMS',
  'WordPress', 'LinkedIn', 'Python', 'Android', 'iOS', 'HTML5', 'Webhook', 'USDT', 'USDC', 'Techserva'];
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BRAND_RE = new RegExp(`(?<![\\w.])(${BRANDS.map(esc).join('|')})(?![\\w])`, 'g');
export const clearer = s => CLEARER.reduce((t, [a, b]) => t.replace(a, b), s);
export const lock = s => { const used = []; const t = clearer(s).replace(BRAND_RE, m => { used.push(m); return `XQ${used.length}X`; }); return { t, used }; };
export const unlock = (out, used, src) => {
  let r = out;
  for (let i = used.length; i >= 1; i--) { const re = new RegExp(`XQ\\s*${i}\\s*X`, 'i'); if (!re.test(r)) return src; r = r.replace(re, used[i - 1]); }
  return r;
};
// Words Indonesian clients use as they are.
const AFTER = { id: [[/halaman arahan/gi, 'landing page'], [/tes penetrasi/gi, 'pen test']] };
const polish = (code, t) => (AFTER[code] || []).reduce((x, [a, b]) => x.replace(a, b), t);

async function callApi(tl, batch) {
  const locked = batch.map(lock);
  const qs = locked.map(q => 'q=' + encodeURIComponent(q.t)).join('&');
  const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=${encodeURIComponent(tl)}&${qs}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000) });
      if (r.status === 429 || r.status >= 500) { await sleep(3000 * (attempt + 1)); continue; }
      if (!r.ok) throw new Error('status ' + r.status);
      const j = await r.json();
      const arr = j.map(x => (Array.isArray(x) ? x[0] : x));
      if (arr.length !== batch.length) throw new Error('length mismatch');
      return arr.map((x, i) => unlock(x, locked[i].used, batch[i]));
    } catch (e) {
      if (attempt === 5) throw e;
      await sleep(2000 * (attempt + 1));
    }
  }
  throw new Error('gave up');
}

function batches(list, maxEncoded = 5500) {
  const out = []; let cur = []; let size = 0;
  for (const s of list) {
    const n = encodeURIComponent(s).length + 3;
    if (cur.length && size + n > maxEncoded) { out.push(cur); cur = []; size = 0; }
    cur.push(s); size += n;
  }
  if (cur.length) out.push(cur);
  return out;
}

async function probe() {
  const probes = ['Every IT job, on one price list.', 'Pay in full, then receive the finished work.'];
  const ok = [];
  for (const l of languagePool) {
    try {
      const r = await callApi(l.code, probes);
      const changed = r[0] !== probes[0] && r[1] !== probes[1];
      if (changed) ok.push(l.code); else console.log('unchanged', l.code);
    } catch (e) { console.log('fail', l.code, e.message); }
    await sleep(120);
  }
  fs.writeFileSync(path.join(ROOT, 'data', 'langs-ok.json'), JSON.stringify(ok));
  console.log('working', ok.length, 'of', languagePool.length);
}

async function run() {
  const ok = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'langs-ok.json'), 'utf8'));
  const src = sourceStrings();
  console.log('strings', src.length, 'chars', src.join('').length, 'langs', ok.length);
  let idx = 0;
  const worker = async () => {
    while (idx < ok.length) {
      const code = ok[idx++];
      const file = path.join(CACHE, code + '.json');
      const cache = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
      const missing = src.filter(s => !cache[s]);
      try {
        for (const b of batches(missing)) {
          const res = await callApi(code, b);
          b.forEach((s, i) => { cache[s] = polish(code, res[i]); });
          await sleep(150);
        }
        fs.writeFileSync(file, JSON.stringify(cache));
        console.log('done', code, Object.keys(cache).length);
      } catch (e) {
        fs.writeFileSync(file, JSON.stringify(cache));
        console.log('ERR', code, e.message);
      }
    }
  };
  await Promise.all(Array.from({ length: 5 }, worker));
}

// --purge drops every cached translation whose source the clearer wording or the brand lock changes.
function purge() {
  const touched = sourceStrings().filter(s => lock(s).t !== s);
  let n = 0;
  for (const f of fs.readdirSync(CACHE)) {
    const file = path.join(CACHE, f); const c = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const s of touched) if (s in c) { delete c[s]; n++; }
    fs.writeFileSync(file, JSON.stringify(c));
  }
  console.log('purged', touched.length, 'strings,', n, 'entries');
}
if (process.argv.includes('--purge')) purge();
if (process.argv.includes('--probe')) await probe();
else if (process.argv[1]?.endsWith('translate.mjs')) await run();
