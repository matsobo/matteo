/* Petali Incantati — interazioni e movimento */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = matchMedia('(pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- testata ---------- */
  var top = $('#top');
  function onScroll() { top.classList.toggle('scrolled', window.scrollY > 30); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var navLinks = $$('.tavole a');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id ? 'true' : 'false'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('.plate').forEach(function (s) { io.observe(s); });
  }

  /* ---------- I: peonia 3D ---------- */
  var bloom = null, canvas = $('#bloom');
  if (window.PetaliBloom && canvas) {
    bloom = window.PetaliBloom.init(canvas, reduce ? { still: true, open: 1 } : { open: 0 });
  }
  if (bloom && !reduce && finePointer) {
    addEventListener('pointermove', function (e) {
      bloom.pointer(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1);
    }, { passive: true });
  }

  /* ---------- II: indice occasioni (solo evidenziazione della voce) ---------- */
  $$('.occ').forEach(function (li) {
    li.addEventListener('pointerenter', function () { li.classList.add('is-on'); });
    li.addEventListener('pointerleave', function () { li.classList.remove('is-on'); });
  });

  /* ---------- III: componi il mazzo ---------- */
  var form = $('#composer'), msg = $('#msg'), bqBox = $('#bqPhoto');
  var TONO = { 'bianchi e avorio': 'bianchi', 'rosa cipria': 'cipria', 'colori accesi': 'accesi', 'lilla e viola': 'lilla', 'a scelta del fiorista': 'libero' };
  var FORMA = { 'un mazzo': 'mazzo', 'una composizione': 'composizione', 'una pianta': 'pianta' };
  function imgPath(p) { return (window.__PI_IMG && window.__PI_IMG[p]) || p; }
  function showPhoto(src) {
    var cur = bqBox.querySelector('img:not(.leaving)');
    if (cur && cur.getAttribute('src') === src) return;
    var next = new Image(); next.alt = ''; next.width = 720; next.height = 842; next.src = src;
    var swap = function () {
      if (reduce) { bqBox.innerHTML = ''; bqBox.appendChild(next); return; }
      next.className = 'entering'; bqBox.appendChild(next);
      requestAnimationFrame(function () { requestAnimationFrame(function () { next.className = ''; }); });
      if (cur) { cur.className = 'leaving'; setTimeout(function () { if (cur.parentNode) cur.parentNode.removeChild(cur); }, 500); }
    };
    (next.decode ? next.decode() : Promise.resolve()).then(swap, swap);
  }
  if (bqBox && finePointer && !reduce) {
    bqBox.addEventListener('pointermove', function (e) {
      var r = bqBox.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      $$('img', bqBox).forEach(function (im) { if (!im.classList.contains('leaving')) im.style.transform = 'rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 6) + 'deg)'; });
    });
    bqBox.addEventListener('pointerleave', function () { $$('img', bqBox).forEach(function (im) { im.style.transform = ''; }); });
  }
  function update() {
    if (!form) return;
    var fd = new FormData(form);
    var occ = fd.get('occ'), tone = fd.get('tone'), shape = fd.get('form'), when = fd.get('when');
    var text = 'Buongiorno, vorrei ' + shape + ' per ' + occ + ', ';
    text += tone === 'a scelta del fiorista' ? 'con colori a vostra scelta' : 'nei toni ' + tone;
    if (when) {
      var d = new Date(when + 'T12:00:00');
      if (!isNaN(d)) text += ', per ' + d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    text += '. Mi potete dire disponibilità e prezzo?';
    msg.textContent = text;
    if (bqBox) showPhoto(imgPath('assets/img/mazzi/' + FORMA[shape] + '-' + TONO[tone] + '.webp'));
  }
  if (form) {
    form.addEventListener('change', update);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    $('#when').min = today.toISOString().slice(0, 10);
    update();
  }
  var copyBtn = $('#copyMsg');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var t = msg.textContent, label = copyBtn.lastChild;
    function done(ok) {
      var old = 'Copia il messaggio';
      label.textContent = ok ? 'Copiato!' : 'Selezionalo e copialo';
      setTimeout(function () { label.textContent = old; }, 2200);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(function () { done(true); }, function () { done(false); });
    else {
      var r = document.createRange(); r.selectNodeContents(msg);
      var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      done(ok);
    }
  });

  /* ---------- IV: di stagione (dati locali, nessuna API) ---------- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  var MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  var STAGIONE = [
    [['Elleboro', 'Helleborus niger'], ['Mimosa', 'Acacia dealbata'], ['Anemone', 'Anemone coronaria'], ['Ranuncolo', 'Ranunculus asiaticus']],
    [['Mimosa', 'Acacia dealbata'], ['Anemone', 'Anemone coronaria'], ['Ranuncolo', 'Ranunculus asiaticus'], ['Violetta', 'Viola odorata']],
    [['Tulipano', 'Tulipa'], ['Giacinto', 'Hyacinthus orientalis'], ['Ranuncolo', 'Ranunculus asiaticus'], ['Mimosa', 'Acacia dealbata']],
    [['Tulipano', 'Tulipa'], ['Lillà', 'Syringa vulgaris'], ['Glicine', 'Wisteria sinensis'], ['Ranuncolo', 'Ranunculus asiaticus']],
    [['Peonia', 'Paeonia lactiflora'], ['Rosa', 'Rosa'], ['Ginestra', 'Spartium junceum'], ['Iris', 'Iris germanica']],
    [['Ortensia', 'Hydrangea macrophylla'], ['Rosa', 'Rosa'], ['Lavanda', 'Lavandula angustifolia'], ['Gelsomino', 'Jasminum officinale']],
    [['Girasole', 'Helianthus annuus'], ['Ortensia', 'Hydrangea macrophylla'], ['Agapanto', 'Agapanthus africanus'], ['Lavanda', 'Lavandula angustifolia']],
    [['Dalia', 'Dahlia'], ['Zinnia', 'Zinnia elegans'], ['Girasole', 'Helianthus annuus'], ['Oleandro', 'Nerium oleander']],
    [['Dalia', 'Dahlia'], ['Aster', 'Symphyotrichum'], ['Cosmea', 'Cosmos bipinnatus'], ['Zinnia', 'Zinnia elegans']],
    [['Dalia', 'Dahlia'], ['Crisantemo', 'Chrysanthemum'], ['Aster', 'Symphyotrichum'], ['Ciclamino', 'Cyclamen']],
    [['Crisantemo', 'Chrysanthemum'], ['Ciclamino', 'Cyclamen'], ['Erica', 'Erica carnea'], ['Viburno', 'Viburnum tinus']],
    [['Elleboro', 'Helleborus niger'], ['Stella di Natale', 'Euphorbia pulcherrima'], ['Amarillide', 'Hippeastrum'], ['Viburno', 'Viburnum tinus']]
  ];
  var m = new Date().getMonth();
  var mEl = $('#seasonMonth'); if (mEl) mEl.textContent = MESI[m];
  var list = $('#seasonList');
  if (list) STAGIONE[m].forEach(function (f) {
    var li = document.createElement('li');
    var b = document.createElement('b'); b.textContent = f[0];
    var i = document.createElement('i'); i.setAttribute('lang', 'la'); i.textContent = f[1];
    li.appendChild(b); li.appendChild(i); list.appendChild(li);
  });
  var wheel = $('#wheel');
  if (wheel) {
    for (var k = 0; k < 12; k++) {
      var a0 = (k / 12) * Math.PI * 2 - Math.PI / 2, a1 = ((k + 1) / 12) * Math.PI * 2 - Math.PI / 2;
      var R = 150, r = 70, C = 160;
      var p = document.createElementNS(SVGNS, 'path');
      var d = 'M' + (C + r * Math.cos(a0)) + ' ' + (C + r * Math.sin(a0)) +
        ' L' + (C + R * Math.cos(a0)) + ' ' + (C + R * Math.sin(a0)) +
        ' A' + R + ' ' + R + ' 0 0 1 ' + (C + R * Math.cos(a1)) + ' ' + (C + R * Math.sin(a1)) +
        ' L' + (C + r * Math.cos(a1)) + ' ' + (C + r * Math.sin(a1)) +
        ' A' + r + ' ' + r + ' 0 0 0 ' + (C + r * Math.cos(a0)) + ' ' + (C + r * Math.sin(a0)) + 'Z';
      var g = document.createElementNS(SVGNS, 'g');
      if (k === m) g.setAttribute('class', 'now');
      p.setAttribute('d', d);
      p.setAttribute('fill', k === m ? '#a8284f' : (k % 2 ? '#ebe3d4' : '#fbf8f2'));
      p.setAttribute('stroke', '#1d2620'); p.setAttribute('stroke-width', '.8');
      var am = (a0 + a1) / 2, t = document.createElementNS(SVGNS, 'text');
      t.setAttribute('x', C + 110 * Math.cos(am)); t.setAttribute('y', C + 110 * Math.sin(am) + 4);
      t.setAttribute('text-anchor', 'middle'); t.textContent = MESI[k].slice(0, 3);
      g.appendChild(p); g.appendChild(t); wheel.appendChild(g);
    }
    var mid = document.createElementNS(SVGNS, 'text');
    mid.setAttribute('x', 160); mid.setAttribute('y', 166); mid.setAttribute('text-anchor', 'middle');
    mid.setAttribute('class', 'mid');
    mid.textContent = MESI[m];
    wheel.appendChild(mid);
  }

  /* ---------- V: mappa OpenStreetMap, solo dopo clic o consenso ---------- */
  var mapLoaded = false;
  function loadMap() {
    if (mapLoaded) return; mapLoaded = true;
    var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'assets/vendor/leaflet/leaflet.css';
    document.head.appendChild(css);
    var s = document.createElement('script'); s.src = 'assets/vendor/leaflet/leaflet.js';
    s.onload = function () {
      var box = $('.map-box'); box.classList.add('map-loaded');
      var LAT = 44.4775, LON = 8.9198;
      var map = L.map('map', { scrollWheelZoom: false }).setView([LAT, LON], 16);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
      }).addTo(map);
      L.Icon.Default.imagePath = 'assets/vendor/leaflet/images/';
      L.marker([LAT, LON]).addTo(map).bindPopup('<strong>Petali Incantati</strong><br>Via Don Luigi Sturzo, Manesseno');
      $('#map').setAttribute('tabindex', '0');
    };
    document.head.appendChild(s);
  }
  var mapBtn = $('#mapLoad');
  if (mapBtn) mapBtn.addEventListener('click', loadMap);
  if (window.PetaliConsent) {
    if (PetaliConsent.has('external')) loadMap();
    PetaliConsent.onChange(function (st) { if (st.external) loadMap(); });
  }

  /* ---------- movimento (GSAP + Lenis) ---------- */
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', function () {
    root.classList.add('js-anim');
    var lenis = null;
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.11 });
      lenis.on('scroll', ScrollTrigger.update);
      var tick = function (t) { lenis.raf(t * 1000); };
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href'); if (id.length < 2) return;
          var el = document.querySelector(id); if (!el) return;
          e.preventDefault(); lenis.scrollTo(el, { offset: id === '#contenuto' ? 0 : -60 });
          el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true });
        });
      });
    }

    // intro titolo
    gsap.from('.hero-title .ln > span', { yPercent: 105, duration: 1.2, ease: 'power4.out', stagger: .12, delay: .1 });
    gsap.from('.hero-lead, .hero-actions', { y: 24, opacity: 0, duration: .9, ease: 'power3.out', stagger: .1, delay: .5 });
    gsap.from('.label-card', { y: 50, rotate: 4, opacity: 0, duration: 1, ease: 'power3.out', delay: .7 });

    // fioritura legata allo scroll: la tavola I resta ferma mentre il fiore si apre
    var desk = matchMedia('(min-width: 901px)').matches;
    ScrollTrigger.create({
      trigger: '.hero', start: 'top top', end: desk ? '+=90%' : 'bottom top',
      pin: desk ? '.hero-pin' : false, scrub: true,
      onUpdate: function (self) { if (bloom) bloom.setOpen(self.progress); }
    });
    if (desk) {
      gsap.to('.hero-copy', { yPercent: -10, opacity: .15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=90%', scrub: true } });
      gsap.to('.hand-1', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=30%', scrub: true } });
    }

    // comparsa dei blocchi
    $$('.rv').forEach(function (el) {
      gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    // le foto montate "si posano" sulla pagina
    gsap.from('.mount', { y: 80, rotate: function (i) { return [-6, 5, -4][i]; }, opacity: 0, duration: 1, ease: 'power3.out', stagger: .12,
      scrollTrigger: { trigger: '.photos', start: 'top 80%', once: true } });
    // la ruota dei mesi gira fino al mese corrente
    gsap.from('#wheel', { rotate: -120, transformOrigin: '50% 50%', duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: '.season', start: 'top 70%', once: true } });

    return function () { root.classList.remove('js-anim'); if (lenis) lenis.destroy(); };
  });
})();
