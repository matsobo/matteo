/* Peonia 3D procedurale che sboccia con lo scroll.
   Sorgente: si compila in assets/js/scene3d.js con esbuild (vedi README). */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Object3D, Mesh, BufferGeometry,
  Float32BufferAttribute, MeshPhysicalMaterial, MeshStandardMaterial, CylinderGeometry,
  HemisphereLight, DirectionalLight, Color, DoubleSide, MathUtils
} from 'three';

function petalGeometry(L, W, cup, bend, seed, colBase, colMid, colTip) {
  const SU = 12, SV = 16, pos = [], col = [], idx = [];
  const c = new Color();
  for (let j = 0; j <= SV; j++) {
    const v = j / SV;
    const w = W * Math.pow(Math.sin(Math.PI * (0.06 + 0.9 * v)), 0.62) * (0.42 + 0.58 * v);
    for (let i = 0; i <= SU; i++) {
      const u = i / SU * 2 - 1;
      const x = u * w;
      const y = v * L;
      let z = -cup * u * u * w;                       // bordi verso il centro del fiore
      z += bend * v * v * L;                          // curva lungo la lunghezza
      z += 0.012 * L * Math.sin(u * 6 + seed) * v * v * v; // increspatura in punta
      pos.push(x, y, z);
      const t = Math.pow(v, 0.9);
      if (t < 0.5) c.copy(colBase).lerp(colMid, t * 2); else c.copy(colMid).lerp(colTip, (t - 0.5) * 2);
      c.multiplyScalar(0.92 + 0.08 * (1 - Math.abs(u)));
      col.push(c.r, c.g, c.b);
    }
  }
  for (let j = 0; j < SV; j++) for (let i = 0; i < SU; i++) {
    const a = j * (SU + 1) + i, b = a + 1, d = a + SU + 1, e = d + 1;
    idx.push(a, d, b, b, d, e);
  }
  const g = new BufferGeometry();
  g.setIndex(idx);
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

function init(canvas, opts) {
  opts = opts || {};
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { return null; }
  if (!renderer.getContext()) return null;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  const flower = new Group();
  const tilt = new Group();
  tilt.add(flower);
  scene.add(tilt);

  const mat = new MeshPhysicalMaterial({ vertexColors: true, roughness: 0.62, side: DoubleSide, sheen: 1, sheenRoughness: 0.5, sheenColor: new Color('#ffd6e0') });
  const leafMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: DoubleSide });

  const RINGS = 11, petals = [];
  const base = new Color('#9e2149'), mid = new Color('#de7f9c'), tip = new Color('#f9dfe6');
  const baseIn = new Color('#8c1840'), midIn = new Color('#cc5a80'), tipIn = new Color('#f2bfcd');
  let k = 0;
  for (let r = 0; r < RINGS; r++) {
    const t = r / (RINGS - 1);
    const count = Math.round(6 + t * 9);
    const L = 0.34 + t * 0.62, W = 0.34 + t * 0.52;
    const cb = base.clone().lerp(baseIn, 1 - t), cm = mid.clone().lerp(midIn, 1 - t), ct = tip.clone().lerp(tipIn, 1 - t);
    for (let p = 0; p < count; p++) {
      const geo = petalGeometry(L * (0.94 + 0.12 * Math.random()), W, 0.7 - t * 0.3, -0.12 + t * 0.2, k * 1.7, cb, cm, ct);
      const pivot = new Object3D();
      pivot.rotation.y = p / count * Math.PI * 2 + r * 2.39996; // angolo aureo tra anelli
      const m = new Mesh(geo, mat);
      m.position.set(0, -t * 0.12, 0.03 + t * 0.16);
      pivot.add(m);
      flower.add(pivot);
      petals.push({ m, closed: -0.05 + t * 0.3, open: 0.12 + Math.pow(t, 1.3) * 1.55, jitter: (Math.random() - 0.5) * 0.08 });
      k++;
    }
  }
  // sepali e foglie
  const green = new Color('#3f5a2e'), greenMid = new Color('#5f7d43'), greenTip = new Color('#86a160');
  for (let s = 0; s < 5; s++) {
    const pivot = new Object3D(); pivot.rotation.y = s / 5 * Math.PI * 2;
    const m = new Mesh(petalGeometry(0.55, 0.22, 0.4, 0.15, s, green, greenMid, greenTip), leafMat);
    m.position.set(0, -0.16, 0.12); m.rotation.x = 1.75;
    pivot.add(m); flower.add(pivot);
  }
  const stem = new Mesh(new CylinderGeometry(0.035, 0.05, 2.6, 10), new MeshStandardMaterial({ color: '#4d6a35', roughness: 0.8 }));
  stem.position.y = -1.45; flower.add(stem);
  [[-0.8, 0.8, 1.25], [-1.3, -2.4, 1.15]].forEach(([y, ry, rx]) => {
    const pivot = new Object3D(); pivot.position.y = y; pivot.rotation.y = ry;
    const leaf = new Mesh(petalGeometry(1.0, 0.34, 0.25, 0.25, y, green, greenMid, greenTip), leafMat);
    leaf.rotation.x = rx; pivot.add(leaf); flower.add(pivot);
  });

  scene.add(new HemisphereLight('#fff7f0', '#c4b296', 1.25));
  const key = new DirectionalLight('#fff1e2', 2.1); key.position.set(-2.5, 4, 3); scene.add(key);
  const rim = new DirectionalLight('#ffd0dc', 1.1); rim.position.set(3, 1.5, -3); scene.add(rim);

  let open = 0, target = opts.open != null ? opts.open : 0.05, px = 0, py = 0, tx = 0, ty = 0;
  function applyOpen(o) {
    for (const p of petals) p.m.rotation.x = MathUtils.lerp(p.closed, p.open, o) + p.jitter * o;
  }
  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const narrow = w / h < 0.9;
    camera.position.set(0, narrow ? 3.6 : 3.3, narrow ? 5.6 : 4.6);
    camera.lookAt(0, narrow ? -0.35 : -0.55, 0);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let running = false, visible = true, raf = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    open += (target - open) * Math.min(1, dt * 4);
    px += (tx - px) * Math.min(1, dt * 3); py += (ty - py) * Math.min(1, dt * 3);
    applyOpen(open);
    flower.rotation.y += dt * 0.12;
    tilt.rotation.x = 0.12 + py * 0.12; tilt.rotation.z = -px * 0.1;
    renderer.render(scene, camera);
    if (running && visible) raf = requestAnimationFrame(frame);
  }
  function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      visible = es[0].isIntersecting;
      if (visible && running) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }).observe(canvas);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (!opts.still) start(); });

  if (opts.still) { open = target; applyOpen(open); tilt.rotation.x = 0.12; renderer.render(scene, camera); }
  else start();

  return {
    setOpen(v) { target = Math.max(0, Math.min(1, v)); },
    pointer(x, y) { tx = x; ty = y; },
    renderOnce() { applyOpen(target); renderer.render(scene, camera); }
  };
}

window.PetaliBloom = { init };
