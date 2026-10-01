/* Storia: metro da sarta che scorre con il registro + punti sulla foto della vetrina */
(function(){
  var reduce = window.BL && window.BL.reduce;

  /* ---------- Metro da sarta: un anno = un centimetro (40px) ---------- */
  var tape = document.querySelector('.tape'), pin = document.querySelector('.tape-pin'), ledger = document.querySelector('.ledger');
  if (tape && ledger) {
    var Y0 = 1964, Y1 = new Date().getFullYear(), STEP = 40, html = '';
    for (var y = Y0; y <= Y1; y++) {
      html += '<div class="tick' + (y % 10 === 0 ? ' dec' : '') + '">' + (y % 5 === 0 || y === Y0 || y === Y1 ? '<b>' + y + '</b>' : '') + '</div>';
    }
    tape.innerHTML = html;
    var update = function(){
      var r = ledger.getBoundingClientRect();
      var p = Math.max(0, Math.min(1, (120 - r.top) / Math.max(1, r.height - innerHeight * .5)));
      var yr = Y0 + p * (Y1 - Y0);
      tape.style.transform = (reduce ? '' : 'rotateY(-24deg) ') + 'translateY(' + (-(yr - Y0) * STEP).toFixed(1) + 'px)';
      pin.textContent = Math.round(yr);
    };
    update();
    window.addEventListener('scroll', update, {passive: true});
    window.addEventListener('resize', update);
    document.addEventListener('bl:view', function(e){ if (e.detail === 'storia') update(); });
  }

  /* ---------- Punti sulla foto della vetrina ---------- */
  var spots = document.querySelectorAll('.spot'), rows = document.querySelectorAll('.spot-list button');
  function select(i){
    spots.forEach(function(s, k){ s.classList.toggle('on', k === i); s.setAttribute('aria-pressed', k === i); });
    rows.forEach(function(r, k){ r.classList.toggle('on', k === i); r.setAttribute('aria-pressed', k === i); });
  }
  spots.forEach(function(s, i){ s.addEventListener('click', function(){ select(i); }); });
  rows.forEach(function(r, i){
    r.addEventListener('click', function(){ select(i); });
    r.addEventListener('mouseenter', function(){ spots[i].classList.add('on'); });
    r.addEventListener('mouseleave', function(){ if (!r.classList.contains('on')) spots[i].classList.remove('on'); });
  });
})();
