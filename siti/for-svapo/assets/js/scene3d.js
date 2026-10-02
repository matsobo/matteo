/* Flacone 3D — unica scena WebGL del sito.
   Canvas fisso dietro al contenuto; main.js ne muove lo stato con lo scroll.
   Niente scena con prefers-reduced-motion o senza WebGL: restano le illustrazioni statiche. */
(function () {
  'use strict';
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.getElementById('flacone');
  if (rm || !canvas || !window.THREE) return;
  try {
    var test = document.createElement('canvas');
    if (!(test.getContext('webgl2') || test.getContext('webgl'))) return;
  } catch (e) { return; }

  var T = window.THREE;
  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = T.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = T.SRGBColorSpace;

  var scene = new T.Scene();
  var pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new T.RoomEnvironment(), 0.04).texture;

  var camera = new T.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0.2, 14);

  /* ---- luci: un controluce ambra, come una resistenza accesa ---- */
  var rim = new T.PointLight(0xff8a3d, 30, 20); rim.position.set(-2.5, 1.5, -3); scene.add(rim);
  var key = new T.DirectionalLight(0xffffff, 1.4); key.position.set(3, 4, 5); scene.add(key);

  var flacone = new T.Group();
  scene.add(flacone);

  /* ---- vetro: profilo ruotato (LatheGeometry) ---- */
  var p = [];
  function pt(r, y) { p.push(new T.Vector2(r, y)); }
  pt(0.001, -2.0); pt(0.82, -2.0); pt(0.95, -1.95); pt(1.0, -1.82);
  pt(1.0, 0.95); pt(0.97, 1.15); pt(0.85, 1.38); pt(0.62, 1.55); pt(0.46, 1.66); pt(0.44, 1.78); pt(0.44, 1.95);
  var vetroGeo = new T.LatheGeometry(p, 96);
  var vetro = new T.Mesh(vetroGeo, new T.MeshPhysicalMaterial({
    color: 0xeaf6f1, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.1,
    clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.6, side: T.DoubleSide, depthWrite: false
  }));
  vetro.renderOrder = 2;
  flacone.add(vetro);

  /* ---- tappo zigrinato ---- */
  var tappoGeo = new T.CylinderGeometry(0.56, 0.56, 0.95, 96, 1);
  var pos = tappoGeo.attributes.position;
  for (var i = 0; i < pos.count; i++) {
    var x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z);
    if (r > 0.3) {
      var a = Math.atan2(z, x), k = 1 + 0.035 * (Math.sin(a * 36) > 0 ? 1 : 0);
      pos.setX(i, x * k); pos.setZ(i, z * k);
    }
  }
  tappoGeo.computeVertexNormals();
  var tappo = new T.Mesh(tappoGeo, new T.MeshStandardMaterial({ color: 0x141c1f, roughness: 0.45, metalness: 0.2 }));
  tappo.position.y = 2.4;
  flacone.add(tappo);

  /* ---- becco contagocce ---- */
  var becco = new T.Mesh(new T.CylinderGeometry(0.1, 0.3, 1.0, 48), new T.MeshPhysicalMaterial({ color: 0xe6ece8, roughness: 0.35, transmission: 0, clearcoat: .6 }));
  becco.position.y = 3.37;
  flacone.add(becco);

  /* ---- liquido a strati: VG (fondo), PG, aroma ---- */
  var H = 2.62, BASE = -1.92, R = 0.93;
  function strato(colore, opac, emissivo) {
    var m = new T.Mesh(new T.CylinderGeometry(R, R, 1, 72, 1), new T.MeshStandardMaterial({
      color: colore, roughness: 0.15, metalness: 0, transparent: true, opacity: opac,
      emissive: emissivo || 0x000000, emissiveIntensity: emissivo ? 0.9 : 0, depthWrite: false
    }));
    m.renderOrder = 1; m.scale.y = 0.0001; flacone.add(m); return m;
  }
  var sVG = strato(0xffa24d, 0.78, 0x8a3a00);
  var sPG = strato(0x9ff0d2, 0.6, 0x2f8f6e);
  var sAR = strato(0xff6a1a, 0.92, 0xff4a00);
  var liv = { vg: 0.36, pg: 0.34, ar: 0.1 };
  function applicaLivelli() {
    var y = BASE, h;
    [[sVG, liv.vg], [sPG, liv.pg], [sAR, liv.ar]].forEach(function (s) {
      h = Math.max(0.0001, s[1] * H);
      s[0].scale.y = h; s[0].position.y = y + h / 2; s[0].visible = s[1] > 0.002; y += h;
    });
  }
  applicaLivelli();

  /* ---- etichetta: arco di cilindro con texture disegnata ---- */
  var etCanvas = document.createElement('canvas'); etCanvas.width = 1024; etCanvas.height = 420;
  var etCtx = etCanvas.getContext('2d');
  var etTex = new T.CanvasTexture(etCanvas); etTex.colorSpace = T.SRGBColorSpace; etTex.anisotropy = 4;
  var etichetta = new T.Mesh(
    new T.CylinderGeometry(1.012, 1.012, 1.0, 96, 1, true, -Math.PI * 0.58, Math.PI * 1.16),
    new T.MeshStandardMaterial({ map: etTex, roughness: 0.6, transparent: true, side: T.FrontSide })
  );
  etichetta.position.y = -0.15; etichetta.renderOrder = 3;
  flacone.add(etichetta);
  var fontOk = false;
  function disegnaEtichetta(r1, r2, r3) {
    var c = etCtx, w = etCanvas.width, h = etCanvas.height;
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#e6ece8'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ff8a3d'; c.fillRect(0, 0, w, 26); c.fillRect(0, h - 14, w, 14);
    c.fillStyle = '#0b1113'; c.textAlign = 'center';
    var d = fontOk ? '"Big Shoulders"' : '"Arial Narrow", Arial';
    c.font = '900 150px ' + d; c.fillText('FOR SVAPO', w / 2, 190);
    c.font = '800 66px ' + d; c.fillText(r1 || 'PG 50 · VG 50', w / 2, 278);
    c.font = '700 44px Atkinson, Arial'; c.fillText(r2 || '10 ml · base neutra', w / 2, 346);
    if (r3) { c.font = '700 30px Atkinson, Arial'; c.fillText(r3, w / 2, 392); }
    etTex.needsUpdate = true;
  }
  var etArgs = [];
  disegnaEtichetta();
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('900 150px "Big Shoulders"'), document.fonts.load('700 44px Atkinson')])
      .then(function () { fontOk = true; disegnaEtichetta.apply(null, etArgs); }).catch(function () {});
  }

  /* ---- vapore: particelle morbide che salgono dal becco ---- */
  var spr = document.createElement('canvas'); spr.width = spr.height = 64;
  var sc = spr.getContext('2d'), g = sc.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.4, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  sc.fillStyle = g; sc.fillRect(0, 0, 64, 64);
  var N = 70, vp = new Float32Array(N * 3), vd = [];
  for (i = 0; i < N; i++) { vd.push({ t: Math.random(), s: 0.4 + Math.random() * 0.6, o: Math.random() * 6.28 }); }
  var vGeo = new T.BufferGeometry(); vGeo.setAttribute('position', new T.BufferAttribute(vp, 3));
  var vapore = new T.Points(vGeo, new T.PointsMaterial({
    map: new T.CanvasTexture(spr), size: 0.9, transparent: true, opacity: 0.22, depthWrite: false,
    blending: T.AdditiveBlending, color: 0xffd9bf
  }));
  vapore.renderOrder = 4;
  flacone.add(vapore);

  /* ---- stato pilotato dallo scroll (main.js) ---- */
  var stato = { x: 0.45, y: -0.02, s: 1, giro: 1, opac: 1, inclina: 0 };
  var mouse = { x: 0, y: 0 }, mt = { x: 0, y: 0 };
  window.addEventListener('pointermove', function (e) {
    mt.x = (e.clientX / window.innerWidth - 0.5); mt.y = (e.clientY / window.innerHeight - 0.5);
  }, { passive: true });

  var vw = 1, vh = 1;
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 900 ? 17 : 14;
    camera.updateProjectionMatrix();
    vh = 2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    vw = vh * camera.aspect;
  }
  window.addEventListener('resize', resize);
  resize();

  var clock = new T.Clock(), rot = 0, attivo = true;
  document.addEventListener('visibilitychange', function () { attivo = !document.hidden; if (attivo) clock.getDelta(); });

  function frame() {
    requestAnimationFrame(frame);
    var dt = Math.min(clock.getDelta(), 0.05);
    canvas.style.opacity = stato.opac;
    if (!attivo || stato.opac < 0.01) return; // pausa quando la scena è fuori vista
    var t = clock.elapsedTime;
    mouse.x += (mt.x - mouse.x) * 0.05; mouse.y += (mt.y - mouse.y) * 0.05;
    rot += dt * 0.35 * stato.giro;
    flacone.rotation.y = rot + mouse.x * 0.5;
    flacone.rotation.x = mouse.y * 0.18;
    flacone.rotation.z = stato.inclina + Math.sin(t * 0.6) * 0.03;
    flacone.position.x = stato.x * vw / 2;
    flacone.position.y = stato.y * vh / 2 + Math.sin(t * 0.9) * 0.06;
    flacone.scale.setScalar(stato.s * (vh / 9.5));
    // vapore
    for (var j = 0; j < N; j++) {
      var q = vd[j]; q.t += dt * 0.12 * q.s; if (q.t > 1) q.t -= 1;
      vp[j * 3] = Math.sin(q.o + q.t * 5 + t * 0.4) * (0.08 + q.t * 0.9);
      vp[j * 3 + 1] = 3.9 + q.t * 3.2;
      vp[j * 3 + 2] = Math.cos(q.o + q.t * 4) * (0.08 + q.t * 0.6);
    }
    vGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }

  document.documentElement.classList.add('has3d');
  requestAnimationFrame(frame);

  window.Flacone = {
    stato: stato,
    livelli: function (o, dur) {
      var dest = { vg: o.vg, pg: o.pg, ar: o.ar };
      if (window.gsap && dur !== 0) {
        window.gsap.to(liv, Object.assign({ duration: dur || 0.8, ease: 'power2.out', overwrite: true, onUpdate: applicaLivelli }, dest));
      } else { Object.assign(liv, dest); applicaLivelli(); }
    },
    etichetta: function (r1, r2, r3) { etArgs = [r1, r2, r3]; disegnaEtichetta(r1, r2, r3); }
  };
  document.dispatchEvent(new CustomEvent('flacone:pronto'));
})();
