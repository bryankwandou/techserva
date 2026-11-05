// The site's 3D layer. 500 tiles, one per real service. They form a drum in the hero, a wall in the
// catalog, four stacks for the four order steps, then one column for the rules.
import * as THREE from '/assets/vendor/three.module.min.js';

const COUNT = 500; const ROWS = 20; const COLS = 25;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);

function layouts() {
  const drum = []; const wall = []; const stacks = []; const column = [];
  for (let i = 0; i < COUNT; i++) {
    const row = Math.floor(i / COLS); const col = i % COLS;
    const th = (col / COLS) * Math.PI * 2;
    const y = (row - (ROWS - 1) / 2) * 0.62;
    drum.push({ x: Math.sin(th) * 4.6, y, z: Math.cos(th) * 4.6, rx: 0, ry: th, rz: 0 });
    wall.push({ x: (col - (COLS - 1) / 2) * 1.22, y: y * 1.08, z: -2, rx: 0, ry: 0, rz: 0 });
    const s = i % 4; const h = Math.floor(i / 4);
    stacks.push({ x: (s - 1.5) * 6.2, y: -6 + h * 0.1, z: -1, rx: Math.PI / 2, ry: 0, rz: h * 0.05 });
    const a = i * 0.17;
    column.push({ x: 8 + Math.cos(a) * 0.5, y: -9 + i * 0.036, z: -2 + Math.sin(a) * 0.5, rx: Math.PI / 2, ry: 0, rz: a });
  }
  return [drum, wall, stacks, column, drum];
}

export function init({ reduced }) {
  const canvas = document.getElementById('scene');
  if (!canvas) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch { canvas.remove(); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

  const home = document.documentElement.dataset.home === '1';
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.z = 21;
  const hemi = new THREE.HemisphereLight(0xffffff, 0x888877, 2.1); scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 1.6); dir.position.set(4, 8, 10); scene.add(dir);

  const geo = new THREE.BoxGeometry(0.9, 0.44, 0.03);
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const mesh = new THREE.InstancedMesh(geo, mat, COUNT);
  mesh.frustumCulled = false; scene.add(mesh);

  const shapes = layouts();
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const hl = Number(document.documentElement.dataset.highlight ?? -1);
  const hlCat = Number(document.documentElement.dataset.highlightCat ?? -1);
  let hovered = -1;

  function paint() {
    const dark = document.documentElement.dataset.theme === 'dark';
    scene.fog = new THREE.Fog(dark ? 0x14140e : 0xf4f1e8, 19.5, 25.5);
    const a = new THREE.Color(dark ? '#3a3a2e' : '#d3ccb9');
    const b = new THREE.Color(dark ? '#23231b' : '#ece7d8');
    const accent = new THREE.Color(dark ? '#ff6a2e' : '#d6410c');
    for (let i = 0; i < COUNT; i++) {
      const row = Math.floor(i / COLS);
      color.copy(row % 2 ? a : b);
      if (i === hovered || i === hl) color.copy(accent);
      else if (row === hlCat) color.copy(accent).lerp(a, 0.55);
      else if (home && hovered < 0 && i % 37 === 0) color.copy(accent);
      mesh.setColorAt(i, color);
    }
    mesh.instanceColor.needsUpdate = true;
  }
  paint();
  addEventListener('themechange', paint);

  let w = 0; let h = 0; let offsetX = 0; let scale = 1; let narrowView = false;
  function resize() {
    w = innerWidth; h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const narrow = w < 960;
    offsetX = (home ? (narrow ? 0 : 6.6) : (narrow ? 2 : 7)) * (document.documentElement.dir === 'rtl' ? -1 : 1);
    scale = narrow ? 0.62 : 0.84;
    narrowView = narrow;
  }
  addEventListener('resize', resize); addEventListener('langchange', resize); resize();

  const anchors = ['cats', 'how', 'rules', 'end'].map(id => document.getElementById(id));
  function progress() {
    if (!home || anchors.some(a => !a)) return 0;
    const y = scrollY + h * 0.5;
    const tops = [h * 0.5, ...anchors.map(a => a.getBoundingClientRect().top + scrollY)];
    for (let i = 0; i < tops.length - 1; i++) {
      if (y < tops[i + 1]) return i + ease(Math.min(1, Math.max(0, (y - tops[i]) / (tops[i + 1] - tops[i]))));
    }
    return tops.length - 1;
  }

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => { pointer.tx = (e.clientX / w) * 2 - 1; pointer.ty = -((e.clientY / h) * 2 - 1); pick(e); }, { passive: true });

  const ray = new THREE.Raycaster();
  let lastPick = 0;
  function pick(e) {
    if (!home || !document.getElementById('stage')) return;
    const now = performance.now(); if (now - lastPick < 60) return; lastPick = now;
    const over = e.target?.closest?.('#stage') && !e.target.closest('a,button');
    let next = -1;
    if (over && scrollY < h * 0.6) {
      ray.setFromCamera(new THREE.Vector2(pointer.tx, pointer.ty), camera);
      const hit = ray.intersectObject(mesh)[0];
      if (hit) next = hit.instanceId;
    }
    if (next !== hovered) {
      hovered = next; paint();
      dispatchEvent(new CustomEvent('tile', { detail: next }));
    }
  }

  let spin = 0; let running = true; let last = performance.now();
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!reduced) spin += dt * (hovered >= 0 ? 0.03 : 0.14);
    pointer.x += (pointer.tx - pointer.x) * 0.06; pointer.y += (pointer.ty - pointer.y) * 0.06;
    const p = progress();
    if (home) canvas.style.opacity = String(narrowView ? 0.2 : lerp(0.95, 0.26, Math.min(1, p * 2.2)));
    const seg = Math.min(shapes.length - 2, Math.floor(p)); const f = p - seg;
    const from = shapes[seg]; const to = shapes[seg + 1];
    const drumAmount = seg === 0 ? 1 - f : seg === 3 ? f : 0;

    for (let i = 0; i < COUNT; i++) {
      const stagger = Math.min(1, Math.max(0, f * 1.5 - (i / COUNT) * 0.5));
      const a = from[i]; const b = to[i];
      dummy.position.set(lerp(a.x, b.x, stagger), lerp(a.y, b.y, stagger), lerp(a.z, b.z, stagger));
      dummy.rotation.set(lerp(a.rx, b.rx, stagger), lerp(a.ry, b.ry, stagger), lerp(a.rz, b.rz, stagger));
      const s = i === hovered ? 1.28 : 1;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    const heroX = offsetX * drumAmount + (home ? 0 : offsetX * (1 - drumAmount));
    mesh.position.x = heroX;
    mesh.rotation.y = spin * drumAmount + pointer.x * 0.16;
    mesh.rotation.x = pointer.y * -0.08 + 0.1 * drumAmount;
    mesh.scale.setScalar(scale);
    renderer.render(scene, camera);
    if (reduced) { running = false; return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => {
    if (reduced) return;
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });
  if (reduced) addEventListener('themechange', () => { running = true; requestAnimationFrame(frame); });
  document.documentElement.dataset.scene3d = 'on';
}
