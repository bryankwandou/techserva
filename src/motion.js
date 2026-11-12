// Scroll choreography. Loaded only when the visitor has not asked for reduced motion.
const load = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.append(s); });

export async function init() {
  await load('/assets/vendor/gsap.min.js');
  await load('/assets/vendor/ScrollTrigger.min.js');
  await load('/assets/vendor/lenis.min.js');
  const { gsap, ScrollTrigger, Lenis } = window;
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({ lerp: 0.12 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // Headline arrives word by word out of a blur. Scripts without spaces arrive as one piece.
  const h1 = document.querySelector('[data-hero] h1');
  if (h1) {
    const split = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/); const frag = document.createDocumentFragment();
        parts.forEach(t => { if (!t) return; if (/^\s+$/.test(t)) { frag.append(t); return; } const sp = document.createElement('span'); sp.className = 'w'; sp.textContent = t; frag.append(sp); });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) split(n);
    });
    split(h1);
    gsap.from(h1.querySelectorAll('.w'), { yPercent: 60, opacity: 0, filter: 'blur(14px)', duration: 1, ease: 'expo.out', stagger: 0.08, clearProps: 'all' });
  }
  gsap.from('[data-hero] > :not(h1)', { y: 18, opacity: 0, duration: 0.65, ease: 'power3.out', stagger: 0.07, delay: 0.25, clearProps: 'all' });

  // Leaving the hero: the copy lifts, fades and blurs while the camera starts its flight.
  const copy = document.querySelector('[data-hero]');
  if (copy) gsap.to(copy, { yPercent: -18, opacity: 0, filter: 'blur(8px)', ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 25%', scrub: true } });

  // In-page links glide instead of jumping. The hero arrow also fires a warp in the 3D scene.
  const ease = t => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); const target = id.length > 1 && document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const dive = a.classList.contains('down');
    if (dive) {
      dispatchEvent(new CustomEvent('dive'));
      a.classList.remove('fired'); void a.offsetWidth; a.classList.add('fired');
    }
    lenis.scrollTo(target, { duration: dive ? 2 : 1.2, easing: ease, offset: -40 });
    history.replaceState(null, '', id);
  }));

  // Category rows wipe in from the side, each with its price counting up.
  const rows = document.querySelectorAll('.cat-list li');
  if (rows.length) {
    rows.forEach(r => r.removeAttribute('data-rise'));
    gsap.set(rows, { clipPath: 'inset(0 100% 0 0)', opacity: 0.2 });
    ScrollTrigger.batch(rows, {
      start: 'top 92%', once: true,
      onEnter: b => gsap.to(b, { clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.05, clearProps: 'clipPath' }),
    });
  }

  gsap.set('[data-rise]', { y: 16, opacity: 0 });
  ScrollTrigger.batch('[data-rise]', {
    start: 'top 90%', once: true,
    onEnter: b => gsap.to(b, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.07, clearProps: 'transform' }),
  });

  // Hero buttons lean toward the pointer. Mouse only: on touch there is no hover to follow.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.hero .btn, .hero .down').forEach(el => {
      const x = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' }), y = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.22); y((e.clientY - r.top - r.height / 2) * 0.3); });
      el.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  }

  const path = document.querySelector('.steps svg.line path');
  if (path) {
    const len = path.getTotalLength();
    gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: { trigger: '.steps', start: 'top 80%', end: 'top 30%', scrub: true },
    });
  }
  gsap.from('.facts b', { opacity: 0, y: 12, duration: 0.55, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '.facts', start: 'top 92%', once: true }, clearProps: 'all' });
}
