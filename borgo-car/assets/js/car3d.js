/* Simulatore di riparazione: utilitaria generica con urto frontale, in un box d'officina.
   Interventi: 1 paraurti · 2 lattoneria (cofano e parafango) · 3 fanale · 4 verniciatura.
   Si ripara toccando i punti sull'auto o la lista; trascina (o frecce) per girarla.
   Riferimenti: studio luci "Volumetric Studio" e stepper verticale di 21st.dev, regole three.js di UI UX Pro Max.
   Tutto è generato dal codice: nessun modello o immagine esterna. */
(function () {
  var stage = document.getElementById('carStage');
  if (!stage) return;
  var canvas = document.getElementById('car3d');
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var T = window.THREE;
  var renderer;
  try { renderer = T && new T.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { renderer = null; }
  if (!renderer) { root.classList.add('no-webgl'); return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;

  var scene = new T.Scene();
  scene.background = new T.Color('#151617');
  scene.fog = new T.Fog('#151617', 10, 22);
  var camera = new T.PerspectiveCamera(36, 1, 0.1, 80);

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sm(a, b, v) { var k = clamp((v - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  /* ---------- ambiente riflesso: tubi luminosi del box ---------- */
  (function () {
    var c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#26282a'); g.addColorStop(0.48, '#141516'); g.addColorStop(0.52, '#3a3936'); g.addColorStop(1, '#1d1c1a');
    x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
    for (var i = 0; i < 10; i++) {
      var px = 50 + i * 102;
      x.fillStyle = 'rgba(255,255,255,.95)'; x.fillRect(px - 9, 40, 18, 150);
    }
    var wg = x.createRadialGradient(760, 270, 10, 760, 270, 160);
    wg.addColorStop(0, 'rgba(255,220,170,.5)'); wg.addColorStop(1, 'rgba(255,220,170,0)');
    x.fillStyle = wg; x.fillRect(560, 100, 400, 340);
    var t = new T.CanvasTexture(c); t.mapping = T.EquirectangularReflectionMapping; t.colorSpace = T.SRGBColorSpace;
    var pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromEquirectangular(t).texture;
    t.dispose();
  })();
  scene.environmentIntensity = 0.85;

  /* ---------- box d'officina: pavimento con strisce gialle, lampade a faro ---------- */
  (function () {
    var c = document.createElement('canvas'); c.width = c.height = 1024;
    var x = c.getContext('2d');
    x.fillStyle = '#2e2f30'; x.fillRect(0, 0, 1024, 1024);
    for (var i = 0; i < 9000; i++) {   // grana del cemento
      x.fillStyle = 'rgba(' + (Math.random() < .5 ? '255,255,255' : '0,0,0') + ',' + (Math.random() * 0.05) + ')';
      x.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
    }
    x.strokeStyle = '#d9a514'; x.lineWidth = 9;
    x.strokeRect(512 - 210, 512 - 120, 420, 240);                  // perimetro del ponte
    x.setLineDash([26, 18]); x.lineWidth = 5; x.beginPath(); x.moveTo(512 - 270, 512 + 160); x.lineTo(512 + 270, 512 + 160); x.stroke();
    var tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    var floor = new T.Mesh(new T.PlaneGeometry(22, 22), new T.MeshStandardMaterial({ map: tex, roughness: 0.62, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    var wall = new T.Mesh(new T.PlaneGeometry(30, 10), new T.MeshStandardMaterial({ color: '#1c1d1e', roughness: 0.9 }));
    wall.position.set(0, 5, -7); scene.add(wall);
  })();

  scene.add(new T.HemisphereLight('#dfe6ee', '#1a1714', 0.35));
  var lamps = [], LAMP_X = [-1.9, 0, 1.9];
  var coneTex = (function () {
    var c = document.createElement('canvas'); c.width = 4; c.height = 256;
    var x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#fff'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, 4, 256);
    return new T.CanvasTexture(c);
  })();
  LAMP_X.forEach(function (lx, i) {
    var s = new T.SpotLight('#eef3ff', 0, 0, 0.5, 0.6, 1.6);
    s.position.set(lx, 4.6, 0.4); s.target.position.set(lx * 0.6, 0, 0);
    scene.add(s); scene.add(s.target);
    if (i === 1) { s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0004; s.shadow.radius = 4; }
    var cone = new T.Mesh(new T.CylinderGeometry(0.1, 1.5, 4.4, 40, 1, true),
      new T.MeshBasicMaterial({ color: '#dfe8ff', alphaMap: coneTex, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
    cone.position.set(lx, 2.4, 0.4); scene.add(cone);
    var housing = new T.Mesh(new T.CylinderGeometry(0.16, 0.26, 0.3, 24), new T.MeshStandardMaterial({ color: '#2a2b2c', roughness: 0.4, metalness: 0.8 }));
    housing.position.set(lx, 4.75, 0.4); scene.add(housing);
    var bulb = new T.Mesh(new T.CircleGeometry(0.2, 24), new T.MeshBasicMaterial({ color: '#333' }));
    bulb.rotation.x = Math.PI / 2; bulb.position.set(lx, 4.59, 0.4); scene.add(bulb);
    lamps.push({ light: s, cone: cone, bulb: bulb });
  });

  /* ---------- geometria: box arrotondato deformabile ---------- */
  function rbox(hx, hy, hz, r, sx, sy, sz) {
    var g = new T.BoxGeometry(hx * 2, hy * 2, hz * 2, sx, sy, sz);
    var p = g.attributes.position, v = new T.Vector3(), q = new T.Vector3();
    for (var i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      q.set(clamp(v.x, -hx + r, hx - r), clamp(v.y, -hy + r, hy - r), clamp(v.z, -hz + r, hz - r));
      v.sub(q); var l = v.length(); if (l > 1e-6) v.multiplyScalar(r / l); v.add(q);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    return g;
  }
  /* normali lisce anche sugli spigoli (i vertici duplicati tra le facce vengono mediati) */
  function dupGroups(g) {
    var p = g.attributes.position, map = {}, ids = new Int32Array(p.count), n = 0;
    for (var i = 0; i < p.count; i++) {
      var k = Math.round(p.getX(i) * 1e4) + ',' + Math.round(p.getY(i) * 1e4) + ',' + Math.round(p.getZ(i) * 1e4);
      if (map[k] === undefined) map[k] = n++;
      ids[i] = map[k];
    }
    return { ids: ids, n: n };
  }
  function smoothNormals(g, d) {
    g.computeVertexNormals();
    var nm = g.attributes.normal, acc = new Float32Array(d.n * 3), i, j;
    for (i = 0; i < nm.count; i++) { j = d.ids[i] * 3; acc[j] += nm.getX(i); acc[j + 1] += nm.getY(i); acc[j + 2] += nm.getZ(i); }
    for (i = 0; i < nm.count; i++) {
      j = d.ids[i] * 3; var x = acc[j], y = acc[j + 1], z = acc[j + 2], l = Math.hypot(x, y, z) || 1;
      nm.setXYZ(i, x / l, y / l, z / l);
    }
    nm.needsUpdate = true;
  }

  /* ---------- tinte (canvas) per le facce: dettagli disegnati, tinta inclusa ---------- */
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return { c: c, x: c.getContext('2d'), t: t }; }
  var TX = {
    side: cv(1024, 256), sideB: cv(1024, 256), front: cv(512, 256), rear: cv(512, 256), top: cv(1024, 512),
    gSide: cv(512, 256), gSideB: cv(512, 256), gFront: cv(256, 256), gRear: cv(256, 256), gTop: cv(256, 256)
  };
  function paintMat(tx) { return new T.MeshPhysicalMaterial({ map: tx.t, roughness: 0.32, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.06 }); }
  var under = new T.MeshStandardMaterial({ color: '#141414', roughness: 0.9 });

  var state = {
    paint: '#2c5d97',
    p: [0, 0, 0, 0],        // avanzamento dei 4 interventi (0 = danno, 1 = riparato)
    target: [0, 0, 0, 0]
  };

  function glass(x, x0, y0, w, h) {
    var g = x.createLinearGradient(x0, y0, x0 + w, y0 + h);
    g.addColorStop(0, '#0b0f12'); g.addColorStop(0.55, '#1c252c'); g.addColorStop(1, '#0a0d10');
    x.fillStyle = g; x.fillRect(x0, y0, w, h);
  }
  function rr(x, x0, y0, w, h, r) { x.beginPath(); x.moveTo(x0 + r, y0); x.arcTo(x0 + w, y0, x0 + w, y0 + h, r); x.arcTo(x0 + w, y0 + h, x0, y0 + h, r); x.arcTo(x0, y0 + h, x0, y0, r); x.arcTo(x0, y0, x0 + w, y0, r); x.closePath(); }
  // rumore stabile per graffi e stucco
  var seed = []; for (var s = 0; s < 400; s++) seed.push(Math.random());

  function drawSide(tx, front) {   // front=true: lato danneggiato (+z), u cresce verso il muso
    var x = tx.x, W = 1024, H = 256, p = state.p;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.fillStyle = state.paint; x.fillRect(0, 0, W, H);
    if (!front) { x.translate(W, 0); x.scale(-1, 1); }
    var sh = x.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, 'rgba(255,255,255,.06)'); sh.addColorStop(0.75, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.35)');
    x.fillStyle = sh; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 3;
    [734, 489, 242, 22].forEach(function (u) { x.beginPath(); x.moveTo(u, 6); x.lineTo(u, 214); x.stroke(); });
    x.fillStyle = '#262728'; x.fillRect(40, 150, 944, 34);            // fascia paracolpi laterale
    x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(40, 150, 944, 3);
    x.fillStyle = '#1b1b1b'; rr(x, 664, 46, 46, 12, 5); x.fill(); rr(x, 420, 46, 46, 12, 5); x.fill();
    if (front) {
      var prim = sm(0.25, 0.75, p[1]) * (1 - sm(0.2, 0.95, p[3]));
      if (prim > 0.01) {                                              // fondo grigio sul parafango riparato
        x.globalAlpha = prim; x.fillStyle = '#8f908b';
        x.beginPath(); x.moveTo(1024, 0); x.lineTo(760, 0);
        for (var k = 0; k <= 12; k++) x.lineTo(740 + seed[k] * 40, k * 21.5);
        x.lineTo(1024, 256); x.closePath(); x.fill(); x.globalAlpha = 1;
      }
      var scr = 1 - sm(0.1, 0.9, p[3]);
      if (scr > 0.01) {                                               // strisciata sulla porta
        x.globalAlpha = scr;
        for (var j = 0; j < 26; j++) {
          var y0 = 82 + seed[j + 20] * 50, x0 = 540 + seed[j + 60] * 60, len = 120 + seed[j + 90] * 120;
          x.strokeStyle = 'rgba(214,214,208,' + (0.35 + seed[j + 120] * 0.5) + ')'; x.lineWidth = 1 + seed[j + 150] * 2.2;
          x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + len, y0 + (seed[j + 180] - 0.4) * 18); x.stroke();
        }
        x.globalAlpha = 1;
      }
    }
    tx.t.needsUpdate = true;
  }
  function drawFront() {
    var x = TX.front.x, W = 512, H = 256, p = state.p;
    x.fillStyle = state.paint; x.fillRect(0, 0, W, H);
    x.fillStyle = '#151617'; rr(x, 156, 40, 200, 74, 6); x.fill();
    x.strokeStyle = '#3b3c3d'; x.lineWidth = 3;
    for (var i = 0; i < 6; i++) { x.beginPath(); x.moveTo(166, 52 + i * 11); x.lineTo(346, 52 + i * 11); x.stroke(); }
    function lamp(x0, broken) {
      var g = x.createRadialGradient(x0 + 52, 78, 4, x0 + 52, 78, 50);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#cfd6dc'); g.addColorStop(1, '#8c959c');
      x.fillStyle = g; rr(x, x0, 36, 104, 84, 8); x.fill();
      x.strokeStyle = '#2a2b2c'; x.lineWidth = 4; rr(x, x0, 36, 104, 84, 8); x.stroke();
      if (broken > 0.01) {
        x.globalAlpha = broken;
        x.fillStyle = '#121314'; x.beginPath(); x.moveTo(x0, 36); x.lineTo(x0 + 70, 36); x.lineTo(x0 + 40, 70); x.lineTo(x0 + 66, 120); x.lineTo(x0, 120); x.closePath(); x.fill();
        x.strokeStyle = 'rgba(235,240,245,.9)'; x.lineWidth = 1.6;
        for (var k = 0; k < 9; k++) { var a = seed[k + 200] * 6.28; x.beginPath(); x.moveTo(x0 + 48, 70); x.lineTo(x0 + 48 + Math.cos(a) * 60, 70 + Math.sin(a) * 45); x.stroke(); }
        x.globalAlpha = 1;
      }
    }
    lamp(28, 1 - sm(0.15, 0.85, p[2]));      // lato urtato (+z)
    lamp(380, 0);
    var prim = sm(0.25, 0.75, p[1]) * (1 - sm(0.2, 0.95, p[3]));
    if (prim > 0.01) { x.globalAlpha = prim * 0.95; x.fillStyle = '#8f908b'; x.fillRect(0, 0, 26, H); x.fillRect(0, 0, 150, 34); x.globalAlpha = 1; }
    TX.front.t.needsUpdate = true;
  }
  function drawRear() {
    var x = TX.rear.x, W = 512, H = 256;
    x.fillStyle = state.paint; x.fillRect(0, 0, W, H);
    [[14, 30], [438, 30]].forEach(function (a) {
      x.fillStyle = '#7d0d10'; rr(x, a[0], a[1], 60, 120, 6); x.fill();
      x.fillStyle = '#d23a2e'; x.fillRect(a[0] + 8, a[1] + 8, 44, 60);
      x.fillStyle = '#f2efe6'; x.fillRect(a[0] + 8, a[1] + 74, 44, 16);
    });
    x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 3; x.strokeRect(84, 8, 344, 200);
    TX.rear.t.needsUpdate = true;
  }
  function drawTop() {
    var x = TX.top.x, W = 1024, H = 512, p = state.p;
    x.fillStyle = state.paint; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(734, 26); x.lineTo(734, 486); x.moveTo(734, 26); x.lineTo(1024, 26); x.moveTo(734, 486); x.lineTo(1024, 486); x.stroke();
    var prim = sm(0.25, 0.75, p[1]) * (1 - sm(0.2, 0.95, p[3]));
    if (prim > 0.01) {
      x.globalAlpha = prim; x.fillStyle = '#8f908b';
      x.beginPath(); x.moveTo(1024, 0); x.lineTo(800, 0);
      for (var k = 0; k <= 10; k++) x.lineTo(790 + seed[k + 30] * 50 + k * 10, k * 26);
      x.lineTo(1024, 280); x.closePath(); x.fill(); x.globalAlpha = 1;
    }
    TX.top.t.needsUpdate = true;
  }
  function drawGlassSide(tx, mirror) {
    var x = tx.x, W = 512, H = 256;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.fillStyle = state.paint; x.fillRect(0, 0, W, H);
    if (mirror) { x.translate(W, 0); x.scale(-1, 1); }
    glass(x, 40, 30, 196, 190); glass(x, 262, 30, 214, 190);
    x.fillStyle = '#1a1a1a'; x.fillRect(236, 30, 26, 190);            // montante centrale nero
    tx.t.needsUpdate = true;
  }
  function drawGlassFace(tx) {
    var x = tx.x; x.fillStyle = state.paint; x.fillRect(0, 0, 256, 256); glass(x, 14, 14, 228, 222);
    x.fillStyle = 'rgba(255,255,255,.07)'; x.beginPath(); x.moveTo(30, 230); x.lineTo(120, 20); x.lineTo(150, 20); x.lineTo(60, 230); x.fill();
    tx.t.needsUpdate = true;
  }
  function drawRoof() { var x = TX.gTop.x; x.fillStyle = state.paint; x.fillRect(0, 0, 256, 256); TX.gTop.t.needsUpdate = true; }
  function drawAll() { drawSide(TX.side, true); drawSide(TX.sideB, false); drawFront(); drawRear(); drawTop(); drawGlassSide(TX.gSide, false); drawGlassSide(TX.gSideB, true); drawGlassFace(TX.gFront); drawGlassFace(TX.gRear); drawRoof(); }

  /* ---------- carrozzeria ---------- */
  var car = new T.Group(); scene.add(car);
  var LX = 1.8, LZ = 0.78;
  var lower = rbox(LX, 0.5, LZ, 0.17, 72, 20, 32);
  var lowerBase = lower.attributes.position.array.slice();
  var lowerDup = dupGroups(lower);
  function lowerShape(px, py, pz, dent) {
    var y01 = py + 0.5, xf = px / LX;
    var top = 0.93;
    if (xf > 0.42) top = 0.93 - 0.21 * Math.pow((xf - 0.42) / 0.58, 1.5);
    if (xf < -0.86) top = 0.93 - 0.04 * ((-xf - 0.86) / 0.14);
    var Y = 0.22 + y01 * (top - 0.22);
    var X = px, Z = pz * (1 - 0.06 * Math.pow(Math.max(0, Math.abs(xf) - 0.72) / 0.28, 2)) * (1 - 0.035 * Math.pow(y01, 3));
    [1.2, -1.2].forEach(function (wx) {                                // passaruota
      var dx = X - wx, R = 0.4;
      if (Math.abs(dx) < R) { var arch = 0.31 + Math.sqrt(R * R - dx * dx); if (Y < arch && Math.abs(Z) > 0.25) Y = arch; }
    });
    if (dent > 0) {                                                    // urto sull'angolo anteriore sinistro
      var dx2 = X - LX, dz = Z - LZ, dy = Y - 0.62;
      var m = Math.exp(-((dx2 * dx2) / 0.32 + (dz * dz) / 0.42 + (dy * dy) / 0.5) * 2.0);
      var cr = 1 + 0.4 * Math.sin(X * 23 + Y * 17) * Math.sin(Z * 19);
      X -= dent * m * 0.4 * cr; Z -= dent * m * 0.3 * cr;
      if (Y > 0.6) Y += dent * 0.14 * Math.exp(-Math.pow((Z - 0.4) / 0.16, 2)) * sm(0.9, 1.5, X) * (1 + 0.5 * Math.sin(X * 14));
    }
    return [X, Y, Z];
  }
  function buildLower(dent) {
    var p = lower.attributes.position;
    for (var i = 0; i < p.count; i++) {
      var r = lowerShape(lowerBase[i * 3], lowerBase[i * 3 + 1], lowerBase[i * 3 + 2], dent);
      p.setXYZ(i, r[0], r[1], r[2]);
    }
    p.needsUpdate = true; smoothNormals(lower, lowerDup);
  }
  // gruppi BoxGeometry: +x, -x, +y, -y, +z, -z
  var lowerMesh = new T.Mesh(lower, [paintMat(TX.front), paintMat(TX.rear), paintMat(TX.top), under, paintMat(TX.side), paintMat(TX.sideB)]);
  lowerMesh.castShadow = true; lowerMesh.receiveShadow = true; car.add(lowerMesh);

  var cabin = rbox(1.1, 0.5, 0.7, 0.1, 44, 14, 24);
  (function () {
    var p = cabin.attributes.position;
    for (var i = 0; i < p.count; i++) {
      var x = p.getX(i), y = p.getY(i), z = p.getZ(i), y01 = y + 0.5;
      var xs = x > 0 ? x - 0.62 * y01 * (x / 1.1) : x + 0.1 * y01 * (-x / 1.1);
      p.setXYZ(i, xs - 0.3, 0.9 + y01 * 0.56, z * (1 - 0.13 * y01));
    }
    smoothNormals(cabin, dupGroups(cabin));
  })();
  var cabMesh = new T.Mesh(cabin, [paintMat(TX.gFront), paintMat(TX.gRear), paintMat(TX.gTop), under, paintMat(TX.gSide), paintMat(TX.gSideB)]);
  cabMesh.castShadow = true; car.add(cabMesh);

  var plastic = new T.MeshStandardMaterial({ color: '#1d1e1f', roughness: 0.55, metalness: 0.05 });
  function part(geo, mat, x, y, z) { var m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; car.add(m); return m; }
  var bumperF = part(rbox(0.13, 0.13, 0.82, 0.06, 4, 4, 12), plastic, 1.84, 0.36, 0);
  part(rbox(0.13, 0.13, 0.82, 0.06, 4, 4, 12), plastic, -1.84, 0.36, 0);
  var plateMat = new T.MeshStandardMaterial({ color: '#efeee8', roughness: 0.5 });
  var plateF = new T.Mesh(new T.BoxGeometry(0.02, 0.11, 0.5), plateMat); plateF.position.set(0.14, 0, 0); bumperF.add(plateF);
  part(new T.BoxGeometry(0.02, 0.11, 0.5), plateMat, -1.98, 0.5, 0);
  [-1, 1].forEach(function (sz) { part(rbox(0.09, 0.06, 0.06, 0.025, 2, 2, 2), plastic, 0.66, 1.02, sz * 0.86); });

  /* ruote: pneumatico a profilo + cerchio in acciaio */
  var tireProfile = [], k;
  for (k = 0; k <= 16; k++) { var a = -Math.PI / 2 + Math.PI * k / 16; tireProfile.push(new T.Vector2(0.2 + Math.cos(a) * 0.1, Math.sin(a) * 0.105)); }
  var tireGeo = new T.LatheGeometry(tireProfile, 40);
  var rubber = new T.MeshStandardMaterial({ color: '#141414', roughness: 0.85 });
  var steel = new T.MeshStandardMaterial({ color: '#b8bbbd', roughness: 0.35, metalness: 0.85 });
  [[1.2, 1], [1.2, -1], [-1.2, 1], [-1.2, -1]].forEach(function (w) {
    var g = new T.Group(); g.position.set(w[0], 0.3, w[1] * 0.66);
    var tire = new T.Mesh(tireGeo, rubber); tire.rotation.x = Math.PI / 2; tire.castShadow = true; g.add(tire);
    var rim = new T.Mesh(new T.CylinderGeometry(0.19, 0.19, 0.16, 32), steel); rim.rotation.x = Math.PI / 2; g.add(rim);
    var hub = new T.Mesh(new T.CylinderGeometry(0.06, 0.07, 0.18, 16), steel); hub.rotation.x = Math.PI / 2; g.add(hub);
    car.add(g);
  });
  // ombra di contatto
  (function () {
    var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d');
    var g = x.createRadialGradient(64, 64, 10, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    var m = new T.Mesh(new T.PlaneGeometry(4.6, 2.4), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.005; car.add(m);
  })();
  car.position.x = -0.15;

  /* ---------- stato del danno ---------- */
  var lastDent = -1, lastTex = '';
  function apply() {
    var p = state.p;
    var bump = 1 - ease(p[0]);
    bumperF.position.set(1.84 - 0.14 * bump, 0.36 - 0.11 * bump, 0.08 * bump);
    bumperF.rotation.set(0.16 * bump, 0.3 * bump, -0.22 * bump);
    var dent = 1 - ease(p[1]);
    if (Math.abs(dent - lastDent) > 0.002) { buildLower(dent); lastDent = dent; }
    var key = p.map(function (v) { return v.toFixed(2); }).join() + state.paint;
    if (key !== lastTex) { drawAll(); lastTex = key; }
  }

  /* ---------- camera orbitale ---------- */
  var az = 0.78, azT = 0.78, el = 0.3, R = 7.2, idle = !reduce, idleT0 = 0;
  var TARGET = new T.Vector3(0.05, 0.6, 0);
  function placeCam() {
    camera.position.set(TARGET.x + Math.cos(az) * R * Math.cos(el), TARGET.y + R * Math.sin(el) + 0.4, TARGET.z + Math.sin(az) * R * Math.cos(el));
    camera.lookAt(TARGET);
  }
  function fit() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    R = w / h < 1 ? 8.6 : (w / h > 1.6 ? 5.4 : 5.9);
    camera.updateProjectionMatrix();
    dirty = true;
  }

  var drag = null;
  canvas.addEventListener('pointerdown', function (e) {
    drag = { x: e.clientX, az: azT, moved: false }; idle = false;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) drag.moved = true;
    if (drag.moved) { azT = drag.az + dx * 0.009; if (reduce) az = azT; kick(); }
  });
  function endDrag(e) { if (drag) { try { canvas.releasePointerCapture(e.pointerId); } catch (_) {} } drag = null; }
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
  function rotBy(d) { idle = false; azT += d; if (reduce) az = azT; kick(); }
  var rl = document.getElementById('rotL'), rrb = document.getElementById('rotR');
  if (rl) rl.addEventListener('click', function () { rotBy(-0.5); });
  if (rrb) rrb.addEventListener('click', function () { rotBy(0.5); });

  /* ---------- interventi ---------- */
  var PARTS = [
    { name: 'Paraurti', az: 0.42, anchor: [2.02, 0.26, -0.05], normal: [1, 0, 0.3],
      txt: 'Paraurti: si smonta, si controllano gli attacchi e la traversa sotto, poi si rimonta o si sostituisce.' },
    { name: 'Lattoneria', az: 0.95, anchor: [1.15, 0.95, 0.42], normal: [0.2, 1, 0.5],
      txt: 'Lattoneria: cofano e parafango tornano in forma con tiraggio e martello, poi stucco, carteggiatura e fondo grigio.' },
    { name: 'Fanale', az: 0.3, anchor: [1.86, 0.62, 0.6], normal: [1, 0, 0.3],
      txt: 'Fanale: il gruppo ottico rotto si sostituisce e si regola l’assetto dei fari.' },
    { name: 'Verniciatura', az: 1.35, anchor: [0.2, 0.6, 0.84], normal: [0, 0, 1],
      txt: 'Verniciatura: tinta abbinata al colore dell’auto e trasparente. Spariscono il fondo grigio e la strisciata sulla porta.' }
  ];
  var out = document.getElementById('jobOut');
  var hsBtns = [].slice.call(document.querySelectorAll('#hotspots .hs'));
  var stepBtns = [].slice.call(document.querySelectorAll('#vstep button'));
  var anim = [null, null, null, null];
  function say(t) { if (out) out.textContent = t; }
  function sync() {
    var done = state.target.filter(function (v) { return v === 1; }).length;
    PARTS.forEach(function (pt, i) {
      var ok = state.target[i] === 1;
      var locked = i === 3 && state.target[1] !== 1;
      [hsBtns[i], stepBtns[i]].forEach(function (b) {
        if (!b) return;
        b.classList.toggle('done', ok);
        if (b.classList.contains('hs')) b.tabIndex = ok ? -1 : 0;
        b.setAttribute('aria-disabled', String(locked));
        b.setAttribute('aria-label', (ok ? 'Riparato: ' : locked ? 'Bloccato, prima la lattoneria: ' : 'Ripara: ') + pt.name);
      });
    });
    canvas.setAttribute('aria-label', 'Utilitaria in 3D con urto frontale. Interventi completati: ' + done + ' su 4.');
    var fa = document.getElementById('fixAll'); if (fa) fa.disabled = done === 4;
  }
  function repair(i, silent) {
    if (state.target[i] === 1) { if (!silent) say(PARTS[i].name + ': già fatto. ' + PARTS[i].txt); return; }
    if (i === 3 && state.target[1] !== 1) { say('Prima la lattoneria: la vernice va su lamiera già raddrizzata e con il fondo.'); return; }
    state.target[i] = 1; idle = false;
    if (!silent) { azT = PARTS[i].az + Math.round((azT - PARTS[i].az) / (Math.PI * 2)) * Math.PI * 2; say(PARTS[i].txt); }
    if (reduce) { state.p[i] = 1; apply(); dirty = true; }
    else anim[i] = { t0: performance.now(), from: state.p[i], dur: i === 1 ? 1700 : 1100 };
    sync(); kick();
    if (state.target.every(function (v) { return v === 1; })) setTimeout(function () { say('Auto pronta per la riconsegna. Ogni lavoro reale parte da un preventivo con le foto del danno.'); }, reduce ? 0 : 1800);
  }
  hsBtns.concat(stepBtns).forEach(function (b) {
    b.addEventListener('click', function () { repair(+b.dataset.part); });
  });
  var fixAll = document.getElementById('fixAll');
  if (fixAll) fixAll.addEventListener('click', function () {
    [0, 1, 2].forEach(function (i, n) { setTimeout(function () { repair(i, true); }, reduce ? 0 : n * 450); });
    setTimeout(function () { repair(3, true); azT = 0.78; }, reduce ? 0 : 1900);
    say('Tutti gli interventi in sequenza: paraurti, lattoneria, fanale, poi vernice.');
  });
  var reset = document.getElementById('resetCar');
  if (reset) reset.addEventListener('click', function () {
    state.p = [0, 0, 0, 0]; state.target = [0, 0, 0, 0]; anim = [null, null, null, null];
    apply(); sync(); say('Auto di nuovo danneggiata. Tocca i punti arancioni per ripararla.'); dirty = true; kick();
  });
  [].slice.call(document.querySelectorAll('.chip')).forEach(function (c) {
    c.addEventListener('click', function () {
      document.querySelectorAll('.chip').forEach(function (o) { o.setAttribute('aria-pressed', String(o === c)); });
      state.paint = c.dataset.paint; apply(); dirty = true; kick();
    });
  });

  /* ---------- punti sull'auto (pulsanti HTML proiettati) ---------- */
  var v3 = new T.Vector3(), n3 = new T.Vector3(), c3 = new T.Vector3();
  function placeHotspots() {
    var w = stage.clientWidth, h = stage.clientHeight;
    car.updateMatrixWorld();
    PARTS.forEach(function (pt, i) {
      var b = hsBtns[i]; if (!b) return;
      v3.fromArray(pt.anchor).applyMatrix4(car.matrixWorld);
      n3.fromArray(pt.normal).normalize();
      c3.copy(camera.position).sub(v3).normalize();
      var back = n3.dot(c3) < -0.05;
      v3.project(camera);
      b.style.transform = 'translate(' + ((v3.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - v3.y) / 2 * h).toFixed(1) + 'px)';
      b.classList.toggle('back', back);
    });
  }

  /* ---------- accensione luci (2 lampi, poi fisse) ---------- */
  var t0 = performance.now();
  function lightLevel(t) {
    if (reduce) return 1;
    var s = (t - t0) / 1000;
    if (s < 0.35) return 0; if (s < 0.45) return 0.9; if (s < 0.7) return 0.05; if (s < 0.78) return 0.8; if (s < 0.95) return 0.1;
    return Math.min(1, 0.1 + (s - 0.95) * 4);
  }
  function setLights(f) {
    lamps.forEach(function (l) {
      l.light.intensity = 26 * f; l.cone.material.opacity = 0.075 * f;
      l.bulb.material.color.setScalar(0.2 + 0.8 * f);
    });
  }

  /* ---------- ciclo ---------- */
  var visible = true, dirty = true, raf = 0;
  var io = new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) kick(); }, { threshold: 0.01 });
  io.observe(stage);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stage); else addEventListener('resize', fit);
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    var busy = false;
    var lf = lightLevel(now); setLights(lf); if (lf < 1) busy = true;
    for (var i = 0; i < 4; i++) {
      var a = anim[i];
      if (a) {
        var k = clamp((now - a.t0) / a.dur, 0, 1);
        state.p[i] = a.from + (1 - a.from) * k;
        if (k >= 1) anim[i] = null;
        busy = true;
      }
    }
    if (busy || dirty) apply();
    if (idle) { azT = 0.78 + Math.sin((now - t0) * 0.00025) * 0.32; busy = true; }
    if (!reduce && Math.abs(azT - az) > 0.0005) { az += (azT - az) * 0.08; busy = true; } else az = azT;
    placeCam(); placeHotspots();
    renderer.render(scene, camera); dirty = false;
    if (busy || drag) kick();
  }

  drawAll(); buildLower(1); lastDent = 1; apply(); sync(); fit(); placeCam();
  stage.classList.add('ready');
  kick();
})();
