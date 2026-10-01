/* Peonia 3D da foto reali: tre scatti della stessa varietà (boccio -> aperta -> piena fioritura)
   montati su superfici con mappa di profondità. Ruota col puntatore, sboccia con lo scroll.
   Sorgente: si compila in assets/js/scene3d.js con esbuild (vedi README). */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, PlaneGeometry, ShaderMaterial, Texture,
  LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace, NoColorSpace
} from 'three';

const VERT = `
uniform sampler2D uDepth; uniform float uAmp; uniform float uTime; uniform float uSway;
varying vec2 vUv; varying float vD;
void main(){
  vUv = uv;
  float d = texture2D(uDepth, uv).r;
  vD = d;
  vec3 p = position;
  p.z += d * uAmp;
  float head = smoothstep(0.45, 1.0, uv.y);           // la corolla oscilla, lo stelo no
  p.x += sin(uTime * 0.9) * uSway * head * head;
  p.z += cos(uTime * 0.7) * uSway * 0.6 * head;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const FRAG = `
uniform sampler2D uMap; uniform sampler2D uShade; uniform float uOpacity; uniform float uShadow;
varying vec2 vUv; varying float vD;
void main(){
  if (uShadow > 0.5) {                                   // ombra morbida: mipmap sfocata
    float a = texture2D(uShade, vUv).r * 0.2 * uOpacity;
    gl_FragColor = vec4(vec3(0.16, 0.10, 0.08) * a, a);   // alfa premoltiplicato
    return;
  }
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.04) discard;
  c.rgb *= 0.9 + 0.16 * vD;                              // leggero volume dalla profondità
  gl_FragColor = vec4(c.rgb, 1.0);
  #include <colorspace_fragment>
  float a = c.a * uOpacity;
  gl_FragColor = vec4(gl_FragColor.rgb * a, a);          // alfa premoltiplicato
}`;

function texFrom(img, srgb) {
  const t = new Texture(img);
  t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  t.minFilter = LinearMipmapLinearFilter; t.magFilter = LinearFilter;
  t.needsUpdate = true;
  return t;
}
function loaded(img) {
  return img.complete && img.naturalWidth ? Promise.resolve(img)
    : new Promise((res, rej) => { img.addEventListener('load', () => res(img), { once: true }); img.addEventListener('error', rej, { once: true }); });
}
function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

/* fallback senza WebGL: foto in dissolvenza con profondità CSS */
function cssBloom(photos, stage) {
  let open = 0, px = 0, py = 0;
  function draw() {
    const t = open * (photos.length - 1);
    photos.forEach((im, i) => { im.style.opacity = Math.max(0, 1 - Math.abs(t - i)); });
    stage.style.transform = 'perspective(1200px) rotateY(' + (px * 6) + 'deg) rotateX(' + (-py * 4) + 'deg)';
  }
  draw();
  return { setOpen(v) { open = Math.max(0, Math.min(1, v)); draw(); }, pointer(x, y) { px = x; py = y; draw(); } };
}

function init(canvas, opts) {
  opts = opts || {};
  const stage = canvas.parentElement;
  const photos = Array.prototype.slice.call(stage.querySelectorAll('.bloom-photos img'));
  const fallback = cssBloom(photos, stage.querySelector('.bloom-photos'));
  // da file:// il browser non concede le foto a WebGL: resta la versione CSS
  const blocked = location.protocol === 'file:' && photos.some(p => !/^data:/.test(p.currentSrc || p.src));
  let renderer = null;
  if (!blocked) {
    try { renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { renderer = null; }
    if (renderer && !renderer.getContext()) renderer = null;
  }
  if (!renderer) return fallback;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  const tilt = new Group(); scene.add(tilt);
  const layers = [];
  let open = opts.open != null ? opts.open : 0, target = open, px = 0, py = 0, tx = 0, ty = 0, time = 0, ready = false;

  const src = k => (window.__PI_IMG && window.__PI_IMG[k]) || k;
  Promise.all(photos.map(p => Promise.all([loaded(p), loadImg(src(p.dataset.depth)), loadImg(src(p.dataset.shade))])))
    .then(pairs => {
      pairs.forEach(([img, dimg, simg], i) => {
        const h = 3.2, w = h * img.naturalWidth / img.naturalHeight;
        const geo = new PlaneGeometry(w, h, 150, 180);
        const uniforms = {
          uMap: { value: texFrom(img, true) }, uDepth: { value: texFrom(dimg, false) }, uShade: { value: texFrom(simg, false) },
          uAmp: { value: 0.55 }, uTime: { value: 0 }, uSway: { value: opts.still ? 0 : 0.035 },
          uOpacity: { value: i === 0 ? 1 : 0 }, uShadow: { value: 0 }
        };
        const mat = new ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true });
        const mesh = new Mesh(geo, mat); mesh.renderOrder = 10 + i;
        const shU = Object.assign({}, uniforms, { uShadow: { value: 1 }, uAmp: { value: 0 }, uOpacity: { value: uniforms.uOpacity.value } });
        const shadow = new Mesh(geo, new ShaderMaterial({ uniforms: shU, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true }));
        shadow.position.set(0.3, -0.12, -0.6); shadow.scale.set(1.04, 1.02, 1); shadow.renderOrder = i;
        tilt.add(shadow, mesh);
        layers.push({ u: uniforms, su: shU });
      });
      ready = true;
      stage.classList.add('bloom-3d');
      resize(); frame(performance.now());
    })
    .catch(() => {});

  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, 0.15, w / h < 0.9 ? 7.4 : 6.2);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', () => { if (ready) { resize(); render(); } });

  function render() {
    const t = open * (layers.length - 1);
    layers.forEach((l, i) => {
      const a = Math.max(0, 1 - Math.abs(t - i));
      l.u.uOpacity.value = a; l.su.uOpacity.value = a; l.u.uTime.value = time; l.su.uTime.value = time;
    });
    tilt.rotation.y = px * 0.32 + (opts.still ? 0 : Math.sin(time * 0.35) * 0.12);
    tilt.rotation.x = py * 0.12;
    renderer.render(scene, camera);
  }
  let raf = 0, last = performance.now();
  function onScreen() { const r = canvas.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; }
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (onScreen()) {                                   // fuori schermo: nessun rendering
      time += dt;
      open += (target - open) * Math.min(1, dt * 5);
      px += (tx - px) * Math.min(1, dt * 3); py += (ty - py) * Math.min(1, dt * 3);
      render();
    }
    if (!opts.still && !document.hidden) raf = requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && ready && !opts.still) { last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
  });

  return {
    setOpen(v) { target = Math.max(0, Math.min(1, v)); if (opts.still) { open = target; if (ready) render(); } fallback.setOpen(v); },
    pointer(x, y) { tx = x; ty = y; }
  };
}

window.PetaliBloom = { init };
