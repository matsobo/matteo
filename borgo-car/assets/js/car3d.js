/* Simulatore di riparazione: auto reale (modello 3D convertito, vedi CREDITS) con urto
   sull'angolo anteriore destro, in un box d'officina.
   Interventi: 1 paraurti · 2 lattoneria (cofano e parafango) · 3 faro · 4 verniciatura.
   Il danno è simulato sulla geometria vera: lamiera accartocciata, paraurti che cede,
   vetro del faro crepato, strisciata sulla porta; dopo la lattoneria compare il fondo grigio.
   Si ripara toccando i punti sull'auto o la lista; trascina (o frecce) per girarla.
   Riferimenti: studio luci "Volumetric Studio" e stepper verticale di 21st.dev, regole three.js di UI UX Pro Max. */
(function () {
  var stage = document.getElementById('carStage');
  if (!stage) return;
  var canvas = document.getElementById('car3d');
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var T = window.THREE;
  var hint = stage.querySelector('.bench-hint');
  var hintText = hint ? hint.textContent : '';
  function fail() { root.classList.add('no-webgl'); }
  if (!T || !window.BC_CAR_MODEL || !window.DecompressionStream) { fail(); return; }
  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { renderer = null; }
  if (!renderer) { fail(); return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;

  var scene = new T.Scene();
  scene.background = new T.Color('#151617');
  scene.fog = new T.Fog('#151617', 11, 24);
  var camera = new T.PerspectiveCamera(34, 1, 0.1, 80);

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sm(a, b, v) { var k = clamp((v - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  var seed = []; for (var s0 = 0; s0 < 600; s0++) seed.push(Math.random());

  /* ---------- ambiente riflesso: tubi luminosi del box ---------- */
  (function () {
    var c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#2a2c2e'); g.addColorStop(0.48, '#151617'); g.addColorStop(0.52, '#3a3936'); g.addColorStop(1, '#1d1c1a');
    x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
    for (var i = 0; i < 10; i++) { x.fillStyle = 'rgba(255,255,255,.95)'; x.fillRect(50 + i * 102 - 9, 40, 18, 150); }
    var wg = x.createRadialGradient(760, 270, 10, 760, 270, 170);
    wg.addColorStop(0, 'rgba(255,222,175,.55)'); wg.addColorStop(1, 'rgba(255,222,175,0)');
    x.fillStyle = wg; x.fillRect(560, 100, 400, 340);
    var t = new T.CanvasTexture(c); t.mapping = T.EquirectangularReflectionMapping; t.colorSpace = T.SRGBColorSpace;
    var pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromEquirectangular(t).texture;
    t.dispose();
  })();
  scene.environmentIntensity = 0.9;

  /* ---------- box d'officina: pavimento con perimetro del ponte, lampade a faro ---------- */
  (function () {
    var c = document.createElement('canvas'); c.width = c.height = 1024;
    var x = c.getContext('2d');
    x.fillStyle = '#2e2f30'; x.fillRect(0, 0, 1024, 1024);
    for (var i = 0; i < 9000; i++) {
      x.fillStyle = 'rgba(' + (Math.random() < .5 ? '255,255,255' : '0,0,0') + ',' + (Math.random() * 0.05) + ')';
      x.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
    }
    x.strokeStyle = '#d9a514'; x.lineWidth = 7;
    x.strokeRect(512 - 132, 512 - 68, 264, 136);
    x.setLineDash([22, 16]); x.lineWidth = 4; x.beginPath(); x.moveTo(512 - 175, 512 + 98); x.lineTo(512 + 175, 512 + 98); x.stroke();
    var tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    var floor = new T.Mesh(new T.PlaneGeometry(22, 22), new T.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    var wall = new T.Mesh(new T.PlaneGeometry(30, 10), new T.MeshStandardMaterial({ color: '#1c1d1e', roughness: 0.9 }));
    wall.position.set(0, 5, -7); scene.add(wall);
  })();

  scene.add(new T.HemisphereLight('#dfe6ee', '#1a1714', 0.4));
  var lamps = [], LAMP_X = [-2.1, 0, 2.1];
  var coneTex = (function () {
    var c = document.createElement('canvas'); c.width = 4; c.height = 256;
    var x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#fff'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, 4, 256);
    return new T.CanvasTexture(c);
  })();
  LAMP_X.forEach(function (lx, i) {
    var sl = new T.SpotLight('#eef3ff', 0, 0, 0.55, 0.6, 1.6);
    sl.position.set(lx, 4.8, 0.5); sl.target.position.set(lx * 0.6, 0, 0);
    scene.add(sl); scene.add(sl.target);
    if (i === 1) { sl.castShadow = true; sl.shadow.mapSize.set(1024, 1024); sl.shadow.bias = -0.0004; sl.shadow.radius = 4; }
    var cone = new T.Mesh(new T.CylinderGeometry(0.1, 1.6, 4.6, 40, 1, true),
      new T.MeshBasicMaterial({ color: '#dfe8ff', alphaMap: coneTex, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
    cone.position.set(lx, 2.5, 0.5); scene.add(cone);
    var housing = new T.Mesh(new T.CylinderGeometry(0.16, 0.26, 0.3, 24), new T.MeshStandardMaterial({ color: '#2a2b2c', roughness: 0.4, metalness: 0.8 }));
    housing.position.set(lx, 4.95, 0.5); scene.add(housing);
    var bulb = new T.Mesh(new T.CircleGeometry(0.2, 24), new T.MeshBasicMaterial({ color: '#333' }));
    bulb.rotation.x = Math.PI / 2; bulb.position.set(lx, 4.79, 0.5); scene.add(bulb);
    lamps.push({ light: sl, cone: cone, bulb: bulb });
  });

  /* ---------- materiali dell'auto ---------- */
  var state = { paint: '#2c5d97', p: [0, 0, 0, 0], target: [0, 0, 0, 0] };
  var MAT = {
    paint: new T.MeshPhysicalMaterial({ color: state.paint, metalness: 0.45, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.035 }),
    chrome: new T.MeshStandardMaterial({ color: '#e1e5e8', metalness: 1, roughness: 0.12 }),
    grille: new T.MeshStandardMaterial({ color: '#1c1d1e', metalness: 0.5, roughness: 0.45 }),
    plastic: new T.MeshStandardMaterial({ color: '#151617', metalness: 0, roughness: 0.62 }),
    trim: new T.MeshStandardMaterial({ color: '#3a3b3d', metalness: 0.7, roughness: 0.35 }),
    glass: new T.MeshPhysicalMaterial({ color: '#0c1218', metalness: 0, roughness: 0.04, transparent: true, opacity: 0.66 }),
    glassDark: new T.MeshPhysicalMaterial({ color: '#050607', metalness: 0.2, roughness: 0.08 }),
    lampFront: new T.MeshPhysicalMaterial({ color: '#e8eef3', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.3 }),
    headlight: new T.MeshPhysicalMaterial({ color: '#e8eef3', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.3 }),
    lampRear: new T.MeshPhysicalMaterial({ color: '#8d0c12', emissive: '#2a0103', roughness: 0.08, transparent: true, opacity: 0.88 }),
    glassRed: new T.MeshStandardMaterial({ color: '#8d0c12', roughness: 0.15 }),
    glassOrange: new T.MeshPhysicalMaterial({ color: '#d9740f', roughness: 0.1, transparent: true, opacity: 0.85 }),
    rims: new T.MeshStandardMaterial({ color: '#c5c9cd', metalness: 1, roughness: 0.28 }),
    rotor: new T.MeshStandardMaterial({ color: '#55585b', metalness: 0.9, roughness: 0.5 }),
    rubber: new T.MeshStandardMaterial({ color: '#121212', roughness: 0.88 }),
    interior: new T.MeshStandardMaterial({ color: '#1b1c1e', roughness: 0.85 }),
    plate: new T.MeshStandardMaterial({ color: '#efeee9', roughness: 0.4 })
  };
  var DEFORM = { paint: 1, chrome: 1, grille: 1, plastic: 1, lampFront: 1, headlight: 1, glassOrange: 1, plate: 1, glassDark: 1 };
  var NO_SHADOW = { glass: 1, lampFront: 1, headlight: 1, lampRear: 1, glassOrange: 1 };

  /* ---------- decodifica del modello (BCM1: gzip + base64) ---------- */
  function decodeModel(b64) {
    var bin = atob(b64), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    var stream = new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).arrayBuffer().then(function (ab) {
      var dv = new DataView(ab), hl = dv.getUint32(4, true);
      var h = JSON.parse(new TextDecoder().decode(new Uint8Array(ab, 8, hl)));
      var o = 8 + hl; o += (4 - o % 4) % 4;
      var out = {};
      h.prims.forEach(function (p) {
        var q = new Int16Array(ab, o, p.vc * 3); o += p.vc * 6; o += (4 - o % 4) % 4;
        var pos = new Float32Array(p.vc * 3);
        for (var j = 0; j < pos.length; j++) { var k = j % 3; pos[j] = (q[j] + 32768) / 65535 * (h.max[k] - h.min[k]) + h.min[k]; }
        var idx = p.i32 ? new Uint32Array(ab.slice(o, o + p.ic * 4)) : new Uint16Array(ab.slice(o, o + p.ic * 2));
        o += p.ic * (p.i32 ? 4 : 2); o += (4 - o % 4) % 4;
        var g = new T.BufferGeometry();
        g.setAttribute('position', new T.BufferAttribute(pos, 3));
        g.setIndex(new T.BufferAttribute(idx, 1));
        g.computeVertexNormals();
        out[p.name] = g;
      });
      return out;
    });
  }

  /* ---------- danno: funzione di deformazione sulla geometria ---------- */
  // D = lamiera (cofano, parafango, angolo), B = paraurti che cede
  function deform(x, y, z, D, B, o) {
    var X = x, Y = y, Z = z;
    if (D > 0) {
      var dx = x - 2.05, dy = y - 0.56, dz = z - 0.84;
      var m = Math.exp(-(dx * dx / 0.26 + dy * dy / 0.2 + dz * dz / 0.34) * 1.5);
      if (m > 1e-4) {
        var n = 1 + 0.6 * Math.sin(x * 19 + y * 11) * Math.sin(z * 15 + x * 7) + 0.25 * Math.sin(y * 40 + z * 33);
        X -= D * m * 0.36 * n; Z -= D * m * 0.26 * n; Y -= D * m * 0.05 * n;
      }
      if (y > 0.76 && x > 1.15 && z > 0) Y += D * 0.11 * Math.exp(-Math.pow((z - 0.48) / 0.24, 2)) * sm(1.2, 1.95, x) * (1 + 0.7 * Math.sin(x * 10));
    }
    if (B > 0) {
      var w = sm(1.8, 1.98, x) * (1 - sm(0.5, 0.63, y)) * sm(-0.25, 0.45, z);
      if (w > 0) { Y -= B * w * 0.2 * ((z + 0.25) / 1.1); X -= B * w * 0.09; Z += B * w * 0.06; }
    }
    o[0] = X; o[1] = Y; o[2] = Z;
  }

  /* ---------- texture procedurali: crepe, strisciate, fondo grigio ---------- */
  function canvasTex(w, h, draw) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  var crackTex = canvasTex(512, 512, function (x, W, H) {
    var cx = W * 0.72, cy = H * 0.42;
    x.fillStyle = 'rgba(20,22,24,.55)'; x.beginPath(); x.arc(cx, cy, 34, 0, 6.283); x.fill();
    x.strokeStyle = 'rgba(250,252,255,.95)'; x.lineCap = 'round';
    for (var i = 0; i < 16; i++) {            // crepe radiali spezzate
      var a = i / 16 * 6.283 + seed[i] * 0.3, len = 140 + seed[i + 20] * 260, px = cx, py = cy;
      x.lineWidth = 1.2 + seed[i + 40] * 1.8; x.beginPath(); x.moveTo(px, py);
      for (var k = 1; k <= 6; k++) { px = cx + Math.cos(a + (seed[i * 6 + k + 60] - 0.5) * 0.35) * len * k / 6; py = cy + Math.sin(a + (seed[i * 6 + k + 160] - 0.5) * 0.35) * len * k / 6; x.lineTo(px, py); }
      x.stroke();
    }
    for (var r = 1; r <= 3; r++) {            // anelli concentrici
      x.lineWidth = 1; x.beginPath();
      for (var j = 0; j <= 40; j++) { var b = j / 40 * 6.283, rr = r * 52 + (seed[(j + r * 40) % 500] - 0.5) * 16; if (j) x.lineTo(cx + Math.cos(b) * rr, cy + Math.sin(b) * rr); else x.moveTo(cx + Math.cos(b) * rr, cy + Math.sin(b) * rr); }
      x.stroke();
    }
  });
  var scratchTex = canvasTex(1024, 384, function (x, W, H) {
    var g = x.createRadialGradient(W * 0.45, H * 0.5, 20, W * 0.45, H * 0.5, W * 0.45);
    g.addColorStop(0, 'rgba(190,190,185,.18)'); g.addColorStop(1, 'rgba(190,190,185,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (var j = 0; j < 46; j++) {
      var y0 = H * 0.3 + seed[j] * H * 0.4, x0 = W * 0.08 + seed[j + 50] * W * 0.3, len = W * (0.3 + seed[j + 100] * 0.5);
      x.strokeStyle = 'rgba(232,232,226,' + (0.35 + seed[j + 150] * 0.55) + ')';
      x.lineWidth = 1 + seed[j + 200] * 3;
      x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + len, y0 + (seed[j + 250] - 0.45) * 40); x.stroke();
    }
  });
  var primerTex = canvasTex(512, 512, function (x, W, H) {
    x.fillStyle = '#8f908b';
    x.beginPath();
    for (var k = 0; k <= 48; k++) { var a = k / 48 * 6.283, rr = W * (0.36 + seed[k + 300] * 0.09); var px = W / 2 + Math.cos(a) * rr, py = H / 2 + Math.sin(a) * rr * 0.9; if (k) x.lineTo(px, py); else x.moveTo(px, py); }
    x.closePath(); x.fill();
    x.strokeStyle = 'rgba(70,72,70,.5)'; x.lineWidth = 6; x.stroke();              // bordo carteggiato
    x.globalAlpha = 0.25; x.fillStyle = '#b9bab4';
    for (var i = 0; i < 400; i++) x.fillRect(W * 0.2 + seed[i] * W * 0.6, H * 0.2 + seed[(i + 77) % 600] * H * 0.6, 3, 3);
  });
  function decalMat(map) {
    return new T.MeshStandardMaterial({ map: map, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, roughness: 0.7 });
  }

  /* ---------- costruzione dell'auto ---------- */
  var car = new T.Group(); scene.add(car);
  var parts = {}, base = {}, regionIdx = {};
  var crack = null, scratch = null, primers = [];
  var ready = false;

  function buildCar(geos) {
    Object.keys(geos).forEach(function (name) {
      var g = geos[name];
      var mesh = new T.Mesh(g, MAT[name] || MAT.plastic);
      mesh.castShadow = !NO_SHADOW[name]; mesh.receiveShadow = !NO_SHADOW[name];
      car.add(mesh); parts[name] = mesh;
      if (DEFORM[name]) {
        var arr = g.attributes.position.array;
        base[name] = arr.slice();
        var list = [];
        for (var i = 0; i < arr.length; i += 3) if (arr[i] > 1.05) list.push(i / 3);
        regionIdx[name] = new Uint32Array(list);
      }
    });
    car.updateMatrixWorld(true);

    // crepe sul vetro del faro: UV planari calcolate dalla forma integra (seguono la deformazione)
    var hg = geos.headlight;
    if (hg) {
      var a = hg.attributes.position.array, n = a.length / 3;
      var y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (var i = 0; i < n; i++) { y0 = Math.min(y0, a[i * 3 + 1]); y1 = Math.max(y1, a[i * 3 + 1]); z0 = Math.min(z0, a[i * 3 + 2]); z1 = Math.max(z1, a[i * 3 + 2]); }
      var uv = new Float32Array(n * 2);
      for (i = 0; i < n; i++) { uv[i * 2] = (a[i * 3 + 2] - z0) / (z1 - z0); uv[i * 2 + 1] = (a[i * 3 + 1] - y0) / (y1 - y0); }
      var cg = new T.BufferGeometry();
      cg.setAttribute('position', hg.attributes.position);      // stessa geometria: si deforma insieme
      cg.setAttribute('normal', hg.attributes.normal);
      cg.setAttribute('uv', new T.BufferAttribute(uv, 2));
      cg.setIndex(hg.index);
      crack = new T.Mesh(cg, decalMat(crackTex)); crack.material.roughness = 0.3; car.add(crack);
    }
    // strisciata sulla porta destra e fondo grigio su parafango e cofano (decal sulla forma integra)
    var paint = parts.paint;
    function decal(pos, rot, size, map) {
      var m = new T.Mesh(new T.DecalGeometry(paint, new T.Vector3().fromArray(pos), new T.Euler(rot[0], rot[1], rot[2]), new T.Vector3().fromArray(size)), decalMat(map));
      scene.add(m); return m;
    }
    scratch = decal([0.2, 0.6, 0.9], [0, 0, 0], [1.25, 0.42, 0.5], scratchTex);
    primers.push(decal([1.62, 0.74, 0.86], [0, 0, 0], [0.82, 0.42, 0.45], primerTex));
    primers.push(decal([1.62, 0.86, 0.45], [-Math.PI / 2, 0, 0], [0.85, 0.75, 0.5], primerTex));
  }

  /* ---------- applica lo stato del danno ---------- */
  var lastD = -1, lastB = -1, tmp = [0, 0, 0];
  function apply() {
    if (!ready) return;
    var p = state.p;
    var D = 1 - ease(p[1]), B = 1 - ease(p[0]);
    if (Math.abs(D - lastD) > 0.001 || Math.abs(B - lastB) > 0.001) {
      Object.keys(regionIdx).forEach(function (name) {
        var g = parts[name].geometry, arr = g.attributes.position.array, b = base[name], idx = regionIdx[name];
        for (var k = 0; k < idx.length; k++) {
          var i = idx[k] * 3;
          deform(b[i], b[i + 1], b[i + 2], D, B, tmp);
          arr[i] = tmp[0]; arr[i + 1] = tmp[1]; arr[i + 2] = tmp[2];
        }
        g.attributes.position.needsUpdate = true;
        g.computeVertexNormals();
      });
      lastD = D; lastB = B;
    }
    var broken = 1 - sm(0.1, 0.8, p[2]);
    if (crack) crack.material.opacity = broken;
    MAT.headlight.opacity = 0.3 + 0.35 * broken;
    MAT.headlight.color.set('#e8eef3').lerp(new T.Color('#8f969c'), broken);
    var prim = sm(0.55, 1, p[1]) * (1 - sm(0.15, 0.9, p[3]));
    primers.forEach(function (m) { m.material.opacity = prim; });
    if (scratch) scratch.material.opacity = 1 - sm(0.1, 0.9, p[3]);
    MAT.paint.color.set(state.paint);
  }

  /* ---------- camera orbitale ---------- */
  var az = 0.62, azT = 0.62, el = 0.25, R = 6.0, idle = !reduce;
  var TARGET = new T.Vector3(0.3, 0.6, 0);
  function placeCam() {
    camera.position.set(TARGET.x + Math.cos(az) * R * Math.cos(el), TARGET.y + R * Math.sin(el) + 0.35, TARGET.z + Math.sin(az) * R * Math.cos(el));
    camera.lookAt(TARGET);
  }
  var dirty = true;
  function fit() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    R = w / h < 1 ? 9.6 : (w / h > 1.6 ? 5.7 : 6.3);
    camera.updateProjectionMatrix();
    dirty = true; kick();
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
    { name: 'Paraurti', az: 0.38, anchor: [2.34, 0.28, 0.24], normal: [1, 0, 0.35],
      txt: 'Paraurti: si smonta, si controllano gli attacchi e la traversa sotto, poi si rimonta o si sostituisce.' },
    { name: 'Lattoneria', az: 0.8, anchor: [1.42, 1.06, 0.66], normal: [0.2, 0.7, 0.7],
      txt: 'Lattoneria: cofano e parafango tornano in forma con tiraggio e martello, poi stucco, carteggiatura e fondo grigio.' },
    { name: 'Faro', az: 0.42, anchor: [2.1, 0.88, 0.9], normal: [1, 0.3, 0.6],
      txt: 'Faro: il gruppo ottico con il vetro rotto si sostituisce e si regola l’assetto dei fari.' },
    { name: 'Verniciatura', az: 1.32, anchor: [0.15, 0.6, 1.06], normal: [0, 0, 1],
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
    canvas.setAttribute('aria-label', 'Auto in 3D con urto sull’angolo anteriore destro. Interventi completati: ' + done + ' su 4.');
    var fa = document.getElementById('fixAll'); if (fa) fa.disabled = done === 4;
  }
  function repair(i, silent) {
    if (!ready) return;
    if (state.target[i] === 1) { if (!silent) say(PARTS[i].name + ': già fatto. ' + PARTS[i].txt); return; }
    if (i === 3 && state.target[1] !== 1) { say('Prima la lattoneria: la vernice va su lamiera già raddrizzata e con il fondo.'); return; }
    state.target[i] = 1; idle = false;
    if (!silent) { azT = PARTS[i].az + Math.round((azT - PARTS[i].az) / (Math.PI * 2)) * Math.PI * 2; say(PARTS[i].txt); }
    if (reduce) { state.p[i] = 1; apply(); dirty = true; }
    else anim[i] = { t0: performance.now(), from: state.p[i], dur: i === 1 ? 1800 : 1200 };
    sync(); kick();
    if (state.target.every(function (v) { return v === 1; })) setTimeout(function () { say('Auto pronta per la riconsegna. Ogni lavoro reale parte da un preventivo con le foto del danno.'); }, reduce ? 0 : 1900);
  }
  hsBtns.concat(stepBtns).forEach(function (b) {
    b.addEventListener('click', function () { repair(+b.dataset.part); });
  });
  var fixAll = document.getElementById('fixAll');
  if (fixAll) fixAll.addEventListener('click', function () {
    if (!ready) return;
    [0, 1, 2].forEach(function (i, n) { setTimeout(function () { repair(i, true); }, reduce ? 0 : n * 450); });
    setTimeout(function () { repair(3, true); azT = 0.62; }, reduce ? 0 : 2000);
    say('Tutti gli interventi in sequenza: paraurti, lattoneria, faro, poi vernice.');
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
      l.light.intensity = 30 * f; l.cone.material.opacity = 0.07 * f;
      l.bulb.material.color.setScalar(0.2 + 0.8 * f);
    });
  }

  /* ---------- ciclo ---------- */
  var visible = true, raf = 0;
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
    if (idle && ready) { azT = 0.62 + Math.sin((now - t0) * 0.00025) * 0.3; busy = true; }
    if (!reduce && Math.abs(azT - az) > 0.0005) { az += (azT - az) * 0.08; busy = true; } else az = azT;
    placeCam(); car.updateMatrixWorld(); placeHotspots();
    renderer.render(scene, camera); dirty = false;
    if (busy || drag) kick();
  }

  if (hint) hint.textContent = 'Caricamento del modello 3D…';
  stage.classList.add('loading');
  sync(); fit(); placeCam(); kick();
  decodeModel(window.BC_CAR_MODEL).then(function (geos) {
    buildCar(geos);
    ready = true;
    apply();
    stage.classList.remove('loading'); stage.classList.add('ready');
    if (hint) hint.textContent = hintText;
    dirty = true; kick();
  }).catch(function () { fail(); });
})();
