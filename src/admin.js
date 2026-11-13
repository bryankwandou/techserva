// Admin dashboard. Accounts and sessions live in Neon (api/auth.js); the client queue lives in this browser's IndexedDB.
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

const call = base => async (action, { params = {}, body } = {}) => {
  const q = new URLSearchParams({ action, ...params });
  const r = await fetch(`/api/${base}?${q}`, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  const j = await r.json().catch(() => ({ error: 'Jawaban server tidak terbaca' }));
  if (!r.ok) { const err = new Error(j.error || 'Gagal'); err.status = r.status; throw err; }
  return j;
};
const auth = call('auth');

let meta = null;
const GOOGLE_NOTE = {
  'google-off': 'Login Google belum diaktifkan di server.',
  'google-failed': 'Login Google gagal. Coba lagi.',
  pending: 'Akun Google ini sudah tercatat dan menunggu persetujuan akun master.',
  disabled: 'Akun ini dinonaktifkan.',
};
const field = (attrs) => h('input', { class: 'field', ...attrs });
const card = (title, ...kids) => h('div', { class: 'auth-card' }, h('h1', {}, title), ...kids);
const linkBtn = (text, view) => h('button', { type: 'button', class: 'linkish', onclick: () => { location.hash = view; } }, text);

async function googleBtn() {
  let on = false;
  try { on = (await auth('config')).google; } catch { /* offline */ }
  return h('a', { class: 'btn google', href: on ? '/api/auth?action=google' : '#login=google-off', onclick: on ? null : e => { e.preventDefault(); location.hash = 'login=google-off'; } },
    h('svg', { viewBox: '0 0 24 24', width: '18', height: '18', 'aria-hidden': 'true' }), 'Masuk dengan Google');
}
const gIcon = el => { const s = el.querySelector('svg'); if (s) s.innerHTML = '<path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7h-4a12 12 0 0 0 0 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"/>'; return el; };

async function login(msg = '') {
  const u = field({ autocomplete: 'username', 'aria-label': 'Username atau email', placeholder: 'Username atau email', required: true });
  const p = field({ type: 'password', autocomplete: 'current-password', 'aria-label': 'Password', placeholder: 'Password', required: true });
  const note = h('p', { class: 'note', role: 'alert' }, msg);
  const form = h('form', { class: 'form', onsubmit: async e => {
    e.preventDefault(); note.textContent = '';
    try { await auth('login', { body: { user: u.value, pass: p.value } }); location.hash = ''; start(); }
    catch (err) { note.textContent = err.message; }
  } }, u, p, h('button', { class: 'btn primary', type: 'submit' }, 'Masuk'), note);
  app.replaceChildren(card('Masuk admin', form, h('p', { class: 'or' }, 'atau'), gIcon(await googleBtn()),
    h('p', { class: 'auth-links' }, linkBtn('Lupa password', 'forgot'), linkBtn('Buat akun', 'register'))));
  u.focus();
}

function register() {
  const u = field({ autocomplete: 'username', placeholder: 'Username', 'aria-label': 'Username', required: true, minlength: '3', maxlength: '32' });
  const m = field({ type: 'email', autocomplete: 'email', placeholder: 'Email', 'aria-label': 'Email', required: true });
  const p = field({ type: 'password', autocomplete: 'new-password', placeholder: 'Password, minimal 8 karakter', 'aria-label': 'Password', required: true, minlength: '8' });
  const p2 = field({ type: 'password', autocomplete: 'new-password', placeholder: 'Ulangi password', 'aria-label': 'Ulangi password', required: true });
  const why = h('textarea', { class: 'field', placeholder: 'Siapa Anda dan untuk apa akses admin ini (opsional)', 'aria-label': 'Catatan', maxlength: '300' });
  const note = h('p', { class: 'note', role: 'alert' });
  const form = h('form', { class: 'form', onsubmit: async e => {
    e.preventDefault(); note.textContent = '';
    if (p.value !== p2.value) { note.textContent = 'Kedua password tidak sama.'; return; }
    try {
      await auth('register', { body: { username: u.value, email: m.value, pass: p.value, note: why.value } });
      app.replaceChildren(card('Permintaan terkirim', h('p', { class: 'lead' }, 'Akun Anda sudah tercatat dan menunggu persetujuan akun master. Setelah disetujui, Anda bisa masuk dengan username dan password tadi.'), h('p', { class: 'auth-links' }, linkBtn('Kembali ke halaman masuk', 'login'))));
    } catch (err) { note.textContent = err.message; }
  } }, u, m, p, p2, why, h('button', { class: 'btn primary', type: 'submit' }, 'Minta akun'), note);
  app.replaceChildren(card('Buat akun admin', h('p', { class: 'note' }, 'Akun baru aktif setelah disetujui akun master.'), form, h('p', { class: 'auth-links' }, linkBtn('Sudah punya akun? Masuk', 'login'))));
}

function forgot() {
  const u = field({ placeholder: 'Username atau email', 'aria-label': 'Username atau email', required: true });
  const note = h('p', { class: 'note', role: 'alert' });
  const form = h('form', { class: 'form', onsubmit: async e => {
    e.preventDefault(); note.textContent = '';
    try {
      await auth('forgot', { body: { user: u.value } });
      app.replaceChildren(card('Permintaan reset tercatat', h('p', { class: 'lead' }, 'Kalau akun itu ada, akun master akan melihat permintaan ini dan mengirim link reset kepada Anda. Link berlaku 2 jam.'), h('p', { class: 'auth-links' }, linkBtn('Kembali ke halaman masuk', 'login'))));
    } catch (err) { note.textContent = err.message; }
  } }, u, h('button', { class: 'btn primary', type: 'submit' }, 'Minta link reset'), note);
  app.replaceChildren(card('Lupa password', h('p', { class: 'note' }, 'Akun yang tersambung ke Google juga bisa langsung masuk dengan tombol Google.'), form, h('p', { class: 'auth-links' }, linkBtn('Kembali ke halaman masuk', 'login'))));
}

function reset(t) {
  const p = field({ type: 'password', autocomplete: 'new-password', placeholder: 'Password baru, minimal 8 karakter', 'aria-label': 'Password baru', required: true, minlength: '8' });
  const p2 = field({ type: 'password', autocomplete: 'new-password', placeholder: 'Ulangi password baru', 'aria-label': 'Ulangi password baru', required: true });
  const note = h('p', { class: 'note', role: 'alert' });
  const form = h('form', { class: 'form', onsubmit: async e => {
    e.preventDefault(); note.textContent = '';
    if (p.value !== p2.value) { note.textContent = 'Kedua password tidak sama.'; return; }
    try { await auth('reset', { body: { token: t, pass: p.value } }); history.replaceState(null, '', '/admin/'); login('Password sudah diganti. Silakan masuk.'); }
    catch (err) { note.textContent = err.message; }
  } }, p, p2, h('button', { class: 'btn primary', type: 'submit' }, 'Simpan password baru'), note);
  app.replaceChildren(card('Buat password baru', form));
}

function route() {
  const hsh = location.hash.slice(1);
  if (hsh.startsWith('reset=')) return reset(hsh.slice(6));
  if (hsh === 'register') return register();
  if (hsh === 'forgot') return forgot();
  if (hsh.startsWith('login=')) return login(GOOGLE_NOTE[hsh.slice(6)] || '');
  return start();
}

async function start() {
  try { meta = await api('meta'); }
  catch (e) { return login(e.status === 401 ? '' : e.message); }
  if (location.hash && !location.hash.startsWith('#reset')) history.replaceState(null, '', '/admin/');
  await openDB();
  const panel = h('div', { id: 'panel' });
  const tabs = [['Templates', templates], ['Client loop', loop], ['Permintaan klien', leads], ['Pengunjung', visits], ...(meta.me.role === 'master' ? [['Akun', accounts]] : []), ['Akun saya', mine]];
  const bar = h('div', { class: 'tabs', role: 'tablist' }, tabs.map(([name, fn], i) => h('button', { role: 'tab', 'aria-selected': String(i === 0), onclick: e => {
    bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', 'false'));
    e.currentTarget.setAttribute('aria-selected', 'true'); fn(panel);
  } }, name)));
  app.replaceChildren(
    h('div', { class: 'row-gap', style: 'justify-content:space-between' },
      h('h1', { style: 'font-size:2.6rem' }, 'Techserva admin'),
      h('div', { class: 'row-gap' },
        h('span', { class: 'note' }, `${meta.me.username}${meta.me.role === 'master' ? ' (master)' : ''}`),
        h('button', { class: 'tool', onclick: () => { const d = document.documentElement; d.dataset.theme = d.dataset.theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('theme', d.dataset.theme); } catch {} } }, 'Terang atau gelap'),
        h('button', { class: 'tool', onclick: async () => { await auth('logout'); login('Anda sudah keluar.'); } }, 'Keluar'))),
    bar, panel);
  templates(panel);
}

