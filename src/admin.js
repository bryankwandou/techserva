// Admin dashboard. The client queue lives in this browser's IndexedDB; it holds no data on the server.
const app = document.getElementById('app');
const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  e.append(...kids.flat().filter(x => x != null));
  return e;
};
const api = async (action, { params = {}, body } = {}) => {
  const q = new URLSearchParams({ action, ...params });
  const r = await fetch(`/api/admin?${q}`, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  const j = await r.json().catch(() => ({ error: 'Bad response' }));
  if (!r.ok) { const err = new Error(j.error || 'Failed'); err.status = r.status; throw err; }
  return j;
};
const fmt = n => n.toLocaleString('en');

/* IndexedDB queue */
const DB = { db: null };
const openDB = () => new Promise((ok, no) => {
  const r = indexedDB.open('techserva-loop', 1);
  r.onupgradeneeded = () => { const s = r.result.createObjectStore('jobs', { keyPath: 'id', autoIncrement: true }); s.createIndex('state', 'state'); };
  r.onsuccess = () => { DB.db = r.result; ok(); }; r.onerror = () => no(r.error);
});
const tx = (mode, fn) => new Promise((ok, no) => {
  const t = DB.db.transaction('jobs', mode); const res = fn(t.objectStore('jobs'));
  t.oncomplete = () => ok(res && res.result !== undefined ? res.result : res); t.onerror = () => no(t.error);
});
const countState = st => tx('readonly', s => (st ? s.index('state').count(st) : s.count()));
const nextJob = () => new Promise((ok, no) => {
  const q = DB.db.transaction('jobs').objectStore('jobs').index('state').openCursor('queued');
  q.onsuccess = () => ok(q.result ? q.result.value : null); q.onerror = () => no(q.error);
});
const putJob = j => tx('readwrite', s => s.put(j));
const addJobs = jobs => tx('readwrite', s => { jobs.forEach(j => s.add(j)); });

let meta = null;

function login(msg = '') {
  const u = h('input', { class: 'field', autocomplete: 'username', 'aria-label': 'Username', placeholder: 'Username' });
  const p = h('input', { class: 'field', type: 'password', autocomplete: 'current-password', 'aria-label': 'Password', placeholder: 'Password' });
  const note = h('p', { class: 'note', role: 'alert' }, msg);
  const form = h('form', { class: 'form', style: 'max-width:380px', onsubmit: async e => {
    e.preventDefault();
    try { await api('login', { body: { user: u.value, pass: p.value } }); start(); }
    catch (err) { note.textContent = err.message; }
  } }, u, p, h('button', { class: 'btn primary', type: 'submit' }, 'Sign in'), note);
  app.replaceChildren(h('h1', { style: 'font-size:3rem;margin-top:48px' }, 'Admin'), form);
}

async function start() {
  try { meta = await api('meta'); }
  catch (e) { if (e.status === 401) return login(); return login(e.message); }
  await openDB();
  const panel = h('div', { id: 'panel' });
  const tabs = [['Templates', templates], ['Client loop', loop], ['Requests', leads]];
  const bar = h('div', { class: 'tabs', role: 'tablist' }, tabs.map(([name, fn], i) => h('button', { role: 'tab', 'aria-selected': String(i === 0), onclick: e => {
    bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', 'false'));
    e.currentTarget.setAttribute('aria-selected', 'true'); fn(panel);
  } }, name)));
  app.replaceChildren(
    h('div', { class: 'row-gap', style: 'justify-content:space-between' },
      h('h1', { style: 'font-size:2.6rem' }, 'Techserva admin'),
      h('div', { class: 'row-gap' },
        h('button', { class: 'tool', onclick: () => { const d = document.documentElement; d.dataset.theme = d.dataset.theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('theme', d.dataset.theme); } catch {} } }, 'Light or dark'),
        h('button', { class: 'tool', onclick: async () => { await api('logout'); login(); } }, 'Sign out'))),
    bar, panel);
  templates(panel);
}

const options = (list, label) => [h('option', { value: '' }, label), ...list.map(x => h('option', { value: x.id }, x.name))];
const copy = async (text, btn) => { await navigator.clipboard.writeText(text); const t = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = t; }, 1200); };

