/* Consenso cookie / contenuti esterni — Linee guida Garante Privacy 2021.
   Nessuna richiesta a terzi finché l'utente non sceglie. La X chiude rifiutando. */
(function () {
  'use strict';
  var KEY = 'pi-consent', VERSION = 1, MAX_AGE = 183 * 24 * 3600 * 1000; // ~6 mesi
  var listeners = [];
  var state = read();

  function read() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && s.v === VERSION && Date.now() - s.ts < MAX_AGE) return s;
    } catch (e) {}
    return null;
  }
  function save(external) {
    state = { v: VERSION, ts: Date.now(), external: !!external };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    listeners.forEach(function (fn) { fn(state); });
    hide();
  }

  var box, cats, extBox;
  function build() {
    box = document.createElement('section');
    box.className = 'cc';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-labelledby', 'cc-title');
    box.setAttribute('aria-describedby', 'cc-desc');
    box.hidden = true;
    box.innerHTML =
      '<button type="button" class="cc-x" data-cc="reject" aria-label="Chiudi: accetta solo i cookie tecnici">×</button>' +
      '<h2 id="cc-title">Cookie e contenuti esterni</h2>' +
      '<p id="cc-desc">Questo sito usa solo strumenti tecnici necessari. Con il tuo consenso possiamo mostrare la mappa di OpenStreetMap, che è un servizio esterno. Puoi cambiare idea in ogni momento da “Preferenze cookie” in fondo alla pagina. <a href="cookie.html">Cookie policy</a>.</p>' +
      '<div class="cc-cats" hidden>' +
        '<label><input type="checkbox" checked disabled> <span><strong>Tecnici</strong> — necessari al funzionamento, sempre attivi.</span></label>' +
        '<label><input type="checkbox" id="cc-ext"> <span><strong>Contenuti esterni</strong> — mappa OpenStreetMap (tile scaricati dai server di OpenStreetMap Foundation).</span></label>' +
      '</div>' +
      '<div class="cc-row">' +
        '<button type="button" class="btn btn-line" data-cc="reject">Rifiuta</button>' +
        '<button type="button" class="btn btn-line" data-cc="custom" aria-expanded="false">Personalizza</button>' +
        '<button type="button" class="btn btn-line" data-cc="accept">Accetta tutto</button>' +
      '</div>';
    document.body.appendChild(box);
    cats = box.querySelector('.cc-cats');
    extBox = box.querySelector('#cc-ext');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cc]'); if (!b) return;
      var a = b.getAttribute('data-cc');
      if (a === 'reject') save(false);
      else if (a === 'accept') save(true);
      else if (a === 'custom') {
        if (cats.hidden) { cats.hidden = false; b.textContent = 'Salva scelte'; b.setAttribute('aria-expanded', 'true'); extBox.focus(); }
        else save(extBox.checked);
      }
    });
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') save(false); });
  }
  function show() {
    if (!box) build();
    extBox.checked = !!(state && state.external);
    box.hidden = false;
    var first = box.querySelector('.cc-row .btn');
    if (first) first.focus({ preventScroll: true });
  }
  function hide() { if (box) box.hidden = true; }

  window.PetaliConsent = {
    has: function (cat) { return !!(state && state[cat]); },
    onChange: function (fn) { listeners.push(fn); },
    open: show
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-consent-open]').forEach(function (el) {
      el.addEventListener('click', show);
    });
    if (!state) { build(); box.hidden = false; }
  });
})();
