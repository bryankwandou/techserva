// The service assistant. Answers come from the site's own catalog, terms and FAQ, with a link
// to the source. No AI model and no server call: the whole knowledge base runs in the browser.
import { buildIndex, search } from '/assets/rag.mjs';

const $ = (s, r = document) => r.querySelector(s);
let index = null; let ctx = null;

async function ensureIndex(state, tr) {
  if (index && index.lang === state.lang) return index;
  const kb = await (await fetch('/assets/kb.json')).json();
  const docs = kb.map(d => ({ ...d, titleEn: d.title, textEn: d.text, title: tr(d.tk, d.title), text: tr(d.xk, d.text) }));
  index = buildIndex(docs); index.lang = state.lang;
  return index;
}
// A WhatsApp link that carries the question, so the admin sees what the assistant could not answer.
const waLink = (kind, label, query, code) => {
  const a = el('a', 'wa-chat', label); a.href = ctx.waHref(kind, kind === 'custom' ? 'assistant/no-answer' : 'assistant/answer', { query, code });
  a.target = '_blank'; a.rel = 'noopener'; return a;
};
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

// `hint` is the English wording of a suggestion chip: the chip shows the visitor's language,
// and the hint keeps the search exact even when the translation drifts.
function answer(query, hint = '') {
  const { tr, money, ui } = ctx;
  const label = k => tr(ui[k][0], ui[k][1]);
  const hits = search(index, hint || query, 6);
  const box = el('div', 'msg bot');
  const top = hits[0];
  if (!top || top.score < 2.2 || top.coverage < 0.34) {
    box.textContent = tr(ui.chat_none[0], ui.chat_none[1]);
    const a = el('a', '', tr(ui.nav_services[0], ui.nav_services[1])); a.href = '/services/'; a.style.display = 'block'; a.style.marginTop = '8px';
    box.append(a, waLink('custom', label('wa_custom_btn'), query));
    return box;
  }
  const d = top.doc;
  if (d.type === 'service') {
    const line = el('span', '');
    const name = el('a', '', d.title); name.href = d.url;
    line.append(name, ` ${tr(ui.chat_starts[0], ui.chat_starts[1])} ${money(d.idr)}.`);
    box.append(line);
    const terms = el('a', 'src', `${tr(ui.svc_terms[0], ui.svc_terms[1])}`); terms.href = `/terms/${d.slug}/`; box.append(terms);
  } else {
    box.append(el('span', '', d.text));
    const src = el('a', 'src', `${tr(ui.chat_sources[0], ui.chat_sources[1])}: ${d.title}`); src.href = d.url; box.append(src);
  }
  const more = hits.slice(1).filter(h => h.doc.type === 'service' && h.score > top.score * 0.45).slice(0, 3);
  if (more.length) {
    const ul = el('ul');
    more.forEach(h => { const li = el('li'); const a = el('a', '', h.doc.title); a.href = h.doc.url; li.append(a, ` · ${money(h.doc.idr)}`); ul.append(li); });
    box.append(el('span', 'src', tr(ui.chat_try[0], ui.chat_try[1])), ul);
  }
  box.append(waLink(d.type === 'service' ? 'order' : 'chat', label(d.type === 'service' ? 'wa_order' : 'wa_admin'), d.type === 'service' ? '' : query, d.code || ''));
  return box;
}

export async function init(state, { tr, money, waHref, waReady }) {
  const ui = await (await fetch('/assets/chat-ui.json')).json();
  ctx = { tr, money, ui, waHref };
  waReady().catch(() => {});
  const panel = $('#chat'); const opener = $('#chat-open'); const log = $('#chat-log'); const form = $('#chat-form'); const input = $('#chat-input');
  const openIt = async () => {
    panel.hidden = false; opener.hidden = true;
    if (!log.children.length) log.append(el('div', 'msg bot', tr(ui.chat_hello[0], ui.chat_hello[1])));
    input.focus({ preventScroll: true });
    await ensureIndex(state, tr);
  };
  const ask = async (q, hint) => {
    log.append(el('div', 'msg me', q));
    await ensureIndex(state, tr);
    log.append(answer(q, hint));
    log.scrollTop = log.scrollHeight;
  };
  opener.addEventListener('click', openIt);
  document.querySelectorAll('[data-open-chat]').forEach(b => b.addEventListener('click', openIt));
  $('#chat-close').addEventListener('click', () => { panel.hidden = true; opener.hidden = false; opener.focus(); });
  form.addEventListener('submit', e => { e.preventDefault(); const q = input.value.trim().slice(0, 300); if (!q) return; input.value = ''; ask(q); });
  document.querySelectorAll('#chat .chips button').forEach(b => b.addEventListener('click', () => ask(b.textContent, b.dataset.en)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) $('#chat-close').click(); });
  addEventListener('langchange', () => { index = null; });
}
