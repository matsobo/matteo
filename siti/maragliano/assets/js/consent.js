/* Consenso cookie e contenuti esterni — Linee guida Garante Privacy 2021.
   X = solo tecnici · Accetta / Rifiuta / Personalizza con pari evidenza · revocabile dal footer · validità 6 mesi.
   Nessun cookie: la scelta è salvata in localStorage (strumento tecnico). */
(function () {
  'use strict';
  var KEY = 'maragliano-consenso-v1';
  var DURATA = 182 * 24 * 60 * 60 * 1000; // 6 mesi
  var listeners = [];

  function leggi() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      if (v && v.ts && Date.now() - v.ts < DURATA) return v;
    } catch (e) {}
    return null;
  }
  function salva(esterni) {
    var v = { ts: Date.now(), esterni: !!esterni };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
    chiudi();
    listeners.forEach(function (fn) { try { fn(v); } catch (e) {} });
  }

  var box, cat, chk, ultimoFocus;
  function crea() {
    box = document.createElement('section');
    box.className = 'consenso';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-labelledby', 'consenso-t');
    box.setAttribute('aria-describedby', 'consenso-d');
    box.hidden = true;
    box.innerHTML =
      '<button type="button" class="consenso-x" aria-label="Chiudi: continua solo con i cookie tecnici">×</button>' +
      '<h2 id="consenso-t">Cookie e contenuti esterni</h2>' +
      '<p id="consenso-d">Questo sito usa solo strumenti tecnici. La mappa di OpenStreetMap è un contenuto esterno: si carica soltanto con il tuo consenso o quando la apri tu. Dettagli nella <a href="cookie.html">cookie policy</a>.</p>' +
      '<div class="consenso-azioni">' +
        '<button type="button" data-a="tutto">Accetta tutto</button>' +
        '<button type="button" data-a="rifiuta">Rifiuta</button>' +
        '<button type="button" data-a="personalizza" aria-expanded="false" aria-controls="consenso-cat">Personalizza</button>' +
      '</div>' +
      '<div class="consenso-cat" id="consenso-cat" hidden>' +
        '<label><input type="checkbox" checked disabled><span><b>Tecnici</b><small>Necessari al funzionamento, compresa la memoria di questa scelta. Sempre attivi.</small></span></label>' +
        '<label><input type="checkbox" id="consenso-esterni"><span><b>Contenuti esterni</b><small>Mappa OpenStreetMap: invia il tuo indirizzo IP ai server di OpenStreetMap Foundation.</small></span></label>' +
        '<button type="button" class="salva" data-a="salva">Salva le scelte</button>' +
      '</div>';
    document.body.appendChild(box);
    cat = box.querySelector('#consenso-cat');
    chk = box.querySelector('#consenso-esterni');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('consenso-x')) return salva(false);
      var a = b.getAttribute('data-a');
      if (a === 'tutto') salva(true);
      else if (a === 'rifiuta') salva(false);
      else if (a === 'salva') salva(chk.checked);
      else if (a === 'personalizza') {
        cat.hidden = !cat.hidden;
        b.setAttribute('aria-expanded', String(!cat.hidden));
      }
    });
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') salva(false); });
  }
  function apri(daUtente) {
    if (!box) crea();
    var v = leggi();
    chk.checked = !!(v && v.esterni);
    box.hidden = false;
    if (daUtente) { ultimoFocus = document.activeElement; box.querySelector('[data-a="tutto"]').focus(); }
  }
  function chiudi() {
    if (box) box.hidden = true;
    if (ultimoFocus && ultimoFocus.focus) ultimoFocus.focus();
    ultimoFocus = null;
  }

  window.MaraConsent = {
    get: leggi,
    on: function (fn) { listeners.push(fn); },
    open: function () { apri(true); }
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.js-preferenze').forEach(function (b) {
      b.addEventListener('click', function () { apri(true); });
    });
    if (!leggi()) apri(false);
  });
})();
