// Vector illustrations for the catalog: one scene per category, varied per service by colour,
// layout and a label taken from the service itself (a number, a product name or an initial).
// Pure SVG strings, so the PDF keeps them sharp and small.
import fs from 'node:fs';

const PAL = [
  ['#ff5a1f', '#ffd9c7'], ['#e8a317', '#fcebc2'], ['#e0446e', '#f9d3df'], ['#7a62e8', '#e2dcfb'],
  ['#14a37a', '#cdeee3'], ['#2d7fd3', '#d4e6f8'], ['#b4561e', '#f1dccb'], ['#4a8f2a', '#dcecd0'],
];
const INK = '#17170f'; const PAPER = '#fbf8f0';

// Background tint: the light colour pushed further toward paper, without transparency (keeps the PDF small).
const mix = hex => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.4 + 251 * 0.6).toString(16).padStart(2, '0')).join('');
const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

// Short label for the badge. Numbers first (they say the size of the job), then known names.
const NAMES = [
  ['React Three Fiber', 'R3F'], ['React Native', 'RN'], ['Next.js', 'NEXT'], ['React', 'REACT'], ['Vue', 'VUE'], ['Svelte', 'SV'], ['Webflow', 'WF'],
  ['Framer', 'FR'], ['Tailwind', 'TW'], ['jQuery', 'JQ'], ['GraphQL', 'GQL'], ['Flutter', 'FL'], ['Discord', 'DC'], ['Slack', 'SL'], ['LINE', 'LINE'],
  ['Stripe', 'PAY'], ['Docker', 'DKR'], ['Playwright', 'PW'], ['Cypress', 'CY'], ['Looker', 'LS'], ['Metabase', 'MB'], ['Power BI', 'BI'],
  ['Unity', 'U'], ['Godot', 'GD'], ['Blender', 'BL'], ['Lottie', 'LT'], ['Rive', 'RV'], ['Three.js', '3JS'], ['GSAP', 'GSAP'], ['WhatsApp', 'WA'],
  ['Instagram', 'IG'], ['Telegram', 'TG'], ['Messenger', 'FB'], ['Teams', 'MS'], ['Zapier', 'ZAP'], ['n8n', 'N8N'], ['Make', 'MAKE'],
  ['Shopify', 'SHOP'], ['WooCommerce', 'WOO'], ['Google Sheets', 'SHEET'], ['Calendar', 'CAL'], ['Analytics', 'GA4'], ['Supabase', 'SB'],
  ['Firebase', 'FB'], ['Laravel', 'LV'], ['FastAPI', 'PY'], ['Node.js', 'NODE'], ['Vercel', 'VC'], ['Netlify', 'NF'], ['Cloudflare', 'CF'],
  ['Kubernetes', 'K8S'], ['GitHub', 'GH'], ['Git', 'GIT'], ['AWS', 'AWS'], ['OpenAPI', 'API'], ['WordPress', 'WP'], ['LinkedIn', 'CV'],
  ['Figma', 'FIG'], ['HTML', 'HTML'], ['CSS', 'CSS'], ['SEO', 'SEO'], ['WCAG', 'A11Y'], ['PDF', 'PDF'], ['AI', 'AI'], ['3D', '3D'], ['AR', 'AR'],
  ['SaaS', 'SAAS'], ['CRM', 'CRM'], ['MVP', 'MVP'], ['MCP', 'MCP'], ['RAG', 'RAG'], ['ETL', 'ETL'], ['KPI', 'KPI'], ['CI/CD', 'CI'], ['VPS', 'VPS'],
  ['SSL', 'SSL'], ['DNS', 'DNS'], ['DDoS', 'DDOS'], ['MFA', 'MFA'], ['QA', 'QA'], ['UX', 'UX'], ['UI', 'UI'], ['API', 'API'], ['CTO', 'CTO'],
];
export function badge(name) {
  const num = name.match(/(\d[\d,.]*)\s*(languages|pages|screens|slides|icons|levels|assets|endpoints|articles|changes|hours|months|month|seconds|minutes|hour|users|days)?/i);
  for (const [k, b] of NAMES) if (new RegExp(`(^|[^\\w])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\w]|$)`).test(name)) return b;
  if (num) {
    const unit = (num[2] || '').toLowerCase();
    const u = { hours: 'H', hour: 'H', months: 'MO', month: 'MO', seconds: 'S', minutes: 'MIN', days: 'D' }[unit] || '';
    return (num[1].replace(/,\d{3}/g, 'K') + u).slice(0, 5);
  }
  return '';
}

