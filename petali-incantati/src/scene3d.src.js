/* Fiori 3D fotorealistici procedurali: peonia dell'hero + bouquet del compositore.
   Texture dei petali generate al volo (sfumature, venature, mottature, bordi irregolari),
   luce da studio con riflessi ambientali, ombra morbida sulla carta.
   Sorgente: si compila in assets/js/scene3d.js con esbuild (vedi README). */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/* ---------- utilità ---------- */
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 144665) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s) { return noise(x, y, s) * 0.6 + noise(x * 2.1, y * 2.1, s + 7) * 0.3 + noise(x * 4.3, y * 4.3, s + 13) * 0.1; }
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hex = h => { const c = new THREE.Color(h); return [c.r * 255, c.g * 255, c.b * 255]; }; // sRGB 0..255
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* ---------- forme dei petali (coordinate texture: x -0.5..0.5, v 0 base .. 1 punta) ---------- */
const SHAPES = {
  peony: {
    hw: v => 0.07 + 0.41 * Math.pow(smooth(0, 0.72, v), 0.75),
    top: (x, s) => 0.78 + 0.19 * Math.sqrt(Math.max(0, 1 - Math.pow(x / 0.48, 2))) + 0.016 * Math.sin(x * 29 + s) + 0.008 * Math.sin(x * 71 + s * 2.3) - 0.03 * Math.exp(-Math.pow((x - (hash(s, 1, 3) - 0.5) * 0.6) / 0.035, 2)),
    veins: 26
  },
  rose: {
    hw: v => 0.09 + 0.39 * Math.sin(Math.min(v / 0.78, 1) * Math.PI / 2),
    top: (x, s) => 0.76 + 0.22 * Math.sqrt(Math.max(0, 1 - Math.pow(x / 0.48, 2))) + 0.008 * Math.sin(x * 30 + s),
    veins: 18
  },
  ranunculus: {
    hw: v => 0.12 + 0.36 * Math.sin(Math.min(v / 0.68, 1) * Math.PI / 2),
    top: (x) => 0.74 + 0.24 * Math.sqrt(Math.max(0, 1 - Math.pow(x / 0.48, 2))),
    veins: 14
  },
  leaf: {
    hw: v => 0.46 * Math.pow(Math.sin(Math.PI * Math.min(1, v * 0.98 + 0.02)), 0.85) * (v < 0.08 ? v / 0.08 * 0.6 + 0.4 : 1),
    top: () => 1.0,
    veins: 0
  }
};