const when = t => (t ? new Date(t).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-');
const STATUS = { active: 'aktif', pending: 'menunggu', disabled: 'nonaktif' };

async function accounts(panel) {
  const note = h('p', { class: 'note', role: 'alert' });
  const out = h('div');
  const act = async (action, id, confirmText) => {
    if (confirmText && !confirm(confirmText)) return;
    try {
      const r = await api(action, { body: { id } });
      if (r.link) {
        const box = h('input', { class: 'field', readonly: true, value: r.link, 'aria-label': 'Link reset' });
        note.replaceChildren(`Link reset (berlaku ${r.hours} jam, sekali pakai). Kirim ke pemilik akun: `, box, h('button', { class: 'tool', onclick: e => copy(r.link, e.currentTarget) }, 'Salin'));
        box.select();
      } else note.textContent = 'Tersimpan.';
      draw();
    } catch (e) { note.textContent = e.message; }
  };
  const u = field({ placeholder: 'Username', 'aria-label': 'Username', required: true });
  const m = field({ type: 'email', placeholder: 'Email (opsional)', 'aria-label': 'Email' });
  const p = field({ type: 'text', placeholder: 'Password awal, minimal 8 karakter', 'aria-label': 'Password awal', required: true, minlength: '8' });
  const create = h('form', { class: 'form', onsubmit: async e => {
    e.preventDefault();
    try { await api('create', { body: { username: u.value, email: m.value, pass: p.value } }); note.textContent = `Akun ${u.value} dibuat dan langsung aktif.`; u.value = m.value = p.value = ''; draw(); }
    catch (err) { note.textContent = err.message; }
  } }, h('h3', {}, 'Buat akun baru'), u, m, p, h('button', { class: 'btn primary', type: 'submit' }, 'Buat akun'));
  const draw = async () => {
    const r = await api('accounts');
    const pending = r.accounts.filter(a => a.status === 'pending');
    const resets = r.accounts.filter(a => a.wants_reset);
    out.replaceChildren(
      h('h3', { style: 'margin-top:8px' }, `Menunggu persetujuan (${pending.length})`),
      pending.length ? h('table', { class: 'data' }, h('tbody', {}, pending.map(a => h('tr', {},
        h('td', {}, h('b', {}, a.username)), h('td', {}, a.email || '-'), h('td', {}, a.note || ''), h('td', {}, when(a.created_at)),
        h('td', {}, h('div', { class: 'row-gap' }, h('button', { class: 'btn primary', onclick: () => act('approve', a.id) }, 'Setujui'), h('button', { class: 'tool', onclick: () => act('reject', a.id, `Tolak dan hapus permintaan ${a.username}?`) }, 'Tolak'))))))) : h('p', { class: 'note' }, 'Tidak ada.'),
      h('h3', { style: 'margin-top:24px' }, `Minta reset password (${resets.length})`),
      resets.length ? h('table', { class: 'data' }, h('tbody', {}, resets.map(a => h('tr', {}, h('td', {}, h('b', {}, a.username)), h('td', {}, a.email || '-'),
        h('td', {}, a.role === 'master' ? 'Akun master: pakai login Google atau skrip seed' : h('button', { class: 'btn primary', onclick: () => act('reset-link', a.id) }, 'Buat link reset')))))) : h('p', { class: 'note' }, 'Tidak ada.'),
      h('h3', { style: 'margin-top:24px' }, `Semua akun (${r.accounts.length})`),
      h('table', { class: 'data' }, h('thead', {}, h('tr', {}, ...['Username', 'Email', 'Peran', 'Status', 'Google', 'Terakhir masuk', ''].map(x => h('th', {}, x)))),
        h('tbody', {}, r.accounts.map(a => h('tr', {},
          h('td', {}, a.username), h('td', {}, a.email || '-'), h('td', {}, a.role), h('td', {}, STATUS[a.status] || a.status), h('td', {}, a.google ? 'ya' : '-'), h('td', {}, when(a.last_login)),
          h('td', {}, a.role === 'master' ? '' : h('div', { class: 'row-gap' },
            a.status === 'active' ? h('button', { class: 'tool', onclick: () => act('disable', a.id) }, 'Nonaktifkan') : a.status === 'disabled' ? h('button', { class: 'tool', onclick: () => act('enable', a.id) }, 'Aktifkan') : null,
            a.status !== 'pending' ? h('button', { class: 'tool', onclick: () => act('reset-link', a.id) }, 'Link reset') : null,
            h('button', { class: 'tool', onclick: () => act('delete', a.id, `Hapus akun ${a.username}?`) }, 'Hapus'))))))),
      h('h3', { style: 'margin-top:24px' }, 'Aktivitas terakhir'),
      h('table', { class: 'data' }, h('tbody', {}, r.log.map(l => h('tr', {}, h('td', {}, when(l.created_at)), h('td', {}, l.username || '-'), h('td', {}, l.action), h('td', {}, l.detail || ''))))));
  };
  panel.replaceChildren(h('div', { class: 'two', style: 'align-items:start;margin-top:12px' }, h('div', {}, note, out), create));
  draw().catch(e => { note.textContent = e.message; });
}

async function visits(panel) {
  const days = h('select', { class: 'field', 'aria-label': 'Rentang', style: 'max-width:200px;min-height:42px' }, [7, 30, 90, 365].map(d => h('option', { value: d, selected: d === 7 }, `${d} hari terakhir`)));
  const out = h('div'); let last = null;
  const NAME = { 'web.id': 'techserva.web.id', 'my.id': 'techserva.my.id', 'vercel.app': 'techserva.vercel.app', other: 'lainnya' };
  const card = (n, label, cls) => h('div', { class: `an-card ${cls || ''}` }, h('b', {}, fmt(n)), h('span', {}, label));
  const table = (head, rows) => h('table', { class: 'data' }, h('thead', {}, h('tr', {}, ...head.map(x => h('th', {}, x)))), h('tbody', {}, rows));
  const csv = () => {
    if (!last) return;
    const lines = [['bagian', 'nama', 'tayangan', 'pengunjung unik'].join(',')];
    last.trend.forEach(t => lines.push(['harian', t.day, t.views, ''].join(',')));
    last.sources.forEach(x => lines.push(['alamat', NAME[x.source] || x.source, x.views, x.uniques].join(',')));
    last.pages.forEach(x => lines.push(['halaman', `"${x.path}"`, x.views, x.uniques].join(',')));
    last.countries.forEach(x => lines.push(['negara', x.country, x.views, ''].join(',')));
    last.wa.forEach(x => lines.push(['klik whatsapp', `"${x.detail}"`, x.clicks, ''].join(',')));
    const a = h('a', { href: URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' })), download: `techserva-pengunjung-${days.value}hari.csv` }); a.click(); URL.revokeObjectURL(a.href);
  };
  const draw = async () => {
    out.replaceChildren(h('p', { class: 'note' }, 'Memuat'));
    try {
      const r = last = await api('visits', { params: { days: days.value } });
      const max = Math.max(1, ...r.trend.map(t => t.views)); const total = Math.max(1, r.total.views);
      out.replaceChildren(
        h('div', { class: 'an-cards' }, card(r.total.views, 'Total tayangan halaman'), card(r.total.uniques, 'Pengunjung unik', 'b'), card(r.total.today, 'Tayangan hari ini', 'c'), card(r.total.wa, 'Klik WhatsApp', 'd'), card(r.total.leads, 'Permintaan lewat formulir', 'e')),
        h('section', { class: 'an-box' }, h('div', { class: 'an-head' }, h('b', {}, `Tren pengunjung, ${r.days} hari`), h('span', { class: 'note' }, `${fmt(r.total.views)} tayangan`)),
          h('div', { class: 'an-chart' }, r.trend.map(t => h('div', { class: 'an-col', title: `${t.day}: ${t.views} tayangan (web.id ${t.web}, my.id ${t.my}, vercel.app ${t.vercel})` },
            h('small', {}, t.views ? String(t.views) : ''),
            h('div', { class: 'an-stack', style: `height:${(t.views / max) * 100}%` }, h('i', { class: 'web', style: `flex:${t.web}` }), h('i', { class: 'my', style: `flex:${t.my}` }), h('i', { class: 'vc', style: `flex:${t.vercel}` }), h('i', { class: 'ot', style: `flex:${Math.max(0, t.views - t.web - t.my - t.vercel)}` })),
            h('span', {}, t.day.slice(5).replace('-', '/'))))),
          h('p', { class: 'an-legend' }, h('i', { class: 'web' }), 'techserva.web.id ', h('i', { class: 'my' }), 'techserva.my.id ', h('i', { class: 'vc' }), 'techserva.vercel.app ', h('i', { class: 'ot' }), 'lainnya')),
        h('div', { class: 'two', style: 'align-items:start;gap:24px' },
          h('section', { class: 'an-box' }, h('div', { class: 'an-head' }, h('b', {}, 'Per alamat domain')), table(['Alamat', 'Tayangan', 'Unik'], r.sources.map(x => h('tr', {}, h('td', {}, NAME[x.source] || x.source), h('td', {}, fmt(x.views)), h('td', {}, fmt(x.uniques)))))),
          h('section', { class: 'an-box' }, h('div', { class: 'an-head' }, h('b', {}, 'Negara')), table(['Negara', 'Tayangan'], r.countries.map(x => h('tr', {}, h('td', {}, x.country), h('td', {}, fmt(x.views))))))),
        h('section', { class: 'an-box' }, h('div', { class: 'an-head' }, h('b', {}, 'Rincian per halaman'), h('span', { class: 'note' }, `${r.pages.length} halaman`)),
          table(['Halaman', 'Tayangan', 'Pengunjung unik', '% dari total'], r.pages.map(x => h('tr', {}, h('td', { style: 'font-family:var(--mono);font-size:.85rem' }, x.path), h('td', {}, fmt(x.views)), h('td', {}, fmt(x.uniques)),
            h('td', {}, h('div', { class: 'an-pct' }, h('i', { style: `width:${(x.views / total) * 100}%` })), `${((x.views / total) * 100).toFixed(1)}%`))))),
        h('section', { class: 'an-box' }, h('div', { class: 'an-head' }, h('b', {}, 'Tombol WhatsApp yang diklik')),
          r.wa.length ? table(['Tombol', 'Klik'], r.wa.map(x => h('tr', {}, h('td', { style: 'font-family:var(--mono);font-size:.85rem' }, x.detail || '-'), h('td', {}, fmt(x.clicks))))) : h('p', { class: 'note', style: 'padding:14px' }, 'Belum ada klik.')));
    } catch (e) { out.replaceChildren(h('p', { role: 'alert' }, e.message)); }
  };
  days.addEventListener('change', draw);
  panel.replaceChildren(
    h('p', { class: 'an-note' }, h('b', {}, 'Penghitung milik situs sendiri. '), 'Menghitung halaman yang benar-benar dibuka di browser setelah JavaScript berjalan, jadi bot dan crawler tidak terhitung. Data disimpan di database Neon Techserva. Tidak ada IP yang disimpan.'),
    h('div', { class: 'row-gap' }, days, h('button', { class: 'btn', onclick: csv }, 'Unduh CSV'), h('button', { class: 'btn primary', onclick: draw }, 'Muat ulang')), out);
  draw();
}

function mine(panel) {
  const note = h('p', { class: 'note', role: 'alert' });
  const cur = field({ type: 'password', autocomplete: 'current-password', placeholder: 'Password lama', 'aria-label': 'Password lama' });
  const p = field({ type: 'password', autocomplete: 'new-password', placeholder: 'Password baru, minimal 8 karakter', 'aria-label': 'Password baru', minlength: '8', required: true });
  const m = field({ type: 'email', value: meta.me.email || '', placeholder: 'Email untuk login Google', 'aria-label': 'Email' });
  const say = t => { note.textContent = t; };
  panel.replaceChildren(h('div', { class: 'two', style: 'align-items:start;margin-top:12px' },
    h('form', { class: 'form', onsubmit: async e => { e.preventDefault(); try { await api('password', { body: { current: cur.value, pass: p.value } }); cur.value = p.value = ''; say('Password diganti.'); } catch (err) { say(err.message); } } },
      h('h3', {}, 'Ganti password'), cur, p, h('button', { class: 'btn primary', type: 'submit' }, 'Simpan password')),
    h('div', {},
      h('form', { class: 'form', onsubmit: async e => { e.preventDefault(); try { await api('email', { body: { email: m.value } }); meta.me.email = m.value; say('Email disimpan. Akun Google dengan email ini bisa dipakai untuk masuk.'); } catch (err) { say(err.message); } } },
        h('h3', {}, 'Email dan Google'), h('p', { class: 'note' }, meta.me.google ? 'Akun Google sudah tersambung.' : 'Belum ada akun Google yang tersambung. Isi email Gmail Anda, lalu masuk sekali dengan tombol Google.'), m,
        h('div', { class: 'row-gap' }, h('button', { class: 'btn', type: 'submit' }, 'Simpan email'), meta.me.google ? h('button', { class: 'tool', type: 'button', onclick: async () => { await api('unlink-google', { body: {} }); meta.me.google = false; say('Akun Google dilepas.'); } }, 'Lepas Google') : null)),
      h('div', { class: 'form' }, h('h3', {}, 'Sesi'), h('button', { class: 'tool', onclick: async () => { await api('signout-all', { body: {} }); login('Semua sesi sudah keluar.'); } }, 'Keluar dari semua perangkat')),
      note)));
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
addEventListener('hashchange', route);
route();