// Building blocks, all in a 240 x 150 box.
const r = (x, y, w, h, f, rx = 3, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}"${extra}/>`;
const line = (x1, y1, x2, y2, s, w = 2, extra = '') => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${s}" stroke-width="${w}" stroke-linecap="round"${extra}/>`;
const circ = (x, y, rr, f, extra = '') => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${f}"${extra}/>`;
const strokeR = (x, y, w, h, s, rx = 4, sw = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${PAPER}" stroke="${s}" stroke-width="${sw}"/>`;
const browser = (x, y, w, h, a) => strokeR(x, y, w, h, INK) + line(x, y + 12, x + w, y + 12, INK) + circ(x + 7, y + 6, 2, a) + circ(x + 14, y + 6, 2, INK) + circ(x + 21, y + 6, 2, INK);
const phone = (x, y, w, h) => strokeR(x, y, w, h, INK, 9) + r(x + w / 2 - 7, y + 5, 14, 3, INK, 1.5);
const lines = (x, y, w, n, c, gap = 7) => Array.from({ length: n }, (_, i) => line(x, y + i * gap, x + w * (i === n - 1 ? 0.6 : 1), y + i * gap, c, 2.4)).join('');

const SCENES = {
  web: (a, b, v) => browser(40, 22, 160, 108, a) + r(52, 44, 136, 30 + v * 6, b) + lines(60, 56, 70, 2, a) + r(52, 84 + v * 6, 40, 26, b) + r(100, 84 + v * 6, 40, 26, b) + r(148, 84 + v * 6, 40, 26, a, 3),
  fullstack: (a, b, v) => browser(26, 26, 120, 86, a) + r(36, 48, 100, 20, b) + lines(38, 80, 80, 3, INK) +
    `<ellipse cx="190" cy="${46 + v * 3}" rx="26" ry="8" fill="${b}" stroke="${INK}" stroke-width="2"/><path d="M164 ${46 + v * 3}v46c0 4 12 8 26 8s26-4 26-8V${46 + v * 3}" fill="${b}" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M164 ${68 + v * 3}c0 4 12 8 26 8s26-4 26-8" fill="none" stroke="${INK}" stroke-width="2"/>` + line(146, 70, 164, 70, a, 3, ' stroke-dasharray="3 4"'),
  frontend: (a, b, v) => browser(36, 20, 168, 112, a) + r(48, 42, 50, 78, b) + r(106, 42, 86, 34, a, 4) + r(106, 84, 40, 36, b) + r(152, 84, 40, 36, b) + circ(73, 60 + v * 4, 10, PAPER) + lines(58, 84, 30, 3, INK),
  backend: (a, b, v) => [0, 1, 2].map(i => strokeR(30, 26 + i * 34, 96, 26, INK) + circ(44, 39 + i * 34, 4, i === v % 3 ? a : b) + lines(56, 39 + i * 34, 52, 1, INK)).join('') +
    `<text x="178" y="92" font-family="Consolas,monospace" font-size="54" font-weight="700" fill="${a}" text-anchor="middle">{ }</text>`,
  i18n: (a, b, v) => circ(98, 76, 48, b, ` stroke="${INK}" stroke-width="2"`) + `<ellipse cx="98" cy="76" rx="20" ry="48" fill="none" stroke="${INK}" stroke-width="2"/>` + line(50, 76, 146, 76, INK) + line(56, 52, 140, 52, INK, 1.5) + line(56, 100, 140, 100, INK, 1.5) +
    [['A', 168, 40], ['文', 196, 70], ['ع', 168, 104]].map(([t, x, y], i) => r(x - 16, y - 18, 32, 28, i === v % 3 ? a : PAPER, 6, ` stroke="${INK}" stroke-width="2"`) + `<text x="${x}" y="${y + 2}" font-size="17" font-weight="600" text-anchor="middle" fill="${INK}">${t}</text>`).join(''),
  design: (a, b, v) => strokeR(34, 24, 124, 100, INK) + r(46, 36, 100, 44, b) + circ(96, 58, 14 + v * 2, a) + lines(46, 94, 90, 3, INK) +
    [a, b, INK, PAPER].map((c, i) => r(176, 26 + i * 26, 30, 20, c, 4, ` stroke="${INK}" stroke-width="2"`)).join('') + `<path d="M150 132l18-40 10 6-18 38z" fill="${a}" stroke="${INK}" stroke-width="2"/>`,
  motion: (a, b, v) => `<path d="M120 26l46 24v52l-46 24-46-24V50z" fill="${b}" stroke="${INK}" stroke-width="2"/><path d="M120 74l46-24M120 74l-46-24M120 74v52" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M20 ${118 - v * 4}C60 ${70 - v * 4} 40 30 74 40" fill="none" stroke="${a}" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/><path d="M220 30c-30 20-20 60-50 80" fill="none" stroke="${a}" stroke-width="3" stroke-linecap="round"/>` + circ(220, 30, 6, a),
  mobile: (a, b, v) => phone(56, 14, 62, 122) + r(64, 30, 46, 40, b) + lines(66, 80, 40, 3, INK) + r(64, 106, 46, 16, a, 5) + phone(132, 30, 54, 106) + r(140, 46, 38, 22, a) + r(140, 74, 38, 22, b) + r(140, 102, 38, 22, b),
  game: (a, b, v) => `<path d="M52 66c0-16 12-24 30-24h76c18 0 30 8 30 24l12 44c3 14-14 22-24 10l-14-16H78l-14 16c-10 12-27 4-24-10z" fill="${b}" stroke="${INK}" stroke-width="2.4"/>` +
    r(76, 64, 8, 24, INK, 2) + r(68, 72, 24, 8, INK, 2) + circ(160, 66, 6, a) + circ(174, 80, 6, a) + circ(146, 80, 6, INK) + circ(160, 94, 6, INK) + [0, 1, 2].map(i => `<path d="M${108 + i * 12} ${28 - v}l4 8 9 1-6 6 2 9-9-4-8 4 2-9-6-6 9-1z" fill="${a}"/>`).join(''),
  ai: (a, b, v) => strokeR(70, 30, 100, 92, INK, 14) + circ(100, 70, 9, a) + circ(140, 70, 9, a) + line(98, 98, 142, 98, INK, 3) + line(120, 14, 120, 30, INK) + circ(120, 12, 5, a) +
    [0, 1, 2, 3].map(i => line(70, 50 + i * 14, 56, 50 + i * 14, INK) + line(170, 50 + i * 14, 184, 50 + i * 14, INK)).join('') + `<path d="M204 ${30 + v * 3}l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="${a}"/>`,
  chat: (a, b, v) => `<path d="M30 34h110a10 10 0 0 1 10 10v34a10 10 0 0 1-10 10H70l-22 16V88H30a10 10 0 0 1-10-10V44a10 10 0 0 1 10-10z" fill="${b}" stroke="${INK}" stroke-width="2"/>` + lines(36, 52, 92, 3, INK, 9) +
    `<path d="M210 70H110a10 10 0 0 0-10 10v28a10 10 0 0 0 10 10h62l22 16v-16h16a10 10 0 0 0 10-10V80a10 10 0 0 0-10-10z" fill="${a}" stroke="${INK}" stroke-width="2"/>` + [0, 1, 2].map(i => circ(140 + i * 18, 94, 4 + (i === v % 3 ? 1 : 0), PAPER)).join(''),
  auto: (a, b, v) => [[40, 40], [120, 40], [200, 40], [80, 110], [160, 110]].map(([x, y], i) => r(x - 22, y - 16, 44, 32, i === v % 5 ? a : b, 8, ` stroke="${INK}" stroke-width="2"`)).join('') +
    `<path d="M62 40h36M142 40h36M52 56l18 38M190 56l-18 38M102 110h36" stroke="${INK}" stroke-width="2" fill="none" marker-end="url(#ar)"/>`,
  data: (a, b, v) => line(30, 128, 214, 128, INK, 2) + line(30, 128, 30, 20, INK, 2) + [38, 62, 50, 84, 72, 100].map((hgt, i) => r(42 + i * 28, 128 - hgt - v * 3, 18, hgt + v * 3, i % 2 ? a : b, 2, ` stroke="${INK}" stroke-width="1.5"`)).join('') +
    `<path d="M42 90L82 70 112 80 152 40 200 30" fill="none" stroke="${INK}" stroke-width="2.5"/>` + circ(200, 30, 5, a, ` stroke="${INK}" stroke-width="2"`),
  security: (a, b, v) => `<path d="M120 16l52 18v36c0 34-22 54-52 66-30-12-52-32-52-66V34z" fill="${b}" stroke="${INK}" stroke-width="2.4"/>` + r(100, 66, 40, 34, a, 5, ` stroke="${INK}" stroke-width="2"`) +
    `<path d="M108 66V56a12 12 0 0 1 24 0v10" fill="none" stroke="${INK}" stroke-width="3"/>` + circ(120, 82, 4, INK) + [0, 1, 2].map(i => line(190, 40 + i * 20 + v, 222, 40 + i * 20 + v, INK, 2, ' stroke-dasharray="2 5"')).join(''),
  audit: (a, b, v) => strokeR(54, 22, 92, 114, INK, 6) + r(80, 16, 40, 14, a, 4, ` stroke="${INK}" stroke-width="2"`) + [0, 1, 2, 3].map(i => `<path d="M66 ${52 + i * 20}l5 5 9-10" fill="none" stroke="${i <= v % 4 ? a : INK}" stroke-width="2.5"/>` + line(88, 52 + i * 20, 132, 52 + i * 20, INK)).join('') +
    circ(178, 92, 24, b, ` stroke="${INK}" stroke-width="3"`) + line(195, 109, 214, 128, INK, 6),
  hosting: (a, b, v) => `<path d="M64 68a26 26 0 0 1 50-16 22 22 0 0 1 40 6 20 20 0 0 1 2 40H70a22 22 0 0 1-6-30z" fill="${b}" stroke="${INK}" stroke-width="2.4"/>` + line(120, 98, 120, 116, INK) +
    [0, 1].map(i => strokeR(76 + i * 46, 116, 40, 22, INK) + circ(86 + i * 46, 127, 3.5, i === v % 2 ? a : INK)).join('') + `<path d="M188 32v18h18" fill="none" stroke="${a}" stroke-width="3"/>` + circ(196, 42, 18, 'none', ` stroke="${a}" stroke-width="3"`),
  qa: (a, b, v) => strokeR(40, 24, 96, 108, INK, 6) + [0, 1, 2, 3].map(i => r(52, 40 + i * 22, 12, 12, i === v % 4 ? a : PAPER, 2, ` stroke="${INK}" stroke-width="2"`) + line(72, 46 + i * 22, 122, 46 + i * 22, INK)).join('') +
    `<ellipse cx="180" cy="86" rx="20" ry="26" fill="${a}" stroke="${INK}" stroke-width="2.4"/>` + circ(180, 56, 10, INK) + [0, 1, 2].map(i => line(160, 74 + i * 14, 146, 68 + i * 16, INK) + line(200, 74 + i * 14, 214, 68 + i * 16, INK)).join('') + line(180, 62, 180, 110, INK, 1.5),
  roast: (a, b, v) => `<path d="M120 136c-30 0-48-20-44-46 3-20 20-28 18-50 18 10 26 26 24 40 8-6 10-16 8-26 22 16 34 38 30 56-4 16-16 26-36 26z" fill="${a}" stroke="${INK}" stroke-width="2.4"/>` +
    `<path d="M120 134c-14 0-22-10-20-22 2-10 12-14 12-26 12 8 22 20 20 32-2 10-6 16-12 16z" fill="${b}"/>` + `<path d="M170 30h50a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8h-30l-14 12V70h-6a8 8 0 0 1-8-8V38a8 8 0 0 1 8-8z" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>` + `<text x="195" y="56" font-size="14" font-weight="700" text-anchor="middle" fill="${INK}">${['!', '?!', '✓'][v % 3]}</text>`,
  pitch: (a, b, v) => strokeR(30, 20, 180, 100, INK, 4) + line(120, 120, 120, 138, INK, 3) + line(96, 138, 144, 138, INK, 3) + r(44, 34, 70, 72, b) + `<path d="M126 96l20-22 16 12 28-36" fill="none" stroke="${a}" stroke-width="4"/>` + lines(52, 50, 50, 3 + v % 2, INK, 10),
  care: (a, b, v) => strokeR(40, 30, 104, 96, INK, 6) + r(40, 30, 104, 22, a, 6) + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => r(52 + (i % 3) * 30, 62 + Math.floor(i / 3) * 20, 20, 12, i === v % 9 ? a : b, 2)).join('') +
    `<path d="M170 120l40-40a16 16 0 1 0-12-12l-40 40z" fill="${b}" stroke="${INK}" stroke-width="2.4"/>` + circ(206, 64, 6, PAPER, ` stroke="${INK}" stroke-width="2"`),
};


