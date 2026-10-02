/* Scena 3D dell'hero: il burger fotografato, scontornato e messo in rilievo (Three.js).
   Tecnica: piano suddiviso + mappa di profondità ricavata dalla foto (displacement nel vertex shader).
   Il burger ruota con il mouse e con lo scroll; la luce della foto resta quella originale.
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
  if (reduce || !window.THREE || !dati) return fallback();
  var gl = null;
  try { gl = canvas.getContext('webgl2') || canvas.getContext('webgl'); } catch (e) {}
  if (!gl) return fallback();

  var THREE = window.THREE;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, context: gl, antialias: true, alpha: true, premultipliedAlpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  var H = 3, W = H * dati.ratio;           // dimensioni del piano in unità scena
  var RILIEVO = 0.9;                        // profondità massima del rilievo

  var loader = new THREE.TextureLoader();
  var texColore = loader.load(dati.color, function () { pronto(); });
  texColore.colorSpace = THREE.SRGBColorSpace;
  texColore.anisotropy = 8;
  var texProf = loader.load(dati.depth, function () { pronto(); });

  var uniforms = {
    uColore: { value: texColore },
    uProf: { value: texProf },
    uRilievo: { value: RILIEVO },
    uLuce: { value: new THREE.Vector2(0, 0) }
  };
  var materiale = new THREE.ShaderMaterial({
    uniforms: uniforms,
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader: [
      'uniform sampler2D uProf; uniform float uRilievo;',
      'varying vec2 vUv; varying float vZ;',
      'void main(){',
      '  vUv = uv;',
      '  float d = texture2D(uProf, uv).r;',
      '  vZ = d;',
      '  vec3 p = position; p.z += d * uRilievo;',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D uColore; uniform vec2 uLuce;',
      'varying vec2 vUv; varying float vZ;',
      'void main(){',
      '  vec4 c = texture2D(uColore, vUv);',
      '  float a = smoothstep(0.3, 0.9, c.a);',   // erode il bordo chiaro dello scontorno
      '  if (a < 0.02) discard;',
      // leggero riflesso che segue il movimento: rende percepibile il volume
      '  float r = smoothstep(0.35, 1.0, vZ) * (0.06 + 0.05 * dot(normalize(vec2(vUv.x - 0.5, 0.5 - vUv.y) + 0.001), uLuce));',
      '  gl_FragColor = vec4(c.rgb + r, a);',
      '  #include <colorspace_fragment>',
      '}'
    ].join('\n')
  });
  var piano = new THREE.Mesh(new THREE.PlaneGeometry(W, H, 260, Math.round(260 / dati.ratio)), materiale);
  piano.position.z = -RILIEVO * 0.45;       // centra il volume sull'asse di rotazione
  var burger = new THREE.Group();
  burger.add(piano);
  scene.add(burger);

  /* ---------- stato ---------- */
  var mx = 0, my = 0, smx = 0, smy = 0, scrollP = 0, intro = 0, caricati = 0;
  var visibile = true, attivo = true;

  function pronto() { caricati++; if (caricati === 2) loop(); }

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // il burger deve stare nel canvas sia in larghezza sia in altezza
    var t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    var z = Math.max((H * 0.95) / (2 * t), (W * 0.98) / (2 * t * camera.aspect));
    camera.position.set(0, 0, z + RILIEVO);
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

  var inLoop = false, t0 = performance.now(), tempo = 0;
  function loop() {
    if (inLoop || caricati < 2) return;
    inLoop = true; t0 = performance.now();
    requestAnimationFrame(frame);
  }
  function frame(now) {
    if (!visibile || !attivo) { inLoop = false; return; }
    var dt = Math.min(0.05, (now - t0) / 1000); t0 = now; tempo += dt;
    intro = Math.min(1, intro + dt * 0.8);
    var e = 1 - Math.pow(1 - intro, 3);
    smx += (mx - smx) * Math.min(1, dt * 4);
    smy += (my - smy) * Math.min(1, dt * 4);
    // ingresso: arriva ruotato e piccolo · poi oscilla piano e segue il mouse · con lo scroll gira e scende
    burger.rotation.y = (1 - e) * -0.9 + Math.sin(tempo * 0.6) * 0.12 + smx * 0.38 + scrollP * 0.7;
    burger.rotation.x = Math.sin(tempo * 0.45) * 0.04 + smy * 0.14 + scrollP * 0.35;
    var s = 0.82 + 0.18 * e - scrollP * 0.12;
    burger.scale.set(s, s, s);
    burger.position.y = Math.sin(tempo * 1.1) * 0.04 - scrollP * 0.6;
    uniforms.uLuce.value.set(-burger.rotation.y, burger.rotation.x);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // API per lo scroll (main.js): 0 = inizio hero, 1 = hero uscito
  window.MaraScene = {
    esplodi: function (p) { scrollP = Math.max(0, Math.min(1, p)); },
    resize: resize
  };
})();
