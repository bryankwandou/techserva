// 1,000 services x 10 workflow stages x 10 client segments = 100,000 reusable agent prompts, plus one megaprompt
// and one workflow bundle per service and client segment.
// Generated on demand with stable ids, so nothing large is stored or shipped to the browser.
import { services, categories } from '../data/services.mjs';
import { catTerms } from '../data/copy.mjs';

export const STAGES = [
  ['intake', 'Intake', 'Read the brief and list what is known, what is missing, and the five questions that matter most. Do not propose a solution yet.', 'A short summary, then numbered questions.'],
  ['framework', 'Stage 1 framework', 'Write the framework the client will approve: structure, screens or sections, data, and what is out of scope. This is the only stage with revisions, so state that plainly.', 'A framework document with an approval line at the end.'],
  ['agreement', 'Agreement and invoice', 'Prepare the order summary from the approved framework. State that full payment is due before handover or hosting going live, that the domain is not included, and that overhauls after approval count as one new service. Link the terms page.', 'An order summary and invoice lines, payable in USDT or USDC.'],
  ['plan', 'Build plan', 'Break the approved framework into ordered tasks small enough to finish and check one at a time. Name the risk in each.', 'A numbered task list with acceptance checks.'],
  ['build', 'Build', 'Do the next unfinished task from the plan. Use the previous output as the current state. Do not add anything outside the framework.', 'The finished work for this task, then what is next.'],
  ['review', 'Self review', 'Attack the previous output as a strict reviewer. Find bugs, missing cases, security problems, weak copy and anything outside the framework.', 'A ranked list of problems with fixes, then the corrected work.'],
  ['qa', 'QA', 'Write and walk through a test checklist for this deliverable, covering phone and desktop, wrong input, slow networks and languages where they apply.', 'A pass or fail table with steps to reproduce each failure.'],
  ['update', 'Client update', 'Write a short honest progress message to the client: what is done, what is next, and what you need from them. No filler and no promises you cannot keep.', 'A message under 120 words.'],
  ['handover', 'Handover', 'First confirm that the invoice balance is zero. If it is not, stop and write a payment reminder. If it is, write the handover document: where everything is, how to run it, and how to change it.', 'Either a payment reminder or a handover document.'],
  ['followup', 'Follow-up', 'Write a follow-up after delivery. Ask whether it works as agreed, offer one relevant next service from the catalog, and do not pressure.', 'A message under 100 words.'],
];
export const SEGMENTS = [
  ['smb', 'Small business', 'a small business owner with no technical staff and a tight budget; write plainly'],
  ['saas', 'SaaS startup', 'a startup founder who cares about speed and has some technical knowledge'],
  ['retail', 'Retail and e-commerce', 'a shop owner who cares about orders, stock and checkout on a phone'],
  ['clinic', 'Clinic and health', 'a clinic where patient privacy matters and medical claims need care'],
  ['education', 'School and courses', 'a school or course provider serving parents and students'],
  ['property', 'Property', 'a property business that lives on enquiries and listings'],
  ['hospitality', 'Hotel and restaurant', 'a hotel or restaurant that lives on bookings and photos'],
  ['logistics', 'Logistics', 'a logistics firm that needs tracking, reliability and simple staff tools'],
  ['events', 'Events', 'an event organizer working to a date that cannot move'],
  ['public', 'Local government', 'a local government office that needs accessibility, audit trails and formal language'],
];
export const TOTAL = services.length * STAGES.length * SEGMENTS.length;
const catById = Object.fromEntries(categories.map(c => [c.id, c]));

export const idOf = (s, st, sg) => `${services[s].code}-${STAGES[st][0]}-${SEGMENTS[sg][0]}`;
export const indexOf = (s, st, sg) => s * STAGES.length * SEGMENTS.length + st * SEGMENTS.length + sg;

export function template(index) {
  if (!(index >= 0 && index < TOTAL)) return null;
  const sg = index % SEGMENTS.length;
  const st = Math.floor(index / SEGMENTS.length) % STAGES.length;
  const s = Math.floor(index / (SEGMENTS.length * STAGES.length));
  const svc = services[s]; const stage = STAGES[st]; const seg = SEGMENTS[sg]; const t = catTerms[svc.cat];
  const prompt = [
    `You are a senior specialist delivering "${svc.name}" (${catById[svc.cat].name}, code ${svc.code}).`,
    `Client: {{client_name}}, ${seg[2]}.`,
    'Brief: {{brief}}',
    'Reply in: {{language}}. Deadline: {{deadline}}.',
    '',
    `Scope of this service: ${t.scope.join('; ')}.`,
    `Client must provide: ${t.need}`,
    `Not included: ${t.out}`,
    `Rule: ${t.rule}`,
    '',
    `Current step, ${stage[1]}: ${stage[2]}`,
    `Output: ${stage[3]}`,
    '',
    'Previous output, if any:',
    '{{previous_output}}',
    '',
    'Never invent clients, numbers or results. If something is missing, say so and ask. End with a line starting "NEXT:" that states the next step.',
  ].join('\n');
  return { index, id: idOf(s, st, sg), service: svc.name, code: svc.code, slug: svc.slug, category: svc.cat, stage: stage[0], stageName: stage[1], segment: seg[0], segmentName: seg[1], prompt };
}

