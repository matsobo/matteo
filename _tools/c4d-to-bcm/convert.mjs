// Converte "Opel Astra.c4d" in un formato binario compatto per il sito (BCM1, gzip + base64).
// Uso: node convert.mjs <file.c4d> <out.js> [scala-target]
import fs from 'node:fs';
import zlib from 'node:zlib';
import { MeshoptSimplifier } from 'meshoptimizer';
import { parseC4D } from './c4dparse.mjs';

const [src, outJs, tScaleArg] = process.argv.slice(2);
const TSCALE = parseFloat(tScaleArg || '1');
await MeshoptSimplifier.ready;
const r = parseC4D(src);

/* ---------- materiali: tag in ordine, l'ultimo vince ---------- */
const matNames = []; const matIdx = {};
const fm = new Int16Array(r.NF).fill(-1);
for (const t of r.tex) {
  if (!(t.name in matIdx)) { matIdx[t.name] = matNames.length; matNames.push(t.name); }
  const m = matIdx[t.name];
  if (!t.restriction) { fm.fill(m); continue; }
  for (const [a, b] of r.sels[t.restriction]) for (let f = a; f <= b; f++) fm[f] = m;
}

/* ---------- gruppi di resa e budget di triangoli ---------- */
const GROUPS = [
  { name: 'paint',   mats: ['carpaint'], tris: 52000 },
  { name: 'chrome',  mats: ['chrome', 'chrome stripes', 'chrome squares'], tris: 12000 },
  { name: 'grille',  mats: ['metal wireMap #44'], tris: 1400 },
  { name: 'plastic', mats: ['black plastic'], tris: 16000 },
  { name: 'trim',    mats: ['23 - Default', '04 - Defaultbmb', '23 - Default2'], tris: 3500 },
  { name: 'glass',   mats: ['glass'], tris: 3200 },
  { name: 'lampFront', mats: [], tris: 2200 },
  { name: 'lampRear', mats: [], tris: 2400 },
  { name: 'glassDark', mats: ['glass black'], tris: 2600 },
  { name: 'glassRed', mats: ['glass red'], tris: 1100 },
  { name: 'glassOrange', mats: ['glass orange'], tris: 1400 },
  { name: 'rims',    mats: ['rims'], tris: 9000 },
  { name: 'rotor',   mats: ['rotorMap #38'], tris: 2200 },
  { name: 'rubber',  mats: ['rubber'], tris: 7500 },
  { name: 'interior', mats: ['interior', 'simple_metal_0_98', 'Material #743Map #26', 'Material #744Map #27'], tris: 9000 },
  { name: 'plate',   mats: ['regiter plateMap #24'], tris: 500 },
];
const DROP = new Set(['Material #411']); // dettaglio del marchio: rimosso

/* ---------- trasformazione: muso +X, alto +Y, metri, ruote a y=0 ---------- */
// C4D: lunghezza su Y (muso +Y), verticale su -Z (terra a Z=+53), lato guida a X<0.
// Scena: lato guida (sinistro) a -Z  ->  newZ = X_c4d
let zGround = -Infinity, yMin = Infinity, yMax = -Infinity;
for (let i = 0; i < r.NP; i++) { const z = r.pos[i * 3 + 2]; if (z > zGround) zGround = z; const y = r.pos[i * 3 + 1]; if (y < yMin) yMin = y; if (y > yMax) yMax = y; }
const LEN_M = 4.29 * TSCALE;                     // lunghezza reale Astra H (circa)
const s = LEN_M / (yMax - yMin);
const P = new Float32Array(r.NP * 3);
for (let i = 0; i < r.NP; i++) {
  const x = r.pos[i * 3], y = r.pos[i * 3 + 1], z = r.pos[i * 3 + 2];
  P[i * 3] = y * s; P[i * 3 + 1] = (zGround - z) * s; P[i * 3 + 2] = x * s;
}
console.log('scala', s.toFixed(5), 'lunghezza', LEN_M);