/* texture colore+alfa e normal map, generate per pixel e messe in cache */
const texCache = new Map();
function petalMaps(shapeName, pal, seed, W, H) {
  const key = shapeName + pal.join() + seed + W;
  if (texCache.has(key)) return texCache.get(key);
  const shape = SHAPES[shapeName], leaf = shapeName === 'leaf';
  const cCream = hex(pal[0]), cBase = hex(pal[1]), cMid = hex(pal[2]), cTip = hex(pal[3]);
  const white = [255, 252, 248];
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'); const img = ctx.createImageData(W, H); const d = img.data;
  const hgt = new Float32Array(W * H);
  for (let py = 0; py < H; py++) {
    const v = 1 - (py + 0.5) / H;
    for (let px = 0; px < W; px++) {
      const x = (px + 0.5) / W - 0.5, i = py * W + px;
      const hw = shape.hw(v), top = shape.top(x, seed);
      const dist = Math.min((hw - Math.abs(x)) * W, (top - v) * H);
      const a = Math.min(1, Math.max(0, dist / 1.6 + 0.5));
      let col, h = 0;
      const mott = fbm(x * 7 + seed, v * 14, seed) - 0.5;
      if (leaf) {
        col = v < 0.5 ? mix(cBase, cMid, v * 2) : mix(cMid, cTip, (v - 0.5) * 2);
        const mid = Math.exp(-Math.pow(x / 0.012, 2));
        const lat = Math.pow(Math.abs(Math.sin((v * 11 - Math.abs(x) * 6) * Math.PI)), 26) * smooth(0.02, 0.06, Math.abs(x));
        col = mix(col, hex(pal[4] || '#a9c27e'), mid * 0.75 + lat * 0.18);
        col = col.map(c => c * (1 + mott * 0.16));
        h = -mid * 0.9 - lat * 0.4 + mott * 0.3;
      } else {
        // sfumatura base crema -> colore -> punta chiara
        if (v < 0.1) col = mix(cCream, cBase, v / 0.1);
        else if (v < 0.5) col = mix(cBase, cMid, (v - 0.1) / 0.4);
        else col = mix(cMid, cTip, Math.min(1, (v - 0.5) / 0.42));
        const ang = Math.atan2(x, v + 0.12);
        const vein = Math.pow(Math.abs(Math.cos(ang * shape.veins + fbm(x * 4, v * 5, seed + 3) * 5)), 40) * (0.35 + 0.65 * v);
        col = mix(col, white, vein * 0.045);
        col = col.map(c => c * (1 + mott * 0.12));
        // bordi traslucidi: più chiari vicino al contorno
        col = mix(col, mix(cTip, white, 0.25), (1 - Math.min(1, Math.max(0, dist) / 9)) * 0.18);
        h = vein * 0.3 + mott * 0.45 + 0.06 * Math.sin(v * 40 + x * 5 + seed);
      }
      d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = a * 255;
      hgt[i] = h;
    }
  }
  ctx.putImageData(img, 0, 0);
  // normal map da altezza
  const nv = document.createElement('canvas'); nv.width = W; nv.height = H;
  const nctx = nv.getContext('2d'); const nimg = nctx.createImageData(W, H); const nd = nimg.data;
  const S = leaf ? 3.5 : 2.2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const dx = (hgt[y * W + Math.min(W - 1, x + 1)] - hgt[y * W + Math.max(0, x - 1)]) * S;
    const dy = (hgt[Math.min(H - 1, y + 1) * W + x] - hgt[Math.max(0, y - 1) * W + x]) * S;
    const l = Math.hypot(dx, dy, 1);
    nd[i * 4] = (-dx / l * 0.5 + 0.5) * 255; nd[i * 4 + 1] = (dy / l * 0.5 + 0.5) * 255; nd[i * 4 + 2] = (1 / l * 0.5 + 0.5) * 255; nd[i * 4 + 3] = 255;
  }
  nctx.putImageData(nimg, 0, 0);
  const map = new THREE.CanvasTexture(cv); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  const normal = new THREE.CanvasTexture(nv);
  const out = { map, normal };
  texCache.set(key, out);
  return out;
}

function petalMaterial(shapeName, pal, seed, res, leaf) {
  const t = petalMaps(shapeName, pal, seed, res, res * 2);
  const m = new THREE.MeshPhysicalMaterial({
    map: t.map, normalMap: t.normal, normalScale: new THREE.Vector2(0.45, 0.45),
    alphaTest: 0.5, side: THREE.DoubleSide,
    roughness: leaf ? 0.42 : 0.58,
    sheen: leaf ? 0 : 0.4, sheenRoughness: 0.45, sheenColor: new THREE.Color(pal[3]),
    emissive: new THREE.Color(leaf ? '#000000' : '#ffffff'), emissiveMap: leaf ? null : t.map, emissiveIntensity: leaf ? 0 : 0.05
  });
  m.userData.depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t.map, alphaTest: 0.5, side: THREE.DoubleSide });
  return m;
}