// Subject icons in a 32 x 32 box, matched against the service name. They tell the reader what
// the job is about at a glance: a fork for a restaurant site, a key for login work, a bug for QA.
const S = 'fill="none" stroke="#17170f" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
const ICONS = [
  [/clinic|health|fitness|medical/i, `<path ${S} d="M16 28S4 20 4 11a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 9-12 17-12 17z"/><path ${S} d="M10 15h4l2-4 2 7 2-3h3"/>`],
  [/portfolio|profile|company|cv /i, `<path ${S} d="M4 10h24v17H4zM11 10V6h10v4M4 17h24"/>`],
  [/property|house|home/i, `<path ${S} d="M4 15L16 5l12 10M8 12v14h16V12M13 26v-7h6v7"/>`],
  [/catalog|listing|directory|job board/i, `<path ${S} d="M4 6c5-1 9 0 12 3 3-3 7-4 12-3v20c-5-1-9 0-12 3-3-3-7-4-12-3zM16 9v20"/>`],
  [/restaurant|food|menu/i, `<path ${S} d="M9 4v10a3 3 0 0 0 6 0V4M12 4v24M22 4c-3 0-4 4-4 9h4v15"/>`],
  [/hotel|room|booking|schedul|reserv/i, `<path ${S} d="M4 26V8M4 18h24v8M4 14h8a4 4 0 0 1 4 4M16 14h8a4 4 0 0 1 4 4"/>`],
  [/school|course|learning|exam|training|workshop|teach/i, `<path ${S} d="M2 12l14-6 14 6-14 6zM8 15v7c4 3 12 3 16 0v-7M28 13v8"/>`],
  [/store|shop|checkout|cart|marketplace|purchase|commerce/i, `<path ${S} d="M3 5h4l3 15h15l3-10H9"/><circle cx="12" cy="26" r="2" fill="#17170f"/><circle cx="23" cy="26" r="2" fill="#17170f"/>`],
  [/blog|news|article|document|whitepaper|readme|manual|proposal|requirement|copy|writing|case study/i, `<path ${S} d="M7 3h13l6 6v20H7zM20 3v6h6M11 15h11M11 20h11M11 25h7"/>`],
  [/wedding|invitation|donation|non-profit|loyalty/i, `<path ${S} d="M16 27S4 19 4 11a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 8-12 16-12 16z"/>`],
  [/email|newsletter|inbox/i, `<path ${S} d="M3 7h26v18H3zM3 8l13 10L29 8"/>`],
  [/speed|performance|vitals|fast|load test|stress/i, `<path ${S} d="M18 3L6 18h9l-2 11 13-16h-9z"/>`],
  [/seo|search|discovery|find/i, `<circle cx="13" cy="13" r="8" ${S}/><path ${S} d="M19 19l9 9"/>`],
  [/login|session|oauth|password|mfa|role|permission|key|secret|verification/i, `<circle cx="10" cy="16" r="6" ${S}/><path ${S} d="M16 16h13M24 16v5M28 16v4"/>`],
  [/payment|invoice|billing|price|pricing|crypto|wallet|financial|cost|paid/i, `<path ${S} d="M3 8h26v17H3zM3 13h26M8 20h6"/>`],
  [/calendar|month|attendance|shift|scheduled|retainer|on call/i, `<path ${S} d="M4 7h24v21H4zM4 13h24M10 3v7M22 3v7"/><path d="M9 18h4v4H9z" fill="#17170f"/>`],
  [/chart|dashboard|report|kpi|analytics|metrics|forecast|funnel|analysis|segment/i, `<path ${S} d="M4 28h24M8 24V14M14 24V8M20 24v-6M26 24V11"/>`],
  [/bug|crash|test|qa|regression|validation/i, `<path ${S} d="M10 12a6 6 0 0 1 12 0v8a6 6 0 0 1-12 0zM16 12v14M10 16H4M28 16h-6M10 22l-5 4M22 22l5 4M11 8L8 4M21 8l3-4"/>`],
  [/security|hardening|firewall|ddos|malware|hacked|phishing|incident|vulnerab|penetration|protection|abuse|privacy/i, `<path ${S} d="M16 3l11 4v8c0 7-5 12-11 14C10 27 5 22 5 15V7z"/><path ${S} d="M11 16l4 4 6-7"/>`],
  [/hosting|server|cloud|deploy|vps|docker|kubernetes|staging|aws|migration|backup|uptime|monitor/i, `<path ${S} d="M4 5h24v9H4zM4 18h24v9H4z"/><circle cx="9" cy="9.5" r="1.6" fill="#17170f"/><circle cx="9" cy="22.5" r="1.6" fill="#17170f"/>`],
  [/domain|dns|ssl|certificate|language|locali|translation|currency|right-to-left|hreflang|routing/i, `<circle cx="16" cy="16" r="12" ${S}/><path ${S} d="M4 16h24M16 4c-5 6-5 18 0 24M16 4c5 6 5 18 0 24"/>`],
  [/chat|bot|whatsapp|telegram|discord|slack|messenger|instagram| line |widget|broadcast| dm /i, `<path ${S} d="M4 6h24v15H13l-7 6v-6H4z"/><path ${S} d="M10 13h.1M16 13h.1M22 13h.1"/>`],
  [/agent|assistant| ai |chatbot|prompt|rag|model|mcp|sentiment/i, `<rect x="6" y="8" width="20" height="17" rx="5" ${S}/><path ${S} d="M16 3v5M12 16h.1M20 16h.1M12 21h8"/>`],
  [/video|trailer|walkthrough|motion graphics|tour/i, `<rect x="3" y="7" width="20" height="18" rx="3" ${S}/><path ${S} d="M23 13l6-4v14l-6-4z"/>`],
  [/3d|configurator|showroom|blender|webgl|shader| ar /i, `<path ${S} d="M16 3l12 6v14l-12 6-12-6V9zM16 15l12-6M16 15L4 9M16 15v14"/>`],
  [/animation|animated|lottie|rive|scroll|transition|interaction|gsap/i, `<path ${S} d="M4 24C10 6 20 6 28 8"/><circle cx="26" cy="8" r="3" fill="#17170f"/><path ${S} d="M4 28h6"/>`],
  [/game|arcade|puzzle|quiz|level|sprite|unity|godot|multiplayer|leaderboard|player/i, `<path ${S} d="M7 11h18a4 4 0 0 1 4 4l1 7c1 4-3 6-5 3l-3-4H10l-3 4c-2 3-6 1-5-3l1-7a4 4 0 0 1 4-4zM10 14v6M7 17h6"/><circle cx="22" cy="16" r="1.6" fill="#17170f"/>`],
  [/phone|mobile|android|ios|app store|offline|push|camera|scan|wrapper/i, `<rect x="9" y="3" width="14" height="26" rx="3" ${S}/><path ${S} d="M14 25h4"/>`],
  [/map|location|courier|delivery|tracking/i, `<path ${S} d="M16 29s-9-9-9-16a9 9 0 0 1 18 0c0 7-9 16-9 16z"/><circle cx="16" cy="13" r="3" ${S}/>`],
  [/sheet|table|data|database|query|schema|etl|warehouse|dataset|inventory|crm|records|form|survey/i, `<ellipse cx="16" cy="7" rx="11" ry="4" ${S}/><path ${S} d="M5 7v18c0 2 5 4 11 4s11-2 11-4V7M5 16c0 2 5 4 11 4s11-2 11-4"/>`],
  [/automation|workflow|integration|zapier|n8n|make|sync|webhook|pipeline|queue|bridge|script|connect/i, `<circle cx="7" cy="16" r="4" ${S}/><circle cx="25" cy="7" r="4" ${S}/><circle cx="25" cy="25" r="4" ${S}/><path ${S} d="M11 14l10-5M11 18l10 5"/>`],
  [/design|figma|logo|brand|icon|typography|color|wireframe|prototype| ui | ux |template|redesign|polish/i, `<path ${S} d="M5 27l4-12 12-12 8 8-12 12zM9 15l8 8M21 3l8 8"/>`],
  [/deck|pitch|slides|presentation|investor|speaker/i, `<path ${S} d="M3 5h26v16H3zM16 21v6M10 28h12M8 16l5-5 4 3 6-6"/>`],
  [/roast|critique|review|teardown|audit|check|due diligence/i, `<circle cx="13" cy="13" r="8" ${S}/><path ${S} d="M19 19l9 9M9 13l3 3 5-6"/>`],
  [/launch|startup|idea|mvp|saas|rocket/i, `<path ${S} d="M16 3c6 4 8 11 6 18h-12C8 14 10 7 16 3zM10 21l-4 6 6-2M22 21l4 6-6-2"/><circle cx="16" cy="12" r="2.4" ${S}/>`],
  [/maintenance|update|patch|repair|fix|upgrade|cleanup|rescue|take over|handover|support/i, `<path ${S} d="M20 4a7 7 0 0 0-7 9L4 22l6 6 9-9a7 7 0 0 0 9-7l-4 4-5-1-1-5z"/>`],
  [/consult|advice|strategy|session|interview|hiring|vendor|cto|meeting/i, `<path ${S} d="M3 6h17v11H9l-5 4v-4H3zM23 11h6v11h-1v4l-5-4h-7v-2"/>`],
  [/api|endpoint|graphql|rest|backend|node|python|laravel|firebase|supabase|frontend|react|vue|svelte|next|html|css|tailwind|jquery|component|code|repo|git/i, `<path ${S} d="M11 8l-8 8 8 8M21 8l8 8-8 8M18 5l-4 22"/>`],
];
// When no word in the name matches, the category gives the picture.
const browserIcon = `<path ${S} d="M3 5h26v22H3zM3 11h26"/><path d="M6 7h2v2H6zM10 7h2v2h-2z" fill="#17170f"/><path ${S} d="M8 16h10M8 21h16"/>`;
export const subjectIcon = (name, cat) => {
  const hit = ICONS.find(([re]) => re.test(` ${name} `)); if (hit) return hit[1];
  if (cat === 'web') return browserIcon;
  const probe = { fullstack: 'database', frontend: 'frontend', backend: 'backend', i18n: 'language', design: 'design', motion: 'animation', mobile: 'mobile', game: 'game', ai: 'agent', chat: 'chat', auto: 'automation', data: 'dashboard', security: 'security', audit: 'audit', hosting: 'server', qa: 'bug', roast: 'review', pitch: 'deck', care: 'maintenance',
    industry: 'company', polish: 'design', seo: 'search', bizweb: 'inventory', bizsys: 'crm', sitecare: 'server', agents: 'agent', workflow: 'workflow', bots: 'chat', features: 'dashboard',
    desktop: 'code', cms: 'blog', nocode: 'form', payments: 'payment', martech: 'analytics', cloud: 'cloud', ml: 'model', dbeng: 'database', itsupport: 'maintenance', compliance: 'policy' }[cat];
  const f = probe && ICONS.find(([re]) => re.test(` ${probe} `));
  return f ? f[1] : browserIcon;
};

