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

  gsap.from('[data-hero] > *', { y: 18, opacity: 0, duration: 0.65, ease: 'power3.out', stagger: 0.07, clearProps: 'all' });

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
