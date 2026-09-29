/*
 * Pizza Sbrano — teglia di focaccia 3D procedurale.
 * Niente modelli esterni: impasto, buchi, olio, sale e condimenti sono generati
 * da un campo di altezze condiviso tra geometria, texture colore, rugosità e clearcoat.
 * Build: esbuild src/focaccia.js --bundle --minify --format=iife --global-name=Focaccia
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const W = 4.2, D = 2.9, T = 0.2;            // dimensioni focaccia (unità ≈ 10 cm)
const COLS = 4, ROWS = 3, GAP = 0.016;      // tagli
const TRAY_H = 0.34, TRAY_T = 0.035;

/* ---------- rumore deterministico ---------- */
function hash(i, j, s = 0) {
  let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y, s = 0) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s = 0, oct = 4) {
  let t = 0, a = 0.5, f = 1;
  for (let k = 0; k < oct; k++) { t += a * vnoise(x * f, y * f, s + k); f *= 2.03; a *= 0.5; }
  return t / (1 - Math.pow(0.5, oct));
}
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

/* ---------- impasto: buchi fatti con le dita ---------- */
function makeDimples(seed) {
  const r = rng(seed), cell = 0.2, list = [], grid = new Map();
  for (let gx = -Math.ceil(W / 2 / cell); gx <= Math.ceil(W / 2 / cell); gx++)
    for (let gz = -Math.ceil(D / 2 / cell); gz <= Math.ceil(D / 2 / cell); gz++) {
      const x = (gx + 0.5 + (r() - 0.5) * 0.75) * cell, z = (gz + 0.5 + (r() - 0.5) * 0.75) * cell;
      const d = { x, z, rx: 0.038 + r() * 0.03, rz: 0.034 + r() * 0.03, rot: r() * Math.PI, dep: 0.045 + r() * 0.05 };
      d.c = Math.cos(d.rot); d.s = Math.sin(d.rot);
      list.push(d);
      const key = gx + ',' + gz; grid.set(key, d);
    }
  return { list, grid, cell };
}

function field(dim) {
  const { grid, cell } = dim;
  return (x, z) => {
    const e = Math.min(W / 2 - Math.abs(x), D / 2 - Math.abs(z));
    let h = T + (fbm(x * 1.6 + 7, z * 1.6, 1) - 0.5) * 0.06 + (fbm(x * 7, z * 7, 9, 3) - 0.5) * 0.014;
    h += 0.055 * Math.exp(-Math.max(e, 0) / 0.13);          // l'impasto sale contro la teglia
    h -= 0.07 * (1 - smooth(0, 0.045, e));                  // spigolo arrotondato
    let dm = 0;
    const gx = Math.floor(x / cell), gz = Math.floor(z / cell);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const d = grid.get((gx + a) + ',' + (gz + b)); if (!d) continue;
      const dx = x - d.x, dz = z - d.z, u = (dx * d.c + dz * d.s) / d.rx, v = (-dx * d.s + dz * d.c) / d.rz;
      const q = u * u + v * v;
      dm += d.dep * Math.exp(-q * 1.1) - d.dep * 0.18 * Math.exp(-Math.pow(Math.sqrt(q) - 1.5, 2) * 2.5); // buco + piccolo bordo rialzato
    }
    dm *= smooth(0.07, 0.24, e);
    return { h: h - dm, dm: Math.max(dm, 0), e };
  };
}

