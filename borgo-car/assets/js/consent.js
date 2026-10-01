/* Consenso per i contenuti esterni (Linee guida Garante 2021):
   X = solo tecnici · Rifiuta / Personalizza / Accetta con pari evidenza · revocabile dal footer · scadenza 6 mesi. */
(function () {
  var KEY = 'bc-consent', SIX_MONTHS = 1000 * 60 * 60 * 24 * 182;
  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && Date.now() - v.ts < SIX_MONTHS) return v;
    } catch (e) {}
    return null;
  }
  function save(ext) {
    var v = { ext: !!ext, ts: Date.now(), v: 1 };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
    window.bcConsent = v;
    document.dispatchEvent(new CustomEvent('bc:consent', { detail: v }));
    close();
  }
  window.bcConsent = read();

  var box, opener;
  function build() {
    box = document.createElement('section');
    box.className = 'consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-labelledby', 'cs-t');
    box.setAttribute('aria-describedby', 'cs-d');
    box.innerHTML =
      '<button type="button" class="x" data-c="x" aria-label="Chiudi: solo contenuti tecnici">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '<h2 id="cs-t">Prima di continuare</h2>' +
      '<p id="cs-d">Il sito non usa cookie di profilazione. L\'unico contenuto esterno è la mappa di OpenStreetMap, che riceverebbe il tuo indirizzo IP. ' +
      'Dettagli nella <a href="cookie.html">cookie policy</a>.</p>' +
      '<fieldset hidden id="cs-f"><legend>Categorie</legend>' +
      '<label><input type="checkbox" checked disabled> Tecnici: necessari, sempre attivi</label>' +
      '<label><input type="checkbox" id="cs-ext"> Contenuti esterni: mappa OpenStreetMap</label></fieldset>' +
      '<div class="row">' +
      '<button type="button" class="btn line" data-c="no">Rifiuta</button>' +
      '<button type="button" class="btn line" data-c="custom" aria-expanded="false" aria-controls="cs-f">Personalizza</button>' +
      '<button type="button" class="btn line" data-c="yes">Accetta tutto</button></div>';
    document.body.appendChild(box);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]'); if (!b) return;
      var c = b.dataset.c, f = box.querySelector('#cs-f');
      if (c === 'x' || c === 'no') save(false);
      else if (c === 'yes') save(true);
      else if (c === 'custom') {
        if (f.hidden) { f.hidden = false; b.textContent = 'Salva scelte'; b.setAttribute('aria-expanded', 'true'); box.querySelector('#cs-ext').focus(); }
        else save(box.querySelector('#cs-ext').checked);
      }
    });
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') save(false); });
  }
  function open(fromUser) {
    if (!box) build();
    var f = box.querySelector('#cs-f'), ext = box.querySelector('#cs-ext');
    ext.checked = !!(window.bcConsent && window.bcConsent.ext);
    if (fromUser) { f.hidden = false; var b = box.querySelector('[data-c=custom]'); b.textContent = 'Salva scelte'; b.setAttribute('aria-expanded', 'true'); }
    box.hidden = false;
    if (fromUser) box.querySelector('h2').setAttribute('tabindex', '-1'), box.querySelector('h2').focus();
  }
  function close() { if (box) box.hidden = true; if (opener) { opener.focus(); opener = null; } }

  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-consent-open]');
    if (o) { opener = o; open(true); }
  });
  function init() { if (!window.bcConsent) open(false); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