/* ---------- pezzi connessi (vetri, cromature) per classificare fari e loghi ---------- */
function componentsOf(matSet) {
  const par = new Map();
  const find = (x) => { while (par.get(x) !== x) { par.set(x, par.get(par.get(x))); x = par.get(x); } return x; };
  const faces = [];
  for (let f = 0; f < r.NF; f++) if (matSet.has(matNames[fm[f]])) faces.push(f);
  for (const f of faces) for (let k = 0; k < 4; k++) { const v = r.polys[f * 4 + k]; if (!par.has(v)) par.set(v, v); }
  for (const f of faces) { const a = find(r.polys[f * 4]); for (let k = 1; k < 4; k++) { const b = find(r.polys[f * 4 + k]); if (a !== b) par.set(b, a); } }
  const box = new Map(), faceComp = new Map();
  for (const f of faces) {
    const c = find(r.polys[f * 4]); faceComp.set(f, c);
    let b = box.get(c); if (!b) { b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; box.set(c, b); }
    for (let k = 0; k < 4; k++) { const v = r.polys[f * 4 + k]; for (let j = 0; j < 3; j++) { const x = P[v * 3 + j]; if (x < b[j]) b[j] = x; if (x > b[j + 3]) b[j + 3] = x; } }
  }
  return { faceComp, box };
}
const GL = componentsOf(new Set(['glass']));
const CH = componentsOf(new Set(['chrome', 'chrome stripes', 'chrome squares']));
const T_ = TSCALE;
function glassKind(f) {
  const b = GL.box.get(GL.faceComp.get(f));
  const cz = (b[2] + b[5]) / 2;
  if (b[3] > 1.5 * T_ && b[4] < 0.9 * T_) return (b[1] > 0.5 * T_ && cz > 0) ? 'headlight' : 'lampFront';
  if (b[0] < -1.55 * T_ && (b[4] < 1.06 * T_ || (b[1] > 1.3 * T_ && b[4] < 1.36 * T_))) return 'lampRear';
  return 'glass';
}
function chromeDrop(f) {
  const b = CH.box.get(CH.faceComp.get(f));
  const cz = (b[2] + b[5]) / 2, span = Math.max(b[3] - b[0], b[4] - b[1], b[5] - b[2]);
  if (Math.abs(cz) < 0.1 * T_ && span < 0.2 * T_ && (b[0] > 1.95 * T_ || b[3] < -1.98 * T_)) return true;   // loghi
  if (b[3] < -1.98 * T_ && b[1] > 0.78 * T_ && b[4] < 0.86 * T_ && (b[5] - b[2]) < 0.06 * T_) return true;  // scritta sul portellone
  return false;
}

/* ---------- triangolazione per gruppo ---------- */
const g2 = {}; GROUPS.forEach((g, i) => g.mats.forEach((m) => { g2[m] = i; }));
const tris = GROUPS.map(() => []);
const hl = []; // vetro del faro anteriore destro (lato verso la camera)
const gIndex = (n) => GROUPS.findIndex((g) => g.name === n);
let dropped = 0;
for (let f = 0; f < r.NF; f++) {
  const mname = matNames[fm[f]];
  if (DROP.has(mname)) { dropped++; continue; }
  let gi = g2[mname]; if (gi === undefined) throw new Error('materiale senza gruppo: ' + mname);
  const a = r.polys[f * 4], b = r.polys[f * 4 + 1], c = r.polys[f * 4 + 2], d = r.polys[f * 4 + 3];
  let list = tris[gi];
  if (GROUPS[gi].name === 'glass') { const k = glassKind(f); if (k === 'headlight') list = hl; else list = tris[gIndex(k)]; }
  else if (GROUPS[gi].name === 'chrome' && chromeDrop(f)) { dropped++; continue; }
  list.push(a, b, c);
  if (c !== d) list.push(a, c, d);
}
console.log('poligoni rimossi (loghi e scritte):', dropped);
GROUPS.push({ name: 'headlight', mats: [], tris: 2000 }); tris.push(hl);