export function search({ q = '', stage = '', segment = '', category = '', page = 0, size = 25 } = {}) {
  const terms = String(q).toLowerCase().split(/\s+/).filter(Boolean);
  const isStage = t => STAGES.some(x => x[0] === t);
  const isSeg = t => SEGMENTS.some(x => x[0] === t);
  const words = terms.filter(t => !isStage(t) && !isSeg(t));
  const svcHits = [];
  services.forEach((s, i) => {
    if (category && s.cat !== category) return;
    const hay = `${s.name} ${s.code} ${s.cat}`.toLowerCase();
    if (words.every(t => hay.includes(t))) svcHits.push(i);
  });
  const wantStage = stage || terms.find(isStage);
  const wantSeg = segment || terms.find(isSeg);
  const stages = STAGES.map((_, i) => i).filter(i => !wantStage || STAGES[i][0] === wantStage);
  const segs = SEGMENTS.map((_, i) => i).filter(i => !wantSeg || SEGMENTS[i][0] === wantSeg);
  const total = svcHits.length * stages.length * segs.length;
  const items = [];
  const start = page * size;
  for (let k = start; k < Math.min(start + size, total); k++) {
    const sg = segs[k % segs.length];
    const st = stages[Math.floor(k / segs.length) % stages.length];
    const s = svcHits[Math.floor(k / (segs.length * stages.length))];
    const { prompt, ...meta } = template(indexOf(s, st, sg));
    items.push(meta);
  }
  return { total, page, size, items };
}

export function render(prompt, vars = {}) {
  return prompt.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (vars[k] !== undefined && vars[k] !== '') return String(vars[k]);
    return k === 'previous_output' ? '(none yet)' : `{{${k}}}`;
  });
}

// One service for one client type as a single megaprompt (Markdown) that walks all ten stages in order,
// and the same thing as a workflow bundle (JSON) a team or an automation tool can run step by step.
const VARS = [['client_name', 'Client name'], ['brief', 'What the client asked for, in their words'], ['language', 'Reply language'], ['deadline', 'Agreed deadline']];
const GATES = new Set(['framework', 'agreement', 'handover']);
export function megaprompt(s, sg) {
  const svc = services[s]; const seg = SEGMENTS[sg]; const t = catTerms[svc.cat]; const cat = catById[svc.cat];
  const md = [
    `# ${svc.code} ${svc.name}: megaprompt for ${seg[1].toLowerCase()} clients`, '',
    `Category: ${cat.name}. Starting price: IDR ${svc.idr.toLocaleString('en-US')}. Service page: /services/${svc.slug}/ Terms: /terms/${svc.slug}/`, '',
    '## How to use', '',
    'Paste this whole file into ChatGPT, Claude or another assistant. Fill the variables first. The assistant works one stage at a time, shows its output, and waits for "next" before moving on. Stages marked GATE need the client\'s written approval or a paid invoice before you continue.', '',
    '## Variables', '', ...VARS.map(([k, d]) => `- {{${k}}}: ${d}`), '',
    '## Role', '',
    `You are a senior specialist delivering "${svc.name}" (${cat.name}, code ${svc.code}) for ${seg[2]}.`, '',
    '## Fixed terms', '',
    `- Scope: ${t.scope.join('; ')}.`, `- Client provides: ${t.need}`, `- Not included: ${t.out}`, `- Rule: ${t.rule}`,
    '- Full payment comes before handover or before anything goes live. The domain is not included.',
    '- Never invent clients, numbers or results. If something is missing, say so and ask.', '',
    '## Workflow', '',
    ...STAGES.flatMap(([id, name, task, out], i) => [`### Stage ${i + 1}. ${name}${GATES.has(id) ? ' (GATE)' : ''}`, '', `Task: ${task}`, '', `Output: ${out}`, '']),
    '## Start', '', 'Begin with Stage 1 using the variables above. After each stage, end with a line starting "NEXT:" and stop.', '',
  ].join('\n');
  const bundle = {
    id: `${svc.code}-${seg[0]}`, service: { code: svc.code, name: svc.name, category: cat.name, slug: svc.slug, price_idr: svc.idr },
    client_type: { id: seg[0], name: seg[1], note: seg[2] }, variables: VARS.map(([key, label]) => ({ key, label })),
    terms: { scope: t.scope, client_provides: t.need, not_included: t.out, rule: t.rule },
    steps: STAGES.map(([id], st) => { const x = template(indexOf(s, st, sg)); return { order: st + 1, id, name: x.stageName, gate: GATES.has(id), prompt: x.prompt, next_input: '{{previous_output}}' }; }),
  };
  return { name: `${svc.code}-${svc.slug}-${seg[0]}`, md, bundle };
}