// One service, one picture: a small mock-up of what the client receives. The frame says what
// kind of thing it is (web page, phone, dashboard, document, slides, chat, code, server, game),
// the content inside says what it does (menu, booking calendar, product grid, form, chart...),
// stacked sheets show how many pages or screens, and a medallion carries the subject icon.
// Straight edges almost everywhere so 228 printed books stay small.
const FRAME_BY = [
  [/phone|mobile|android|ios|flutter|react native|app store|telegram mini|wrapper|offline|push notification|in-app|camera|courier|loyalty|fitness|parent app/i, 'phone'],
  [/game|arcade|puzzle|quiz|unity|godot|sprite|level design|multiplayer|leaderboard|in-game|rewarded/i, 'game'],
  [/invoice|contract|document|extraction|meeting summary|policy|prompt library|library of|writing tool|knowledge base/i, 'doc'],
  [/search/i, 'web'],
  [/bot|chat|whatsapp|instagram|messenger|telegram|discord|slack|teams|line |inbox|dm |handoff|widget|agent|assistant/i, 'chat'],
  [/deck|slides|pitch|presentation|speaker notes/i, 'slides'],
  [/dashboard|report|analytics|kpi|metrics|looker|power bi|metabase|forecast|funnel|segmentation|churn|monitoring|admin/i, 'dash'],
  [/document|manual|readme|whitepaper|proposal|requirements|plan|policy|guidelines|checklist|script|case study|summary|article|copy|writing|grant|cv |audit|review|roast|critique|teardown|due diligence|kit/i, 'doc'],
  [/server|hosting|vps|docker|kubernetes|deploy|cloud|backup|uptime|dns|ssl|domain|staging|migration|aws|ci\/cd|pipeline|cloudflare|firewall|ddos/i, 'server'],
  [/api|endpoint|graphql|webhook|queue|backend|database|schema|query|node\.js|python|laravel|firebase|supabase|etl|test suite|unit test|code|repo|git|cli|sync|integration|automation|workflow|zapier|n8n|make\.com/i, 'code'],
];
const CAT_FRAME = { web: 'web', fullstack: 'dash', frontend: 'web', backend: 'code', i18n: 'web', design: 'web', motion: 'web', mobile: 'phone', game: 'game', ai: 'chat', chat: 'chat', auto: 'code', data: 'dash', security: 'server', audit: 'doc', hosting: 'server', qa: 'doc', roast: 'doc', pitch: 'slides', care: 'doc',
  industry: 'web', polish: 'web', seo: 'web', bizweb: 'dash', bizsys: 'dash', sitecare: 'server', agents: 'chat', workflow: 'code', bots: 'chat', features: 'dash',
  desktop: 'code', cms: 'web', nocode: 'dash', payments: 'code', martech: 'dash', cloud: 'server', ml: 'dash', dbeng: 'code', itsupport: 'server', compliance: 'doc' };
