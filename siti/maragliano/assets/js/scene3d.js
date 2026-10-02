/* Scena 3D dell'hero: il burger fotografato, diviso nei suoi strati e "sezionato" (Three.js).
   La foto è scontornata e tagliata in 5 strati (pane sotto, insalata, carne, pomodoro e formaggio,
   pane sopra); le parti nascoste sono ricostruite. Ogni strato è un piano in rilievo
   (mappa di profondità nel vertex shader). All'arrivo gli strati scendono e si compongono,
   con lo scroll il panino si riapre strato per strato.
   - devicePixelRatio max 2, pausa fuori schermo, fallback alla foto statica senza WebGL
   - con prefers-reduced-motion la scena non parte: resta la foto statica */
(function () {
  'use strict';
  var root = document.documentElement;
  var canvas = document.getElementById('burger3d');
  var dati = window.MARA_BURGER;
  if (!canvas) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fallback() { root.classList.add('no-3d'); }
  if (reduce || !window.THREE || !dati || !dati.strati) return fallback();
  var gl = null;
  try { gl = canvas.getContext('webgl2') || canvas.getContext('webgl'); } catch (e) {}
  if (!gl) return fallback();

  var THREE = window.THREE;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, context: gl, antialias: true, alpha: true, premultipliedAlpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  var H = 3, W = H * dati.ratio;   // inquadratura della foto originale, in unità scena
  var APERTURA = 0.4;               // distanza tra gli strati a panino aperto
  // ordine di disegno (dietro → davanti) come nella foto
  var ORDINE = { 'pane-sotto': 0, 'carne': 1, 'condimenti': 2, 'insalata': 3, 'pane-sopra': 4 };

  var vertex = [
    'uniform sampler2D uProf; uniform float uRilievo;',
    'varying vec2 vUv; varying float vZ;',
    'void main(){',
    '  vUv = uv;',
    '  float d = texture2D(uProf, uv).r;',
    '  vZ = d;',
    '  vec3 p = position; p.z += d * uRilievo;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
    '}'
  ].join('\n');
  var fragment = [
    'uniform sampler2D uColore; uniform sampler2D uProf; uniform vec2 uLuce; uniform float uOmbra;',
    'varying vec2 vUv; varying float vZ;',
    'void main(){',
    '  vec4 c = texture2D(uColore, vUv);',
    '  float a = smoothstep(0.25, 0.9, c.a);',
    // le parti ricostruite (nascoste nella foto) compaiono solo mentre il panino si apre
    '  float vis = texture2D(uProf, vUv).g;',
    '  a *= mix(smoothstep(0.2, 0.8, vis), 1.0, smoothstep(0.02, 0.35, uOmbra));',
    '  if (a < 0.02) discard;',
    '  float r = smoothstep(0.35, 1.0, vZ) * (0.05 + 0.05 * dot(normalize(vec2(vUv.x - 0.5, 0.5 - vUv.y) + 0.001), uLuce));',
    // a panino aperto il bordo inferiore di ogni strato si scurisce un po': dà spessore al taglio
    '  float sotto = smoothstep(0.35, 0.0, vUv.y) * uOmbra * 0.25;',
    '  gl_FragColor = vec4(c.rgb * (1.0 - sotto) + r, a);',
    '  #include <colorspace_fragment>',
    '}'
  ].join('\n');

  var loader = new THREE.TextureLoader();
  var daCaricare = dati.strati.length * 2, caricati = 0;
  function caricato() { caricati++; if (caricati === daCaricare) loop(); }

  var burger = new THREE.Group();
  var strati = dati.strati.map(function (s, i) {
    var tc = loader.load(s.colore, caricato); tc.colorSpace = THREE.SRGBColorSpace; tc.anisotropy = 8;
    var tp = loader.load(s.prof, caricato);
    var u = { uColore: { value: tc }, uProf: { value: tp }, uRilievo: { value: 0 }, uLuce: { value: new THREE.Vector2() }, uOmbra: { value: 0 } };
    var m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
    var w = s.w * W, h = s.h * H;
    var seg = Math.round(Math.max(40, 180 * s.w));
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h, seg, Math.max(12, Math.round(seg * h / w))), m);
    mesh.renderOrder = ORDINE[s.nome] != null ? ORDINE[s.nome] : i;
    var g = new THREE.Group();
    g.add(mesh);
    g.userData = {
      base: new THREE.Vector3((s.x + s.w / 2 - 0.5) * W, -(s.y + s.h / 2 - 0.5) * H, s.avanti * 0.02),
      indice: i,               // 0 = pane sotto … 4 = pane sopra
      rilievo: s.rilievo * 0.75,
      u: u
    };
    burger.add(g);
    return g;
  });
  var n = strati.length, centro = (n - 1) / 2;
  scene.add(burger);

  /* ---------- stato ---------- */
  var mx = 0, my = 0, smx = 0, smy = 0;
  var apertura = 1.25;          // ingresso: il panino arriva aperto e si chiude
  var scrollP = 0, tempo = 0;
  var visibile = true, attivo = true;

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // deve entrare anche il panino aperto (altezza circa doppia)
    var t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    var z = Math.max((H * 1.55) / (2 * t), (W * 0.95) / (2 * t * camera.aspect));
    camera.position.set(0, 0, z + 1);
    camera.lookAt(0, 0, 0);
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

  var inLoop = false, t0 = 0, inizio = -1;
  function loop() {
    if (inLoop || caricati < daCaricare) return;
    inLoop = true; t0 = performance.now();
    requestAnimationFrame(frame);
  }
  function frame(now) {
    if (!visibile || !attivo) { inLoop = false; return; }
    var dt = Math.min(0.05, (now - t0) / 1000); t0 = now; tempo += dt;
    if (inizio < 0) inizio = tempo;
    smx += (mx - smx) * Math.min(1, dt * 4);
    smy += (my - smy) * Math.min(1, dt * 4);

    // obiettivo: chiuso all'inizio (dopo l'ingresso), aperto con lo scroll
    var obiettivo = scrollP;
    apertura += (obiettivo - apertura) * Math.min(1, dt * (tempo - inizio < 1.6 ? 2.2 : 6));
    var a = Math.max(0, apertura);

    for (var i = 0; i < n; i++) {
      var g = strati[i], b = g.userData.base, k = g.userData.indice - centro;
      g.position.set(
        b.x,
        b.y + k * a * APERTURA,
        b.z + Math.abs(k) * a * 0.08
      );
      // ogni strato ruota un po' per conto suo: si vede che sono pezzi separati
      g.rotation.set(a * 0.22, a * (i % 2 ? 0.16 : -0.12) * (k / centro || 0.4), a * k * 0.025);
      g.userData.u.uOmbra.value = Math.min(1, a);
      // da chiuso il rilievo è basso, così i tagli combaciano; si gonfia mentre il panino si apre
      g.userData.u.uRilievo.value = g.userData.rilievo * (0.25 + 0.75 * Math.min(1, a));
      g.userData.u.uLuce.value.set(-burger.rotation.y, burger.rotation.x);
    }
    burger.rotation.y = Math.sin(tempo * 0.6) * 0.1 + smx * 0.32 + a * 0.35;
    burger.rotation.x = Math.sin(tempo * 0.45) * 0.03 + smy * 0.12 - a * 0.05;
    var s = 1 - Math.min(1, a) * 0.2;
    burger.scale.set(s, s, s);
    burger.position.y = Math.sin(tempo * 1.1) * 0.03 - Math.min(1, a) * 0.15;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // API per lo scroll (main.js): 0 = panino chiuso, 1 = panino aperto
  window.MaraScene = {
    esplodi: function (p) { scrollP = Math.max(0, Math.min(1, p)); },
    resize: resize,
    apertura: function () { return apertura; }
  };
})();
