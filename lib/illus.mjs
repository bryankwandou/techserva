// Vector illustrations for the catalog: one scene per category, varied per service by colour,
// layout and a label taken from the service itself (a number, a product name or an initial).
// Pure SVG strings, so the PDF keeps them sharp and small.

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
  [/catalog|listing|directory|job board/i, `<path ${S} d="M4 6c5-1 9 0 12 3 3-3 7-4 12-3v20c-5-1-9 0-12 3-3-3-7-4-12-3zM16 9v20"/>`],
  [/restaurant|food|menu/i, `<path ${S} d="M9 4v10a3 3 0 0 0 6 0V4M12 4v24M22 4c-3 0-4 4-4 9h4v15"/>`],
  [/hotel|room|booking|schedul|reserv/i, `<path ${S} d="M4 26V8M4 18h24v8M4 14h8a4 4 0 0 1 4 4M16 14h8a4 4 0 0 1 4 4"/>`],
  [/school|course|learning|exam|training|workshop|teach/i, `<path ${S} d="M2 12l14-6 14 6-14 6zM8 15v7c4 3 12 3 16 0v-7M28 13v8"/>`],
  [/property|house|home/i, `<path ${S} d="M4 15L16 5l12 10M8 12v14h16V12M13 26v-7h6v7"/>`],
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
  const probe = { fullstack: 'database', frontend: 'frontend', backend: 'backend', i18n: 'language', design: 'design', motion: 'animation', mobile: 'mobile', game: 'game', ai: 'agent', chat: 'chat', auto: 'automation', data: 'dashboard', security: 'security', audit: 'audit', hosting: 'server', qa: 'bug', roast: 'review', pitch: 'deck', care: 'maintenance' }[cat];
  const f = probe && ICONS.find(([re]) => re.test(` ${probe} `));
  return f ? f[1] : browserIcon;
};

// One service, one picture. `w` and `h` are display size; the art is drawn in a 240 x 150 box.
export function illustration(svc, cat) {
  const h = hash(svc.slug); const [a, b] = PAL[(h >>> 3) % PAL.length]; const v = h % 7;
  const tag = badge(svc.name); const tw = Math.max(34, tag.length * 9 + 16);
  // Card art stays light on curves so 228 printed books stay small: a big subject icon on a
  // tinted panel, with straight-edged blocks in the category colour that shift per service.
  const blocks = [0, 1, 2, 3].map(i => { const k = (h >>> (i * 4)) & 15; return `<rect x="${128 + (k % 4) * 14}" y="${22 + i * 22}" width="${30 + (k >> 2) * 8}" height="12" fill="${i === v % 4 ? a : b}"/>`; }).join('');
  return `<svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${svc.name.replace(/"/g, '')}">` +
    `<rect width="240" height="120" fill="${mix(b)}"/>` + blocks +
    `<rect x="18" y="14" width="92" height="92" fill="${b}"/><rect x="18" y="98" width="92" height="8" fill="${a}"/>` +
    `<g transform="translate(29 21) scale(2.2)">${subjectIcon(svc.name, cat)}</g>` +
    (tag ? `<g transform="translate(${240 - tw - 10} 88)"><rect width="${tw}" height="22" fill="${INK}"/><text x="${tw / 2}" y="15.5" font-family="Consolas,monospace" font-size="12" font-weight="700" fill="${PAPER}" text-anchor="middle">${tag}</text></g>` : '') + '</svg>';
}

// Bigger picture for a category opener: the same scene without the per-service label.
export function categoryArt(cat, i) {
  const [a, b] = PAL[i % PAL.length];
  return `<svg viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><marker id="ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4 0 8z" fill="${INK}"/></marker></defs>${(SCENES[cat] || SCENES.web)(a, b, 2)}</svg>`;
}
