/* Lo stender: grucce in prospettiva che oscillano con lo scorrimento */
(function(){
  var rack = document.querySelector('.rack');
  if (!rack) return;
  var reduce = window.BL && window.BL.reduce;
  var items = Array.prototype.slice.call(rack.querySelectorAll('.hanger'));
  var count = document.querySelector('.rack-ui .count');
  var st = items.map(function(){ return {a: 0, v: 0}; });
  var lastX = rack.scrollLeft, vel = 0, running = false;

  /* Rotazione verso il centro + oscillazione a molla */
  function frame(){
    var r = rack.getBoundingClientRect(), cx = r.left + r.width / 2, settled = true, nearest = 0, best = 1e9;
    var dx = rack.scrollLeft - lastX; lastX = rack.scrollLeft;
    vel += (dx - vel) * .3;
    items.forEach(function(el, i){
      var b = el.getBoundingClientRect(), c = b.left + b.width / 2;
      var d = Math.max(-1, Math.min(1, (c - cx) / (r.width / 2)));
      if (Math.abs(c - cx) < best) { best = Math.abs(c - cx); nearest = i; }
      if (reduce) return;
      var s = st[i];
      s.v += (-vel * .45 - s.a * 0.09) - s.v * .2;   /* forza dallo scorrimento, ritorno elastico, attrito */
      s.a += s.v * .5;
      s.a = Math.max(-9, Math.min(9, s.a));
      if (Math.abs(s.a) > .05 || Math.abs(s.v) > .05) settled = false;
      el.style.setProperty('--ry', (d * -38).toFixed(2) + 'deg');
      el.style.setProperty('--sw', s.a.toFixed(2) + 'deg');
    });
    if (count) count.textContent = ('0' + (nearest + 1)).slice(-2) + ' / ' + ('0' + items.length).slice(-2);
    if (Math.abs(vel) > .05) settled = false;
    if (!settled) requestAnimationFrame(frame); else running = false;
  }
  function kick(){ if (!running) { running = true; requestAnimationFrame(frame); } }
  rack.addEventListener('scroll', kick, {passive: true});
  window.addEventListener('resize', kick);
  kick();

  /* Passaggio del mouse: la gruccia si muove come se la sfiorassi */
  items.forEach(function(el, i){
    el.addEventListener('pointerenter', function(e){
      if (reduce || e.pointerType !== 'mouse') return;
      st[i].v += (e.movementX || 2) > 0 ? 1.6 : -1.6; kick();
    });
  });

  /* Trascinamento con il mouse (il touch usa lo scroll nativo) */
  var drag = null, moved = false;
  rack.addEventListener('pointerdown', function(e){
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = {x: e.clientX, s: rack.scrollLeft}; moved = false;
  });
  window.addEventListener('pointermove', function(e){
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) { moved = true; rack.classList.add('dragging'); }
    if (moved) rack.scrollLeft = drag.s - dx;
  });
  window.addEventListener('pointerup', function(){ drag = null; setTimeout(function(){ rack.classList.remove('dragging'); }, 0); });
  rack.addEventListener('click', function(e){ if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  /* Rotella verticale → scorrimento orizzontale finché lo stender può scorrere */
  rack.addEventListener('wheel', function(e){
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    var max = rack.scrollWidth - rack.clientWidth;
    if ((e.deltaY > 0 && rack.scrollLeft < max - 1) || (e.deltaY < 0 && rack.scrollLeft > 1)) {
      e.preventDefault(); rack.scrollLeft += e.deltaY;
    }
  }, {passive: false});

  /* Pulsanti precedente / successivo (alternativa al trascinamento) */
  function go(dir){
    var r = rack.getBoundingClientRect(), cx = r.left + r.width / 2, idx = 0, best = 1e9;
    items.forEach(function(el, i){ var b = el.getBoundingClientRect(), d = Math.abs(b.left + b.width / 2 - cx); if (d < best) { best = d; idx = i; } });
    focusItem(Math.max(0, Math.min(items.length - 1, idx + dir)));
  }
  function focusItem(i){
    var el = items[i], r = rack.getBoundingClientRect(), b = el.getBoundingClientRect();
    rack.scrollBy({left: b.left + b.width / 2 - (r.left + r.width / 2), behavior: reduce ? 'auto' : 'smooth'});
  }
  var prevB = document.querySelector('[data-rack="prev"]'), nextB = document.querySelector('[data-rack="next"]');
  if (prevB) prevB.addEventListener('click', function(){ go(-1); });
  if (nextB) nextB.addEventListener('click', function(){ go(1); });
  rack.addEventListener('keydown', function(e){
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var cur = items.indexOf(document.activeElement.closest('.hanger'));
    if (cur < 0) return;
    e.preventDefault();
    var n = Math.max(0, Math.min(items.length - 1, cur + (e.key === 'ArrowRight' ? 1 : -1)));
    items[n].querySelector('.garment').focus({preventScroll: true}); focusItem(n);
  });

  /* Filtri: portano alla prima gruccia della categoria e attenuano le altre */
  document.querySelectorAll('[data-filter]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var f = btn.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(function(o){ o.setAttribute('aria-pressed', o === btn); });
      var first = -1;
      items.forEach(function(el, i){
        var ok = f === 'tutto' || el.dataset.cat === f;
        el.classList.toggle('dim', !ok);
        if (ok && first < 0) first = i;
      });
      if (first >= 0) focusItem(first);
    });
  });

  /* Scheda del capo (dialog) */
  var dlg = document.getElementById('detail');
  rack.addEventListener('click', function(e){
    var g = e.target.closest('.garment');
    if (!g || !dlg) return;
    var h = g.closest('.hanger');
    dlg.querySelector('[data-f="img"]').src = h.dataset.img || '';
    dlg.querySelector('[data-f="img"]').alt = h.dataset.alt || '';
    dlg.querySelector('[data-f="img"]').parentNode.hidden = !h.dataset.img;
    dlg.querySelector('[data-f="ex"]').hidden = h.dataset.example !== '1';
    dlg.querySelector('[data-f="cat"]').textContent = h.dataset.catLabel;
    dlg.querySelector('[data-f="name"]').innerHTML = h.querySelector('.tag b').innerHTML;
    dlg.querySelector('[data-f="desc"]').innerHTML = h.dataset.desc;
    var msg = 'Buongiorno, vorrei sapere se avete disponibile: ' + h.dataset.catLabel.toLowerCase() + ' (' + h.querySelector('.tag b').textContent.replace(/\[.*?\]/g, '').trim() + ').';
    dlg.querySelector('[data-f="wa"]').href = 'https://wa.me/39010542234?text=' + encodeURIComponent(msg);
    dlg.showModal();
    dlg.querySelector('.close').focus();
  });
  if (dlg) {
    dlg.querySelector('.close').addEventListener('click', function(){ dlg.close(); });
    dlg.addEventListener('click', function(e){ if (e.target === dlg) dlg.close(); });
  }
})();
