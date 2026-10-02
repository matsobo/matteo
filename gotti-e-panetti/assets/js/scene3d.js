/* Gotti e Panetti — il salame sotto l'affettatrice (three.js)
   Interazioni: trascina a destra o tocca per tagliare, scorri la colonna,
   pulsante "Taglia una fetta". Con prefers-reduced-motion: niente animazioni,
   le fette compaiono direttamente sul banco. */
(function () {
  'use strict';
  var canvas = document.getElementById('salame');
  if (!canvas) return;
  var stage = document.getElementById('stage');
  var btn = document.getElementById('taglia');
  var counterEl = document.getElementById('fette');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  var gl = null;
  try { gl = window.THREE && (canvas.getContext('webgl2') || canvas.getContext('webgl')); } catch (e) { gl = null; }
  if (!gl) { root.classList.add('no-webgl'); if (btn) btn.hidden = true; return; }

  var T = window.THREE;
  var gs = window.gsap || null;

  /* ---------- numeri casuali ripetibili ---------- */
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  /* ---------- texture: sezione del salame ---------- */
  function sectionCanvas(seed) {
    var r = rng(seed), S = 512, c = document.createElement('canvas'); c.width = c.height = S;
    var x = c.getContext('2d'), C = S / 2, R = S / 2;
    x.save(); x.beginPath(); x.arc(C, C, R, 0, Math.PI * 2); x.clip();
    // magro: base e grana
    x.fillStyle = '#7a1b26'; x.fillRect(0, 0, S, S);
    var meats = ['#6a1520', '#8f2632', '#83202c', '#9c2f39', '#701924'];
    for (var i = 0; i < 2600; i++) {
      x.fillStyle = meats[(r() * meats.length) | 0];
      x.globalAlpha = .35 + r() * .5;
      x.beginPath(); x.ellipse(r() * S, r() * S, 2 + r() * 7, 2 + r() * 5, r() * 3, 0, 7); x.fill();
    }
    x.globalAlpha = 1;
    // grasso a grana grossa: tasselli irregolari
    for (var k = 0; k < 230; k++) {
      var a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * .9, px = C + Math.cos(a) * d, py = C + Math.sin(a) * d;
      var s = 3 + Math.pow(r(), 2) * 13, n = 6 + (r() * 4 | 0);
      x.fillStyle = r() < .5 ? '#f6e9e2' : '#ecd6cc';
      x.beginPath();
      for (var j = 0; j < n; j++) {
        var t = j / n * Math.PI * 2, rr = s * (.6 + r() * .55);
        x[j ? 'lineTo' : 'moveTo'](px + Math.cos(t) * rr, py + Math.sin(t) * rr * (.7 + r() * .5));
      }
      x.closePath(); x.fill();
      x.strokeStyle = 'rgba(160,70,70,.35)'; x.lineWidth = 1; x.stroke();
    }
    // pepe in grani
    for (var p = 0; p < 46; p++) {
      var pa = r() * Math.PI * 2, pd = Math.sqrt(r()) * R * .86;
      x.fillStyle = '#1d1512'; x.beginPath(); x.arc(C + Math.cos(pa) * pd, C + Math.sin(pa) * pd, 2.2 + r() * 1.8, 0, 7); x.fill();
    }
    // corona più scura verso il budello
    var g = x.createRadialGradient(C, C, R * .62, C, C, R);
    g.addColorStop(0, 'rgba(70,10,18,0)'); g.addColorStop(.85, 'rgba(70,10,18,.35)'); g.addColorStop(1, 'rgba(50,8,12,.7)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    // budello e fiore bianco
    x.lineWidth = 9; x.strokeStyle = '#4a2119'; x.beginPath(); x.arc(C, C, R - 6, 0, 7); x.stroke();
    x.lineWidth = 4; x.strokeStyle = '#d9d0c4'; x.beginPath(); x.arc(C, C, R - 2, 0, 7); x.stroke();
    x.restore();
    return c;
  }

  /* ---------- texture: budello con muffa nobile e spago ---------- */
  var L = 3.4, Rb = .5, RINGS = [];
  for (var ri = .55; ri < L - .1; ri += .34) RINGS.push(ri);

  function casingCanvases() {
    var r = rng(7), W = 1024, H = 1024;
    var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
    var b = document.createElement('canvas'); b.width = W; b.height = H; var y = b.getContext('2d');
    x.fillStyle = '#4c1d16'; x.fillRect(0, 0, W, H);
    y.fillStyle = '#808080'; y.fillRect(0, 0, W, H);
    var tones = ['#3f1712', '#5c2519', '#46190f', '#6a2e20'];
    for (var i = 0; i < 1800; i++) {
      x.globalAlpha = .25 + r() * .35; x.fillStyle = tones[(r() * tones.length) | 0];
      x.beginPath(); x.ellipse(r() * W, r() * H, 4 + r() * 22, 3 + r() * 10, r() * 3, 0, 7); x.fill();
    }
    // grinze del budello (rilievo)
    for (var w = 0; w < 260; w++) {
      var sx = r() * W, sy = r() * H, len = 20 + r() * 60;
      y.strokeStyle = r() < .5 ? 'rgba(90,90,90,.35)' : 'rgba(170,170,170,.3)'; y.lineWidth = 1 + r() * 1.5;
      y.beginPath(); y.moveTo(sx, sy); y.quadraticCurveTo(sx + (r() - .5) * 20, sy + len / 2, sx + (r() - .5) * 12, sy + len); y.stroke();
    }
    x.globalAlpha = 1;
    // fiore (muffa bianca), a chiazze morbide
    for (var m = 0; m < 150; m++) {
      var mx = r() * W, my = r() * H, mr = 8 + r() * 46;
      var g = x.createRadialGradient(mx, my, 0, mx, my, mr);
      g.addColorStop(0, 'rgba(226,220,208,' + (.15 + r() * .35) + ')'); g.addColorStop(1, 'rgba(236,230,220,0)');
      x.fillStyle = g; x.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
    }
    // spago: anelli (lungo u) e fili longitudinali (lungo v)
    function string(ctx, bump, x1, y1, x2, y2) {
      ctx.lineCap = 'round';
      ctx.strokeStyle = bump ? '#202020' : 'rgba(50,25,15,.55)'; ctx.lineWidth = bump ? 14 : 11;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = bump ? '#f4f4f4' : '#e2d3b6'; ctx.lineWidth = bump ? 7 : 6;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    RINGS.forEach(function (s) {
      var v = H - s / L * H;
      string(x, false, 0, v, W, v); string(y, true, 0, v, W, v);
    });
    for (var u = 0; u < 6; u++) {
      var ux = (u + .5) / 6 * W;
      string(x, false, ux, H * .02, ux, H * .98); string(y, true, ux, H * .02, ux, H * .98);
    }
    return [c, b];
  }

  function marbleCanvas() {
    var r = rng(19), S = 1024, c = document.createElement('canvas'); c.width = c.height = S; var x = c.getContext('2d');
    x.fillStyle = '#efede7'; x.fillRect(0, 0, S, S);
    for (var i = 0; i < 26; i++) {
      x.strokeStyle = 'rgba(120,115,105,' + (.05 + r() * .18) + ')'; x.lineWidth = .6 + r() * 2.4;
      var px = r() * S, py = 0; x.beginPath(); x.moveTo(px, py);
      while (py < S) { px += (r() - .45) * 70; py += 20 + r() * 40; x.lineTo(px, py); }
      x.stroke();
    }
    return c;
  }

  /* ---------- profilo del salame ---------- */
  function radiusAt(s) {
    if (s <= 0) return Rb * .14;
    var back = .42, r = Rb;
    if (s < back) { var t = 1 - s / back; r = Rb * Math.max(.14, Math.sqrt(1 - t * t)); }
    var dmin = 9; for (var i = 0; i < RINGS.length; i++) dmin = Math.min(dmin, Math.abs(s - RINGS[i]));
    r *= 1 - .035 * Math.exp(-(dmin * dmin) / .0009);
    r *= 1 + .018 * Math.sin(s * 2.3 + 1.1);
    return r;
  }

  /* ---------- scena ---------- */
  var renderer = new T.WebGLRenderer({ canvas: canvas, context: gl, antialias: true, alpha: false });
  var mobile = matchMedia('(max-width: 900px)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.6 : 2));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0xe9e6df, 1);

  var scene = new T.Scene();
  var pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new window.RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .55;

  var camera = new T.PerspectiveCamera(30, 1, .1, 60);

  scene.add(new T.HemisphereLight(0xfffaf2, 0xb3a690, .55));
  var key = new T.DirectionalLight(0xfff1e2, 2.4);
  key.position.set(2.5, 6, 4.5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -5; key.shadow.camera.right = 5;
  key.shadow.camera.top = 4; key.shadow.camera.bottom = -4; key.shadow.radius = 5; key.shadow.bias = -.0006;
  scene.add(key);
  var rim = new T.DirectionalLight(0xffd9cf, .7); rim.position.set(-5, 2.5, -3); scene.add(rim);

  var anis = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  function tex(cv, srgb) { var t = new T.CanvasTexture(cv); if (srgb) t.colorSpace = T.SRGBColorSpace; t.anisotropy = anis; return t; }

  // bancone di marmo
  var BOARD = -.62;
  var marble = tex(marbleCanvas(), true);
  var board = new T.Mesh(new T.BoxGeometry(9, .3, 5), new T.MeshStandardMaterial({ map: marble, roughness: .32, metalness: 0 }));
  board.position.set(.4, BOARD - .15, 0); board.receiveShadow = true; scene.add(board);

  // carta da banco
  var paper = new T.Mesh(new T.PlaneGeometry(2.5, 2.1), new T.MeshStandardMaterial({ color: 0xf5efe5, roughness: .95 }));
  paper.rotation.x = -Math.PI / 2; paper.rotation.z = .12; paper.position.set(2.15, BOARD + .004, .95); paper.receiveShadow = true;
  scene.add(paper);

  // materiali
  var BX = .55; // piano di taglio (x)
  var clip = new T.Plane(new T.Vector3(-1, 0, 0), BX);
  var cas = casingCanvases();
  var casingMap = tex(cas[0], true), casingBump = tex(cas[1], false);
  var casingMat = new T.MeshStandardMaterial({ map: casingMap, bumpMap: casingBump, bumpScale: 1.6, roughness: .78, clippingPlanes: [clip], clipShadows: true });
  var sections = [tex(sectionCanvas(3), true), tex(sectionCanvas(11), true), tex(sectionCanvas(29), true)];
  var sectionMats = sections.map(function (t) { return new T.MeshPhysicalMaterial({ map: t, roughness: .48, clearcoat: .22, clearcoatRoughness: .55 }); });
  var rindMat = new T.MeshStandardMaterial({ color: 0x5a281e, roughness: .8 });

  // corpo del salame (tornio) con l'asse lungo x
  var pts = [], N = 180;
  for (var i = 0; i <= N; i++) { var s = i / N * L; pts.push(new T.Vector2(radiusAt(s), s - L / 2)); }
  var bodyGeo = new T.LatheGeometry(pts, 96); bodyGeo.rotateZ(-Math.PI / 2);
  var body = new T.Mesh(bodyGeo, casingMat); body.castShadow = true;
  // nodo dello spago sulla punta
  var knot = new T.Mesh(new T.TorusGeometry(.07, .025, 8, 20), new T.MeshStandardMaterial({ color: 0xe2d3b6, roughness: .9 }));
  knot.position.x = -L / 2 - .02; knot.rotation.y = Math.PI / 2;
  var salame = new T.Group(); salame.add(body, knot);
  var Y0 = BOARD + Rb * .96;
  var START = BX - L / 2; // fronte del salame sul piano di taglio
  salame.position.set(START, Y0, 0);
  scene.add(salame);

  // faccia di taglio (sempre sul piano)
  var cap = new T.Mesh(new T.CircleGeometry(1, 72), sectionMats[0]);
  cap.geometry.rotateY(Math.PI / 2);
  scene.add(cap);
  function placeCap(planeX) {
    var sLocal = planeX - salame.position.x + L / 2;
    var r = radiusAt(Math.min(L, Math.max(0, sLocal)));
    cap.scale.set(1, r, r); cap.position.set(planeX - .001, Y0, 0);
    clip.constant = planeX;
    return r;
  }
  placeCap(BX);

  // affettatrice: lama, mozzo e carter rosso
  var slicer = new T.Group();
  var steel = new T.MeshStandardMaterial({ color: 0xeef1f3, metalness: 1, roughness: .14, envMapIntensity: 2.2 });
  var red = new T.MeshPhysicalMaterial({ color: 0xb0142b, roughness: .3, clearcoat: .8, clearcoatRoughness: .15 });
  var blade = new T.Mesh(new T.CylinderGeometry(1.05, 1.05, .018, 96), steel);
  blade.rotation.z = Math.PI / 2;
  var bevel = new T.Mesh(new T.TorusGeometry(1.03, .02, 10, 96), steel); bevel.rotation.y = Math.PI / 2;
  var hub = new T.Mesh(new T.CylinderGeometry(.34, .38, .12, 48), red); hub.rotation.z = Math.PI / 2; hub.position.x = .06;
  var cover = new T.Mesh(new T.CylinderGeometry(1.16, 1.16, .07, 96, 1, false, Math.PI * .05, Math.PI * 1.1), red);
  cover.rotation.z = Math.PI / 2; cover.position.x = .07;
  var spinner = new T.Group(); spinner.add(blade, bevel);
  slicer.add(spinner, hub, cover);
  slicer.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
  var REST_Z = -1.75;
  slicer.position.set(BX + .012, Y0 + .62, REST_Z);
  scene.add(slicer);

  /* ---------- camera e dimensioni ---------- */
  var look = new T.Vector3(.35, -.05, .25);
  var orbit = { az: 0, el: 0, taz: 0, tel: 0 };
  var baseDist = 7.2;
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    var tv = Math.tan(camera.fov * Math.PI / 360), th = tv * camera.aspect;
    baseDist = Math.max((camera.aspect < 1 ? 2.75 : 3.1) / th, 2.1 / tv);
    camera.updateProjectionMatrix();
    placeCamera(); requestRender();
  }
  function placeCamera() {
    var az = .62 + orbit.az, el = .5 + orbit.el;
    camera.position.set(look.x + Math.sin(az) * Math.cos(el) * baseDist, look.y + Math.sin(el) * baseDist, look.z + Math.cos(az) * Math.cos(el) * baseDist);
    camera.lookAt(look);
  }

  /* ---------- fette ---------- */
  var THICK = .05, MAX = 16, slices = [], busy = false, queue = 0;
  var sliceGeo = new T.CylinderGeometry(1, 1, THICK, 64, 1); sliceGeo.rotateZ(-Math.PI / 2); // asse x
  function landing(i) {
    var row = i % 8, lap = Math.floor(i / 8);
    return { x: 1.3 + row * .19 + lap * .1, y: BOARD + .006 + THICK / 2 + row * .012 + lap * .05, z: 1.45 - row * .1 - lap * .55, ry: .3 - row * .04 };
  }
  function setCount() { if (counterEl) counterEl.textContent = String(slices.length); }

  function makeSlice(r) {
    var m = sectionMats[slices.length % sectionMats.length];
    var mesh = new T.Mesh(sliceGeo, [rindMat, m, m]);
    mesh.scale.set(1, r, r); mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.rotation.x = Math.random() * 6.28;
    return mesh;
  }

  function cutInstant() {
    var r = placeCap(BX);
    salame.position.x += THICK;
    placeCap(BX);
    var mesh = makeSlice(r), p = landing(slices.length);
    mesh.position.set(p.x, p.y, p.z); mesh.rotation.set(0, p.ry, -Math.PI / 2 + .02, 'YXZ');
    scene.add(mesh); slices.push(mesh); setCount();
    cap.material = sectionMats[slices.length % sectionMats.length];
    if (slices.length >= MAX) resetInstant();
    requestRender();
  }
  function resetInstant() {
    slices.forEach(function (s) { scene.remove(s); }); slices = [];
    salame.position.x = START; placeCap(BX); setCount();
  }

  function cut() {
    if (reduce || !gs) { cutInstant(); return; }
    if (busy) { queue = Math.min(queue + 1, 3); return; }
    busy = true; wake();
    if (slices.length >= MAX) { resetAnimated(); return; }
    // 1) il salame avanza oltre la lama
    var startX = salame.position.x, obj = { x: startX }, separated = false;
    gs.to(obj, {
      x: startX + THICK, duration: .16, ease: 'power2.out',
      onUpdate: function () { salame.position.x = obj.x; placeCap(BX + (obj.x - startX)); },
    });
    // 2) la lama passa
    gs.to(spinner.rotation, { x: '+=' + Math.PI * 3, duration: .55, ease: 'power1.inOut' });
    gs.to(slicer.position, {
      z: 1.75, duration: .3, delay: .16, ease: 'power2.in',
      onUpdate: function () {
        if (!separated && slicer.position.z > -.05) { separated = true; separate(); }
      },
      onComplete: function () {
        gs.to(slicer.position, { z: REST_Z, duration: .45, ease: 'power3.out', onComplete: done });
      },
    });
  }
  function separate() {
    var r = placeCap(BX);
    var mesh = makeSlice(r), i = slices.length, p = landing(i);
    mesh.position.set(BX + THICK / 2, Y0, 0);
    scene.add(mesh); slices.push(mesh); setCount();
    cap.material = sectionMats[slices.length % sectionMats.length];
    var tl = gs.timeline();
    tl.to(mesh.position, { x: BX + .2, duration: .12, ease: 'power1.out' })
      .to(mesh.rotation, { z: -Math.PI / 2 + .02, y: p.ry, x: 0, duration: .55, ease: 'power2.inOut' }, '<')
      .to(mesh.position, { x: p.x, z: p.z, duration: .55, ease: 'power1.inOut' }, '<')
      .to(mesh.position, { y: p.y, duration: .55, ease: 'bounce.out' }, '<');
  }
  function done() {
    busy = false;
    if (queue > 0) { queue--; setTimeout(cut, 60); }
  }
  function resetAnimated() {
    var old = slices; slices = []; setCount();
    old.forEach(function (s, k) {
      gs.to(s.position, { z: 3.2, y: BOARD - .6, duration: .6, delay: k * .02, ease: 'power2.in', onComplete: function () { scene.remove(s); } });
    });
    gs.to(salame.position, { x: START, duration: .9, delay: .3, ease: 'power3.inOut', onUpdate: function () { placeCap(BX); }, onComplete: done });
  }

  /* ---------- rendering su richiesta ---------- */
  var visible = true, running = false, idleUntil = 0, needs = true;
  function requestRender() { needs = true; if (!running) frame(); }
  function wake() { idleUntil = performance.now() + 2500; if (!running && visible) { running = true; requestAnimationFrame(loop); } }
  function frame() {
    if (!reduce) {
      orbit.az += (orbit.taz - orbit.az) * .08; orbit.el += (orbit.tel - orbit.el) * .08;
    }
    placeCamera();
    renderer.render(scene, camera); needs = false;
  }
  function loop(t) {
    if (!visible || document.hidden) { running = false; return; }
    frame();
    if (t < idleUntil || busy) requestAnimationFrame(loop); else running = false;
  }

  /* ---------- interazioni ---------- */
  var down = null, acc = 0;
  stage.addEventListener('pointermove', function (e) {
    var b = stage.getBoundingClientRect();
    if (!reduce) { orbit.taz = ((e.clientX - b.left) / b.width - .5) * .5; orbit.tel = ((e.clientY - b.top) / b.height - .5) * -.18; wake(); }
    if (down && down.id === e.pointerId) {
      var dx = e.clientX - down.x; down.x = e.clientX; down.moved += Math.abs(dx);
      if (dx > 0) { acc += dx; while (acc > 70) { acc -= 70; cut(); } }
    }
  });
  canvas.addEventListener('pointerdown', function (e) { down = { id: e.pointerId, x: e.clientX, moved: 0 }; acc = 0; });
  window.addEventListener('pointerup', function (e) {
    if (down && down.id === e.pointerId && down.moved < 6 && e.target === canvas) cut();
    down = null;
  });
  stage.addEventListener('pointerleave', function () { orbit.taz = 0; orbit.tel = 0; wake(); });
  if (btn) btn.addEventListener('click', cut);

  // scorrimento della colonna: una fetta ogni tratto di pagina
  if (!reduce) {
    var done0 = 0;
    window.addEventListener('scroll', function () {
      var max = document.documentElement.scrollHeight - innerHeight; if (max <= 0) return;
      var target = Math.floor(scrollY / max * 10);
      while (done0 < target) { done0++; cut(); }
    }, { passive: true });
  }

  // pausa fuori schermo
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) wake(); }).observe(stage);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) wake(); });
  window.addEventListener('resize', resize);

  // immagine iniziale: qualche fetta già sul banco
  for (var f = 0; f < 4; f++) cutInstant();
  resize();
  if (!reduce) wake();
})();