function templates(panel) {
  const q = h('input', { class: 'field', type: 'search', placeholder: 'Search service, e.g. landing page or TS-001', 'aria-label': 'Search templates', style: 'flex:1 1 280px' });
  const cat = h('select', { class: 'field', 'aria-label': 'Category', style: 'flex:0 1 240px' }, options(meta.categories, 'All categories'));
  const stage = h('select', { class: 'field', 'aria-label': 'Stage', style: 'flex:0 1 200px' }, options(meta.stages, 'All stages'));
  const seg = h('select', { class: 'field', 'aria-label': 'Client type', style: 'flex:0 1 200px' }, options(meta.segments, 'All client types'));
  const info = h('p', { class: 'note' }); const rows = h('tbody'); const detail = h('div'); const pager = h('div', { class: 'row-gap' });
  let page = 0; let timer;
  const run = async () => {
    const r = await api('search', { params: { q: q.value, category: cat.value, stage: stage.value, segment: seg.value, page, size: 25 } });
    info.textContent = `${fmt(r.total)} of ${fmt(meta.total)} templates. Page ${page + 1}.`;
    rows.replaceChildren(...r.items.map(t => h('tr', { class: 'rowlink', tabindex: '0', onclick: () => show(t.index), onkeydown: e => { if (e.key === 'Enter') show(t.index); } },
      h('td', { style: 'font-family:var(--mono);font-size:.8rem' }, t.id), h('td', {}, t.service), h('td', {}, t.stageName), h('td', {}, t.segmentName))));
    pager.replaceChildren(
      h('button', { class: 'tool', disabled: page === 0, onclick: () => { page--; run(); } }, 'Previous'),
      h('button', { class: 'tool', disabled: (page + 1) * 25 >= r.total, onclick: () => { page++; run(); } }, 'Next'));
  };
  const show = async i => {
    const t = await api('template', { params: { index: i } });
    const copyBtn = h('button', { class: 'btn primary', onclick: e => copy(t.prompt, e.currentTarget) }, 'Copy for ChatGPT');
    detail.replaceChildren(h('h2', { style: 'font-size:1.8rem;margin-top:22px' }, t.id), h('pre', { class: 'prompt' }, t.prompt), copyBtn);
    detail.scrollIntoView({ block: 'nearest' });
  };
  q.addEventListener('input', () => { clearTimeout(timer); page = 0; timer = setTimeout(run, 220); });
  [cat, stage, seg].forEach(s => s.addEventListener('change', () => { page = 0; run(); }));
  panel.replaceChildren(h('div', { class: 'row-gap' }, q, cat, stage, seg), info,
    h('table', { class: 'data' }, h('thead', {}, h('tr', {}, ...['Template id', 'Service', 'Stage', 'Client type'].map(x => h('th', {}, x)))), rows), pager, detail);
  run();
}

