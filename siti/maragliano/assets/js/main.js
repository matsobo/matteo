/* Maragliano — interazioni del sito. Script classico (funziona anche da file://). */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ======================================================
     1. APERTO ORA — orari [DA CONFERMARE] + festività calcolate in locale
     ====================================================== */
  var ORARI = { 0: null, 1: [7, 19], 2: [7, 19], 3: [7, 19], 4: [7, 19], 5: [7, 19], 6: [7, 13] };
  function pasqua(y) { // algoritmo di Meeus/Jones/Butcher
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
        f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
        mese = Math.floor((h + l - 7 * m + 114) / 31), giorno = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(y, mese - 1, giorno));
  }
  function festivo(y, mo, d) {
    var fisse = ['1-1', '1-6', '4-25', '5-1', '6-2', '6-24', '8-15', '11-1', '12-8', '12-25', '12-26']; // 24/6 San Giovanni, patrono di Genova
    if (fisse.indexOf(mo + '-' + d) > -1) return true;
    var p = pasqua(y), lun = new Date(p.getTime() + 864e5);
    return lun.getUTCMonth() + 1 === mo && lun.getUTCDate() === d;
  }
  function oraRoma() {
    var parti = {};
    try {
      new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', weekday: 'short', hour12: false })
        .formatToParts(new Date()).forEach(function (p) { parti[p.type] = p.value; });
      var gg = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'].indexOf(parti.weekday.slice(0, 3).toLowerCase());
      return { y: +parti.year, mo: +parti.month, d: +parti.day, h: +parti.hour % 24, mi: +parti.minute, g: gg };
    } catch (e) {
      var n = new Date();
      return { y: n.getFullYear(), mo: n.getMonth() + 1, d: n.getDate(), h: n.getHours(), mi: n.getMinutes(), g: n.getDay() };
    }
  }
  function aggiornaStato() {
    var t = oraRoma(), fascia = ORARI[t.g], ora = t.h + t.mi / 60;
    var fest = festivo(t.y, t.mo, t.d);
    var aperto = !!fascia && !fest && ora >= fascia[0] && ora < fascia[1];
    var testo = aperto ? 'Aperto ora · fino alle ' + fascia[1] + ':00' : (fest ? 'Chiuso · oggi è festivo' : 'Chiuso ora');
    $$('.js-stato').forEach(function (el) { el.classList.toggle('is-open', aperto); });
    var breve = aperto ? 'Aperto ora' : 'Chiuso ora';
    $$('.js-stato-testo').forEach(function (el) { el.textContent = el.closest('.top') ? breve : testo; });
    $$('.cartello tr').forEach(function (tr) { tr.classList.toggle('oggi', +tr.getAttribute('data-g') === t.g); });
  }
  aggiornaStato();
  setInterval(aggiornaStato, 60000);

  var anni = $('.js-anni');
  if (anni) anni.textContent = String(oraRoma().y - 1920);

  /* ======================================================
     2. COMPONI IL TUO HAMBURGER — pila SVG + scontrino
     ====================================================== */
  var form = $('#builder'), svg = $('#pila-svg'), righe = $('#scontrino-righe');
  var NS = 'http://www.w3.org/2000/svg';
  var CARNI = { Manzo: '#5a2f1d', Tacchino: '#c4986a', Spinaci: '#4d7a36', Salsiccia: '#93402c' };
  var PANI = { Classico: '#d99a4e', Integrale: '#93653c' };
  var ORDINE = ['Insalata', 'CARNE', 'Formaggio', 'Pomodoro', 'Cipolla', 'Salsa BBQ'];

  function el(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function forma(nome, y, s) {
    var g = el('g', { 'data-strato': nome, stroke: '#1f1a17', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    var L = 30, R = 270, h;
    switch (nome) {
      case 'paneSotto':
        h = 34; g.appendChild(el('path', { d: 'M' + L + ' ' + (y - h) + 'H' + R + 'c0 22-18 ' + h + '-42 ' + h + 'H72c-24 0-42-12-42-' + h + 'z', fill: PANI[s.pane] }));
        break;
      case 'CARNE':
        h = 32; g.appendChild(el('rect', { x: L - 4, y: y - h, width: R - L + 8, height: h, rx: 16, fill: CARNI[s.carne] }));
        g.appendChild(el('path', { d: 'M70 ' + (y - h + 12) + 'h40M150 ' + (y - h + 20) + 'h50M222 ' + (y - h + 12) + 'h34', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 4 }));
        break;
      case 'Formaggio':
        h = 14; g.appendChild(el('path', { d: 'M' + (L - 6) + ' ' + (y - h) + 'H' + (R + 6) + 'l-14 26-22-14-20 22-22-20-24 18-22-18-24 16-22-18-22 14-22-20z', fill: '#f3b72f' }));
        break;
      case 'Insalata':
        h = 16; g.appendChild(el('path', { d: 'M' + (L - 8) + ' ' + y + 'c12-18 26 2 40-10s26 8 42-6 28 8 44-6 28 8 44-6 28 8 44-6 26 6 40-4l-4 ' + (h - 2) + 'H' + (L - 4) + 'z', fill: '#6f9a3e' }));
        break;
      case 'Pomodoro':
        h = 12; g.appendChild(el('rect', { x: 48, y: y - h, width: 96, height: h, rx: 6, fill: '#c3241b' }));
        g.appendChild(el('rect', { x: 156, y: y - h, width: 96, height: h, rx: 6, fill: '#c3241b' }));
        break;
      case 'Cipolla':
        h = 10; [70, 130, 190].forEach(function (x) { g.appendChild(el('rect', { x: x, y: y - h, width: 44, height: h, rx: 5, fill: '#f1e4ef' })); });
        break;
      case 'Salsa BBQ':
        h = 8; g.appendChild(el('path', { d: 'M40 ' + (y - h) + 'c30 6 50-6 80 2s60-6 90 0 40-4 50 0v6c-6 10-10 16-14 4-20 2-40 8-60 2-4 14-10 14-14 2-30 0-60 6-90-2-6 12-12 12-14-2-10 2-20 0-28-4z', fill: '#6e1a12' }));
        break;
      case 'paneSopra':
        h = 74; g.appendChild(el('path', { d: 'M' + L + ' ' + y + 'c0-50 54-' + h + ' 120-' + h + 's120 24 120 ' + h + 'z', fill: PANI[s.pane] }));
        g.appendChild(el('path', { d: 'M70 ' + (y - 40) + 'c18-18 44-26 72-28', fill: 'none', stroke: 'rgba(255,255,255,.55)', 'stroke-width': 5 }));
        [[100, 30], [135, 50], [170, 44], [205, 30], [120, 18], [190, 16], [152, 24], [228, 14], [80, 14]].forEach(function (p) {
          g.appendChild(el('ellipse', { cx: p[0], cy: y - p[1], rx: 6, ry: 3, fill: '#fbf7f1', 'stroke-width': 2 }));
        });
        break;
    }
    return { g: g, h: h };
  }
  function stato() {
    var fd = new FormData(form);
    return { pane: fd.get('pane'), carne: fd.get('carne'), extra: fd.getAll('extra') };
  }
  var precedenti = [];
  function disegna(animaNuovi) {
    if (!form) return;
    var s = stato();
    var nomi = ['paneSotto'].concat(ORDINE.filter(function (n) { return n === 'CARNE' || s.extra.indexOf(n) > -1; }), ['paneSopra']);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(el('ellipse', { cx: 150, cy: 330, rx: 130, ry: 8, fill: 'rgba(31,26,23,.18)' }));
    var y = 324, nuovi = [];
    nomi.forEach(function (n) {
      var f = forma(n, y, s);
      svg.appendChild(f.g);
      y -= f.h + 2;
      if (precedenti.indexOf(n) < 0) nuovi.push(f.g);
    });
    if (y < 10) svg.setAttribute('viewBox', '0 ' + (y - 10) + ' 300 ' + (350 - y));
    else svg.setAttribute('viewBox', '0 0 300 340');
    if (animaNuovi && window.gsap && !reduce && nuovi.length) {
      window.gsap.from(nuovi, { y: -70, opacity: 0, duration: 0.55, ease: 'bounce.out', stagger: 0.06 });
    }
    precedenti = nomi;

    // scontrino
    while (righe.firstChild) righe.removeChild(righe.firstChild);
    function riga(dt, dd) {
      var a = document.createElement('dt'), b = document.createElement('dd');
      a.textContent = dt; b.textContent = dd; righe.appendChild(a); righe.appendChild(b);
    }
    riga('Pane', s.pane); riga('Carne', s.carne);
    s.extra.forEach(function (x) { riga('+', x); });
  }
  if (form) {
    form.addEventListener('change', function () { disegna(true); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    disegna(false);
  }

  /* ======================================================
     3. LISTINO — immagine che segue il cursore (solo mouse)
     ====================================================== */
  var segui = $('.segui');
  if (segui && fine && !reduce) {
    var img = $('img', segui), sx = 0, sy = 0, tx = 0, ty = 0, on = false;
    $$('.voce').forEach(function (v) {
      v.addEventListener('pointerenter', function () {
        img.src = v.getAttribute('data-img');
        on = true; segui.style.visibility = 'visible'; segui.style.opacity = '1';
      });
      v.addEventListener('pointerleave', function () { on = false; segui.style.opacity = '0'; segui.style.visibility = 'hidden'; });
    });
    window.addEventListener('pointermove', function (e) { tx = e.clientX + 24; ty = e.clientY - 180; }, { passive: true });
    (function seguiLoop() {
      sx += (tx - sx) * 0.18; sy += (ty - sy) * 0.18;
      if (on) segui.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px) rotate(' + ((tx - sx) * 0.04).toFixed(2) + 'deg)';
      requestAnimationFrame(seguiLoop);
    })();
  }

  /* ======================================================
     4. RAIL — sezione corrente
     ====================================================== */
  var links = $$('.rail ol a');
  if ('IntersectionObserver' in window && links.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + en.target.id)); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) io.observe(s); });
  }

  /* ======================================================
     5. MAPPA — Leaflet + OSM solo dopo clic o consenso
     ====================================================== */
  var mappaFatta = false;
  function caricaMappa() {
    if (mappaFatta || !window.L) return;
    mappaFatta = true;
    var ph = $('#mappa-ph'); if (ph) ph.hidden = true;
    var L = window.L;
    L.Icon.Default.imagePath = 'assets/vendor/leaflet/images/';
    var m = L.map('mappa', { scrollWheelZoom: false }).setView([44.404129, 8.94141], 17);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(m);
    L.marker([44.404129, 8.94141], { alt: 'Maragliano, Via Innocenzo Frugoni 15r' }).addTo(m)
      .bindPopup('<strong>Maragliano</strong><br>Via Innocenzo Frugoni 15r');
  }
  var mb = $('#mappa-btn');
  if (mb) mb.addEventListener('click', caricaMappa);
  if (window.MaraConsent) {
    var c = window.MaraConsent.get();
    if (c && c.esterni) caricaMappa();
    window.MaraConsent.on(function (v) { if (v.esterni) caricaMappa(); });
  }

  /* ======================================================
     6. MOVIMENTO — GSAP + ScrollTrigger + Lenis
     Il contenuto è visibile anche senza JS: gli stati iniziali li imposta solo gsap.
     ====================================================== */
  if (!window.gsap || !window.ScrollTrigger) return;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  var mm = gsap.matchMedia();
  mm.add({ moto: '(prefers-reduced-motion: no-preference)', desk: '(min-width: 861px)' }, function (ctx) {
    if (!ctx.conditions.moto) return; // reduced motion: tutto resta nello stato finale

    // Lenis (smooth scroll) collegato a ScrollTrigger
    var lenis = null;
    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.12 });
      lenis.on('scroll', ST.update);
      var tick = function (t) { lenis.raf(t * 1000); };
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href'); if (id.length < 2) return;
          var t = $(id); if (!t) return;
          e.preventDefault(); lenis.scrollTo(t, { offset: ctx.conditions.desk ? 0 : -60 });
          if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
          t.focus({ preventScroll: true });
        });
      });
    }

    // intro hero
    gsap.from('.hero h1 .riga > span', { yPercent: 110, duration: 1, ease: 'power4.out', stagger: 0.1, delay: 0.1 });
    gsap.from('.anno', { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out' });
    gsap.from('.kicker, .lead, .hero .azioni', { y: 18, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, delay: 0.45 });
    gsap.from('.cartellino', { rotate: -25, y: -40, opacity: 0, duration: 1, ease: 'back.out(1.8)', delay: 0.9, transformOrigin: '50% 0%' });

    // l'hamburger si scompone mentre si scende dall'hero
    ST.create({ trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true,
      onUpdate: function (self) { if (window.MaraScene) window.MaraScene.esplodi(self.progress * 1.6); } });
    gsap.to('.anno', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // reveal
    $$('.rv').forEach(function (n) {
      gsap.from(n, { y: 36, opacity: 0, duration: 0.85, ease: 'power3.out', scrollTrigger: { trigger: n, start: 'top 88%', once: true } });
    });
    // il listino si "scrive" riga per riga
    gsap.from('.voce', { x: -24, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.07, scrollTrigger: { trigger: '.listino', start: 'top 80%', once: true } });

    // rotolo di carta: si srotola durante la sezione pinnata
    var tl = gsap.timeline({ scrollTrigger: { trigger: '.bottega-pin', start: 'top top', end: '+=120%', pin: true, scrub: 0.6 } });
    tl.fromTo('.foglio', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', ease: 'none', duration: 1 })
      .from('.tappa', { y: 20, opacity: 0, stagger: 0.25, duration: 0.3 }, 0.1)
      .fromTo('.rotolo-asse', { rotateX: 0 }, { rotateX: 720, ease: 'none', duration: 1 }, 0)
      .from('.timbro', { scale: 2.4, opacity: 0, rotate: 20, duration: 0.25, ease: 'power4.in' }, 0.75);

    // cartello orari che "dondola" all'arrivo
    gsap.from('.cartello', { rotate: -4, transformOrigin: '50% 0%', duration: 1.4, ease: 'elastic.out(1,0.35)', scrollTrigger: { trigger: '.cartello', start: 'top 80%', once: true } });

    return function () { if (lenis) lenis.destroy(); };
  });
})();
