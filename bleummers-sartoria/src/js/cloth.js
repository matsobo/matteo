/* Campione di tessuto gessato in 3D (Three.js): reagisce a cursore, dito e scroll */
(function(){
  var box = document.querySelector('.cloth');
  if (!box || !window.THREE) return;
  var T = window.THREE, reduce = window.BL && window.BL.reduce;

  var renderer;
  try {
    renderer = new T.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'high-performance'});
  } catch (e) { return; } /* senza WebGL resta la foto del tessuto */
  if (!renderer.getContext()) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  box.insertBefore(renderer.domElement, box.firstChild);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  box.classList.add('webgl');

  /* ---------- Texture procedurali: lana blu, gessato, bordo dentellato ---------- */
  var S = 1024;
  function cnv(){ var c = document.createElement('canvas'); c.width = c.height = S; return c; }
  var rnd = (function(seed){ return function(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; })(1964);

  var col = cnv(), g = col.getContext('2d');
  g.fillStyle = '#1c3326'; g.fillRect(0, 0, S, S);
  for (var i = -S; i < S * 2; i += 4) { /* armatura diagonale (twill) */
    g.strokeStyle = 'rgba(255,255,255,' + (0.025 + rnd() * 0.03) + ')';
    g.lineWidth = 1.4; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke();
  }
  for (i = 0; i < 9000; i++) { /* fibre di lana */
    var x = rnd() * S, y = rnd() * S, a = rnd() * Math.PI, l = 2 + rnd() * 7;
    g.strokeStyle = rnd() > .5 ? 'rgba(120,160,130,.10)' : 'rgba(4,12,8,.2)';
    g.lineWidth = .8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  for (var sx = 40; sx < S; sx += 72) { /* righe di gesso, tratteggiate come un vero gessato */
    for (var sy = 0; sy < S; sy += 3) {
      g.fillStyle = 'rgba(232,228,218,' + (0.35 + rnd() * 0.35) + ')';
      g.fillRect(sx + (rnd() - .5) * 1.6, sy, 1.6 + rnd() * 1.2, 2);
    }
  }
  var map = new T.CanvasTexture(col);
  map.colorSpace = T.SRGBColorSpace; map.anisotropy = 8;

  var bmp = cnv(), b = bmp.getContext('2d');
  b.fillStyle = '#808080'; b.fillRect(0, 0, S, S);
  for (i = 0; i < 26000; i++) { var v = Math.floor(rnd() * 255); b.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',.35)'; b.fillRect(rnd() * S, rnd() * S, 2, 2); }
  var bump = new T.CanvasTexture(bmp);

  var al = cnv(), c2 = al.getContext('2d'), tooth = 22, m = 26;
  c2.fillStyle = '#000'; c2.fillRect(0, 0, S, S); c2.fillStyle = '#fff'; c2.beginPath();
  var p; /* bordo a zig-zag delle forbici dentellate */
  for (p = m; p <= S - m; p += tooth) c2.lineTo(p, (p / tooth) % 2 < 1 ? m : m + tooth * .55);
  for (p = m; p <= S - m; p += tooth) c2.lineTo((p / tooth) % 2 < 1 ? S - m : S - m - tooth * .55, p);
  for (p = S - m; p >= m; p -= tooth) c2.lineTo(p, (p / tooth) % 2 < 1 ? S - m : S - m - tooth * .55);
  for (p = S - m; p >= m; p -= tooth) c2.lineTo((p / tooth) % 2 < 1 ? m : m + tooth * .55, p);
  c2.closePath(); c2.fill();
  var alpha = new T.CanvasTexture(al);

  /* ---------- Scena ---------- */
  var scene = new T.Scene();
  var cam = new T.PerspectiveCamera(32, 1, .1, 50);
  cam.position.set(0, -.55, 5.4); cam.lookAt(0, 0, 0);
  scene.add(new T.HemisphereLight(0xfff4e2, 0x2a2d40, .9));
  var key = new T.DirectionalLight(0xfff1dc, 2.4);
  key.position.set(-2.2, 2.6, 3.2); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 6;
  key.shadow.camera.left = -3; key.shadow.camera.right = 3; key.shadow.camera.top = 3; key.shadow.camera.bottom = -3;
  scene.add(key);
  var rim = new T.DirectionalLight(0xc8e6d0, .6); rim.position.set(3, -1, -2); scene.add(rim);

  var W = 3.3, Hh = 2.5, SX = 84, SY = 64;
  var geo = new T.PlaneGeometry(W, Hh, SX, SY);
  var pos = geo.attributes.position, base = Float32Array.from(pos.array);
  var mat = new T.MeshStandardMaterial({map: map, bumpMap: bump, bumpScale: .9, alphaMap: alpha, alphaTest: .5, roughness: .92, metalness: 0, side: T.DoubleSide});
  var cloth = new T.Mesh(geo, mat);
  cloth.castShadow = true;
  var group = new T.Group(); group.add(cloth); scene.add(group);
  group.rotation.set(-.42, 0, -.08);

  var table = new T.Mesh(new T.PlaneGeometry(12, 12), new T.ShadowMaterial({opacity: .22}));
  table.position.z = -.32; table.receiveShadow = true; group.add(table);
  var hit = new T.Mesh(new T.PlaneGeometry(W, Hh), new T.MeshStandardMaterial({visible: false}));
  group.add(hit);

  /* ---------- Interazione ---------- */
  var ray = new T.Raycaster(), ndc = new T.Vector2();
  var press = {x: 0, y: 0, k: 0, target: 0}, ripples = [], last = null;
  var tilt = {x: 0, y: 0};
  function local(e){
    var r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    tilt.x = ndc.y; tilt.y = ndc.x;
    ray.setFromCamera(ndc, cam);
    var h = ray.intersectObject(hit)[0];
    return h ? cloth.worldToLocal(h.point.clone()) : null;
  }
  function onMove(e){
    var q = local(e);
    if (!q) { press.target = 0; return; }
    box.classList.add('touched');
    press.x = q.x; press.y = q.y; press.target = 1;
    if (last && !reduce) {
      var sp = Math.hypot(q.x - last.x, q.y - last.y);
      if (sp > .05) { ripples.push({x: q.x, y: q.y, t: clock, a: Math.min(.09, sp * .5)}); if (ripples.length > 10) ripples.shift(); last = q; }
    } else last = q;
    if (reduce) draw(clock);
  }
  var el = renderer.domElement;
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerdown', function(e){ onMove(e); var q = local(e); if (q) ripples.push({x: q.x, y: q.y, t: clock, a: .1}); });
  el.addEventListener('pointerleave', function(){ press.target = 0; last = null; tilt.x = tilt.y = 0; if (reduce) draw(clock); });

  var scrollK = 0;
  window.addEventListener('scroll', function(){
    var r = box.getBoundingClientRect();
    scrollK = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight));
  }, {passive: true});

  /* ---------- Deformazione del tessuto ---------- */
  function shape(t){
    press.k += (press.target - press.k) * .12;
    for (var i = 0, n = pos.count; i < n; i++) {
      var x = base[i * 3], y = base[i * 3 + 1], z = 0;
      z += .07 * Math.sin(x * 1.7 + t * .55) * Math.cos(y * 1.3 + t * .4);   /* drappeggio morbido */
      z += .045 * Math.sin((x + y) * 2.6 + t * .8);
      z += .2 * Math.exp(-Math.pow(x - y * .45 - .35, 2) * 5);             /* piega diagonale */
      var cx = Math.max(0, x / (W / 2)), cy = Math.max(0, y / (Hh / 2));
      z += .42 * Math.pow(cx, 3) * Math.pow(cy, 2);                         /* angolo che si solleva */
      if (press.k > .01) {
        var d2 = (x - press.x) * (x - press.x) + (y - press.y) * (y - press.y);
        z -= .16 * press.k * Math.exp(-d2 / .09);                             /* pressione del dito */
        z += .05 * press.k * Math.exp(-Math.pow(Math.sqrt(d2) - .45, 2) / .02);
      }
      for (var j = 0; j < ripples.length; j++) {
        var rp = ripples[j], age = t - rp.t, d = Math.hypot(x - rp.x, y - rp.y);
        z += rp.a * Math.exp(-age * 1.5) * Math.sin(11 * d - 9 * age) * Math.exp(-Math.pow(d - age * .9, 2) * 6);
      }
      pos.array[i * 3 + 2] = z;
    }
    ripples = ripples.filter(function(r){ return t - r.t < 3; });
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  function resize(){
    var w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    cam.position.z = w / h < 1.1 ? 6.4 : 5.4;
  }
  var clock = 0, prev = performance.now(), running = false, visible = true;
  function draw(t){
    shape(t);
    group.rotation.x += ((-.42 + scrollK * .22 + tilt.x * .08) - group.rotation.x) * .08;
    group.rotation.y += ((tilt.y * .14) - group.rotation.y) * .08;
    renderer.render(scene, cam);
  }
  function loop(now){
    if (!running) return;
    clock += Math.min(.05, (now - prev) / 1000); prev = now;
    draw(clock);
    requestAnimationFrame(loop);
  }
  function start(){ if (running || reduce) return; running = true; prev = performance.now(); requestAnimationFrame(loop); }
  function stop(){ running = false; }
  resize(); if (box.clientWidth) draw(0);
  document.addEventListener('bl:view', function(e){ if (e.detail === 'bottega') { resize(); draw(clock); } });
  window.addEventListener('resize', function(){ resize(); draw(clock); });
  new IntersectionObserver(function(es){ visible = es[0].isIntersecting; visible && !document.hidden ? start() : stop(); }).observe(box);
  document.addEventListener('visibilitychange', function(){ !document.hidden && visible ? start() : stop(); });
})();
