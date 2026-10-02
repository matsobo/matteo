/* Borgo Car — interazioni comuni a tutte le tavole */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  /* ---------- contatti: da completare prima della pubblicazione ---------- */
  // Solo cifre con prefisso internazionale, es. "393XXXXXXXXX". Vuoto = mostra avviso.
  var CFG = { wa: '' };
  var toastEl = $('#toast');
  function toast(m) {
    if (!toastEl) return;
    toastEl.textContent = m; toastEl.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove('show'); }, 3200);
  }
  $$('[data-k="wa"]').forEach(function (a) {
    if (CFG.wa) {
      a.href = 'https://wa.me/' + CFG.wa + '?text=' + encodeURIComponent('Buongiorno, vorrei un preventivo per la mia auto.');
      a.target = '_blank'; a.rel = 'noopener'; a.removeAttribute('data-missing');
    } else {
      a.addEventListener('click', function (e) { e.preventDefault(); toast('Numero WhatsApp da confermare con il titolare. Intanto chiama lo 010 373 2127.'); });
    }
  });

  /* ---------- menu mobile ---------- */
  var mb = $('#menuBtn'), mn = $('#mnav');
  if (mb && mn) {
    var setMenu = function (o) {
      mn.classList.toggle('open', o); mb.setAttribute('aria-expanded', String(o));
      mb.textContent = o ? 'Chiudi' : 'Indice';
      if (o) { var a = $('a', mn); a && a.focus(); }
    };
    mb.addEventListener('click', function () { setMenu(!mn.classList.contains('open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mn.classList.contains('open')) { setMenu(false); mb.focus(); } });
  }

  /* ---------- transizione tra tavole: nastro carta (fallback se manca la View Transition) ---------- */
  var wipe = $('.wipe');
  var nativeVT = 'CSSViewTransitionRule' in window && location.protocol !== 'file:';
  if (wipe && !reduce && !nativeVT) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      var href = a.getAttribute('href');
      if (!/^[a-z-]+\.html(#.*)?$/.test(href) || href.split('#')[0] === location.pathname.split('/').pop()) return;
      e.preventDefault();
      wipe.classList.add('on');
      setTimeout(function () { location.href = href; }, 380);
    });
    addEventListener('pageshow', function () { wipe.classList.remove('on'); });
  }

  /* ---------- prima / dopo ---------- */
  var ba = $('#ba'), baR = $('#baRange');
  if (ba && baR) baR.addEventListener('input', function () { ba.style.setProperty('--p', baR.value + '%'); });

  /* ---------- servizi in scorrimento orizzontale (lavorazioni) ---------- */
  var cards = $('#cards');
  if (cards) {
    var bar = $('#cardsBar');
    var upd = function () {
      var max = cards.scrollWidth - cards.clientWidth;
      var p = max > 0 ? cards.scrollLeft / max : 1;
      if (bar) bar.style.transform = 'scaleX(' + (0.08 + p * 0.92) + ')';
    };
    cards.addEventListener('scroll', upd, { passive: true }); upd();
    var step = function (d) {
      var c = $('.card', cards); var w = c ? c.getBoundingClientRect().width : 320;
      cards.scrollBy({ left: d * w, behavior: reduce ? 'auto' : 'smooth' });
    };
    $('#cPrev').addEventListener('click', function () { step(-1); });
    $('#cNext').addEventListener('click', function () { step(1); });
    // trascinamento col mouse (il touch scorre nativamente)
    var down = false, sx = 0, sl = 0, moved = false;
    cards.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = cards.scrollLeft; cards.classList.add('dragging');
    });
    addEventListener('pointermove', function (e) {
      if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 3) moved = true; cards.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', function () { if (!down) return; down = false; cards.classList.remove('dragging'); });
    cards.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  /* ---------- orari: evidenzia oggi ---------- */
  var hrs = $('#hours');
  if (hrs) { var today = new Date().getDay(); var tr = $('tr[data-d="' + today + '"]', hrs); if (tr) tr.classList.add('today'); }

  /* ---------- mappa OpenStreetMap: solo dopo clic o consenso ---------- */
  var gate = $('#mapGate'), mapEl = $('#map');
  var mapLoaded = false;
  function loadMap() {
    if (mapLoaded || !mapEl || !window.L) return;
    mapLoaded = true;
    if (gate) gate.hidden = true;
    var pos = [44.4087, 8.9893];
    var map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: true }).setView(pos, 17);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);
    var icon = L.divIcon({
      className: 'bc-pin', iconSize: [38, 48], iconAnchor: [19, 46], popupAnchor: [0, -40],
      html: '<svg viewBox="0 0 38 48" width="38" height="48" aria-hidden="true"><path d="M19 47S2 29 2 18a17 17 0 0 1 34 0c0 11-17 29-17 29Z" fill="#e2531b" stroke="#151515" stroke-width="2.5"/><rect x="10" y="10" width="18" height="16" fill="#ecebe6" stroke="#151515" stroke-width="2"/><text x="19" y="22.5" text-anchor="middle" font-family="Arial" font-weight="700" font-size="9" fill="#151515">BC</text></svg>'
    });
    L.marker(pos, { icon: icon, keyboard: true, title: 'Borgo Car, Via del Borgo 18R' }).addTo(map)
      .bindPopup('<strong>Borgo Car</strong><br>Via del Borgo 18R, 16132 Genova<br><a href="https://www.google.com/maps/dir/?api=1&destination=Borgo+Car+Via+del+Borgo+18R+16132+Genova" target="_blank" rel="noopener">Indicazioni</a>');
  }
  if (gate) {
    $('#mapLoad').addEventListener('click', loadMap);
    if (window.bcConsent && window.bcConsent.ext) addEventListener('load', loadMap);
    document.addEventListener('bc:consent', function (e) { if (e.detail.ext) loadMap(); });
  }

  /* ---------- modulo preventivo (demo, nessun invio) ---------- */
  var form = $('#quote');
  if (form) {
    var t0 = Date.now();
    var foto = $('#f-foto'), files = $('#f-files');
    foto.addEventListener('change', function () {
      var f = [].slice.call(foto.files || []);
      files.textContent = f.length ? f.length + (f.length === 1 ? ' foto selezionata' : ' foto selezionate') : '';
    });
    var err = function (id, m) {
      var el = $('#e-' + id), inp = $('#f-' + id);
      el.textContent = m; inp.setAttribute('aria-invalid', String(!!m)); return !m;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) { return ($('#f-' + id).value || '').trim(); };
      var res = [
        ['nome', err('nome', v('nome').length < 2 ? 'Scrivi nome e cognome.' : '')],
        ['tel', err('tel', v('tel').replace(/\D/g, '').length < 6 ? 'Serve un numero di telefono per richiamarti.' : '')],
        ['tipo', err('tipo', !v('tipo') ? 'Scegli il tipo di intervento.' : '')],
        ['priv', err('priv', !$('#f-priv').checked ? 'Serve la conferma per poterti ricontattare.' : '')]
      ];
      var bad = res.filter(function (r) { return !r[1]; });
      if (bad.length) { $('#f-' + bad[0][0]).focus(); return; }
      var ok = $('#ok');
      if (v('web') || Date.now() - t0 < 2500) { ok.hidden = false; ok.textContent = 'Richiesta ricevuta.'; return; } // honeypot / time-trap
      ok.hidden = false;
      ok.textContent = 'Demo: richiesta pronta ma non inviata. Grazie ' + v('nome').split(' ')[0] + ', in produzione Borgo Car ti richiamerà al ' + v('tel') + '.';
      form.reset(); files.textContent = ''; ok.focus();
    });
  }

  /* ---------- movimento (GSAP + Lenis), mai con "riduci movimento" ---------- */
  if (reduce || !window.gsap) return;
  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  root.classList.add('js');

  if (window.Lenis && window.ScrollTrigger) {
    var lenis = new window.Lenis({ lerp: 0.12 });
    lenis.on('scroll', window.ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  // titolo home: le due parole entrano con larghezze opposte
  var h1 = $('.c-title h1');
  if (h1) {
    gsap.from(h1, { fontStretch: '60%', duration: 1.2, ease: 'power4.out' });
    gsap.from('.c-title h1 .w2', { fontStretch: '150%', duration: 1.2, ease: 'power4.out', delay: 0.05 });
    gsap.from('.t01 > *', { y: 24, opacity: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out', clearProps: 'transform,opacity' });
  }
  // storia: l'anno si allarga mentre scorri
  var yr = $('#bigYear');
  if (yr && window.ScrollTrigger) {
    // larghezza massima che entra nella tavola, così l'anno non viene mai tagliato
    var wrap = yr.parentNode, maxS = 50;
    var measure = function () {
      var keep = yr.style.fontStretch; maxS = 50;
      for (var st = 150; st >= 50; st -= 5) { yr.style.fontStretch = st + '%'; if (yr.getBoundingClientRect().width <= wrap.clientWidth - 2) { maxS = st; break; } }
      yr.style.fontStretch = keep;
    };
    measure();
    window.ScrollTrigger.create({
      trigger: '.year-wrap', start: 'top 80%', end: 'bottom top', scrub: true,
      onRefreshInit: measure,
      onUpdate: function (s) { yr.style.fontStretch = (50 + s.progress * (maxS - 50)) + '%'; }
    });
  }
  // reveal
  $$('.rv').forEach(function (el) {
    gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  // tavole interne: i servizi arrivano scorrendo
  if ($('#cards')) gsap.from('.card', { x: 60, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out', clearProps: 'transform,opacity' });
})();