function loop(panel) {
  const stats = h('div', { class: 'stat-row' }); const work = h('div'); const log = h('p', { class: 'note' });
  const refresh = async () => {
    const [all, queued, done] = await Promise.all([countState(), countState('queued'), countState('done')]);
    stats.replaceChildren(h('div', {}, h('b', {}, fmt(all)), 'clients in this browser'), h('div', {}, h('b', {}, fmt(queued)), 'waiting for next step'), h('div', {}, h('b', {}, fmt(done)), 'finished all 10 stages'));
  };
  const name = h('input', { class: 'field', placeholder: 'Client name', 'aria-label': 'Client name' });
  const svc = h('select', { class: 'field', 'aria-label': 'Service' }, meta.services.map(s => h('option', { value: s.code }, `${s.code} ${s.name}`)));
  const seg = h('select', { class: 'field', 'aria-label': 'Client type' }, meta.segments.map(s => h('option', { value: s.id }, s.name)));
  const brief = h('textarea', { class: 'field', placeholder: 'Brief', 'aria-label': 'Brief' });
  const lang = h('input', { class: 'field', value: 'English', 'aria-label': 'Reply language' });
  const add = h('form', { class: 'form', onsubmit: async e => {
    e.preventDefault(); if (!name.value.trim()) return;
    await addJobs([{ name: name.value.trim(), service: svc.value, segment: seg.value, brief: brief.value, language: lang.value, stage: 0, state: 'queued', last: '', history: [], at: Date.now() }]);
    name.value = ''; brief.value = ''; refresh();
  } }, h('h3', {}, 'Add a client'), name, svc, seg, lang, brief, h('button', { class: 'btn', type: 'submit' }, 'Add to queue'));

  const stress = h('input', { class: 'field', type: 'number', value: '50000', min: '1', max: '50000', 'aria-label': 'Sample clients', style: 'max-width:150px' });
  const load = h('button', { class: 'btn', id: 'load-test', onclick: async () => {
    const n = Math.min(50000, +stress.value || 0); const t0 = performance.now();
    for (let i = 0; i < n; i += 5000) {
      const chunk = [];
      for (let k = i; k < Math.min(n, i + 5000); k++) {
        const s = meta.services[k % meta.services.length]; const g = meta.segments[k % meta.segments.length];
        chunk.push({ name: `Sample ${k + 1}`, service: s.code, segment: g.id, brief: 'Sample record for a capacity test.', language: 'English', stage: 0, state: 'queued', last: '', history: [], at: Date.now(), sample: true });
      }
      await addJobs(chunk);
    }
    log.textContent = `Added ${fmt(n)} sample clients in ${((performance.now() - t0) / 1000).toFixed(1)} seconds.`;
    log.dataset.done = '1'; refresh();
  } }, 'Add sample clients');
  const clear = h('button', { class: 'tool', onclick: async () => {
    await new Promise(ok => { const t = DB.db.transaction('jobs', 'readwrite'); t.objectStore('jobs').clear(); t.oncomplete = ok; });
    work.replaceChildren(); refresh();
  } }, 'Empty this queue');

  const next = async () => {
    const j = await nextJob();
    if (!j) { work.replaceChildren(h('p', { class: 'note', style: 'margin-top:14px' }, 'Nothing is waiting.')); return; }
    const stageId = meta.stages[j.stage].id;
    const r = await api('prompt', { body: { service: j.service, stage: stageId, segment: j.segment, vars: { client_name: j.name, brief: j.brief, language: j.language, deadline: j.deadline || 'as agreed', previous_output: j.last } } });
    const out = h('textarea', { class: 'field', placeholder: 'Paste the ChatGPT reply here', 'aria-label': 'ChatGPT reply', style: 'min-height:160px' });
    const save = async () => {
      if (!out.value.trim()) { out.focus(); return; }
      j.history.push({ stage: stageId, at: Date.now() }); j.last = out.value.slice(0, 20000); j.stage += 1;
      if (j.stage >= meta.stages.length) j.state = 'done';
      await putJob(j); await refresh(); next();
    };
    work.replaceChildren(
      h('h3', { style: 'margin-top:20px' }, `${j.name}: step ${j.stage + 1} of ${meta.stages.length}, ${meta.stages[j.stage].name}`),
      h('p', { class: 'note' }, r.id), h('pre', { class: 'prompt', id: 'loop-prompt' }, r.prompt),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn primary', onclick: e => copy(r.prompt, e.currentTarget) }, 'Copy prompt'),
        h('a', { class: 'btn', href: 'https://chatgpt.com/', target: '_blank', rel: 'noopener' }, 'Open ChatGPT')),
      out, h('div', { class: 'row-gap' }, h('button', { class: 'btn', id: 'loop-save', onclick: save }, 'Save and go to next')));
  };
  const exportJobs = async () => {
    const all = await tx('readonly', s => s.getAll());
    const blob = new Blob([all.map(j => JSON.stringify(j)).join('\n')], { type: 'application/x-ndjson' });
    const a = h('a', { href: URL.createObjectURL(blob), download: 'techserva-clients.jsonl' }); a.click(); URL.revokeObjectURL(a.href);
  };
  panel.replaceChildren(stats,
    h('p', { class: 'note', style: 'margin-top:12px' }, 'How the loop works: pick up the next waiting client, copy the prompt into ChatGPT, paste the reply back. The reply feeds the next stage. The queue is stored in this browser only, so export it to keep a copy.'),
    h('div', { class: 'row-gap', style: 'margin-top:14px' }, h('button', { class: 'btn primary', id: 'loop-next', onclick: next }, 'Next client'), h('button', { class: 'tool', onclick: exportJobs }, 'Export as JSONL')),
    work,
    h('div', { class: 'two', style: 'margin-top:36px;align-items:start' }, add,
      h('div', {}, h('h3', {}, 'Capacity test'), h('p', { class: 'note' }, 'Adds sample records to prove the queue can hold this many clients. It does not make ChatGPT serve them at once.'), h('div', { class: 'row-gap' }, stress, load, clear), log)));
  refresh();
}

async function leads(panel) {
  panel.replaceChildren(h('p', { class: 'note' }, 'Loading'));
  try {
    const r = await api('leads');
    if (!r.configured) return panel.replaceChildren(h('p', {}, 'Request storage is not connected yet.'));
    if (!r.leads.length) return panel.replaceChildren(h('p', {}, 'No requests yet.'));
    panel.replaceChildren(h('table', { class: 'data' }, h('thead', {}, h('tr', {}, ...['Reference', 'Service', 'Name', 'Contact', 'Brief', 'Language', 'Received'].map(x => h('th', {}, x)))),
      h('tbody', {}, r.leads.map(l => h('tr', {}, h('td', {}, l.reference), h('td', {}, l.service), h('td', {}, l.name), h('td', {}, l.contact), h('td', {}, l.brief), h('td', {}, l.lang), h('td', {}, l.at.slice(0, 16).replace('T', ' ')))))));
  } catch (e) { panel.replaceChildren(h('p', { role: 'alert' }, e.message)); }
}
start();
