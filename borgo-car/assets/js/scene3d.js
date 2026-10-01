/* Banco di prova: pannello porta con bozza, letto sotto la luce a strisce.
   Il cursore sposta le lampade (rotazione dell'ambiente), il selettore porta il pannello
   da "Bozza" a "Vernice". Nessuna immagine esterna: tutto è generato qui. */
(function () {
  var canvas = document.getElementById('panel3d');
  if (!canvas) return;
  var root = document.documentElement;
  var stage = document.getElementById('benchStage');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var T = window.THREE;
  var renderer;
  try { renderer = T && new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'low-power' }); } catch (e) { renderer = null; }
  if (!renderer) { root.classList.add('no-webgl'); return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.setClearColor(0x1b1c1d, 1);

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(28, 1, 0.1, 50);

  /* ---- ambiente: cabina con tubi luminosi verticali (equirettangolare su canvas) ---- */
  function envCanvas() {
    var c = document.createElement('canvas'); c.width = 2048; c.height = 1024;
    var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0, '#141516'); g.addColorStop(0.46, '#0c0c0d'); g.addColorStop(0.5, '#2a2926'); g.addColorStop(1, '#1a1917');
    x.fillStyle = g; x.fillRect(0, 0, 2048, 1024);
    for (var i = 0; i < 16; i++) {
      var px = 64 + i * 128, w = (i % 3 === 0) ? 34 : 24;
      var lg = x.createLinearGradient(px - w, 0, px + w, 0);
      lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.35, 'rgba(255,255,255,.95)');
      lg.addColorStop(0.65, 'rgba(255,255,255,.95)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = lg; x.fillRect(px - w, 60, w * 2, 860);
    }
    /* portone dell'officina: luce calda a un lato */
    var wg = x.createRadialGradient(1500, 520, 20, 1500, 520, 260);
    wg.addColorStop(0, 'rgba(255,214,160,.55)'); wg.addColorStop(1, 'rgba(255,214,160,0)');
    x.fillStyle = wg; x.fillRect(1200, 220, 600, 600);
    var t = new T.CanvasTexture(c);
    t.mapping = T.EquirectangularReflectionMapping; t.colorSpace = T.SRGBColorSpace;
    return t;
  }
  var pmrem = new T.PMREMGenerator(renderer);
  var envTex = envCanvas();
  scene.environment = pmrem.fromEquirectangular(envTex).texture;
  envTex.dispose();
  var hasEnvRot = 'environmentRotation' in scene;

  /* ---- geometria del pannello ---- */
  var W = 4.2, H = 2.6, SX = 210, SY = 130;
  var geo = new T.PlaneGeometry(W, H, SX, SY);
  var pos = geo.attributes.position;
  var N = pos.count;
  var bx = new Float32Array(N), by = new Float32Array(N), bz = new Float32Array(N);
  var DX = -0.55, DY = -0.32;            // centro della bozza
  function sig(v) { return 1 / (1 + Math.exp(-v)); }
  for (var i = 0; i < N; i++) {
    var x = pos.getX(i), y = pos.getY(i);
    var z = -0.075 * x * x - 0.06 * y * y;                     // bombatura della porta
    z += 0.05 * sig((y - 0.46) / 0.04);                        // linea di carattere
    z -= 0.02 * Math.exp(-Math.pow((x - 1.62) / 0.035, 2));    // battuta porta
    bx[i] = x; by[i] = y; bz[i] = z;
  }
  var colors = new Float32Array(N * 3);
  geo.setAttribute('color', new T.BufferAttribute(colors, 3));

  /* mappe di ruvidità e trasparente (verde = roughness, rosso = clearcoat) */
  var MW = 256, MH = Math.round(256 * H / W);
  var mc = document.createElement('canvas'); mc.width = MW; mc.height = MH;
  var mx = mc.getContext('2d');
  var mapTex = new T.CanvasTexture(mc);
  var cu = (DX + W / 2) / W, cv = (DY + H / 2) / H;

  var mat = new T.MeshPhysicalMaterial({
    vertexColors: true, metalness: 0.45, roughness: 1, roughnessMap: mapTex,
    clearcoat: 1, clearcoatRoughness: 0.035, clearcoatMap: mapTex, envMapIntensity: 1.15
  });
  var panel = new T.Mesh(geo, mat);
  var group = new T.Group(); group.add(panel); scene.add(group);

  var lamp = new T.DirectionalLight(0xffffff, 1.1);
  lamp.position.set(1, 1, 3); scene.add(lamp);
  scene.add(new T.AmbientLight(0xffffff, 0.08));

  /* ---- stato ---- */
  var paint = new T.Color('#1d3557'), paintTarget = paint.clone();
  var primer = new T.Color('#8c8d89'), metal = new T.Color('#7d7c78'), gap = new T.Color('#050505');
  var tmp = new T.Color();
  var tCur = -1, tTarget = 0;
  var px = 0, py = 0, pxT = 0, pyT = 0, idle = !reduce, idleT = 0;
  var visible = true, dirty = true;

  function sm(a, b, v) { var k = Math.min(1, Math.max(0, (v - a) / (b - a))); return k * k * (3 - 2 * k); }

  function build(t) {
    var dent = 1 - sm(0.04, 0.42, t);
    var prim = sm(0.18, 0.36, t) * (1 - sm(0.64, 0.94, t));
    for (var i = 0; i < N; i++) {
      var x = bx[i], y = by[i], ddx = x - DX, ddy = y - DY, r2 = ddx * ddx + ddy * ddy;
      var ang = Math.atan2(ddy, ddx);
      var d = 0;
      if (dent > 0) {
        d = 0.13 * Math.exp(-r2 / 0.16) * (1 + 0.12 * Math.sin(ang * 3 + 0.6) * Math.exp(-r2 / 0.08));
        var ln = (ddy - 0.42 * ddx);                                  // piega diagonale
        d += 0.028 * Math.exp(-(ln * ln) / 0.0025) * Math.exp(-r2 / 0.35);
        d *= dent;
      }
      pos.setZ(i, bz[i] - d);
      /* colore: vernice / fondo sulla zona riparata / lamiera scoperta nella strisciata */
      var rr = Math.sqrt(r2) + 0.03 * Math.sin(ang * 4);
      var patch = sm(0.78, 0.5, rr);
      tmp.copy(paint).lerp(primer, patch * prim);
      var scrape = dent * Math.exp(-Math.pow((ddy - 0.42 * ddx) / 0.03, 2)) * Math.exp(-r2 / 0.08);
      tmp.lerp(metal, Math.min(0.85, scrape));
      var seam = Math.exp(-Math.pow((x - 1.62) / 0.022, 2));
      tmp.lerp(gap, seam * 0.9);
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    pos.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    geo.computeVertexNormals();

    /* mappa: fondo opaco (ruvido, senza trasparente) dove c'è il primer */
    mx.fillStyle = 'rgb(255,56,0)'; mx.fillRect(0, 0, MW, MH);   // R=clearcoat 1, G=roughness .22
    if (prim > 0.01) {
      var gx = cu * MW, gy = (1 - cv) * MH, R = MW * (0.7 / W);
      var rg = mx.createRadialGradient(gx, gy, R * 0.55, gx, gy, R * 1.05);
      var cc = Math.round(255 * (1 - prim * 0.95));
      var ro = Math.round(56 + (230 - 56) * prim);
      rg.addColorStop(0, 'rgb(' + cc + ',' + ro + ',0)'); rg.addColorStop(1, 'rgb(255,56,0)');
      mx.fillStyle = rg; mx.fillRect(0, 0, MW, MH);
    }
    mapTex.needsUpdate = true;
  }

  function fit() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    var tanH = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    var needH = (H * 0.86) / (2 * tanH), needW = (W * 0.8) / (2 * tanH * camera.aspect);
    camera.position.set(0, 0, Math.min(needH, needW) + 0.3);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    dirty = true;
  }

  /* ---- interazione: la lampada segue il puntatore ---- */
  var dot = document.getElementById('lampDot');
  function onPoint(e) {
    var r = stage.getBoundingClientRect();
    var cx = (e.clientX - r.left) / r.width, cy = (e.clientY - r.top) / r.height;
    pxT = cx * 2 - 1; pyT = -(cy * 2 - 1); idle = false;
    if (dot) { dot.style.left = (cx * 100) + '%'; dot.style.top = (cy * 100) + '%'; }
    if (reduce) { px = pxT; py = pyT; dirty = true; }
  }
  stage.addEventListener('pointermove', onPoint);
  stage.addEventListener('pointerdown', onPoint);

  /* ---- controlli: fasi, cursore, tinte ---- */
  var range = document.getElementById('repair');
  var out = document.getElementById('stageOut');
  var steps = [].slice.call(document.querySelectorAll('.steps button'));
  var TXT = [
    'Bozza: la lamiera è deformata. Sotto la luce a strisce le linee si spezzano, ed è così che si legge un danno.',
    'Lattoneria: la lamiera torna in forma, poi stucco e carteggiatura. Le strisce cominciano a raddrizzarsi.',
    'Fondo: il primer grigio isola il metallo e prepara la superficie alla vernice.',
    'Vernice e trasparente: le strisce di luce tornano dritte e continue. Il pannello è a posto.'
  ];
  var lastStage = 0;
  function stageOf(t) { return t < 0.2 ? 0 : t < 0.46 ? 1 : t < 0.78 ? 2 : 3; }
  function setT(t, fromRange) {
    tTarget = Math.max(0, Math.min(1, t));
    if (!fromRange && range) range.value = Math.round(tTarget * 100);
    var s = stageOf(tTarget);
    steps.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === s)); });
    if (s !== lastStage && out) { out.textContent = TXT[s]; lastStage = s; }
    if (reduce) { tCur = tTarget; build(tCur); dirty = true; }
  }
  if (range) range.addEventListener('input', function () { setT(range.value / 100, true); });
  steps.forEach(function (b) { b.addEventListener('click', function () { setT(parseFloat(b.dataset.t)); }); });
  [].slice.call(document.querySelectorAll('.chip')).forEach(function (c) {
    c.addEventListener('click', function () {
      document.querySelectorAll('.chip').forEach(function (o) { o.setAttribute('aria-pressed', String(o === c)); });
      paintTarget.set(c.dataset.paint);
      if (reduce) { paint.copy(paintTarget); build(tCur); dirty = true; }
      if (tTarget < 0.78) setT(1);   // scegliere la tinta porta alla fase vernice
    });
  });

  /* ---- ciclo di render: solo se visibile e solo se qualcosa cambia ---- */
  var io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) loop(); }, { threshold: 0.01 });
  io.observe(stage);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stage); else addEventListener('resize', fit);

  var raf = 0;
  function loop() {
    if (raf || !visible) return;
    raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    raf = 0;
    var moving = false;
    if (!reduce) {
      if (idle) { idleT = now * 0.00018; pxT = Math.sin(idleT) * 0.55; pyT = Math.cos(idleT * 0.7) * 0.2; }
      var k = 0.08;
      px += (pxT - px) * k; py += (pyT - py) * k;
      if (Math.abs(pxT - px) > 0.0005 || Math.abs(pyT - py) > 0.0005 || idle) moving = true;
      if (Math.abs(tTarget - tCur) > 0.002) { tCur += (tTarget - tCur) * 0.14; build(tCur); moving = true; }
      else if (tCur !== tTarget) { tCur = tTarget; build(tCur); moving = true; }
      if (!paint.equals(paintTarget)) {
        paint.lerp(paintTarget, 0.12);
        if (Math.abs(paint.r - paintTarget.r) + Math.abs(paint.g - paintTarget.g) + Math.abs(paint.b - paintTarget.b) < 0.004) paint.copy(paintTarget);
        build(tCur); moving = true;
      }
    } else if (tCur < 0) { tCur = tTarget; build(tCur); }
    var rotEnv = 0.6 + px * 0.9;
    if (hasEnvRot) { scene.environmentRotation.y = rotEnv; } else { group.rotation.y = px * 0.25; }
    group.rotation.x = -0.05 - py * (reduce ? 0 : 0.1);
    group.rotation.y = (hasEnvRot ? 0 : px * 0.25) + px * (reduce ? 0 : 0.12) - 0.12;
    lamp.position.set(px * 3, py * 2 + 0.6, 3);
    if (moving || dirty) { renderer.render(scene, camera); dirty = false; }
    if (moving || dirty || idle) loop();
  }

  fit(); build(0); tCur = 0;
  /* mantiene vivo il ciclo quando l'utente interagisce */
  ['pointermove', 'pointerdown', 'input', 'click'].forEach(function (ev) {
    (ev === 'input' || ev === 'click' ? document : stage).addEventListener(ev, function () { dirty = true; loop(); });
  });
  loop();
})();