/* ---------- verso delle facce: il tetto deve guardare in alto ---------- */
function faceNormal(a, b, c) {
  const ux = P[b*3]-P[a*3], uy = P[b*3+1]-P[a*3+1], uz = P[b*3+2]-P[a*3+2];
  const vx = P[c*3]-P[a*3], vy = P[c*3+1]-P[a*3+1], vz = P[c*3+2]-P[a*3+2];
  return [uy*vz - uz*vy, uz*vx - ux*vz, ux*vy - uy*vx];
}
let up = 0, dn = 0;
const paintT = tris[0];
for (let k = 0; k < paintT.length; k += 3) {
  const a = paintT[k], b = paintT[k+1], c = paintT[k+2];
  const cy = (P[a*3+1] + P[b*3+1] + P[c*3+1]) / 3;
  if (cy < 1.3 * TSCALE) continue;
  const n = faceNormal(a, b, c); if (n[1] > 0) up++; else dn++;
}
const FLIP = dn > up;
console.log('tetto: su', up, 'giù', dn, '-> inverto il verso:', FLIP);

/* ---------- semplificazione + bordi vivi ---------- */
const CREASE = Math.cos(38 * Math.PI / 180);
function build(gIdx) {
  const T = tris[gIdx];
  if (!T.length) return null;
  // compatta i vertici usati
  const remap = new Map(); const pos = [];
  const idx = new Uint32Array(T.length);
  for (let k = 0; k < T.length; k++) {
    const v = T[k]; let n = remap.get(v);
    if (n === undefined) { n = pos.length / 3; remap.set(v, n); pos.push(P[v*3], P[v*3+1], P[v*3+2]); }
    idx[k] = n;
  }
  if (FLIP) for (let k = 0; k < idx.length; k += 3) { const t = idx[k+1]; idx[k+1] = idx[k+2]; idx[k+2] = t; }
  const posF = new Float32Array(pos);
  const target = Math.min(idx.length, GROUPS[gIdx].tris * 3);
  let out = idx, err = 0;
  if (target < idx.length) {
    [out, err] = MeshoptSimplifier.simplify(idx, posF, 3, target, 0.02, ['LockBorder']);
    if (out.length > target * 1.25) {          // bordi troppo vincolanti: secondo passaggio senza blocco
      [out, err] = MeshoptSimplifier.simplify(idx, posF, 3, target, 0.02, []);
    }
  }
  // normali di faccia
  const nt = out.length / 3;
  const fn = new Float32Array(nt * 3);
  for (let t = 0; t < nt; t++) {
    const a = out[t*3], b = out[t*3+1], c = out[t*3+2];
    const ux = posF[b*3]-posF[a*3], uy = posF[b*3+1]-posF[a*3+1], uz = posF[b*3+2]-posF[a*3+2];
    const vx = posF[c*3]-posF[a*3], vy = posF[c*3+1]-posF[a*3+1], vz = posF[c*3+2]-posF[a*3+2];
    fn[t*3] = uy*vz - uz*vy; fn[t*3+1] = uz*vx - ux*vz; fn[t*3+2] = ux*vy - uy*vx;
  }
  const unit = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x/l, y/l, z/l]; };
  // triangoli incidenti per vertice
  const nv = posF.length / 3;
  const inc = Array.from({ length: nv }, () => []);
  for (let t = 0; t < nt; t++) for (let k = 0; k < 3; k++) inc[out[t*3+k]].push(t);
  // separa i vertici sugli spigoli vivi
  const newPos = []; const newIdx = new Uint32Array(out.length);
  for (let v = 0; v < nv; v++) {
    const ts = inc[v]; if (!ts.length) continue;
    const groups = []; // {n:[x,y,z], id}
    for (const t of ts) {
      const nt0 = unit(fn[t*3], fn[t*3+1], fn[t*3+2]);
      let sx = 0, sy = 0, sz = 0;
      for (const u of ts) {
        const nu = unit(fn[u*3], fn[u*3+1], fn[u*3+2]);
        if (nu[0]*nt0[0] + nu[1]*nt0[1] + nu[2]*nt0[2] >= CREASE) { sx += fn[u*3]; sy += fn[u*3+1]; sz += fn[u*3+2]; }
      }
      const cn = unit(sx, sy, sz);
      let g = groups.find((G) => G.n[0]*cn[0] + G.n[1]*cn[1] + G.n[2]*cn[2] > 0.995);
      if (!g) { g = { n: cn, id: newPos.length / 3 }; groups.push(g); newPos.push(posF[v*3], posF[v*3+1], posF[v*3+2]); }
      for (let k = 0; k < 3; k++) if (out[t*3+k] === v) newIdx[t*3+k] = g.id;
    }
  }
  return { name: GROUPS[gIdx].name, pos: new Float32Array(newPos), idx: newIdx, srcTris: T.length / 3, err };
}

