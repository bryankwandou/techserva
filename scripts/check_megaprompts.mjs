// Checks that every service has a megaprompt and a 10-step workflow bundle for every client type.
// Usage: node scripts/check_megaprompts.mjs
import { megaprompt, TOTAL, SEGMENTS } from '../lib/templates.mjs';
import { services } from '../data/services.mjs';

let n = 0, bad = 0, size = 0;
for (let i = 0; i < services.length; i++) for (let g = 0; g < SEGMENTS.length; g++) {
  const m = megaprompt(i, g); n++; size += m.md.length;
  if (m.bundle.steps.length !== 10 || /undefined|NaN/.test(m.md + JSON.stringify(m.bundle))) bad++;
}
console.log('services', services.length, 'stage prompts', TOTAL, 'megaprompts', n, 'broken', bad, 'avg KB', (size / n / 1024).toFixed(1));
console.log(bad ? 'FAIL' : 'PASS');
process.exit(bad ? 1 : 0);