const LAYOUT_BY = [
  [/search/i, 'search'], [/invoice|quotation|receipt|billing/i, 'invoice'], [/classif|triage|ticket|helpdesk|moderat|accuracy|test set/i, 'list'],
  [/restaurant|menu|food|price list|pricing/i, 'menu'], [/booking|schedul|calendar|attendance|shift|appointment|event/i, 'calendar'],
  [/store|shop|catalog|product|marketplace|inventory|checkout|cart|property|listing|job board|hotel|room/i, 'grid'],
  [/form|survey|registration|waitlist|login|signup|oauth|session|exam|validation|password|mfa/i, 'form'],
  [/portfolio|gallery|showroom|photo|image|icon set|sprites|logo|brand/i, 'gallery'],
  [/blog|news|article|documentation|docs|course|school|learning|wedding|invitation|donation/i, 'article'],
  [/chart|dashboard|report|analytics|kpi|metrics|sales|forecast|speed|performance|vitals|load|stress|cost/i, 'chart'],
  [/language|locali|translation|currency|right-to-left|hreflang|multi-language/i, 'langs'],
  [/3d|configurator|360|ar |webgl|shader|three/i, 'cube'],
];

const starts = re => new RegExp(`\\b(?:${re.source})`, 'i');
const pick = (list, name) => list.find(([re]) => starts(re).test(name));
const tile = (x, y, w, hh, f) => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${f}"/>`;
const bar = (x, y, w, c, t = 2.4) => tile(x, y, w, t, c);