/* geometria del petalo: griglia deformata (coppa, curvatura, increspature, stropicciature) */
function petalGeometry(L, W, p, r, SU, SV) {
  const pos = [], uv = [], idx = [];
  const s = r() * 100;
  for (let j = 0; j <= SV; j++) {
    const v = j / SV;
    for (let i = 0; i <= SU; i++) {
      const u = i / SU * 2 - 1;
      let x = u * W / 2, y = v * L;
      let z = -p.cup * u * u * (W / 2) * (0.25 + 0.75 * v);
      z += p.bend * v * v * L;
      z += p.ruffle * L * v * v * (0.3 + Math.abs(u)) * Math.sin(u * 9 + s) * Math.cos(v * 5 + s * 0.7);
      z += p.crumple * L * (fbm(u * 2.2 + s, v * 3, 5) - 0.5);
      if (p.fold) z -= p.fold * Math.abs(u) * (W / 2) * Math.sin(Math.PI * v);
      if (p.curl) { const c = smooth(0.6, 1, v) * p.curl; z += c * L * 0.35; y -= c * c * L * 0.12; }
      pos.push(x, y, z); uv.push(i / SU, v);
    }
  }
  for (let j = 0; j < SV; j++) for (let i = 0; i < SU; i++) {
    const a = j * (SU + 1) + i, b = a + 1, c = a + SU + 1, e = c + 1;
    idx.push(a, c, b, b, c, e);
  }
  const g = new THREE.BufferGeometry();
  g.setIndex(idx);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/* ---------- fiori ---------- */
const STYLES = {
  // peonia doppia: petali di guardia larghi + palla di petali increspati
  peony: r => {
    const rings = [];
    for (let k = 0; k < 9; k++) {
      const t = k / 8;
      rings.push({ n: Math.round(4 + t * 11), L: 0.26 + t * 0.52, W: 0.4 + t * 0.4, r0: 0.13 + t * 0.11, y: -0.02 - t * 0.06,
        closed: -0.12 + t * 0.16, open: 0.02 + t * 0.48, cup: 1.25, bend: -0.16, ruffle: 0.035, crumple: 0.12, curl: 0 });
    }
    rings.push({ n: 6, L: 0.95, W: 1.05, r0: 0.25, y: -0.1, closed: 0.1, open: 0.78, cup: 1.05, bend: -0.06, ruffle: 0.025, crumple: 0.08, curl: 0 });
    rings.push({ n: 7, L: 1.05, W: 1.12, r0: 0.29, y: -0.16, closed: 0.18, open: 0.98, cup: 0.95, bend: 0, ruffle: 0.025, crumple: 0.08, curl: 0 });
    return { shape: 'peony', rings };
  },
  rose: r => {
    const rings = [];
    for (let k = 0; k < 7; k++) {
      const t = k / 6;
      rings.push({ n: Math.round(3 + t * 5), L: 0.45 + t * 0.55, W: 0.55 + t * 0.45, r0: 0.01 + t * 0.1, y: -t * 0.06,
        closed: -0.05 + t * 0.18, open: 0.0 + Math.pow(t, 1.4) * 1.05, cup: 1.25 - t * 0.35, bend: 0, ruffle: 0.01, crumple: 0.05, curl: t * 0.9 });
    }
    return { shape: 'rose', rings };
  },
  ranunculus: r => {
    const rings = [];
    for (let k = 0; k < 12; k++) {
      const t = k / 11;
      rings.push({ n: Math.round(7 + t * 7), L: 0.3 + t * 0.42, W: 0.42 + t * 0.4, r0: 0.02 + t * 0.12, y: -t * 0.05,
        closed: -0.1 + t * 0.2, open: 0.05 + Math.pow(t, 1.2) * 0.95, cup: 1.15, bend: -0.04, ruffle: 0.01, crumple: 0.04, curl: 0 });
    }
    return { shape: 'ranunculus', rings };
  }
};

function makeFlower(styleName, pal, seed, opts) {
  opts = opts || {};
  const r = rng(seed), res = opts.res || 192, SU = opts.hi ? 18 : 10, SV = opts.hi ? 26 : 14;
  const def = STYLES[styleName](r);
  const mats = [0, 1, 2].map(k => petalMaterial(def.shape, pal, seed * 3 + k, res));
  const group = new THREE.Group(), petals = [];
  def.rings.forEach((R, ri) => {
    for (let p = 0; p < R.n; p++) {
      const geo = petalGeometry(R.L * (0.9 + 0.2 * r()), R.W * (0.9 + 0.2 * r()), R, r, SU, SV);
      const mat = mats[Math.floor(r() * 3)];
      const mesh = new THREE.Mesh(geo, mat);
      mesh.customDepthMaterial = mat.userData.depth;
      mesh.castShadow = true;
      const pivot = new THREE.Object3D();
      pivot.rotation.y = p / R.n * Math.PI * 2 + ri * 2.39996 + (r() - 0.5) * 0.25;
      mesh.position.set(0, R.y, R.r0);
      mesh.rotation.z = (r() - 0.5) * 0.35;
      pivot.add(mesh); group.add(pivot);
      petals.push({ mesh, closed: R.closed + (r() - 0.5) * 0.06, open: R.open + (r() - 0.5) * 0.18 });
    }
  });
  if (styleName === 'peony' && opts.stamens !== false) {
    const N = 70, fil = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.006, 0.008, 1, 5), new THREE.MeshStandardMaterial({ color: '#f1d27a', roughness: 0.6 }), N);
    const ant = new THREE.InstancedMesh(new THREE.SphereGeometry(0.017, 8, 6), new THREE.MeshStandardMaterial({ color: '#e7a91c', roughness: 0.45, emissive: '#5a3500', emissiveIntensity: 0.25 }), N);
    const o = new THREE.Object3D();
    for (let i = 0; i < N; i++) {
      const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * 0.1, h = 0.06 + r() * 0.1;
      const tipP = new THREE.Vector3(Math.cos(a) * (rr + 0.03), h, Math.sin(a) * (rr + 0.03));
      const baseP = new THREE.Vector3(Math.cos(a) * rr * 0.4, -0.02, Math.sin(a) * rr * 0.4);
      const dir = tipP.clone().sub(baseP), len = dir.length();
      o.position.copy(baseP).addScaledVector(dir, 0.5); o.scale.set(1, len, 1);
      o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); o.updateMatrix(); fil.setMatrixAt(i, o.matrix);
      o.position.copy(tipP); o.scale.set(1, 1.7, 1); o.updateMatrix(); ant.setMatrixAt(i, o.matrix);
    }
    fil.castShadow = ant.castShadow = true;
    group.add(fil, ant);
    const pistil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshStandardMaterial({ color: '#c94f7a', roughness: 0.5 }));
    pistil.scale.y = 1.3; pistil.position.y = 0.04; group.add(pistil);
  }
  return {
    group,
    setOpen(o) { for (const p of petals) p.mesh.rotation.x = p.closed + (p.open - p.closed) * o; }
  };
}

