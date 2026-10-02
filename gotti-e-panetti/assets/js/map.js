/* Mappa Leaflet + OpenStreetMap, caricata solo dopo clic o consenso "Contenuti esterni". */
(function () {
  'use strict';
  var el = document.getElementById('mappa'), gate = document.getElementById('mappa-gate'), btn = document.getElementById('mappa-load');
  if (!el || !window.L) return;
  var LAT = 44.40302, LNG = 8.94084, loaded = false; // via Domenico Fiasella: punto da verificare sul civico 28R

  function load() {
    if (loaded) return; loaded = true;
    if (gate) gate.hidden = true;
    var map = L.map(el, { scrollWheelZoom: false, zoomControl: true }).setView([LAT, LNG], 17);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    var icon = L.divIcon({
      className: '', iconSize: [44, 58], iconAnchor: [22, 56], popupAnchor: [0, -50],
      html: '<svg class="pin-gp" viewBox="0 0 44 58" aria-hidden="true"><path d="M22 57C22 57 2 33 2 21a20 20 0 0 1 40 0c0 12-20 36-20 36Z" fill="#b0142b" stroke="#161412" stroke-width="2"/><circle cx="22" cy="21" r="11" fill="#faf7f2"/><text x="22" y="25.5" text-anchor="middle" font-family="Courier Prime,monospace" font-weight="700" font-size="11" fill="#b0142b">G&amp;P</text></svg>',
    });
    L.marker([LAT, LNG], { icon: icon, title: 'Gotti e Panetti, Via Domenico Fiasella 28R', alt: 'Gotti e Panetti' })
      .addTo(map)
      .bindPopup('<strong>Gotti e Panetti</strong><br>Via Domenico Fiasella 28R<br>16121 Genova<br><a href="https://www.google.com/maps/dir/?api=1&destination=Affetteria%20Gotti%20e%20Panetti%2C%20Via%20Domenico%20Fiasella%2028R%2C%2016121%20Genova" target="_blank" rel="noopener">Indicazioni</a>')
      .openPopup();
  }
  if (btn) btn.addEventListener('click', load);
  var s = window.gpConsent && window.gpConsent();
  if (s && s.ext) load();
  document.addEventListener('gp:consent', function (e) { if (e.detail && e.detail.ext) load(); });
})();