const prims = [];
for (let g = 0; g < GROUPS.length; g++) {
  const p = build(g); if (!p) continue;
  prims.push(p);
  console.log(p.name.padEnd(12), 'tri', String(p.srcTris).padStart(7), '->', String(p.idx.length / 3).padStart(6), 'vert', String(p.pos.length / 3).padStart(6), 'err', p.err.toFixed(4));
}

/* ---------- scrittura BCM1 ---------- */
const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
for (const p of prims) for (let i = 0; i < p.pos.length; i++) { const k = i % 3; if (p.pos[i] < mn[k]) mn[k] = p.pos[i]; if (p.pos[i] > mx[k]) mx[k] = p.pos[i]; }
const header = { v: 1, min: mn, max: mx, prims: prims.map((p) => ({ name: p.name, vc: p.pos.length / 3, ic: p.idx.length, i32: p.pos.length / 3 > 65535 })) };
const chunks = [];
const pad4 = (n) => (4 - (n % 4)) % 4;
const hj = Buffer.from(JSON.stringify(header), 'utf8');
const head = Buffer.alloc(8); head.write('BCM1', 0, 'ascii'); head.writeUInt32LE(hj.length, 4);
chunks.push(head, hj, Buffer.alloc(pad4(hj.length)));
for (const p of prims) {
  const q = new Int16Array(p.pos.length);
  for (let i = 0; i < p.pos.length; i++) { const k = i % 3; q[i] = Math.round((p.pos[i] - mn[k]) / (mx[k] - mn[k]) * 65535) - 32768; }
  const qb = Buffer.from(q.buffer); chunks.push(qb, Buffer.alloc(pad4(qb.length)));
  const ib = p.pos.length / 3 > 65535 ? Buffer.from(new Uint32Array(p.idx).buffer) : Buffer.from(new Uint16Array(p.idx).buffer);
  chunks.push(ib, Buffer.alloc(pad4(ib.length)));
}
const raw = Buffer.concat(chunks);
const gz = zlib.gzipSync(raw, { level: 9 });
const b64 = gz.toString('base64');
fs.writeFileSync(outJs, '/* Modello 3D dell\'auto (formato BCM1, gzip + base64). Generato da _tools/c4d-to-bcm. */\nwindow.BC_CAR_MODEL="' + b64 + '";\n');
const totT = prims.reduce((a, p) => a + p.idx.length / 3, 0);
console.log('triangoli totali', totT, 'raw', (raw.length / 1024).toFixed(0) + 'KB', 'gzip', (gz.length / 1024).toFixed(0) + 'KB', 'base64', (b64.length / 1024).toFixed(0) + 'KB');