const LEAF_PAL = ['#2c4422', '#2f4a24', '#4b6b33', '#5f7f3e', '#93ad6a'];
function makeLeaf(seed, L, W, opts) {
  opts = opts || {};
  const r = rng(seed);
  const mat = petalMaterial('leaf', opts.pal || LEAF_PAL, seed % 4, 128, true);
  const geo = petalGeometry(L, W, { cup: 0.15, bend: 0.25, ruffle: 0.01, crumple: 0.06, fold: 0.5 }, r, 8, 16);
  const m = new THREE.Mesh(geo, mat);
  m.customDepthMaterial = mat.userData.depth; m.castShadow = true;
  return m;
}
function makeStem(points, radius, color) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 8, false),
    new THREE.MeshStandardMaterial({ color: color || '#4f6d35', roughness: 0.55 }));
  m.castShadow = true;
  return m;
}

/* ---------- palcoscenico comune ---------- */
function stage(canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  if (!renderer.getContext()) return null;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const key = new THREE.DirectionalLight('#fff2e4', 2.6);
  key.position.set(-2.2, 5, 6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 20 });
  key.shadow.radius = 6;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#ffd9e2', 1.3); rim.position.set(3, 2, -4); scene.add(rim);
  scene.add(new THREE.HemisphereLight('#fff8f1', '#cbbb9f', 0.35));
  // fondale che riceve solo l'ombra: il fiore "proietta" sulla carta della pagina
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.1 }));
  catcher.receiveShadow = true; scene.add(catcher);
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  function placeCatcher(target, dist) {
    const dir = new THREE.Vector3().subVectors(target, camera.position).normalize();
    catcher.position.copy(target).addScaledVector(dir, dist);
    catcher.lookAt(camera.position);
  }
  return { renderer, scene, camera, key, placeCatcher };
}

function loop(canvas, renderFn, still) {
  let running = false, visible = true, raf = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    renderFn(dt);
    if (running && visible) raf = requestAnimationFrame(frame);
  }
  const api = {
    start() { if (running || still) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); },
    once() { renderFn(0); }
  };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      visible = es[0].isIntersecting;
      if (visible && running) { last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
    }).observe(canvas);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) api.stop(); else api.start(); });
  return api;
}

