// Parser minimale per il file Cinema 4D R14 di questo modello (oggetto poligonale unico).
// Estrae punti, poligoni, selezioni di poligoni e tag texture (materiale -> selezione).
import fs from 'node:fs';
export function parseC4D(file) {
  const buf = fs.readFileSync(file);
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const N = buf.length;
  const u8 = (o) => buf[o];
  const i32 = (o) => dv.getInt32(o, false);
  const findAll = (bytes) => { const out = []; let i = 0; for (;;) { i = buf.indexOf(bytes, i); if (i < 0) break; out.push(i); i++; } return out; };
  const startPat = (id) => Buffer.from([0x01, (id >>> 24) & 255, (id >>> 16) & 255, (id >>> 8) & 255, id & 255]);
  const utf16 = (o, len) => { let s = ''; for (let k = 0; k < len; k += 2) s += String.fromCharCode(dv.getUint16(o + k, false)); return s; };

  // blocco dati di un tag variabile: START(id) [livello int32] INT32 count, poi chunk 0x8c
  function readArray(dataStart, kind) {
    let o = dataStart;
    if (u8(o) !== 0x0f) throw new Error('count atteso a ' + o);
    const count = i32(o + 1); o += 5;
    const comps = [];
    while (u8(o) === 0x8c) {
      const L = i32(o + 1); const fmt = u8(o + 5); o += 6;
      const bytes = L - 1;
      comps.push({ off: o, bytes, fmt });
      o += bytes;
    }
    return { count, comps, end: o };
  }
  // trova il secondo START (blocco dati) di un tag con id
  function dataStarts(id) {
    return findAll(startPat(id)).filter((p) => u8(p + 5) === 0 && u8(p + 9) === 0x0f && u8(p + 14) === 0x8c);
  }

  // --- punti (5600): 3 chunk di double (X[], Y[], Z[])
  const ptS = dataStarts(5600)[0];
  const pa = readArray(ptS + 9);
  const NP = pa.count;
  const pos = new Float64Array(NP * 3);
  if (pa.comps.length !== 3) throw new Error('punti: chunk ' + pa.comps.length);
  pa.comps.forEach((c, k) => { for (let i = 0; i < NP; i++) pos[i * 3 + k] = dv.getFloat64(c.off + i * 8, false); });

  // --- poligoni (5604): 4 chunk di int32 (a[], b[], c[], d[])
  const pyS = dataStarts(5604)[0];
  const py = readArray(pyS + 9);
  const NF = py.count;
  const polys = new Int32Array(NF * 4);
  if (py.comps.length !== 4) throw new Error('poligoni: chunk ' + py.comps.length);
  py.comps.forEach((c, k) => { for (let i = 0; i < NF; i++) polys[i * 4 + k] = dv.getInt32(c.off + i * 4, false); });

  // --- selezioni di poligoni (5673): nome + segmenti
  const sels = {};
  const tagStarts = (id) => findAll(startPat(id)).filter((p) => u8(p + 5) === 0 && u8(p + 9) === 0x01);
  for (const p of tagStarts(5673)) {
    // nome: primo STRING (0x82) dopo l'header
    const ag0 = buf.indexOf(Buffer.from('agoal1'), p);
    const s = ag0 + 14;
    if (u8(s) !== 0x82) throw new Error('nome selezione non trovato a ' + s);
    const len = i32(s + 1); const name = utf16(s + 5, len);
    // segmenti: START 110011 (0x0001adbb) livello 1
    const segP = buf.indexOf(Buffer.from([0x01, 0x00, 0x01, 0xad, 0xbb]), p);
    let o = segP + 9;
    const n = i32(o + 1); o += 5;
    const segs = [];
    for (let k = 0; k < n; k++) { segs.push([i32(o + 1), i32(o + 6)]); o += 10; }
    sels[name] = segs;
  }

  // --- tag texture (5616): nome del tag (= materiale) e restrizione (id 1006)
  const tex = [];
  for (const p of tagStarts(5616)) {
    // restrizione: INT32 1006 (0x3ee) seguito da INT32 tipo e 0x82 0x82 len
    const rP = buf.indexOf(Buffer.from([0x0f, 0, 0, 0x03, 0xee, 0x0f]), p);
    let restriction = '';
    if (rP > 0 && rP - p < 2000 && u8(rP + 9) === 0x82 && u8(rP + 10) === 0x82) {
      const len = i32(rP + 11); restriction = utf16(rP + 15, len);
    }
    // nome del tag: STRING dopo 'agoal1'
    const ag = buf.indexOf(Buffer.from('agoal1'), p);
    const s = ag + 14;
    if (u8(s) !== 0x82) throw new Error('nome tag non trovato a ' + s);
    const len = i32(s + 1); const name = utf16(s + 5, len);
    tex.push({ at: p, name, restriction });
  }
  return { NP, NF, pos, polys, sels, tex };
}
