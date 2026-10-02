/* Scena 3D: hamburger "esploso" a strati (Three.js).
   Texture dipinte su canvas in attesa delle foto reali del banco: ogni strato ha
   la sua texture, sostituibile con il ritaglio fotografico dell'ingrediente.
   - devicePixelRatio max 2, pausa fuori schermo, fallback statico senza WebGL
   - con prefers-reduced-motion la scena non parte: resta l'illustrazione statica */
(function () {
  'use strict';
  var root = document.documentElement;
  var canvas = document.getElementById('burger3d');
  if (!canvas) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fallback() { root.classList.add('no-3d'); }
  if (reduce || !window.THREE) return fallback();
  var gl = null;
  try { gl = canvas.getContext('webgl2') || canvas.getContext('webgl'); } catch (e) {}
  if (!gl) return fallback();

  var THREE = window.THREE;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, context: gl, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 2.6, 10.5);
  camera.lookAt(0, 1.25, 0);

  /* ---------- texture dipinte ---------- */
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function tex(w, h, draw) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  }
  function macchie(ctx, w, h, n, colori, rMin, rMax, alpha) {
    for (var i = 0; i < n; i++) {
      ctx.globalAlpha = alpha * (0.4 + rnd() * 0.6);
      ctx.fillStyle = colori[(rnd() * colori.length) | 0];
      ctx.beginPath();
      ctx.ellipse(rnd() * w, rnd() * h, rMin + rnd() * (rMax - rMin), (rMin + rnd() * (rMax - rMin)) * 0.6, rnd() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // crosta del pane: dorata in alto, più chiara verso il taglio
  var texCrosta = tex(512, 256, function (ctx, w, h) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#8a4a1c'); g.addColorStop(0.45, '#c47a35'); g.addColorStop(0.85, '#e2a95c'); g.addColorStop(1, '#f1d29c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    macchie(ctx, w, h, 900, ['#7a3e16', '#d58c43', '#f0c27f'], 1, 5, 0.25);
  });
  // mollica (faccia tagliata)
  var texMollica = tex(256, 256, function (ctx, w, h) {
    ctx.fillStyle = '#efd9ae'; ctx.fillRect(0, 0, w, h);
    macchie(ctx, w, h, 1400, ['#e2c68e', '#f8ead0', '#d8b77c'], 1, 4, 0.5);
    var g = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.5);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(160,96,40,.65)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
  // carne: marrone scuro con righe della piastra
  var texCarne = tex(512, 256, function (ctx, w, h) {
    ctx.fillStyle = '#4a2416'; ctx.fillRect(0, 0, w, h);
    macchie(ctx, w, h, 2200, ['#2a120a', '#6b3420', '#8a4a2c', '#3a1a0f'], 1, 6, 0.55);
    macchie(ctx, w, h, 120, ['#a8673f'], 1, 3, 0.6);
  });
  var texCarneTop = tex(256, 256, function (ctx, w, h) {
    ctx.fillStyle = '#4f2818'; ctx.fillRect(0, 0, w, h);
    macchie(ctx, w, h, 1600, ['#2a120a', '#6b3420', '#8a4a2c'], 1, 6, 0.55);
    ctx.globalAlpha = 0.55; ctx.strokeStyle = '#1a0a05'; ctx.lineWidth = 9;
    for (var i = -2; i < 6; i++) { ctx.beginPath(); ctx.moveTo(i * 52, 0); ctx.lineTo(i * 52 + 140, h); ctx.stroke(); }
    ctx.globalAlpha = 1;
  });
  var texFormaggio = tex(256, 256, function (ctx, w, h) {
    ctx.fillStyle = '#f4b52c'; ctx.fillRect(0, 0, w, h);
    macchie(ctx, w, h, 300, ['#f8c955', '#e9a21f'], 4, 14, 0.35);
  });
  var texInsalata = tex(512, 512, function (ctx, w, h) {
    var g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#d9ea9a'); g.addColorStop(0.6, '#86b54a'); g.addColorStop(1, '#4f8a2c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(240,250,210,.55)'; ctx.lineWidth = 3;
    for (var i = 0; i < 26; i++) {
      var a = (i / 26) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(w / 2, h / 2);
      ctx.quadraticCurveTo(w / 2 + Math.cos(a + 0.2) * 120, h / 2 + Math.sin(a + 0.2) * 120, w / 2 + Math.cos(a) * 250, h / 2 + Math.sin(a) * 250);
      ctx.stroke();
    }
  });
  var texPomodoro = tex(256, 256, function (ctx, w, h) {
    ctx.fillStyle = '#c3241b'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8573f';
    for (var i = 0; i < 5; i++) {
      var a = (i / 5) * Math.PI * 2;
      ctx.beginPath(); ctx.ellipse(w / 2 + Math.cos(a) * 58, h / 2 + Math.sin(a) * 58, 30, 18, a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#f6d36a';
    for (var j = 0; j < 22; j++) {
      var b = rnd() * Math.PI * 2, r = 45 + rnd() * 25;
      ctx.beginPath(); ctx.ellipse(w / 2 + Math.cos(b) * r, h / 2 + Math.sin(b) * r, 4, 2.5, b, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#f08b72'; ctx.beginPath(); ctx.arc(w / 2, h / 2, 18, 0, Math.PI * 2); ctx.fill();
  });

  /* ---------- geometrie ---------- */
  function lathe(punti, seg) {
    return new THREE.LatheGeometry(punti.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), seg || 96);
  }
  function irregolare(geo, ampiezza, freq) {
    var p = geo.attributes.position, v = new THREE.Vector3();
    for (var i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      var a = Math.atan2(v.z, v.x), r = Math.hypot(v.x, v.z);
      if (r < 0.01) continue;
      var k = 1 + ampiezza * (Math.sin(a * freq) * 0.6 + Math.sin(a * (freq * 2 + 1) + 1.3) * 0.4);
      p.setX(i, v.x * k); p.setZ(i, v.z * k);
    }
    geo.computeVertexNormals();
    return geo;
  }
  function mat(map, opt) {
    return new THREE.MeshStandardMaterial(Object.assign({ map: map, roughness: 0.75, metalness: 0 }, opt || {}));
  }
  function disco(r, map, y, opt) {
    var m = new THREE.Mesh(new THREE.CircleGeometry(r, 96), mat(map, opt));
    m.rotation.x = -Math.PI / 2; m.position.y = y;
    return m;
  }

  var strati = [];
  function strato(obj, y) { obj.userData.base = y; obj.position.y = y; strati.push(obj); burger.add(obj); return obj; }
  var burger = new THREE.Group();

  // 1. pane sotto
  var paneSotto = new THREE.Group();
  paneSotto.add(new THREE.Mesh(irregolare(lathe([[0, 0], [1.42, 0], [1.56, 0.07], [1.62, 0.2], [1.58, 0.36], [1.5, 0.4], [0, 0.4]]), 0.012, 5), mat(texCrosta, { roughness: 0.85 })));
  paneSotto.add(disco(1.5, texMollica, 0.401, { roughness: 0.95 }));
  strato(paneSotto, 0);

  // 2. insalata ondulata
  var gIns = new THREE.RingGeometry(0, 1.9, 180, 8);
  (function () {
    var p = gIns.attributes.position, uv = gIns.attributes.uv;
    for (var i = 0; i < p.count; i++) {
      var x = p.getX(i), y = p.getY(i), a = Math.atan2(y, x), r = Math.hypot(x, y);
      var rr = r * (1 + 0.07 * Math.sin(a * 9) + 0.04 * Math.sin(a * 23 + 2));
      p.setX(i, Math.cos(a) * rr); p.setY(i, Math.sin(a) * rr);
      var t = r / 1.9;
      p.setZ(i, t * t * (0.16 * Math.sin(a * 13) + 0.08 * Math.sin(a * 31)) - Math.max(0, r - 1.45) * 0.35);
      uv.setXY(i, 0.5 + Math.cos(a) * t * 0.5, 0.5 + Math.sin(a) * t * 0.5);
    }
    gIns.computeVertexNormals();
  })();
  var insalata = new THREE.Mesh(gIns, mat(texInsalata, { side: THREE.DoubleSide, roughness: 0.55 }));
  insalata.rotation.x = -Math.PI / 2;
  var gInsalata = new THREE.Group(); gInsalata.add(insalata);
  strato(gInsalata, 0.44);

  // 3. carne
  var carne = new THREE.Group();
  carne.add(new THREE.Mesh(irregolare(lathe([[0, 0], [1.48, 0], [1.64, 0.08], [1.7, 0.24], [1.66, 0.42], [1.5, 0.52], [0, 0.52]]), 0.025, 7), mat(texCarne, { roughness: 0.9 })));
  carne.add(disco(1.52, texCarneTop, 0.521, { roughness: 0.8 }));
  strato(carne, 0.5);

  // 4. formaggio che cola sui bordi
  var gForm = new THREE.PlaneGeometry(3.15, 3.15, 48, 48);
  (function () {
    var p = gForm.attributes.position;
    for (var i = 0; i < p.count; i++) {
      var x = p.getX(i), y = p.getY(i), d = Math.hypot(x, y);
      var cade = d > 1.45 ? Math.pow(d - 1.45, 1.6) * 1.15 : 0;
      p.setZ(i, -cade + 0.02 * Math.sin(x * 5) * Math.cos(y * 4));
    }
    gForm.computeVertexNormals();
  })();
  var formaggio = new THREE.Mesh(gForm, mat(texFormaggio, { side: THREE.DoubleSide, roughness: 0.4 }));
  formaggio.rotation.x = -Math.PI / 2; formaggio.rotation.z = Math.PI / 4;
  var gFormaggio = new THREE.Group(); gFormaggio.add(formaggio);
  strato(gFormaggio, 1.04);

  // 5. pomodoro
  var gPom = new THREE.Group();
  [[-0.62, 0.15], [0.62, -0.1], [0.05, 0.72]].forEach(function (c, i) {
    var s = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.13, 48), [mat(null, { color: '#b51f17', roughness: 0.35 }), mat(texPomodoro, { roughness: 0.3 }), mat(texPomodoro, { roughness: 0.3 })]);
    s.position.set(c[0], i * 0.012, c[1]);
    s.rotation.y = i;
    gPom.add(s);
  });
  strato(gPom, 1.12);

  // 6. cipolla
  var gCip = new THREE.Group();
  [[0, 0, 0.82], [0.5, 0.3, 0.6], [-0.55, -0.35, 0.55]].forEach(function (c) {
    var t = new THREE.Mesh(new THREE.TorusGeometry(c[2], 0.06, 12, 64), mat(null, { color: '#efe1ec', roughness: 0.3 }));
    t.rotation.x = Math.PI / 2; t.position.set(c[0], 0, c[1]);
    gCip.add(t);
  });
  strato(gCip, 1.27);

  // 7. pane sopra con sesamo
  var paneSopra = new THREE.Group();
  var profilo = [[0, 0], [1.5, 0], [1.63, 0.12], [1.64, 0.34], [1.48, 0.62], [1.12, 0.88], [0.62, 1.03], [0, 1.08]];
  paneSopra.add(new THREE.Mesh(irregolare(lathe(profilo), 0.012, 4), mat(texCrosta, { roughness: 0.55 })));
  var fondo = disco(1.5, texMollica, 0.001, { roughness: 0.95, side: THREE.DoubleSide });
  paneSopra.add(fondo);
  var semi = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), mat(null, { color: '#f6e8c8', roughness: 0.5 }), 130);
  var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(0.075, 0.03, 0.04), pos = new THREE.Vector3();
  for (var i = 0; i < 130; i++) {
    var t = Math.sqrt(rnd()) * 0.82, a = rnd() * Math.PI * 2;   // t: distanza dal centro (0..1 del raggio)
    var r = t * 1.5, hy = 1.08 * Math.cos(t * Math.PI / 2 * 0.98) + 0.02;
    pos.set(Math.cos(a) * r, hy, Math.sin(a) * r);
    e.set(-Math.sin(a) * t * 1.1, rnd() * Math.PI, Math.cos(a) * t * 1.1);
    q.setFromEuler(e);
    m4.compose(pos, q, sc);
    semi.setMatrixAt(i, m4);
  }
  paneSopra.add(semi);
  strato(paneSopra, 1.36);

  burger.position.y = -0.2;
  scene.add(burger);

  /* ---------- luci ---------- */
  scene.add(new THREE.HemisphereLight('#fff3e2', '#4a3020', 1.1));
  var chiave = new THREE.DirectionalLight('#ffe2bd', 2.4); chiave.position.set(4, 7, 5); scene.add(chiave);
  var contro = new THREE.DirectionalLight('#ffd2b8', 1.3); contro.position.set(-5, 3, -6); scene.add(contro);
  var riemp = new THREE.DirectionalLight('#f2e6d9', 0.5); riemp.position.set(-4, 1, 6); scene.add(riemp);

  /* ---------- stato ---------- */
  var esploso = 1.4, esplosoTarget = 0, scrollEsploso = 0;   // intro: gli strati scendono uno sull'altro
  var mx = 0, my = 0, rotY = 0.4;
  var visibile = true, attivo = true;

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // distanza della camera: l'hamburger (largo ~3.8 unità) deve stare nella larghezza del canvas
    var halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    var z = Math.max(10.5, 3.9 / (halfTan * camera.aspect) * 0.52);
    camera.position.set(0, z * 0.25, z);
    camera.lookAt(0, 1.1, 0);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('pointermove', function (ev) {
    mx = (ev.clientX / window.innerWidth) * 2 - 1;
    my = (ev.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  new IntersectionObserver(function (en) { visibile = en[0].isIntersecting; if (visibile) loop(); }, { threshold: 0 }).observe(canvas);
  document.addEventListener('visibilitychange', function () { attivo = !document.hidden; if (attivo) loop(); });

  var inLoop = false, t0 = performance.now();
  function loop() {
    if (inLoop) return;
    inLoop = true;
    requestAnimationFrame(frame);
  }
  function frame(now) {
    if (!visibile || !attivo) { inLoop = false; return; }
    var dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
    var target = Math.max(esplosoTarget, scrollEsploso);
    esploso += (target - esploso) * Math.min(1, dt * 3.2);
    for (var i = 0; i < strati.length; i++) {
      var s = strati[i];
      s.position.y = s.userData.base + i * esploso * 0.55;
      s.rotation.y = esploso * (i % 2 ? 0.25 : -0.2) * (i / strati.length);
    }
    rotY += dt * 0.25;
    burger.rotation.y = rotY + mx * 0.35;
    burger.rotation.x = 0.12 + my * 0.08;
    burger.position.y = -0.2 - esploso * 1.3;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  loop();

  // API per lo scroll (main.js): 0 = composto, 1 = strati separati
  window.MaraScene = {
    esplodi: function (p) { scrollEsploso = Math.max(0, Math.min(1, p)); },
    resize: resize
  };
})();
