/* Pizza Sbrano — comportamento condiviso tra le pagine */
(function () {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.SB = { reduced };

  /* orologio: il forno è sempre aperto, l'ora è quella vera */
  const clocks = document.querySelectorAll('[data-clock]');
  const tick = () => {
    const d = new Date(), s = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    clocks.forEach(c => c.textContent = s);
  };
  tick(); setInterval(tick, 15000);

  /* giorno / notte: automatico sull'ora, scelta manuale valida 6 ore */
  document.querySelectorAll('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('sbrano-theme', JSON.stringify({ t: next, at: Date.now() })); } catch (e) { }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#0f0d0b' : '#efe8da');
    window.dispatchEvent(new CustomEvent('sb:theme', { detail: next }));
  }));

  /* menu mobile */
  const sheet = document.getElementById('sheet');
  document.querySelectorAll('[data-menu]').forEach(b => b.addEventListener('click', () => {
    const open = !sheet.classList.contains('open');
    sheet.classList.toggle('open', open);
    document.querySelectorAll('[data-menu]').forEach(x => x.setAttribute('aria-expanded', open));
    document.body.style.overflow = open ? 'hidden' : '';
  }));

  /* barra: vetro quando si scorre */
  const bar = document.querySelector('.bar[data-scroll]');
  if (bar) { const f = () => bar.classList.toggle('solid', scrollY > 30); addEventListener('scroll', f, { passive: true }); f(); }

  /* comparsa degli elementi */
  const els = document.querySelectorAll('.rise');
  if (reduced || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.remove('rise')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, d = +(el.dataset.d || 0);
    el.animate([{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: d, easing: 'cubic-bezier(.22,.8,.2,1)', fill: 'forwards' })
      .finished.then(() => { el.classList.remove('rise'); el.getAnimations().forEach(a => a.cancel()); });
    io.unobserve(el);
  }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
})();
