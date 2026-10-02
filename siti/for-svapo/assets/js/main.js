/* For Svapo — interazioni e movimento.
   Il contenuto è leggibile anche senza JS: le classi di animazione le aggiunge questo file. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var mobile = function () { return window.innerWidth < 900; };
  var fmt = function (n) { return n.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); };

  /* ---------- indice a tutto schermo ---------- */
  var btnIndice = document.querySelector('.indice-btn');
  var indice = document.getElementById('indice');
  function chiudiIndice(rifocus) {
    indice.hidden = true; btnIndice.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (rifocus) btnIndice.focus();
  }
  if (btnIndice && indice) {
    btnIndice.addEventListener('click', function () {
      var aperto = btnIndice.getAttribute('aria-expanded') === 'true';
      if (aperto) { chiudiIndice(false); return; }
      indice.hidden = false; btnIndice.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      indice.querySelector('a').focus();
      if (gsap && !rmQuery.matches) gsap.from(indice.querySelectorAll('li'), { y: 30, opacity: 0, stagger: 0.05, duration: 0.5, ease: 'power3.out' });
    });
    indice.addEventListener('click', function (e) { if (e.target.closest('a')) chiudiIndice(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !indice.hidden) chiudiIndice(true); });
  }

  /* ---------- tavola degli aromi ---------- */
  var ELEMENTI = [
    { s: 'Tb', n: 'Tabaccosi', note: 'Note secche, tostate, di foglia essiccata. Varianti con sfumature di miele, nocciola o caramello.', base: '50/50 PG/VG', tag: 'foglia · tostato · frutta secca' },
    { s: 'Fr', n: 'Fruttati', note: 'Frutti rossi, frutta gialla, tropicale. Singoli o in miscela, spesso con una punta acidula.', base: '50/50 o 30/70', tag: 'fragola · pesca · mango' },
    { s: 'Ag', n: 'Agrumati', note: 'Scorza e succo: limone, arancia, pompelmo, bergamotto. Profumi netti e brillanti.', base: '50/50 PG/VG', tag: 'limone · arancia · bergamotto' },
    { s: 'Fs', n: 'Freschi', note: 'Menta, mentolo ed effetto ghiaccio, da soli o abbinati a frutta.', base: '50/50 o 30/70', tag: 'menta · mentolo · ghiaccio' },
    { s: 'Cr', n: 'Cremosi', note: 'Crema, latte, vaniglia, panna: note morbide e rotonde.', base: '30/70 PG/VG', tag: 'crema · vaniglia · latte' },
    { s: 'Pa', n: 'Pasticceria', note: 'Biscotto, torta, caramello, crostata: la famiglia più dolce.', base: '30/70 PG/VG', tag: 'biscotto · caramello · burro' },
    { s: 'Bv', n: 'Bevande', note: 'Caffè, tè, cola e altre bevande riconoscibili.', base: '50/50 PG/VG', tag: 'caffè · tè · cola' },
    { s: 'Sp', n: 'Speziati', note: 'Cannella, anice, liquirizia, chiodi di garofano. Spesso usati in piccola quantità come accento.', base: '50/50 PG/VG', tag: 'cannella · anice · liquirizia' },
    { s: 'Nt', n: 'Neutri', note: 'Basi senza aroma, solo PG e VG: il punto di partenza per chi miscela da sé con il miscelatore qui sotto.', base: 'a scelta', tag: 'PG · VG · base neutra' }
  ];
  var dett = document.getElementById('el-dettaglio');
  document.querySelectorAll('.el').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = ELEMENTI[+b.getAttribute('data-el')];
      document.querySelectorAll('.el').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      dett.querySelector('.el-simbolo').textContent = d.s;
      dett.querySelector('.el-nome').textContent = d.n;
      dett.querySelector('.el-note').textContent = d.note;
      dett.querySelector('.el-base').textContent = d.base;
      dett.querySelector('.el-tag').textContent = d.tag;
      if (gsap && !rmQuery.matches) gsap.fromTo(dett.querySelector('.el-simbolo'), { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
    });
  });

  /* ---------- miscelatore ---------- */
  var form = document.getElementById('misc');
  var vg = document.getElementById('vg'), ar = document.getElementById('ar');
  var out = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
  var misc = { ml: 10, pg: 50, vg: 50, ar: 10 };
  function calcola() {
    var ml = +form.querySelector('input[name=ml]:checked').value;
    var v = +vg.value, p = 100 - v, a = +ar.value;
    var mAr = ml * a / 100, mVg = ml * v / 100, mPg = Math.max(0, ml * p / 100 - mAr);
    misc = { ml: ml, pg: p, vg: v, ar: a, mAr: mAr, mPg: mPg, mVg: mVg };
    out('pg-out', p); out('vg-out', v); out('ar-out', a);
    out('r-ar', fmt(mAr)); out('r-pg', fmt(mPg)); out('r-vg', fmt(mVg));
    vg.setAttribute('aria-valuetext', 'PG ' + p + ' per cento, VG ' + v + ' per cento');
    ar.setAttribute('aria-valuetext', a + ' per cento di aroma');
    if (inMisc) flaconeMisc();
  }
  function flaconeMisc() {
    if (!window.Flacone) return;
    var f = 0.95;
    window.Flacone.livelli({ vg: misc.vg / 100 * f, pg: misc.mPg / misc.ml * f, ar: misc.ar / 100 * f });
    window.Flacone.etichetta('PG ' + misc.pg + ' · VG ' + misc.vg, misc.ml + ' ml · aroma ' + misc.ar + ' %', 'senza nicotina');
  }
  var inMisc = false;
  if (form) { form.addEventListener('input', calcola); form.addEventListener('submit', function (e) { e.preventDefault(); }); calcola(); }

  /* ---------- orari: evidenzia il giorno corrente (nessuna promessa di "aperto ora") ---------- */
  var oggi = new Date().getDay();
  var riga = document.querySelector('.orari tr[data-g="' + oggi + '"]');
  if (riga) riga.classList.add('oggi');

  /* ---------- catalogo: filtri ---------- */
  var voci = Array.prototype.slice.call(document.querySelectorAll('.voce'));
  document.querySelectorAll('.filtro').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-f'), n = 0;
      document.querySelectorAll('.filtro').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      voci.forEach(function (v) { var ok = f === 'tutti' || v.getAttribute('data-cat') === f; v.hidden = !ok; if (ok) n++; });
      out('cat-n', n);
    });
  });

  /* ---------- mappa Leaflet con le sedi, solo dopo clic o consenso ---------- */
  // posizioni indicative, da verificare
  var SEDI = [
    { n: 'Via XX Settembre 87r', z: 'Centro', p: [44.4052, 8.9392] },
    { n: 'Via San Martino 19r', z: 'San Martino (sede legale)', p: [44.4029, 8.9688] },
    { n: 'Via Piacenza 83r', z: 'Val Bisagno', p: [44.4300, 8.9555] },
    { n: 'Via Molassana 55A r', z: 'Molassana', p: [44.4445, 8.9620] }
  ];
  var mappa = null, marker = [], mappaCaricata = false;
  function evidenzia(i) {
    document.querySelectorAll('.fermata').forEach(function (f) { f.classList.toggle('on', +f.getAttribute('data-sede') === i); });
    if (mappa && marker[i]) { mappa.flyTo(SEDI[i].p, 16, { duration: rmQuery.matches ? 0 : 0.8 }); marker[i].openPopup(); }
  }
  function caricaMappa() {
    if (mappaCaricata || !window.L) return;
    mappaCaricata = true;
    document.getElementById('mappa-ph').hidden = true;
    mappa = window.L.map('mappa', { scrollWheelZoom: false, attributionControl: true });
    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(mappa);
    window.L.Icon.Default.imagePath = 'assets/vendor/leaflet/images/';
    SEDI.forEach(function (d, i) {
      marker[i] = window.L.marker(d.p, { alt: 'For Svapo, ' + d.n }).addTo(mappa).bindPopup('<b>For Svapo</b><br>' + d.n + '<br>' + d.z);
      marker[i].on('click', function () { evidenzia(i); });
    });
    mappa.fitBounds(SEDI.map(function (d) { return d.p; }), { padding: [30, 30] });
    document.querySelectorAll('.f-mappa').forEach(function (b) { b.hidden = false; });
  }
  document.querySelectorAll('.f-mappa').forEach(function (b) {
    b.addEventListener('click', function () { evidenzia(+b.getAttribute('data-sede')); });
  });
  document.querySelectorAll('.fermata').forEach(function (f) {
    f.addEventListener('mouseenter', function () { document.querySelectorAll('.fermata').forEach(function (x) { x.classList.toggle('on', x === f); }); });
  });
  var mBtn = document.getElementById('mappa-btn');
  if (mBtn) mBtn.addEventListener('click', caricaMappa);
  if (window.Consenso) {
    if (window.Consenso.esterni()) caricaMappa();
    window.Consenso.onChange(function (v) { if (v.ext) caricaMappa(); });
  }

  /* ---------- movimento ---------- */
  if (!gsap || !ST) return;
  gsap.registerPlugin(ST);
  var mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', function () {
    var lenis = null;
    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1 });
      lenis.on('scroll', ST.update);
      var raf = function (t) { lenis.raf(t * 1000); };
      gsap.ticker.add(raf); gsap.ticker.lagSmoothing(0);
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href'); if (id.length < 2) return;
          var t = document.querySelector(id); if (!t) return;
          e.preventDefault(); lenis.scrollTo(t, { offset: id === '#top' ? 0 : -70 });
          t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
        });
      });
    }

    // titolo hero: le righe salgono dal basso
    gsap.from('.hero h1 .riga > span', { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.09, delay: 0.15 });
    gsap.from('.hero .lead, .hero .azioni, .hero .avviso', { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.55 });
    gsap.from('.civico', { yPercent: 18, opacity: 0, duration: 1.6, ease: 'power3.out' });
    gsap.to('.civico', { yPercent: -22, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // titoli di sezione e righe della scheda
    gsap.utils.toArray('.sez-testa, .misc-pannello').forEach(function (el) {
      gsap.from(el.children, { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 82%' } });
    });
    gsap.from('.scheda tbody tr', { x: -30, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.06, scrollTrigger: { trigger: '.scheda', start: 'top 80%' } });
    gsap.from('.el', { scale: 0.6, opacity: 0, duration: 0.5, ease: 'back.out(1.6)', stagger: { each: 0.05, from: 'random' }, scrollTrigger: { trigger: '.elementi', start: 'top 80%' } });
    gsap.utils.toArray('.rv').forEach(function (el) {
      gsap.from(el, { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
    });

    // catalogo: la foto del prodotto segue il cursore sulle voci che ne hanno una
    var cimg = document.querySelector('.cursore-img');
    if (cimg && window.matchMedia('(pointer: fine)').matches) {
      doc.classList.add('js-cursore');
      var cx = gsap.quickTo(cimg, 'x', { duration: 0.45, ease: 'power3' }), cy = gsap.quickTo(cimg, 'y', { duration: 0.45, ease: 'power3' });
      document.querySelectorAll('.voce[data-img] summary').forEach(function (sm) {
        sm.addEventListener('mouseenter', function () { cimg.src = sm.closest('.voce').getAttribute('data-img'); gsap.to(cimg, { opacity: 1, scale: 1, duration: 0.3 }); });
        sm.addEventListener('mouseleave', function () { gsap.to(cimg, { opacity: 0, scale: 0.85, duration: 0.3 }); });
        sm.addEventListener('mousemove', function (e) { cx(e.clientX + 140); cy(e.clientY); });
      });
    }
    gsap.from('.voce', { y: 24, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.06, scrollTrigger: { trigger: '.voci', start: 'top 82%' } });
    gsap.from('.fermata', { x: -24, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12, scrollTrigger: { trigger: '.linea', start: 'top 80%' } });

    // serbatoio: livello = avanzamento pagina
    var serb = document.querySelector('.serbatoio');
    ST.create({ start: 0, end: 'max', onUpdate: function (s) { if (serb) serb.style.setProperty('--liv', s.progress.toFixed(3)); } });

    // anatomia: sezione pinnata, i quattro passi riempiono il flacone
    var passi = gsap.utils.toArray('.passo');
    doc.classList.add('js-pin');
    var LIV = [
      { vg: 0, pg: 0.45, ar: 0, e: ['PG 100', 'glicole propilenico', ''] },
      { vg: 0.45, pg: 0.45, ar: 0, e: ['PG 50 · VG 50', 'base neutra', ''] },
      { vg: 0.42, pg: 0.42, ar: 0.1, e: ['PG 50 · VG 50', '10 ml · aroma 10 %', ''] },
      { vg: 0.42, pg: 0.42, ar: 0.1, e: ['PG 50 · VG 50', '10 ml · aroma 10 %', 'nicotina: mg/ml in etichetta'] }
    ];
    var passoAtt = -1;
    function vaiPasso(i) {
      if (i === passoAtt) return; passoAtt = i;
      passi.forEach(function (p, k) { p.classList.toggle('on', k === i); });
      if (window.Flacone && i >= 0) { window.Flacone.livelli(LIV[i]); window.Flacone.etichetta.apply(null, LIV[i].e); }
    }
    vaiPasso(0);
    ST.create({
      trigger: '.anatomia', start: 'top top', end: '+=' + (passi.length * 70) + '%', pin: '.anatomia-pin', scrub: true,
      onUpdate: function (s) { vaiPasso(Math.min(passi.length - 1, Math.floor(s.progress * passi.length))); }
    });

    // coreografia del flacone: posizione per sezione
    function preset(nome) {
      var m = mobile();
      var P = {
        hero: m ? { x: 0, y: 0.3, s: 0.5, opac: 1, inclina: 0, giro: 1 } : { x: 0.46, y: -0.04, s: 1, opac: 1, inclina: -0.08, giro: 1 },
        spento: { opac: 0 },
        anatomia: m ? { x: 0, y: 0.5, s: 0.5, opac: 1, inclina: 0, giro: 0.6 } : { x: 0.5, y: -0.02, s: 1.05, opac: 1, inclina: 0, giro: 0.6 },
        misc: m ? { x: 0, y: 0.52, s: 0.5, opac: 1, inclina: 0, giro: 0.5 } : { x: -0.5, y: -0.02, s: 1, opac: 1, inclina: 0.06, giro: 0.5 }
      };
      return P[nome];
    }
    function muovi(nome) {
      if (!window.Flacone) return;
      gsap.to(window.Flacone.stato, Object.assign({ duration: 1.1, ease: 'power3.inOut', overwrite: 'auto' }, preset(nome)));
    }
    [['.hero', 'hero'], ['#banco', 'spento'], ['#catalogo', 'spento'], ['#tavola', 'spento'], ['.anatomia', 'anatomia'], ['#miscelatore', 'misc'], ['#sedi', 'spento']].forEach(function (c) {
      ST.create({
        trigger: c[0], start: 'top 55%', end: 'bottom 45%',
        onToggle: function (s) {
          if (!s.isActive) return;
          muovi(c[1]);
          inMisc = c[1] === 'misc';
          if (inMisc) flaconeMisc();
          else if (c[1] === 'anatomia') { var k = passoAtt; passoAtt = -1; vaiPasso(Math.max(0, k)); }
          else if (c[1] === 'hero' && window.Flacone) { window.Flacone.livelli({ vg: 0, pg: 0, ar: 0.33 }); }
        }
      });
    });
    function iniz() { if (window.Flacone) { var p = preset('hero'); Object.assign(window.Flacone.stato, p); } }
    if (window.Flacone) iniz(); else document.addEventListener('flacone:pronto', iniz);

    window.addEventListener('load', function () { ST.refresh(); });

    return function () {
      if (lenis) lenis.destroy();
      doc.classList.remove('js-pin');
    };
  });
})();