/* ---------- mappe (colore, rugosità, olio, dettaglio) ---------- */
function bakeMaps(F, res) {
  const tw = res, th = Math.round(res * D / W);
  const hm = new Float32Array(tw * th);
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const cCol = cv(tw, th), cRgh = cv(tw, th), cOil = cv(tw, th), cNrm = cv(tw, th);
  const iCol = cCol.getContext('2d').createImageData(tw, th), iRgh = cRgh.getContext('2d').createImageData(tw, th);
  const iOil = cOil.getContext('2d').createImageData(tw, th), iNrm = cNrm.getContext('2d').createImageData(tw, th);
  const det = new Float32Array(tw * th);
  const base = [0.84, 0.56, 0.24], peak = [0.60, 0.31, 0.09], dimple = [0.96, 0.81, 0.45], edge = [0.48, 0.23, 0.06], char = [0.34, 0.16, 0.05];
  for (let py = 0; py < th; py++) for (let px = 0; px < tw; px++) {
    const x = (px + 0.5) / tw * W - W / 2, z = (py + 0.5) / th * D - D / 2, i = py * tw + px;
    const f = F(x, z); hm[i] = f.h;
    const rel = (f.h - T) / 0.05;                                 // sopra/sotto la media
    let c = base.slice();
    const tPeak = smooth(-0.4, 1.0, rel) * 0.85 + (fbm(x * 5, z * 5, 21, 3) - 0.5) * 0.6 + (fbm(x * 1.1, z * 1.1, 23, 3) - 0.45) * 0.5;
    for (let k = 0; k < 3; k++) c[k] = mix(c[k], peak[k], Math.min(1, Math.max(0, tPeak)));
    const tDim = Math.min(1, f.dm * 16);
    for (let k = 0; k < 3; k++) c[k] = mix(c[k], dimple[k], tDim);
    const tEdge = 1 - smooth(0.0, 0.16, f.e);
    for (let k = 0; k < 3; k++) c[k] = mix(c[k], edge[k], tEdge * 0.85);
    const sp = fbm(x * 14, z * 14, 33, 3);                         // macchie di cottura
    const tChar = smooth(0.66, 0.8, sp) * 0.55 * (1 - tDim);
    for (let k = 0; k < 3; k++) c[k] = mix(c[k], char[k], tChar);
    const g = (vnoise(x * 180, z * 180, 5) - 0.5) * 0.06;          // grana
    iCol.data[i * 4] = Math.min(255, (c[0] + g) * 255); iCol.data[i * 4 + 1] = Math.min(255, (c[1] + g) * 255); iCol.data[i * 4 + 2] = Math.min(255, (c[2] + g * 0.6) * 255); iCol.data[i * 4 + 3] = 255;
    const oil = Math.min(1, tDim * 1.2 + smooth(0.5, 0.8, fbm(x * 3, z * 3, 44, 3)) * 0.45);
    const rg = mix(0.62, 0.22, oil) + tChar * 0.2;
    iRgh.data[i * 4] = iRgh.data[i * 4 + 1] = iRgh.data[i * 4 + 2] = rg * 255; iRgh.data[i * 4 + 3] = 255;
    iOil.data[i * 4] = iOil.data[i * 4 + 1] = iOil.data[i * 4 + 2] = (0.25 + oil * 0.75) * 255; iOil.data[i * 4 + 3] = 255;
    // dettaglio fine (pori, bollicine): solo nella normal map, la forma grande è già nella geometria
    det[i] = (fbm(x * 38, z * 38, 61, 3) - 0.5) * 0.004 + Math.max(0, vnoise(x * 95, z * 95, 71) - 0.72) * -0.006;
  }
  const px2 = W / tw;
  for (let py = 0; py < th; py++) for (let px = 0; px < tw; px++) {
    const i = py * tw + px;
    const l = det[py * tw + Math.max(0, px - 1)], r = det[py * tw + Math.min(tw - 1, px + 1)];
    const u = det[Math.max(0, py - 1) * tw + px], d = det[Math.min(th - 1, py + 1) * tw + px];
    let nx = -(r - l) / (2 * px2), ny = (d - u) / (2 * px2), nz = 1;
    const L = Math.hypot(nx, ny, nz); nx /= L; ny /= L; nz /= L;
    iNrm.data[i * 4] = (nx * 0.5 + 0.5) * 255; iNrm.data[i * 4 + 1] = (ny * 0.5 + 0.5) * 255; iNrm.data[i * 4 + 2] = (nz * 0.5 + 0.5) * 255; iNrm.data[i * 4 + 3] = 255;
  }
  cCol.getContext('2d').putImageData(iCol, 0, 0); cRgh.getContext('2d').putImageData(iRgh, 0, 0);
  cOil.getContext('2d').putImageData(iOil, 0, 0); cNrm.getContext('2d').putImageData(iNrm, 0, 0);
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const sample = (x, z) => {                                        // bilineare sul campo
    const fx = Math.min(tw - 1.001, Math.max(0, (x + W / 2) / W * tw - 0.5)), fy = Math.min(th - 1.001, Math.max(0, (z + D / 2) / D * th - 0.5));
    const ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy;
    const a = hm[iy * tw + ix], b = hm[iy * tw + ix + 1], c = hm[(iy + 1) * tw + ix], d = hm[(iy + 1) * tw + ix + 1];
    return mix(mix(a, b, ax), mix(c, d, ax), ay);
  };
  return { map: tex(cCol, true), rough: tex(cRgh), oil: tex(cOil), normal: tex(cNrm), sample };
}

