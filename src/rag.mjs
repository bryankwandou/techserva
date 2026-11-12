// Retrieval without an AI model: BM25 over the catalog, terms and FAQ, in any language.
const STOP = new Set('the a an of to in on for and or is are do does i you we my your it can how what when which who with me be at this that have need want please saya mau butuh yang di ke dari untuk dan atau apa berapa bisa ada perlu memerlukan membutuhkan ingin tolong kak gan sebuah satu buat bikin jasa pakai dengan aku kami'.split(' '));
const ALIAS = { price: 'cost', prices: 'cost', pricing: 'cost', harga: 'cost', biaya: 'cost', much: 'cost', pay: 'payment', paying: 'payment', paid: 'payment', payments: 'payment', bayar: 'payment', pembayaran: 'payment', lunas: 'payment', revision: 'revisions', revisi: 'revisions', website: 'site', websites: 'site', situs: 'site', pages: 'page', halaman: 'page', apps: 'app', aplikasi: 'app', games: 'game', bots: 'bot', chatbot: 'bot', chatbots: 'bot', pentest: 'penetration', pen: 'penetration', arahan: 'landing', toko: 'store', permainan: 'game', kritik: 'critique', revisinya: 'revisions', keamanan: 'security', tests: 'test', testing: 'test', crypto: 'usdt', kripto: 'usdt', usdc: 'usdt', tether: 'usdt' };
const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null;

export function tokenize(text) {
  const clean = String(text).toLowerCase().normalize('NFKC');
  const words = seg
    ? [...seg.segment(clean)].filter(s => s.isWordLike).map(s => s.segment)
    : clean.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const out = [];
  for (const w of words) {
    if (STOP.has(w)) continue;
    out.push(ALIAS[w] || w);
    if (/[぀-ヿ一-鿿가-힯฀-๿]/.test(w) && w.length > 2) {
      for (let i = 0; i < w.length - 1; i++) out.push(w.slice(i, i + 2));
    }
  }
  return out;
}

export function buildIndex(docs) {
  const postings = new Map(); const lens = [];
  docs.forEach((d, i) => {
    const counts = new Map();
    const add = (text, weight) => { for (const t of tokenize(text)) counts.set(t, (counts.get(t) || 0) + weight); };
    add(d.title, 3); add(d.text, 1);
    if (d.titleEn && d.titleEn !== d.title) add(d.titleEn, 2);
    if (d.textEn && d.textEn !== d.text) add(d.textEn, 0.5);
    let len = 0;
    counts.forEach((c, t) => { len += c; if (!postings.has(t)) postings.set(t, []); postings.get(t).push([i, c]); });
    lens.push(len);
  });
  return { docs, postings, lens, avg: lens.reduce((a, b) => a + b, 0) / (lens.length || 1) };
}

export function search(index, query, k = 5) {
  const { docs, postings, lens, avg } = index;
  const K1 = 1.4, B = 0.7, N = docs.length;
  const scores = new Map(); const coverage = new Map();
  // Words the catalog never uses (filler, typos, other phrasing) do not count against a match.
  const all = [...new Set(tokenize(query))]; const known = all.filter(t => postings.has(t));
  const terms = known.length ? known : all;
  for (const t of terms) {
    const list = postings.get(t);
    if (!list) continue;
    const idf = Math.log(1 + (N - list.length + 0.5) / (list.length + 0.5));
    for (const [i, c] of list) {
      scores.set(i, (scores.get(i) || 0) + idf * (c * (K1 + 1)) / (c + K1 * (1 - B + B * lens[i] / avg)));
      coverage.set(i, (coverage.get(i) || 0) + 1);
    }
  }
  const asksCost = terms.includes('cost');
  return [...scores.entries()].map(([i, s]) => {
    let score = s * (1 + coverage.get(i) / (terms.length || 1));
    if (asksCost && docs[i].type === 'service') score *= 1.4;
    // A question gets the written answer first; a plain request gets the service.
    if (docs[i].type === 'faq' && /[?？؟]\s*$/.test(query)) score *= 1.25;
    // A plain request means the plain service, not its animated version.
    if (docs[i].cat === 'motion' && !terms.some(t => /anim|motion|3d|gsap|lottie|three|scroll/.test(t))) score *= 0.8;
    if (docs[i].cat === 'roast' && !terms.some(t => /roast|critique|kritik/.test(t))) score *= 0.8;
    return { doc: docs[i], score, coverage: coverage.get(i) / (terms.length || 1) };
  }).sort((a, b) => b.score - a.score).slice(0, k);
}
