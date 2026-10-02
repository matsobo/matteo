/* Consenso conforme alle Linee guida Garante 2021:
   X = solo tecnici · Rifiuta / Personalizza / Accetta con pari evidenza ·
   scelta ricordata 6 mesi · revocabile da "Preferenze cookie". */
(function () {
  'use strict';
  var KEY = 'gp-consenso', SIX_MONTHS = 182 * 864e5;
  var box = document.getElementById('consenso');
  var pref = document.getElementById('consenso-pref');
  var ext = document.getElementById('c-ext');

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && Date.now() - v.t < SIX_MONTHS) return v;
    } catch (e) { /* storage non disponibile */ }
    return null;
  }
  var state = read();
  function save(extOk) {
    state = { ext: !!extOk, t: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
    hide();
    document.dispatchEvent(new CustomEvent('gp:consent', { detail: state }));
  }
  function show(withPrefs) {
    if (!box) return;
    box.hidden = false;
    if (pref) pref.hidden = !withPrefs;
    if (ext) ext.checked = !!(state && state.ext);
    var custom = box.querySelector('[data-consent="custom"]');
    if (custom) custom.textContent = withPrefs ? 'Salva scelte' : 'Personalizza';
  }
  function hide() { if (box) box.hidden = true; }

  window.gpConsent = function () { return state; };

  if (box) {
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]'); if (!b) return;
      var a = b.getAttribute('data-consent');
      if (a === 'reject') save(false);
      else if (a === 'accept') save(true);
      else if (a === 'custom') { if (pref && !pref.hidden) save(ext && ext.checked); else show(true); }
    });
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') save(false); });
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-consent-open]')) show(true);
  });
  if (!state) show(false);
})();