/* ---------- HERO: peonia ---------- */
function initBloom(canvas, opts) {
  opts = opts || {};
  const st = stage(canvas); if (!st) return null;
  const { renderer, scene, camera } = st;
  const tilt = new THREE.Group(); scene.add(tilt);
  const holder = new THREE.Group(); tilt.add(holder);
  const flower = makeFlower('peony', ['#5a0335', '#860a52', '#b11a76', '#d96bb0'], 11, { hi: true, res: 256 });
  holder.add(flower.group);
  // sepali
  for (let s = 0; s < 5; s++) {
    const pv = new THREE.Object3D(); pv.rotation.y = s / 5 * Math.PI * 2 + 0.3;
    const sep = makeLeaf(40 + s, 0.55, 0.32); sep.position.set(0, -0.2, 0.12); sep.rotation.x = 1.9;
    pv.add(sep); holder.add(pv);
  }
  holder.add(makeStem([[0, -0.2, 0], [0.02, -1.0, 0.05], [0.08, -2.0, 0], [0.12, -3.2, -0.1]], 0.045));
  [[-1.05, 0.9, 1.2, 1.3], [-1.7, -2.3, 1.1, 1.5], [-1.35, 2.6, 1.35, 1.1]].forEach(([y, ry, rx, L], i) => {
    const pv = new THREE.Object3D(); pv.position.set(0.04, y, 0); pv.rotation.y = ry;
    const lf = makeLeaf(70 + i, L, 0.42); lf.rotation.x = rx; pv.add(lf); holder.add(pv);
  });

  let open = opts.open != null ? opts.open : 0.05, target = open, px = 0, py = 0, tx = 0, ty = 0;
  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const narrow = w / h < 0.9;
    camera.position.set(0, narrow ? 6.2 : 5.8, narrow ? 7.4 : 6.4);
    const look = new THREE.Vector3(0, narrow ? -0.55 : -0.85, 0);
    camera.lookAt(look); camera.updateProjectionMatrix();
    st.placeCatcher(look, 3.2);
  }
  resize(); addEventListener('resize', resize);
  const lp = loop(canvas, dt => {
    open += (target - open) * Math.min(1, dt * 4 || 1);
    px += (tx - px) * Math.min(1, dt * 3); py += (ty - py) * Math.min(1, dt * 3);
    flower.setOpen(open);
    holder.rotation.y += dt * 0.1;
    tilt.rotation.x = 0.1 + py * 0.08; tilt.rotation.z = -px * 0.07;
    renderer.render(scene, camera);
  }, opts.still);
  if (opts.still) { open = target; lp.once(); } else lp.start();
  return {
    setOpen(v) { target = Math.max(0, Math.min(1, v)); if (opts.still) lp.once(); },
    pointer(x, y) { tx = x; ty = y; }
  };
}

/* ---------- COMPOSITORE: bouquet ---------- */
const P = {
  peonyPink: ['#7e0846', '#a50f61', '#cf2f86', '#ec86bf'],
  peonyWhite: ['#eee0bb', '#eadfcb', '#f7f1e6', '#fffdf8'],
  peonyBlush: ['#f1e1c5', '#de9eae', '#f3c9d2', '#fdeef1'],
  peonyCoral: ['#f0d6ae', '#cf3e4f', '#ef7f7c', '#fcc6ba'],
  peonyLilac: ['#efe3cc', '#9a6cb1', '#c8a6dc', '#f0e4f7'],
  roseRed: ['#5e0c18', '#7f0e22', '#b8172f', '#d92e44'],
  roseIvory: ['#e5d6b6', '#ecdec4', '#f6eedf', '#fffaf1'],
  roseDusty: ['#e0c1af', '#c4858f', '#e1aeb4', '#f4d5d6'],
  roseLav: ['#d6c6dc', '#9881b4', '#c0acd4', '#e6ddf0'],
  ranOrange: ['#e8a12c', '#df5018', '#f2892f', '#ffbf6c'],
  ranYellow: ['#d6b13a', '#eaa91a', '#f7cb3a', '#ffe68a'],
  ranWhite: ['#cfdcb3', '#e9ecd8', '#f7f6ee', '#ffffff'],
  ranBlush: ['#e8d0b6', '#e2a2ad', '#f3c6cc', '#fde7ea'],
  ranPurple: ['#4f2462', '#6f3787', '#9d66ba', '#d3b2e4']
};
const TONES = {
  'bianchi e avorio': [['peony', P.peonyWhite], ['rose', P.roseIvory], ['ranunculus', P.ranWhite]],
  'rosa cipria': [['peony', P.peonyBlush], ['rose', P.roseDusty], ['ranunculus', P.ranBlush]],
  'colori accesi': [['ranunculus', P.ranOrange], ['rose', P.roseRed], ['peony', P.peonyCoral], ['ranunculus', P.ranYellow]],
  'lilla e viola': [['peony', P.peonyLilac], ['rose', P.roseLav], ['ranunculus', P.ranPurple]],
  'a scelta del fiorista': [['peony', P.peonyPink], ['ranunculus', P.ranBlush], ['rose', P.roseIvory], ['ranunculus', P.ranOrange]]
};

function kraftTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const x = c.getContext('2d'), img = x.createImageData(256, 256), d = img.data;
  for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
    const n = fbm(i / 18, j / 18, 9) * 0.6 + noise(i / 2, j / 40, 4) * 0.4; const k = (j * 256 + i) * 4;
    d[k] = 198 + n * 30; d[k + 1] = 162 + n * 26; d[k + 2] = 118 + n * 20; d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2);
  return t;
}
function lathe(points, mat) {
  const m = new THREE.Mesh(new THREE.LatheGeometry(points.map(p => new THREE.Vector2(p[0], p[1])), 48), mat);
  m.castShadow = true; m.receiveShadow = true; return m;
}
function aimUp(obj, dir) { obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()); }

function initBouquet(canvas, opts) {
  opts = opts || {};
  const st = stage(canvas); if (!st) return null;
  const { renderer, scene, camera } = st;
  scene.environmentIntensity = 0.65;
  let root = null, kraft = null;
  function disposeTree(o) { o.traverse(n => { if (n.geometry) n.geometry.dispose(); }); }

  function build(tone, form) {
    if (root) { scene.remove(root); disposeTree(root); }
    root = new THREE.Group(); scene.add(root);
    const mix = TONES[tone] || TONES['a scelta del fiorista'];
    const r = rng(tone.length * 31 + form.length * 7);
    const heads = [];
    if (form === 'una pianta') {
      const pot = lathe([[0, -2.1], [0.55, -2.1], [0.62, -2.05], [0.78, -1.15], [0.86, -1.1], [0.86, -0.95], [0.78, -0.92]],
        new THREE.MeshStandardMaterial({ color: '#b5603a', roughness: 0.85 }));
      root.add(pot);
      const soil = new THREE.Mesh(new THREE.CircleGeometry(0.74, 32), new THREE.MeshStandardMaterial({ color: '#3b2a1e', roughness: 1 }));
      soil.rotation.x = -Math.PI / 2; soil.position.y = -1.0; root.add(soil);
      for (let i = 0; i < 16; i++) {
        const pv = new THREE.Object3D(); pv.position.y = -1.0; pv.rotation.y = i * 2.39996;
        const lf = makeLeaf(200 + i, 0.9 + r() * 0.6, 0.4); lf.rotation.x = 0.35 + r() * 0.7; pv.add(lf); root.add(pv);
      }
      for (let i = 0; i < 3; i++) {
        const [style, pal] = mix[i % mix.length];
        const a = i / 3 * Math.PI * 2, top = new THREE.Vector3(Math.cos(a) * 0.35, 0.55 + r() * 0.35, Math.sin(a) * 0.35);
        root.add(makeStem([[0, -1.0, 0], [top.x * 0.5, -0.2, top.z * 0.5], [top.x, top.y - 0.15, top.z]], 0.025));
        heads.push({ style: 'ranunculus', pal, pos: top, dir: new THREE.Vector3(top.x, 1, top.z), s: 0.6 });
      }
    } else if (form === 'una composizione') {
      const bowl = lathe([[0, -1.25], [0.6, -1.25], [0.66, -1.2], [1.2, -0.65], [1.35, -0.35], [1.3, -0.3], [1.16, -0.55], [0.6, -1.12]],
        new THREE.MeshPhysicalMaterial({ color: '#e9e4d6', roughness: 0.25, clearcoat: 0.6 }));
      root.add(bowl);
      const ring = [[0, 0.15, 0]].concat(Array.from({ length: 6 }, (_, i) => { const a = i / 6 * Math.PI * 2; return [Math.cos(a) * 0.62, -0.02, Math.sin(a) * 0.62]; }))
        .concat(Array.from({ length: 7 }, (_, i) => { const a = (i + 0.5) / 7 * Math.PI * 2; return [Math.cos(a) * 1.08, -0.3, Math.sin(a) * 1.08]; }));
      ring.forEach((p, i) => {
        const [style, pal] = mix[i % mix.length];
        const pos = new THREE.Vector3(p[0], p[1], p[2]);
        heads.push({ style, pal, pos, dir: new THREE.Vector3(p[0] * 0.9, 1, p[2] * 0.9), s: i === 0 ? 0.62 : 0.52 + r() * 0.08 });
      });
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2 + 0.2, pv = new THREE.Object3D();
        pv.position.set(Math.cos(a) * 1.1, -0.45, Math.sin(a) * 1.1); pv.rotation.y = -a + Math.PI / 2;
        const lf = makeLeaf(300 + i, 0.8, 0.34); lf.rotation.x = 1.25; pv.add(lf); root.add(pv);
      }
    } else {
      // mazzo con carta kraft
      kraft = kraft || kraftTexture();
      const wrap = lathe([[0.06, -2.4], [0.15, -2.1], [0.36, -1.4], [0.66, -0.65], [0.98, 0.0], [1.08, 0.12]],
        new THREE.MeshStandardMaterial({ map: kraft, roughness: 0.92, side: THREE.DoubleSide }));
      root.add(wrap);
      const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 12, 40), new THREE.MeshPhysicalMaterial({ color: mix[0][1][1], roughness: 0.35, sheen: 1, sheenColor: new THREE.Color('#ffffff') }));
      ribbon.rotation.x = Math.PI / 2; ribbon.position.y = -1.75; ribbon.castShadow = true; root.add(ribbon);
      const focal = new THREE.Vector3(0, -2.6, 0);
      const spots = [[0, 0.95, 0]].concat(Array.from({ length: 6 }, (_, i) => { const a = i / 6 * Math.PI * 2; return [Math.cos(a) * 0.76, 0.72, Math.sin(a) * 0.76]; }))
        .concat(Array.from({ length: 5 }, (_, i) => { const a = (i + 0.5) / 5 * Math.PI * 2; return [Math.cos(a) * 1.22, 0.3, Math.sin(a) * 1.22]; }));
      spots.forEach((p, i) => {
        const [style, pal] = mix[i % mix.length];
        const pos = new THREE.Vector3(p[0], p[1], p[2]);
        heads.push({ style, pal, pos, dir: pos.clone().sub(focal), s: i === 0 ? 0.8 : 0.66 + r() * 0.1 });
      });
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * Math.PI * 2 + 0.35, pos = new THREE.Vector3(Math.cos(a) * 1.0, 0.1, Math.sin(a) * 1.0);
        const lf = makeLeaf(400 + i, 0.95, 0.36); const holder = new THREE.Object3D();
        holder.position.copy(pos); aimUp(holder, pos.clone().sub(focal).add(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(1.6)));
        holder.add(lf); root.add(holder);
      }
    }
    heads.forEach((h, i) => {
      const f = makeFlower(h.style, h.pal, 500 + i * 13 + h.pal[1].charCodeAt(2), { res: 128 });
      f.setOpen(h.style === 'rose' ? 0.55 + r() * 0.25 : 0.65 + r() * 0.3);
      const holder = new THREE.Object3D(); holder.position.copy(h.pos); aimUp(holder, h.dir);
      f.group.scale.setScalar(h.s); f.group.rotation.y = r() * 6.28;
      holder.add(f.group); root.add(holder);
    });
    fit();
  }
  function fit() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const fov = camera.fov * Math.PI / 180, need = Math.max(size.y, size.x / camera.aspect) * 0.62 / Math.tan(fov / 2);
    camera.position.set(c.x, c.y + need * 0.38, c.z + need);
    camera.lookAt(c); camera.updateProjectionMatrix();
    st.placeCatcher(c, size.z * 0.5 + 1.2);
  }
  addEventListener('resize', () => { if (root) { fit(); lp.once(); } });
  const lp = loop(canvas, dt => { if (root) root.rotation.y += dt * 0.15; renderer.render(scene, camera); }, opts.still);
  return {
    set(tone, form) { build(tone, form); lp.once(); lp.start(); }
  };
}

window.PetaliBloom = { init: initBloom };
window.PetaliBouquet = { init: initBouquet };