// Colours of one picture, all from one hue. k: frame and text, a: accent, b: soft fill,
// p: paper (equal to the card background), d: screen of dark frames, l: text on dark, m: muted.
const hex = (h, s, l) => {
  s /= 100; l /= 100;
  const f = n => { const k = (n + h / 30) % 12; const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(c * 255).toString(16).padStart(2, '0'); };
  return `#${f(0)}${f(8)}${f(4)}`;
};
// Two hues per picture: hf for the frame and text lines, hc for the fills. p equals the card background.
export function colors(hf, hc, tone) {
  const L = tone ? 10 : 0;
  return { k: hex(hf, 72, 30 + L), m: hex(hf, 45, 56), a: hex(hc, 88, 50 + L), b: hex(hc, 82, 72), p: hex(hc, 60, 96), l: hex(hc, 75, 84) };
}

// Frames are thin outlines, so the picture is carried by what is inside them.
const box = (x, y, w, h, C, rx = 3, sw = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${C.p}" stroke="${C.k}" stroke-width="${sw}"/>`;
function frame(kind, C) {
  // Returns [svg, inner box]. Box is [x, y, w, h] for the content.
  const { k, a, b } = C;
  const dots = (x, y) => tile(x, y, 3, 3, a) + tile(x + 6, y, 3, 3, b) + tile(x + 12, y, 3, 3, k);
  switch (kind) {
    case 'phone': return [box(84, 6, 72, 110, C, 9, 3) + tile(112, 10, 16, 2.5, k), [90, 16, 60, 90]];
    case 'game': return [box(26, 10, 188, 100, C, 6, 2.5) + tile(110, 104, 20, 3, k), [36, 20, 168, 80]];
    case 'slides': return [box(30, 8, 180, 96, C) + tile(118, 104, 3, 10, k) + tile(98, 113, 44, 2, k), [40, 18, 160, 76]];
    case 'doc': return [box(62, 6, 116, 110, C, 2) + `<path d="M160 7h17v17z" fill="${b}"/>`, [74, 18, 92, 88]];
    case 'server': return [[0, 1, 2].map(i => box(46, 10 + i * 34, 148, 28, C) + tile(56, 21 + i * 34, 6, 6, i === 0 ? a : b) + bar(68, 23 + i * 34, 40 + i * 22, i === 1 ? a : b, 2)).join(''), null];
    case 'code': return [box(28, 10, 184, 100, C) + dots(34, 15) + bar(28, 22, 184, k, 1.4), [36, 26, 168, 78]];
    case 'chat': return [box(70, 6, 100, 110, C, 8) + bar(70, 16, 100, k, 1.4) + tile(80, 10, 30, 2.5, k), [78, 22, 84, 86]];
    case 'dash': return [box(24, 10, 192, 100, C) + bar(24, 21, 192, k, 1.4) + tile(26, 22, 34, 87, b) + [0, 1, 2, 3].map(i => bar(32, 32 + i * 12, 22, i === 0 ? a : k, 2)).join('') + dots(30, 14), [66, 28, 142, 74]];
    default: return [box(24, 8, 192, 104, C) + bar(24, 19, 192, k, 1.4) + dots(30, 12) + tile(52, 12, 80, 3, C.m), [33, 26, 174, 78]];
  }
}

function content(layout, [x, y, w, hh], C, icon, dark) {
  const { a, b, p } = C;
  const ink = dark ? C.l : C.k; const soft = dark ? C.m : b;
  const small = (cx, cy, s) => `<g transform="translate(${cx} ${cy}) scale(${s})">${icon.replace(/#17170f/g, ink)}</g>`;
  switch (layout) {
    case 'menu': return bar(x, y, w * 0.4, a, 5) + [0, 1, 2, 3].map(i => small(x, y + 12 + i * 16, 0.38) + bar(x + 16, y + 16 + i * 16, w * 0.5, ink) + tile(x + w - 26, y + 14 + i * 16, 26, 6, i % 2 ? soft : a)).join('');
    case 'calendar': return bar(x, y, w * 0.45, ink, 4) + Array.from({ length: 18 }, (_, i) => tile(x + (i % 6) * (w / 6), y + 10 + Math.floor(i / 6) * ((hh - 26) / 3), w / 6 - 3, (hh - 26) / 3 - 3, i === 8 || i === 13 ? a : soft)).join('') + tile(x + w * 0.62, y + hh - 12, w * 0.38, 10, ink);
    case 'grid': { const cols = w > 100 ? 3 : 2; const cw = w / cols; return Array.from({ length: cols * 2 }, (_, i) => { const cx = x + (i % cols) * cw; const cy = y + Math.floor(i / cols) * (hh / 2); return tile(cx, cy, cw - 5, hh / 2 - 16, i === 1 ? a : soft) + small(cx + (cw - 5) / 2 - 7, cy + (hh / 2 - 16) / 2 - 7, 0.45) + bar(cx, cy + hh / 2 - 12, (cw - 5) * 0.7, ink, 2) + tile(cx, cy + hh / 2 - 7, (cw - 5) * 0.35, 3, a); }).join(''); }
    case 'form': return bar(x, y, w * 0.5, ink, 4) + [0, 1, 2].map(i => `<rect x="${x}" y="${y + 10 + i * 17}" width="${w}" height="12" fill="${dark ? C.m : p}" stroke="${ink}" stroke-width="1.4"/>` + bar(x + 4, y + 15 + i * 17, w * 0.3, soft, 2)).join('') + tile(x, y + 63, w * 0.45, 12, a) + small(x + w - 18, y + 62, 0.42);
    case 'gallery': return Array.from({ length: 6 }, (_, i) => { const cw = w / 3; const ch = hh / 2; const cx = x + (i % 3) * cw; const cy = y + Math.floor(i / 3) * ch; return tile(cx, cy, cw - 4, ch - 4, i === 4 ? a : soft) + `<path d="M${cx + 3} ${cy + ch - 7}l${cw * 0.3} -${ch * 0.4} ${cw * 0.22} ${ch * 0.22} ${cw * 0.15} -${ch * 0.12} ${cw * 0.2} ${ch * 0.3}z" fill="${ink}"/>`; }).join('');
    case 'article': return tile(x, y, w * 0.42, hh * 0.62, a) + small(x + w * 0.21 - 7, y + hh * 0.31 - 7, 0.45) + bar(x + w * 0.48, y + 2, w * 0.5, ink, 5) + [0, 1, 2, 3, 4].map(i => bar(x + w * 0.48, y + 14 + i * 8, w * (i === 4 ? 0.3 : 0.5), soft, 2.4)).join('') + [0, 1].map(i => bar(x, y + hh * 0.72 + i * 8, w * (i ? 0.6 : 0.95), soft, 2.4)).join('');
    case 'chart': return [0.35, 0.6, 0.45, 0.8, 0.65, 0.95].map((q, i) => tile(x + 4 + i * (w / 6), y + hh - hh * 0.75 * q, w / 6 - 6, hh * 0.75 * q, i === 5 ? a : soft)).join('') + bar(x, y + hh - 1, w, ink, 1.6) + tile(x, y, 30, 12, ink) + small(x + w - 16, y - 2, 0.42);
    case 'langs': return ['A', '文', 'ع', 'Я', 'अ', 'Ω'].map((t, i) => { const cw = w / 3; const cx = x + (i % 3) * cw; const cy = y + Math.floor(i / 3) * (hh / 2); return tile(cx, cy, cw - 5, hh / 2 - 6, i === 1 ? a : soft) + `<text x="${cx + (cw - 5) / 2}" y="${cy + hh / 4 + 4}" font-size="13" font-weight="700" text-anchor="middle" fill="${ink}">${t}</text>`; }).join('');
    case 'cube': return `<path d="M${x + w / 2} ${y + 4}l34 16v36l-34 16-34-16V${y + 20}z" fill="${soft}" stroke="${ink}" stroke-width="2"/><path d="M${x + w / 2} ${y + 36}l34-16M${x + w / 2} ${y + 36}l-34-16M${x + w / 2} ${y + 36}v36" stroke="${ink}" stroke-width="2"/>` + tile(x, y + hh - 6, w * 0.3, 4, a) + tile(x + w * 0.7, y + 4, w * 0.3, 4, a);
    case 'chatlog': { const kk = (x * 7 + y * 13 + w) % 5; const rows = 3 + (icon.length % 2); return tile(x, y, 16, 16, a) + small(x + 1, y + 1, 0.44) + bar(x + 20, y + 7, w * 0.4, ink, 2.4) + Array.from({ length: rows }, (_, i) => { const yy = y + 22 + i * (hh - 24) / rows; const ww = w * (0.45 + ((i + kk) % 3) * 0.12); return i % 2 ? tile(x + w - ww, yy, ww, 12, a) + bar(x + w - ww + 5, yy + 5, ww * 0.6, p, 2) : tile(x, yy, ww, 12, soft) + bar(x + 5, yy + 5, ww * 0.6, ink, 2); }).join(''); }
    case 'search': return `<rect x="${x}" y="${y + 4}" width="${w}" height="14" fill="${p}" stroke="${ink}" stroke-width="1.6"/>` + small(x + w - 15, y + 5, 0.38) + [0, 1, 2].map(i => bar(x, y + 28 + i * 16, w * 0.5, a, 3) + bar(x, y + 34 + i * 16, w * 0.85, soft, 2)).join('');
    case 'invoice': return bar(x, y, w * 0.4, ink, 5) + tile(x + w - 24, y, 24, 10, a) + [0, 1, 2, 3].map(i => bar(x, y + 18 + i * 10, w * 0.6, soft, 2.4) + bar(x + w - 22, y + 18 + i * 10, 22, ink, 2.4)).join('') + bar(x, y + 62, w, ink, 1.4) + tile(x + w - 34, y + 68, 34, 10, a);
    case 'list': return [0, 1, 2, 3, 4].map(i => tile(x, y + i * 16, 10, 10, [a, b, a, soft, b][i]) + bar(x + 16, y + 4 + i * 16, w * (0.4 + (i % 3) * 0.15), ink, 2.4) + tile(x + w - 20, y + 2 + i * 16, 20, 6, i === 1 ? a : soft)).join('');
    case 'codelines': return Array.from({ length: 7 }, (_, i) => bar(x + (i % 3) * 8, y + i * 10, 20 + ((i * 37) % 60), [a, C.l, b][i % 3], 3) + bar(x + (i % 3) * 8 + 26 + ((i * 37) % 60), y + i * 10, 12 + ((i * 53) % 40), C.m, 3)).join('');
    case 'gamescene': return tile(x, y + hh - 14, w, 14, b) + tile(x + 20, y + hh - 34, 24, 20, a) + tile(x + 70, y + hh - 50, 40, 8, soft) + tile(x + 120, y + hh - 30, 16, 16, C.l) + small(x + w / 2 - 8, y + 6, 0.5) + bar(x + 4, y + 4, 40, a, 4) + bar(x + w - 44, y + 4, 40, C.l, 4);
    default: return tile(x, y, w, hh * 0.55, a) + small(x + w / 2 - 10, y + hh * 0.27 - 10, 0.62) + [0, 1, 2].map(i => tile(x + i * (w / 3), y + hh * 0.62, w / 3 - 4, hh * 0.38, soft)).join('');
  }
}

// Where the mock-up, the medallion and the label sit. [scale, x, y, medallion x, y, label corner]
const PLACES = [
  [0.62, 0, 10, 178, 64, 'tr'], [0.62, 92, 10, 18, 64, 'tl'], [1, 0, 2, 4, 74, 'br'], [1, 0, 2, 196, 4, 'bl'],
  [0.74, -12, -6, 186, 70, 'tl'], [0.74, 74, 28, 6, 6, 'br'], [0.55, 52, 20, 4, 4, 'bl'], [0.55, 54, 18, 196, 76, 'tr'],
];
export const VARIANTS = 8 * 8 * 2 * PLACES.length;
// A variant fixes the frame hue (8 steps of 45 degrees, far enough apart to read as different colours), the fill hue (8), the tone (2) and the placement. scripts/illus_pick.py chooses one per
// service so that no two pictures share more than a tenth of their drawn shapes in the same colour.
let chosen = null;
try { chosen = JSON.parse(fs.readFileSync(new URL('../data/illus-variants.json', import.meta.url), 'utf8')); } catch { chosen = {}; }

export function illustration(svc, cat, forced) {
  const h = hash(svc.slug);
  const v = forced ?? chosen[svc.code] ?? (h % VARIANTS);
  const hf = (v % 8) * 45; const hc = (Math.floor(v / 8) % 8) * 45 + 22.5; const tone = Math.floor(v / 64) % 2; const [sc, tx, ty, mx, my, lc] = PLACES[Math.floor(v / 128) % PLACES.length];
  const C = colors(hf, hc, tone);
  const name = ` ${svc.name} `;
  const kind = (pick(FRAME_BY, name) || [0, CAT_FRAME[cat] || 'web'])[1];
  const icon = subjectIcon(svc.name, cat);
  let layout = (pick(LAYOUT_BY, name) || [0, ''])[1];
  if (kind === 'chat') layout = 'chatlog'; else if (kind === 'code') layout = layout === 'chart' ? 'chart' : 'codelines'; else if (kind === 'game') layout = 'gamescene';
  if (!layout) layout = ['hero', 'grid', 'article'][h % 3];
  // Stacked sheets for anything sold by count: pages, screens, slides, languages, levels.
  const m = svc.name.match(/(\d+)\s*(pages?|screens?|slides?|languages?|levels?|icons?|assets?|articles?|endpoints?)/i);
  const n = m ? Math.min(6, Math.max(1, Math.round(Math.log2(+m[1]) + 1))) : 1;
  const [fr, box] = frame(kind, C);
  const stack = n > 1 && kind !== 'server' ? Array.from({ length: n - 1 }, (_, i) => `<g transform="translate(${(n - 1 - i) * 5} ${-(n - 1 - i) * 3})"><rect x="24" y="8" width="192" height="104" fill="${i % 2 ? C.b : C.p}" stroke="${C.k}" stroke-width="1.2"/></g>`).join('') : '';
  const inside = box ? content(layout, box, C, icon, false) : '';
  const tag = badge(svc.name); const tw = Math.max(30, tag.length * 8 + 14);
  const [bx, by] = { tl: [4, 4], tr: [236 - tw, 4], bl: [4, 96], br: [236 - tw, 96] }[lc];
  return `<svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${svc.name.replace(/"/g, '')}">` +
    `<rect width="240" height="120" fill="${C.p}"/>` + `<g transform="translate(${tx} ${ty + 4}) scale(${sc} ${sc * 0.95})">${stack}${fr}${inside}</g>` +
    `<g transform="translate(${mx} ${my})"><rect width="40" height="40" fill="${C.a}"/><rect x="3" y="3" width="34" height="34" fill="${C.p}"/><g transform="translate(8 8) scale(.75)">${icon.replace(/#17170f/g, C.k)}</g></g>` +
    (tag ? `<g transform="translate(${bx} ${by})"><rect width="${tw}" height="20" fill="${C.k}"/><text x="${tw / 2}" y="14" font-family="Consolas,monospace" font-size="11" font-weight="700" fill="${C.p}" text-anchor="middle">${tag}</text></g>` : '') + '</svg>';
}

// Bigger picture for a category opener: the same scene without the per-service label.
// Newer categories reuse a scene that fits their subject, drawn with a different detail variant.
const SCENE_OF = { industry: 'web', polish: 'design', seo: 'frontend', bizweb: 'fullstack', bizsys: 'fullstack', sitecare: 'hosting', agents: 'ai', workflow: 'auto', bots: 'chat', features: 'frontend',
  desktop: 'backend', cms: 'web', nocode: 'design', payments: 'backend', martech: 'data', cloud: 'hosting', ml: 'ai', dbeng: 'fullstack', itsupport: 'care', compliance: 'audit' };
const SCENE_V = { industry: 0, polish: 0, seo: 0, bizweb: 0, bizsys: 3, sitecare: 0, agents: 0, workflow: 0, bots: 0, features: 3, desktop: 0, cms: 3, nocode: 3, payments: 3, martech: 0, cloud: 3, ml: 3, dbeng: 1, itsupport: 0, compliance: 0 };
export function categoryArt(cat, i) {
  const [a, b] = PAL[i % PAL.length];
  return `<svg viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><marker id="ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4 0 8z" fill="${INK}"/></marker></defs>${(SCENES[cat] || SCENES[SCENE_OF[cat]] || SCENES.web)(a, b, SCENE_V[cat] ?? 2)}</svg>`;
}
