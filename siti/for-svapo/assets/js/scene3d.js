/* Flacone 3D — unica scena WebGL del sito.
   Modello: flacone da 60 ml con tappo trasparente allungato, come il "Prime" di Super Flavor
   (foto fornita dal committente). L'etichetta è la foto stessa, srotolata sul cilindro.
   Canvas fisso dietro al contenuto; main.js ne muove lo stato con lo scroll.
   Niente scena con prefers-reduced-motion o senza WebGL: restano le immagini statiche. */
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

  /* ---- luci: controluce pervinca e malva come l'insegna, chiave calda ---- */
  var rim = new T.PointLight(0x8f8cf0, 40, 22); rim.position.set(-2.8, 2, -3); scene.add(rim);
  var rim2 = new T.PointLight(0xd49bc4, 25, 22); rim2.position.set(3, -2, -2.5); scene.add(rim2);
  var key = new T.DirectionalLight(0xfff3e0, 1.5); key.position.set(3, 4, 5); scene.add(key);

  var flacone = new T.Group();
  scene.add(flacone);
  var corpo = new T.Group();          // altezza totale da -3.3 a 5.3, ricentrata
  corpo.position.y = -1;
  flacone.add(corpo);

  function lathe(punti, seg) {
    return new T.LatheGeometry(punti.map(function (q) { return new T.Vector2(q[0], q[1]); }), seg || 96);
  }

  /* ---- corpo in PET trasparente: cilindro alto, senza spalla ---- */
  var vetro = new T.Mesh(lathe([[0.001, -3.3], [0.86, -3.3], [0.97, -3.24], [1.0, -3.1], [1.0, 2.62], [0.98, 2.86], [0.001, 2.86]]),
    new T.MeshPhysicalMaterial({
      color: 0xf4f1ff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.12,
      clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.6, side: T.DoubleSide, depthWrite: false
    }));
  vetro.renderOrder = 2;
  corpo.add(vetro);

  /* ---- tappo trasparente allungato (contagocce) ---- */
  var tappo = new T.Mesh(lathe([[0.001, 2.86], [0.985, 2.86], [0.985, 4.22], [0.93, 4.33], [0.7, 4.53], [0.4, 4.78], [0.24, 5.05], [0.2, 5.28], [0.001, 5.31]]),
    new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.18, metalness: 0, transparent: true, opacity: 0.4, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.8, emissive: 0x2a2838, emissiveIntensity: 0.6, side: T.DoubleSide, depthWrite: false }));
  tappo.renderOrder = 3;
  corpo.add(tappo);
  var anello = new T.Mesh(new T.CylinderGeometry(1.0, 1.0, 0.16, 96), new T.MeshStandardMaterial({ color: 0xdedce6, roughness: 0.4 }));
  anello.position.y = 2.94; corpo.add(anello);

  /* ---- liquido a strati: VG (fondo), PG, aroma ---- */
  var H = 5.5, BASE = -3.24, R = 0.94;
  function strato(colore, opac, emissivo) {
    var m = new T.Mesh(new T.CylinderGeometry(R, R, 1, 72, 1), new T.MeshStandardMaterial({
      color: colore, roughness: 0.15, metalness: 0, transparent: true, opacity: opac,
      emissive: emissivo || 0x000000, emissiveIntensity: emissivo ? 0.9 : 0, depthWrite: false
    }));
    m.renderOrder = 1; m.scale.y = 0.0001; corpo.add(m); return m;
  }
  var sVG = strato(0xf2e2bd, 0.7, 0x5a4a2a);   // glicerina: crema
  var sPG = strato(0xa9a6f0, 0.55, 0x3a3790);  // glicole: pervinca dell'insegna
  var sAR = strato(0xd4962a, 0.92, 0x8a5400);  // aroma tabacco: oro del liquido Prime
  var liv = { vg: 0, pg: 0, ar: 0.33 };
  function applicaLivelli() {
    var y = BASE, h;
    [[sVG, liv.vg], [sPG, liv.pg], [sAR, liv.ar]].forEach(function (s) {
      h = Math.max(0.0001, s[1] * H);
      s[0].scale.y = h; s[0].position.y = y + h / 2; s[0].visible = s[1] > 0.002; y += h;
    });
  }
  applicaLivelli();

  /* ---- etichetta dalla foto: 160° sul fronte, il retro resta trasparente ---- */
  var etMat = new T.MeshStandardMaterial({ color: 0xd8a640, roughness: 0.55, metalness: 0.05, side: T.FrontSide });
  var etichetta = new T.Mesh(new T.CylinderGeometry(1.012, 1.012, 5.08, 96, 1, true, -Math.PI * 80 / 180, Math.PI * 160 / 180), etMat);
  etichetta.position.y = -0.22; etichetta.renderOrder = 3;
  corpo.add(etichetta);
  if (window.ETICHETTA_PRIME) {
    var img = new Image();
    img.onload = function () {
      var tex = new T.Texture(img); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4; tex.needsUpdate = true;
      etMat.map = tex; etMat.color.set(0xffffff); etMat.needsUpdate = true;
    };
    img.src = window.ETICHETTA_PRIME;
  }

  /* ---- vapore: particelle morbide che salgono dal beccuccio ---- */
  var spr = document.createElement('canvas'); spr.width = spr.height = 64;
  var sc = spr.getContext('2d'), g = sc.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.4, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  sc.fillStyle = g; sc.fillRect(0, 0, 64, 64);
  var N = 70, vp = new Float32Array(N * 3), vd = [], i;
  for (i = 0; i < N; i++) { vd.push({ t: Math.random(), s: 0.4 + Math.random() * 0.6, o: Math.random() * 6.28 }); }
  var vGeo = new T.BufferGeometry(); vGeo.setAttribute('position', new T.BufferAttribute(vp, 3));
  var vapore = new T.Points(vGeo, new T.PointsMaterial({
    map: new T.CanvasTexture(spr), size: 1.1, transparent: true, opacity: 0.2, depthWrite: false,
    blending: T.AdditiveBlending, color: 0xd9d6ff
  }));
  vapore.renderOrder = 4;
  corpo.add(vapore);

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

  var clock = new T.Clock(), rot = -0.5, attivo = true;
  document.addEventListener('visibilitychange', function () { attivo = !document.hidden; if (attivo) clock.getDelta(); });

  function frame() {
    requestAnimationFrame(frame);
    var dt = Math.min(clock.getDelta(), 0.05);
    canvas.style.opacity = stato.opac;
    if (!attivo || stato.opac < 0.01) return; // pausa quando la scena è fuori vista
    var t = clock.elapsedTime;
    mouse.x += (mt.x - mouse.x) * 0.05; mouse.y += (mt.y - mouse.y) * 0.05;
    rot += dt * 0.3 * stato.giro;
    // oscilla attorno al fronte: l'etichetta resta leggibile, il retro trasparente mostra il liquido
    flacone.rotation.y = Math.sin(rot) * 1.25 + mouse.x * 0.5;
    flacone.rotation.x = mouse.y * 0.15;
    flacone.rotation.z = stato.inclina + Math.sin(t * 0.6) * 0.025;
    flacone.position.x = stato.x * vw / 2;
    flacone.position.y = stato.y * vh / 2 + Math.sin(t * 0.9) * 0.06;
    flacone.scale.setScalar(stato.s * (vh / 13));
    for (var j = 0; j < N; j++) {
      var q = vd[j]; q.t += dt * 0.12 * q.s; if (q.t > 1) q.t -= 1;
      vp[j * 3] = Math.sin(q.o + q.t * 5 + t * 0.4) * (0.08 + q.t * 0.9);
      vp[j * 3 + 1] = 5.4 + q.t * 3.2;
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
    etichetta: function () {} // l'etichetta è la foto reale: non cambia
  };
  document.dispatchEvent(new CustomEvent('flacone:pronto'));
})();