function crumbTexture(outer) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d'), r = rng(outer ? 7 : 3);
  const grd = g.createLinearGradient(0, 0, 0, 256);
  if (outer) { grd.addColorStop(0, '#8a4613'); grd.addColorStop(0.5, '#a9601f'); grd.addColorStop(1, '#6e350c'); }
  else {
    grd.addColorStop(0, '#9a5a1c'); grd.addColorStop(0.06, '#c98a3c'); grd.addColorStop(0.12, '#f0d9a2');
    grd.addColorStop(0.8, '#f3dfae'); grd.addColorStop(0.9, '#d8a257'); grd.addColorStop(1, '#8f5016');
  }
  g.fillStyle = grd; g.fillRect(0, 0, 512, 256);
  if (!outer) {                                                     // alveoli della mollica
    for (let k = 0; k < 520; k++) {
      const x = r() * 512, y = 24 + r() * 200, s = 1 + Math.pow(r(), 2.4) * 11;
      g.beginPath(); g.ellipse(x, y, s * (1 + r() * 0.8), s * (0.55 + r() * 0.4), (r() - 0.5) * 0.6, 0, Math.PI * 2);
      g.fillStyle = `rgba(${150 + r() * 30},${104 + r() * 20},${46 + r() * 20},${0.35 + r() * 0.35})`; g.fill();
      g.beginPath(); g.ellipse(x, y - s * 0.25, s * 0.8, s * 0.3, 0, Math.PI, Math.PI * 2);
      g.strokeStyle = 'rgba(255,245,215,.45)'; g.lineWidth = 0.8; g.stroke();
    }
    g.fillStyle = 'rgba(214,170,70,.18)'; g.fillRect(0, 12, 512, 40);   // olio assorbito sotto la crosta
  } else {
    for (let k = 0; k < 1400; k++) { g.fillStyle = `rgba(${r() < .5 ? '60,25,5' : '200,130,60'},${r() * 0.25})`; g.fillRect(r() * 512, r() * 256, 1 + r() * 3, 1 + r() * 2); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
}

function marbleTexture() {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), r = rng(11);
  g.fillStyle = '#e7e2d9'; g.fillRect(0, 0, S, S);
  const img = g.getImageData(0, 0, S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const n = fbm(x / 260, y / 260, 90, 5), v = Math.abs(Math.sin((x * 0.6 + y * 0.8) / 140 + n * 7));
    const vein = Math.pow(1 - v, 26) * 0.16 + Math.pow(1 - v, 120) * 0.1 + (fbm(x / 90, y / 90, 17, 4) - 0.5) * 0.05, m = (fbm(x / 60, y / 60, 5, 3) - 0.5) * 0.06;
    const i = (y * S + x) * 4;
    img.data[i] = img.data[i] * (1 - vein + m); img.data[i + 1] = img.data[i + 1] * (1 - vein * 1.02 + m); img.data[i + 2] = img.data[i + 2] * (1 - vein * 1.05 + m);
  }
  g.putImageData(img, 0, 0);
  for (let k = 0; k < 4000; k++) { g.fillStyle = `rgba(90,85,78,${r() * 0.08})`; g.fillRect(r() * S, r() * S, 1.5, 1.5); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.anisotropy = 8; return t;
}

function softDot(inner, outer) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64); grd.addColorStop(0, inner); grd.addColorStop(1, outer);
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}

function potatoTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), r = rng(5);
  const grd = g.createRadialGradient(128, 128, 20, 128, 128, 128);
  grd.addColorStop(0, '#f2d98f'); grd.addColorStop(0.6, '#e8bd62'); grd.addColorStop(0.84, '#c07a2a'); grd.addColorStop(1, '#6e3a0e');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(150,80,20,${r() * 0.25})`; g.beginPath(); g.arc(r() * 256, r() * 256, 2 + r() * 10, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- geometria di un pezzo ---------- */
function pieceGeometry(x0, x1, z0, z1, sample, step) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const nx = Math.max(8, Math.ceil((x1 - x0) / step)), nz = Math.max(8, Math.ceil((z1 - z0) / step));
  const pos = [], nrm = [], uv = [], idx = [], e = 0.006;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = mix(x0, x1, i / nx), z = mix(z0, z1, j / nz), h = sample(x, z);
    pos.push(x - cx, h, z - cz);
    const dx = (sample(x + e, z) - sample(x - e, z)) / (2 * e), dz = (sample(x, z + e) - sample(x, z - e)) / (2 * e);
    const L = Math.hypot(dx, 1, dz); nrm.push(-dx / L, 1 / L, -dz / L);
    uv.push((x + W / 2) / W, 1 - (z + D / 2) / D);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const top = new THREE.BufferGeometry();
  top.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  top.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  top.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  top.setIndex(idx);

  // pareti: [punti lungo il bordo], normale uscente
  const edges = [
    { pts: [...Array(nx + 1)].map((_, i) => [mix(x0, x1, i / nx), z0]), n: [0, 0, -1], outer: Math.abs(z0 + D / 2) < 1e-3 },
    { pts: [...Array(nx + 1)].map((_, i) => [mix(x0, x1, i / nx), z1]), n: [0, 0, 1], outer: Math.abs(z1 - D / 2) < 1e-3 },
    { pts: [...Array(nz + 1)].map((_, j) => [x0, mix(z0, z1, j / nz)]), n: [-1, 0, 0], outer: Math.abs(x0 + W / 2) < 1e-3 },
    { pts: [...Array(nz + 1)].map((_, j) => [x1, mix(z0, z1, j / nz)]), n: [1, 0, 0], outer: Math.abs(x1 - W / 2) < 1e-3 },
  ];
  const sides = edges.map(ed => {
    const p = [], n = [], u = [], ix = []; let run = 0;
    ed.pts.forEach(([x, z], k) => {
      if (k) run += Math.hypot(x - ed.pts[k - 1][0], z - ed.pts[k - 1][1]);
      const h = sample(x, z);
      p.push(x - cx, 0.012, z - cz, x - cx, h, z - cz);
      n.push(...ed.n, ...ed.n);
      u.push(run / 1.1, 0, run / 1.1, 1);
      if (k) { const a = (k - 1) * 2; ix.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
    g.setIndex(ix);
    return { g, outer: ed.outer };
  });
  const bottom = new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(Math.PI / 2).translate(0, 0.012, 0);
  return { top, sides, bottom, cx, cz };
}

/* ---------- condimenti ---------- */
function scatter(r, n, sample, pieces, place) {
  let k = 0, tries = 0;
  while (k < n && tries++ < n * 20) {
    const x = (r() - 0.5) * (W - 0.14), z = (r() - 0.5) * (D - 0.14);
    const p = pieces.find(p => x > p.x0 + 0.02 && x < p.x1 - 0.02 && z > p.z0 + 0.02 && z < p.z1 - 0.02);
    if (!p) continue;
    place(p, x, z, sample(x, z)); k++;
  }
}

export function create(canvas, opts = {}) {
  const o = Object.assign({ topping: 'classica', autoRotate: true, zoom: true, theme: 'day', onPick: null, onReady: null, shiftY: 0, shiftX: 0, reduced: false, distance: null }, opts);
  let gl;
  try { gl = canvas.getContext('webgl2', { antialias: true }) || canvas.getContext('webgl', { antialias: true }); } catch (e) { }
  if (!gl) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const bg = new THREE.Color('#efe8da');
  scene.background = bg; scene.fog = new THREE.Fog(bg, 9, 17);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.06; controls.enablePan = false;
  controls.enableZoom = o.zoom; controls.minDistance = 4; controls.maxDistance = 11;
  controls.minPolarAngle = 0.25; controls.maxPolarAngle = 1.22;
  controls.autoRotate = o.autoRotate && !o.reduced; controls.autoRotateSpeed = 0.35;
  controls.target.set(0, 0.15, 0);

  /* banco di marmo */
  const counter = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshPhysicalMaterial({ map: marbleTexture(), roughness: 0.28, clearcoat: 0.4, clearcoatRoughness: 0.25 }));
  counter.rotation.x = -Math.PI / 2; counter.receiveShadow = true; scene.add(counter);

  /* teglia in ferro brunito */
  const tray = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: '#34302c', metalness: 0.85, roughness: 0.42 });
  const iw = W + 0.03, id = D + 0.03;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(iw + TRAY_T * 2, 0.02, id + TRAY_T * 2), steel); plate.position.y = 0.0; tray.add(plate);
  [[0, id / 2 + TRAY_T / 2, iw + TRAY_T * 2, TRAY_T], [0, -id / 2 - TRAY_T / 2, iw + TRAY_T * 2, TRAY_T], [iw / 2 + TRAY_T / 2, 0, TRAY_T, id], [-iw / 2 - TRAY_T / 2, 0, TRAY_T, id]].forEach(([x, z, w, d]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, TRAY_H, d), steel); m.position.set(x, TRAY_H / 2, z); tray.add(m);
  });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#4a4540', metalness: 0.9, roughness: 0.3 });
  [[0, id / 2 + TRAY_T / 2, iw + TRAY_T * 2 + 0.04, 0], [0, -id / 2 - TRAY_T / 2, iw + TRAY_T * 2 + 0.04, 0], [iw / 2 + TRAY_T / 2, 0, id + TRAY_T * 2 + 0.04, 1], [-iw / 2 - TRAY_T / 2, 0, id + TRAY_T * 2 + 0.04, 1]].forEach(([x, z, L, rot]) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, L, 16), rimMat);
    m.rotation.z = Math.PI / 2; if (rot) m.rotation.y = Math.PI / 2; m.position.set(x, TRAY_H, z); tray.add(m);
  });
  // ombra di contatto morbida sotto la teglia
  { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const grd = g.createRadialGradient(128, 128, 30, 128, 128, 128); grd.addColorStop(0, 'rgba(0,0,0,.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.45, D * 1.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.003; scene.add(sh); }
  tray.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  scene.add(tray);

  /* focaccia */
  const mobile = Math.min(window.innerWidth, window.innerHeight) < 700;
  const F = field(makeDimples(24));
  const maps = bakeMaps(F, mobile ? 768 : 1024);
  const topMat = new THREE.MeshPhysicalMaterial({
    map: maps.map, roughnessMap: maps.rough, roughness: 1, normalMap: maps.normal, normalScale: new THREE.Vector2(1.2, 1.2),
    clearcoat: 0.55, clearcoatMap: maps.oil, clearcoatRoughness: 0.18, sheen: 0.4, sheenColor: new THREE.Color('#ffd8a0'), sheenRoughness: 0.6,
  });
  const crumbMat = new THREE.MeshStandardMaterial({ map: crumbTexture(false), roughness: 0.85, side: THREE.DoubleSide });
  const crustMat = new THREE.MeshStandardMaterial({ map: crumbTexture(true), roughness: 0.7, side: THREE.DoubleSide });

  const pieces = [];
  const focaccia = new THREE.Group(); focaccia.position.y = 0.02; scene.add(focaccia);
  for (let rI = 0; rI < ROWS; rI++) for (let cI = 0; cI < COLS; cI++) {
    const x0 = -W / 2 + cI * W / COLS + (cI ? GAP / 2 : 0), x1 = -W / 2 + (cI + 1) * W / COLS - (cI < COLS - 1 ? GAP / 2 : 0);
    const z0 = -D / 2 + rI * D / ROWS + (rI ? GAP / 2 : 0), z1 = -D / 2 + (rI + 1) * D / ROWS - (rI < ROWS - 1 ? GAP / 2 : 0);
    const geo = pieceGeometry(x0, x1, z0, z1, maps.sample, mobile ? 0.028 : 0.02);
    const g = new THREE.Group(); g.position.set(geo.cx, 0, geo.cz);
    const top = new THREE.Mesh(geo.top, topMat); top.castShadow = top.receiveShadow = true; g.add(top);
    geo.sides.forEach(s => { const m = new THREE.Mesh(s.g, s.outer ? crustMat : crumbMat); m.castShadow = true; m.receiveShadow = true; g.add(m); });
    g.add(new THREE.Mesh(geo.bottom, crustMat));
    const toppings = new THREE.Group(); g.add(toppings);
    focaccia.add(g);
    pieces.push({ g, x0, x1, z0, z1, cx: geo.cx, cz: geo.cz, index: pieces.length, lifted: false, home: g.position.clone(), toppings, sets: {} });
  }

  /* condimenti per pezzo */
  const dummy = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0), nrm = new THREE.Vector3(), q = new THREE.Quaternion();
  const normalAt = (x, z) => { const e = 0.01; nrm.set(-(maps.sample(x + e, z) - maps.sample(x - e, z)) / (2 * e), 1, -(maps.sample(x, z + e) - maps.sample(x, z - e)) / (2 * e)).normalize(); return nrm; };
  function buildSet(name, geo, mat, count, seed, placeFn) {
    const r = rng(seed), buckets = pieces.map(() => []);
    scatter(r, count, maps.sample, pieces, (p, x, z, h) => buckets[p.index].push(placeFn(r, x, z, h)));
    pieces.forEach((p, i) => {
      const list = buckets[i]; if (!list.length) return;
      const im = new THREE.InstancedMesh(geo, mat, list.length); im.castShadow = true; im.receiveShadow = true;
      list.forEach((t, k) => {
        dummy.position.set(t.x - p.cx, t.y, t.z - p.cz);
        q.setFromUnitVectors(up, normalAt(t.x, t.z)); dummy.quaternion.copy(q);
        dummy.rotateY(t.ry || 0); if (t.rx) dummy.rotateX(t.rx); if (t.rz) dummy.rotateZ(t.rz);
        dummy.scale.set(t.sx || 1, t.sy || 1, t.sz || 1); dummy.updateMatrix(); im.setMatrixAt(k, dummy.matrix);
        if (t.col) im.setColorAt(k, t.col);
      });
      const holder = new THREE.Group(); holder.add(im); holder.visible = false; holder.userData.set = name;
      p.toppings.add(holder); (p.sets[name] = p.sets[name] || []).push(holder);
    });
  }
  const tmpC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
  // sale grosso (sempre)
  buildSet('sale', new THREE.DodecahedronGeometry(0.011, 0), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.18, transmission: 0, clearcoat: 1, sheen: 0 }), mobile ? 420 : 700, 91,
    (r, x, z, h) => ({ x, z, y: h + 0.004, ry: r() * 6, rx: r() * 3, sx: 0.5 + r(), sy: 0.5 + r() * 0.8, sz: 0.5 + r() }));
  // patate
  const potato = new THREE.CylinderGeometry(0.135, 0.135, 0.016, 32, 1);
  buildSet('patate', potato, new THREE.MeshPhysicalMaterial({ map: potatoTexture(), roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.2 }), 120, 12,
    (r, x, z, h) => ({ x, z, y: h + 0.006 + r() * 0.01, ry: r() * 6, rx: (r() - 0.5) * 0.25, rz: (r() - 0.5) * 0.25, sx: 0.8 + r() * 0.5, sz: 0.7 + r() * 0.4, col: tmpC('#ffffff', '#c98a45', r() * 0.8) }));
  // cipolle
  const onionGeos = [new THREE.TorusGeometry(0.075, 0.009, 6, 24, Math.PI * 1.1), new THREE.TorusGeometry(0.05, 0.008, 6, 20, Math.PI * 1.4)];
  const onionMat = new THREE.MeshPhysicalMaterial({ color: '#e9c98f', roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.15, transmission: 0.0 });
  onionGeos.forEach((g, gi) => { g.rotateX(Math.PI / 2); buildSet('cipolle', g, onionMat, 120, 30 + gi, (r, x, z, h) => ({ x, z, y: h + 0.008, ry: r() * 6, col: tmpC('#fff4dc', '#b0621d', Math.pow(r(), 1.5) * 0.8) })); });
  // olive taggiasche
  buildSet('olive', new THREE.SphereGeometry(0.036, 18, 12), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 }), 90, 44,
    (r, x, z, h) => ({ x, z, y: h + 0.018, ry: r() * 6, sx: 1, sy: 0.72, sz: 1.3 + r() * 0.3, col: tmpC('#3a2530', '#6b4a2e', r()) }));
  // rosmarino
  const needle = new THREE.CylinderGeometry(0.0035, 0.006, 0.075, 5); needle.rotateZ(Math.PI / 2);
  { const r0 = rng(77); const clusters = [...Array(38)].map(() => [(r0() - 0.5) * (W - 0.3), (r0() - 0.5) * (D - 0.3)]); let ci = 0;
    buildSet('rosmarino', needle, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55 }), 380, 78,
      (r, x, z, h) => { const c = clusters[ci++ % clusters.length]; const xx = c[0] + (r() - 0.5) * 0.12, zz = c[1] + (r() - 0.5) * 0.12; return { x: xx, z: zz, y: maps.sample(xx, zz) + 0.006, ry: r() * 6, col: tmpC('#3c5a2a', '#6f7f3a', r()) }; }); }

  let current = null;
  function setTopping(name, animate = true) {
    if (name === current) return;
    current = name;
    pieces.forEach(p => {
      Object.entries(p.sets).forEach(([k, arr]) => arr.forEach(h => {
        const on = k === 'sale' || k === name;
        if (on && !h.visible && animate && !o.reduced && window.gsap) {
          h.visible = true; h.position.y = 0.6; h.scale.setScalar(0.6);
          window.gsap.to(h.position, { y: 0, duration: 0.7, ease: 'bounce.out', delay: Math.random() * 0.25 });
          window.gsap.to(h.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'power2.out' });
        } else h.visible = on;
      }));
    });
  }
  setTopping(o.topping, false);

  /* luci */
  const hemi = new THREE.HemisphereLight('#fff4e2', '#6b5a48', 0.5); scene.add(hemi);
  const key = new THREE.DirectionalLight('#ffe6c4', 2.4); key.position.set(-2.2, 8, 2.6); key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048); key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02; scene.add(key);
  const rim = new THREE.DirectionalLight('#cfe0ff', 0.6); rim.position.set(3, 3, -5); scene.add(rim);
  const lamp = new THREE.PointLight('#ff9a3c', 0, 8, 2); lamp.position.set(1.6, 2.3, 1.1); scene.add(lamp);

  /* vapore */
  const steamTex = softDot('rgba(255,255,255,.9)', 'rgba(255,255,255,0)');
  const steam = [];
  if (!o.reduced) for (let i = 0; i < 26; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, opacity: 0, depthWrite: false }));
    s.userData = { x: (Math.random() - 0.5) * W * 0.8, z: (Math.random() - 0.5) * D * 0.8, t: Math.random(), sp: 0.05 + Math.random() * 0.05 };
    scene.add(s); steam.push(s);
  }

  const themes = {
    day: { bg: '#efe8da', exp: 1.0, env: 0.55, key: 2.4, keyC: '#ffe6c4', hemi: 0.5, rim: 0.6, lamp: 0, steam: 0.08 },
    night: { bg: '#0f0d0b', exp: 1.05, env: 0.1, key: 0.3, keyC: '#9fb4ff', hemi: 0.06, rim: 0.9, lamp: 16, steam: 0.13 },
  };
  let th = themes[o.theme] || themes.day;
  function setTheme(name) {
    const t = themes[name] || themes.day; th = t;
    const apply = () => { };
    const target = { k: key.intensity, h: hemi.intensity, r: rim.intensity, l: lamp.intensity, e: scene.environmentIntensity ?? 1 };
    const to = { k: t.key, h: t.hemi, r: t.rim, l: t.lamp, e: t.env };
    const bgFrom = bg.clone(), bgTo = new THREE.Color(t.bg), kc0 = key.color.clone(), kc1 = new THREE.Color(t.keyC);
    const upd = (p) => {
      key.intensity = mix(target.k, to.k, p); hemi.intensity = mix(target.h, to.h, p); rim.intensity = mix(target.r, to.r, p); lamp.intensity = mix(target.l, to.l, p);
      scene.environmentIntensity = mix(target.e, to.e, p); bg.copy(bgFrom).lerp(bgTo, p); scene.fog.color.copy(bg); key.color.copy(kc0).lerp(kc1, p);
      counter.material.color.setScalar(name === 'night' ? mix(1, 0.28, p) : mix(0.28, 1, p));
    };
    if (window.gsap && !o.reduced) { const s = { p: 0 }; window.gsap.to(s, { p: 1, duration: 0.9, ease: 'power2.inOut', onUpdate: () => upd(s.p) }); }
    else upd(1);
    apply();
  }
  scene.environmentIntensity = th.env; key.intensity = th.key; key.color.set(th.keyC); hemi.intensity = th.hemi; rim.intensity = th.rim; lamp.intensity = th.lamp;
  bg.set(th.bg); scene.fog.color.copy(bg); if (o.theme === 'night') counter.material.color.setScalar(0.28);

  /* camera e dimensioni */
  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const dist = o.distance ? o.distance(w, h) : (w / h < 0.8 ? 10.5 : w / h < 1.2 ? 8.2 : 6.6);
    scene.fog.near = dist + 1.5; scene.fog.far = dist + 10;
    controls.maxDistance = Math.max(11, dist * 1.25); controls.minDistance = Math.min(4, dist * 0.6);
    if (!resize.done) { camera.position.setFromSpherical(new THREE.Spherical(dist, 0.92, 0.5)); resize.done = true; }
    else { const v = camera.position.clone().sub(controls.target).setLength(dist); camera.position.copy(controls.target).add(v); }
    if (o.shiftX || o.shiftY) camera.setViewOffset(w, h, -w * (o.shiftX || 0), -h * (o.shiftY || 0), w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  /* interazione: hover + clic per sollevare un pezzo */
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let hover = null, down = null, idleT = 0;
  const pick = (e) => {
    const r = canvas.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(pieces.map(p => p.g), true)[0];
    if (!hit) return null;
    let obj = hit.object; while (obj && !pieces.find(p => p.g === obj)) obj = obj.parent;
    return pieces.find(p => p.g === obj) || null;
  };
  const tween = (obj, props, dur, ease) => window.gsap ? window.gsap.to(obj, Object.assign({ duration: o.reduced ? 0 : dur, ease: ease || 'power3.out' }, props)) : Object.assign(obj, props);
  function lift(p) {
    pieces.forEach(q => { if (q.lifted && q !== p) drop(q); });
    p.lifted = true;
    const toCam = camera.position.clone().sub(controls.target).setY(0).normalize().multiplyScalar(1.0);
    const pos = p.home.clone().add(toCam); pos.y = 1.35;
    tween(p.g.position, { x: pos.x, y: pos.y, z: pos.z }, 0.9);
    const ax = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), toCam.clone().normalize());
    const qT = new THREE.Quaternion().setFromAxisAngle(ax.normalize(), 0.7).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.25));
    const s = { t: 0 }, q0 = p.g.quaternion.clone();
    tween(s, { t: 1, onUpdate: () => p.g.quaternion.copy(q0).slerp(qT, s.t) }, 0.9);
    o.onPick && o.onPick(p.index, true);
  }
  function drop(p) {
    p.lifted = false;
    tween(p.g.position, { x: p.home.x, y: 0, z: p.home.z }, 0.7, 'power2.inOut');
    const s = { t: 0 }, q0 = p.g.quaternion.clone(), q1 = new THREE.Quaternion();
    tween(s, { t: 1, onUpdate: () => p.g.quaternion.copy(q0).slerp(q1, s.t) }, 0.7);
    o.onPick && o.onPick(p.index, false);
  }
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; idleT = 0; });
  canvas.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const p = pick(e);
    if (p) p.lifted ? drop(p) : lift(p);
    else pieces.forEach(q => q.lifted && drop(q));
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const p = pick(e);
    if (p !== hover) {
      if (hover && !hover.lifted) tween(hover.g.position, { y: 0 }, 0.3);
      hover = p;
      if (hover && !hover.lifted) tween(hover.g.position, { y: 0.05 }, 0.3);
      canvas.style.cursor = hover ? 'pointer' : 'grab';
    }
  });
  canvas.addEventListener('pointerleave', () => { if (hover && !hover.lifted) tween(hover.g.position, { y: 0 }, 0.3); hover = null; });
  controls.addEventListener('start', () => { controls.autoRotate = false; idleT = 0; });

  /* loop */
  let running = true, raf = 0, last = performance.now(), firstFrame = true;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    idleT += dt; if (idleT > 6 && o.autoRotate && !o.reduced && !pieces.some(p => p.lifted)) controls.autoRotate = true;
    controls.update();
    steam.forEach(s => {
      const u = s.userData; u.t += dt * u.sp; if (u.t > 1) { u.t = 0; u.x = (Math.random() - 0.5) * W * 0.8; u.z = (Math.random() - 0.5) * D * 0.8; }
      s.position.set(u.x + Math.sin(u.t * 6 + u.z) * 0.15, 0.35 + u.t * 2.2, u.z);
      s.scale.setScalar(0.5 + u.t * 1.6); s.material.opacity = Math.sin(u.t * Math.PI) * th.steam;
    });
    renderer.render(scene, camera);
    if (firstFrame) { firstFrame = false; o.onReady && o.onReady(); }
    if (running) raf = requestAnimationFrame(frame);
  }
  const start = () => { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame); };
  new IntersectionObserver(([e]) => { running = e.isIntersecting && !document.hidden; if (running) start(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) start(); });
  start();

  return {
    setTopping, setTheme,
    reset() { pieces.forEach(q => q.lifted && drop(q)); },
    liftRandom() { lift(pieces[5]); },
  };
}
