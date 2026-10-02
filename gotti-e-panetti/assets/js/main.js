/* Gotti e Panetti — interazioni comuni a tutte le pagine */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gs = window.gsap, ST = window.ScrollTrigger;
  var numero = document.getElementById('numero');
  var current = numero ? numero.textContent : '';
  var PAGES = { 'index.html': '01', 'storia.html': '02', 'listino.html': '03', 'dove.html': '04' };

  /* ---------- display eliminacode: anteprima del numero al passaggio ---------- */
  function showNum(n) { if (numero) numero.textContent = n; }
  document.querySelectorAll('.tickets a, .strappo').forEach(function (a) {
    a.addEventListener('pointerenter', function () { showNum(a.getAttribute('data-n')); });
    a.addEventListener('focus', function () { showNum(a.getAttribute('data-n')); });
    a.addEventListener('pointerleave', function () { showNum(current); });
    a.addEventListener('blur', function () { showNum(current); });
  });

  /* ---------- transizione tra pagine: la lama passa ---------- */
  var wipe = document.querySelector('.wipe');
  var wipeNum = wipe && wipe.querySelector('.num b');
  var lama = wipe && wipe.querySelector('.lama');
  function pageOf(href) {
    try {
      var u = new URL(href, location.href);
      if (u.origin !== location.origin && location.protocol !== 'file:') return null;
      var f = u.pathname.split('/').pop() || 'index.html';
      return /\.html$/.test(f) ? f : null;
    } catch (e) { return null; }
  }
  /* versione a file unico: le pagine sono viste [data-view] con indirizzo #hash */
  var views = document.querySelectorAll('[data-view]');
  var ROUTES = { banco: '01', storia: '02', listino: '03', dove: '04', privacy: '··', cookie: '··', crediti: '··' };
  if (views.length) {
    var active = null;
    var viewOf = function (h) { h = (h || '').replace('#', ''); return ROUTES[h] ? h : null; };
    var activate = function (name, focus) {
      var sec = null;
      views.forEach(function (v) { var on = v.getAttribute('data-view') === name; v.hidden = !on; if (on) sec = v; });
      active = name;
      document.body.setAttribute('data-view', name);
      document.querySelectorAll('.tickets a, .mbar a').forEach(function (a) {
        if (a.getAttribute('href') === '#' + name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
      current = ROUTES[name]; showNum(current);
      if (sec && sec.getAttribute('data-title')) document.title = sec.getAttribute('data-title');
      if (window.gpLenis) window.gpLenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0);
      document.dispatchEvent(new CustomEvent('gp:view', { detail: name }));
      window.dispatchEvent(new Event('resize'));
      if (ST) ST.refresh();
      if (focus && sec) { var h = sec.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
    };
    var go = function (name, push) {
      if (!name || name === active) return;
      if (push) { try { history.pushState(null, '', '#' + name); } catch (e) { location.hash = name; } }
      if (!wipe || !gs || reduce) { activate(name, true); return; }
      wipeNum.textContent = ROUTES[name]; wipe.classList.add('on');
      gs.fromTo(lama, { rotate: -120 }, { rotate: 160, duration: 1.2, ease: 'power2.out' });
      gs.fromTo(wipe, { clipPath: 'circle(0% at 100% 0%)' }, {
        clipPath: 'circle(150% at 100% 0%)', duration: .5, ease: 'power3.in',
        onComplete: function () {
          activate(name, true);
          gs.to(wipe, { clipPath: 'circle(0% at 0% 100%)', duration: .6, ease: 'power3.inOut', delay: .12, onComplete: function () { wipe.classList.remove('on'); } });
        },
      });
    };
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      var name = viewOf(a.getAttribute('href')); if (!name) return;
      e.preventDefault(); go(name, true);
    });
    window.addEventListener('popstate', function () { go(viewOf(location.hash) || 'banco', false); });
    activate(viewOf(location.hash) || 'banco', false);
  } else if (wipe && gs && !reduce) {
    var flag = null;
    try { flag = sessionStorage.getItem('gp-wipe'); sessionStorage.removeItem('gp-wipe'); } catch (e) { /* ignora */ }
    if (flag) {
      wipeNum.textContent = flag; wipe.classList.add('on');
      gs.set(wipe, { clipPath: 'circle(150% at 100% 0%)' });
      gs.to(wipe, { clipPath: 'circle(0% at 0% 100%)', duration: .7, ease: 'power3.inOut', delay: .08, onComplete: function () { wipe.classList.remove('on'); } });
      gs.fromTo(lama, { rotate: 0 }, { rotate: 160, duration: .8, ease: 'power2.out' });
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (a.getAttribute('href').charAt(0) === '#') return;
      var f = pageOf(a.href); if (!f) return;
      e.preventDefault();
      var n = a.getAttribute('data-n') || PAGES[f] || '··';
      try { sessionStorage.setItem('gp-wipe', n); } catch (err) { /* ignora */ }
      wipeNum.textContent = n; wipe.classList.add('on');
      gs.fromTo(wipe, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: .55, ease: 'power3.in', onComplete: function () { location.href = a.href; } });
      gs.fromTo(lama, { rotate: -120 }, { rotate: 0, duration: .6, ease: 'power2.out' });
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) wipe.classList.remove('on'); });
  }

  /* ---------- parole che cambiano (Chi siamo) ---------- */
  var swaps = document.querySelectorAll('[data-swap]');
  swaps.forEach(function (s) {
    s.setAttribute('role', 'button'); s.setAttribute('tabindex', '0');
    s.setAttribute('aria-label', 'Traduci: ' + s.textContent.replace(/\s+/g, ' ').trim());
    function t() { s.classList.toggle('on'); }
    s.addEventListener('click', t);
    s.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } });
  });

  /* ---------- listino: filtri, frecce, cartellini che oscillano ---------- */
  var rail = document.getElementById('rail');
  if (rail) {
    var tags = Array.prototype.slice.call(rail.querySelectorAll('.tag'));
    document.querySelectorAll('.filtri button').forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-f');
        document.querySelectorAll('.filtri button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        tags.forEach(function (t) { t.hidden = !(f === 'tutto' || t.getAttribute('data-cat') === f); });
        rail.scrollTo({ left: 0, behavior: reduce ? 'auto' : 'smooth' });
        kickAll(6);
      });
    });
    document.querySelectorAll('[data-rail]').forEach(function (b) {
      b.addEventListener('click', function () {
        var card = tags.find(function (t) { return !t.hidden; });
        var step = card ? card.getBoundingClientRect().width + 30 : 300;
        rail.scrollBy({ left: step * Number(b.getAttribute('data-rail')), behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    // rotella verticale -> orizzontale solo finché il binario può scorrere
    rail.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      var max = rail.scrollWidth - rail.clientWidth;
      if ((e.deltaY > 0 && rail.scrollLeft < max - 1) || (e.deltaY < 0 && rail.scrollLeft > 0)) { e.preventDefault(); rail.scrollLeft += e.deltaY; }
    }, { passive: false });

    // pendolo smorzato per ogni cartellino
    var phys = tags.map(function (t) { return { el: t, a: 0, v: 0 }; });
    var raf = 0;
    function step() {
      var moving = false;
      phys.forEach(function (p) {
        p.v += -p.a * .05; p.v *= .9; p.a = Math.max(-10, Math.min(10, p.a + p.v));
        if (Math.abs(p.a) > .02 || Math.abs(p.v) > .02) moving = true; else { p.a = 0; p.v = 0; }
        p.el.style.transform = p.a ? 'rotate(' + p.a.toFixed(2) + 'deg)' : '';
      });
      raf = moving ? requestAnimationFrame(step) : 0;
    }
    function kick(p, f) { if (reduce) return; p.v += f; if (!raf) raf = requestAnimationFrame(step); }
    function kickAll(f) { phys.forEach(function (p, i) { kick(p, f * (i % 2 ? -.7 : 1)); }); }
    var lastX = null;
    rail.addEventListener('pointermove', function (e) {
      if (lastX === null) { lastX = e.clientX; return; }
      var vx = e.clientX - lastX; lastX = e.clientX;
      phys.forEach(function (p) {
        var b = p.el.getBoundingClientRect();
        if (e.clientX > b.left && e.clientX < b.right && e.clientY > b.top) kick(p, Math.max(-1.4, Math.min(1.4, vx * .08)));
      });
    });
    rail.addEventListener('pointerleave', function () { lastX = null; });
    var lastS = rail.scrollLeft;
    rail.addEventListener('scroll', function () {
      var d = rail.scrollLeft - lastS; lastS = rail.scrollLeft;
      phys.forEach(function (p) { kick(p, Math.max(-.6, Math.min(.6, -d * .015))); });
    }, { passive: true });
  }

  /* ---------- movimento: Lenis + rivelazioni ---------- */
  if (!gs || !ST || reduce) {
    swaps.forEach(function (s) {
      if (!('IntersectionObserver' in window)) return;
      new IntersectionObserver(function (en) { if (en[0].isIntersecting) s.classList.add('on'); }, { threshold: 1 }).observe(s);
    });
    return;
  }
  gs.registerPlugin(ST);
  root.classList.add('js');

  if (window.Lenis) {
    var lenis = new window.Lenis({ lerp: .11, smoothWheel: true });
    window.gpLenis = lenis;
    lenis.on('scroll', ST.update);
    gs.ticker.add(function (t) { lenis.raf(t * 1000); });
    gs.ticker.lagSmoothing(0);
    // il binario orizzontale gestisce la sua rotella
    if (rail) rail.setAttribute('data-lenis-prevent-wheel', '');
  }

  ST.batch('.rv', {
    start: 'top 92%', once: true,
    onEnter: function (els) { gs.to(els, { opacity: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .07, overwrite: true }); },
  });
  // titoli dell'intestazione subito visibili con un piccolo slancio
  gs.utils.toArray('.home-h1, .ed-head h1, .listino-head h1, .dove-col h1').forEach(function (h) {
    gs.fromTo(h, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, ease: 'power4.out', delay: .15 });
  });
  swaps.forEach(function (s) {
    ST.create({ trigger: s, start: 'top 55%', end: 'bottom 20%', onEnter: function () { s.classList.add('on'); }, onLeaveBack: function () { s.classList.remove('on'); } });
  });
  // cartellini: entrano oscillando
  if (rail) {
    gs.from('.tag', { rotate: function (i) { return i % 2 ? -9 : 9; }, y: -30, opacity: 0, duration: 1.1, ease: 'elastic.out(1,.45)', stagger: .06, delay: .25, clearProps: 'transform' });
  }
  // timbri: si imprimono
  gs.utils.toArray('.timbro').forEach(function (t, i) {
    gs.from(t, { scale: 1.6, opacity: 0, duration: .45, ease: 'power4.in', delay: i * .12, scrollTrigger: { trigger: t, start: 'top 90%', once: true } });
  });
})();
