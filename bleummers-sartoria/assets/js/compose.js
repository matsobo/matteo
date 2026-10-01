/* Scrivi al negozio: compone un messaggio WhatsApp o email (nessun server) */
(function(){
  var f = document.getElementById('compose');
  if (!f) return;
  function val(n){ return f.elements[n].value.trim(); }
  function check(){
    var ok = true;
    [['nome', 'Scrivi il tuo nome.'], ['msg', 'Scrivi cosa ti serve (almeno 10 caratteri).']].forEach(function(r){
      var v = val(r[0]), bad = r[0] === 'msg' ? v.length < 10 : v.length < 2;
      f.querySelector('#' + r[0] + '-err').textContent = bad ? r[1] : '';
      f.elements[r[0]].setAttribute('aria-invalid', bad);
      if (bad && ok) { f.elements[r[0]].focus(); ok = false; }
    });
    return ok;
  }
  function text(){ return 'Buongiorno, sono ' + val('nome') + '. ' + val('msg'); }
  f.querySelector('[data-send="wa"]').addEventListener('click', function(){
    if (check()) window.open('https://wa.me/39010542234?text=' + encodeURIComponent(text()), '_blank', 'noopener');
  });
  f.querySelector('[data-send="mail"]').addEventListener('click', function(){
    if (check()) location.href = 'mailto:EMAIL-DA-CONFERMARE@esempio.it?subject=' + encodeURIComponent('Richiesta dal sito') + '&body=' + encodeURIComponent(text());
  });
  f.addEventListener('submit', function(e){ e.preventDefault(); });
})();
