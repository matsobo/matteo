/* Bleummer's — script condiviso da tutte le pagine */
(function(){
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.BL = {reduce: reduce};

  /* ---------- Menu (mobile) ---------- */
  var label = document.querySelector('.label');
  var menuBtn = document.querySelector('.menu-btn');
  var setMenu = function(){};
  if (menuBtn) {
    setMenu = function(open){
      label.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open);
      menuBtn.querySelector('.txt').textContent = open ? 'Chiudi' : 'Menu';
      document.body.style.overflow = open ? 'hidden' : '';
    };
    menuBtn.addEventListener('click', function(){ setMenu(!label.classList.contains('open')); });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && label.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
    });
  }

  /* ---------- Orari e stato "aperto ora" (ora di Genova) ---------- */
  var H = {0:[], 1:[[930,1140]], 2:[[540,750],[930,1140]], 3:[[540,750],[930,1140]], 4:[[540,750],[930,1140]], 5:[[540,750],[930,1140]], 6:[[540,750],[930,1140]]};
  var DAYS = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
  function hm(m){ return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }
  function now(){
    try {
      var p = {}; new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/Rome', weekday:'short', hour:'2-digit', minute:'2-digit', hour12:false})
        .formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
      return {d: {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[p.weekday], m: (+p.hour % 24) * 60 + +p.minute};
    } catch (e) { var d = new Date(); return {d: d.getDay(), m: d.getHours() * 60 + d.getMinutes()}; }
  }
  function status(){
    var n = now(), open = null, text;
    H[n.d].forEach(function(r){ if (n.m >= r[0] && n.m < r[1]) open = r; });
    if (open) text = 'Aperto ora · fino alle ' + hm(open[1]);
    else {
      var next = null;
      H[n.d].forEach(function(r){ if (!next && n.m < r[0]) next = 'oggi alle ' + hm(r[0]); });
      for (var i = 1; !next && i < 8; i++) { var d = (n.d + i) % 7; if (H[d].length) next = (i === 1 ? 'domani' : DAYS[d]) + ' alle ' + hm(H[d][0][0]); }
      text = 'Chiuso · riapre ' + next;
    }
    document.querySelectorAll('[data-status]').forEach(function(el){
      el.classList.toggle('is-open', !!open); el.classList.toggle('is-closed', !open);
      el.querySelector('span').textContent = text;
    });
    document.querySelectorAll('[data-day]').forEach(function(tr){ tr.classList.toggle('today', +tr.dataset.day === n.d); });
  }
  status(); setInterval(status, 60000);
  window.BL.isOpen = function(){ var n = now(); return H[n.d].some(function(r){ return n.m >= r[0] && n.m < r[1]; }); };

  /* ---------- Rivelazione all'ingresso ---------- */
  var items = document.querySelectorAll('[data-reveal]');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {rootMargin: '0px 0px -8% 0px'});
    items.forEach(function(el, i){ el.style.transitionDelay = (el.dataset.reveal || 0) + 'ms'; io.observe(el); });
  } else items.forEach(function(el){ el.classList.add('in'); });

  /* ---------- Pagine interne + tenda del camerino ----------
     Il sito è un unico file: ogni pagina è una <section class="view">
     raggiungibile con un indirizzo proprio (#bottega, #storia, ...),
     con cronologia del browser, titolo e voce di menu aggiornati. */
  var views = {}, current = null, curtain = document.querySelector('.curtain');
  document.querySelectorAll('.view').forEach(function(v){ views[v.id] = v; });
  var HOME = 'bottega';
  function routeOf(hash){ var r = (hash || '').replace(/^#\/?/, ''); return views[r] ? r : null; }

  function show(route, fromCurtain){
    if (!views[route]) route = HOME;
    if (route === current) return;
    current = route;
    Object.keys(views).forEach(function(k){ views[k].classList.toggle('active', k === route); });
    document.querySelectorAll('.index a').forEach(function(a){
      if (routeOf(a.getAttribute('href')) === route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = views[route].dataset.title || document.title;
    window.scrollTo(0, 0);
    if (label && label.classList.contains('open')) setMenu(false);
    var h = views[route].querySelector('h1');
    if (h && fromCurtain !== 'init') { h.setAttribute('tabindex', '-1'); h.focus({preventScroll: true}); }
    document.dispatchEvent(new CustomEvent('bl:view', {detail: route}));
    if (fromCurtain === true) openCurtain();
  }
  function openCurtain(){
    requestAnimationFrame(function(){
      curtain.classList.remove('closing');
      void curtain.offsetWidth;
      curtain.classList.add('opening');
    });
  }
  function closeCurtain(done){
    curtain.classList.add('reset'); curtain.classList.remove('opening');
    void curtain.offsetWidth;
    curtain.classList.remove('reset'); curtain.classList.add('closing');
    setTimeout(done, 600);
  }

  document.addEventListener('click', function(e){
    var a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var r = routeOf(a.getAttribute('href'));
    if (!r) return;
    e.preventDefault();
    if (r === current) { if (label && label.classList.contains('open')) setMenu(false); window.scrollTo({top: 0, behavior: reduce ? 'auto' : 'smooth'}); return; }
    if (reduce || !curtain) { location.hash = r; return; }
    closeCurtain(function(){ pendingCurtain = true; location.hash = r; });
  });
  var pendingCurtain = false;
  window.addEventListener('hashchange', function(){
    var r = routeOf(location.hash);
    if (!r) return; /* es. #main del link "vai al contenuto" */
    show(r, pendingCurtain); pendingCurtain = false;
  });
  show(routeOf(location.hash) || HOME, 'init');
})();
