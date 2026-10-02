/* Consenso cookie / contenuti esterni — Linee guida Garante 2021.
   X = solo tecnici; Rifiuta / Personalizza / Accetta con pari evidenza; revocabile dal footer;
   scelta memorizzata 6 mesi (localStorage, solo tecnico). */
(function () {
  'use strict';
  var KEY = 'forsvapo-consenso';
  var SEI_MESI = 1000 * 60 * 60 * 24 * 182;
  var listeners = [];

  function leggi() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      if (v && Date.now() - v.ts < SEI_MESI) return v;
    } catch (e) {}
    return null;
  }
  function salva(ext) {
    var v = { ext: !!ext, ts: Date.now(), v: 1 };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
    stato = v;
    listeners.forEach(function (fn) { fn(v); });
  }
  var stato = leggi();

  window.Consenso = {
    esterni: function () { return !!(stato && stato.ext); },
    onChange: function (fn) { listeners.push(fn); },
    apri: function () { mostra(true); }
  };

  var box, pref, chk, ultimoFocus;
  function mostra(conPref) {
    if (!box) return;
    ultimoFocus = document.activeElement;
    box.hidden = false;
    if (chk) chk.checked = window.Consenso.esterni();
    if (pref) pref.hidden = !conPref;
    var primo = box.querySelector('[data-consent="reject"]:not(.x)') || box.querySelector('button');
    if (conPref && chk) chk.focus(); else if (primo) primo.focus();
  }
  function chiudi() {
    box.hidden = true;
    if (ultimoFocus && ultimoFocus.focus && document.contains(ultimoFocus)) ultimoFocus.focus();
  }

  document.addEventListener('DOMContentLoaded', function () {
    box = document.getElementById('consenso');
    pref = document.getElementById('consenso-pref');
    chk = document.getElementById('c-ext');
    if (!box) return;

    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (!b) return;
      var a = b.getAttribute('data-consent');
      if (a === 'accept') { salva(true); chiudi(); }
      else if (a === 'reject') { salva(false); chiudi(); }
      else if (a === 'custom') {
        if (pref.hidden) { pref.hidden = false; b.textContent = 'Salva scelte'; chk.focus(); }
        else { salva(chk.checked); chiudi(); b.textContent = 'Personalizza'; }
      }
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { salva(false); chiudi(); }
    });
    document.querySelectorAll('[data-consent-open]').forEach(function (b) {
      b.addEventListener('click', function () { mostra(true); });
    });
    if (!stato) mostra(false);
  });
})();
