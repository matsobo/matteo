/* Mappa OpenStreetMap con Leaflet e marker sull'indirizzo del negozio */
(function(){
  var el = document.getElementById('map');
  if (!el || !window.L) return;
  /* Coordinate da fonti online (due valori leggermente diversi): [DA CONFERMARE] */
  var SHOP = [44.4051, 8.9412], map = null;
  function init(){
    if (map) { map.invalidateSize(); return; }
    map = L.map(el, {scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: false}).setView(SHOP, 17);
    map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">contributori di OpenStreetMap</a>'
    }).addTo(map);
    /* Se le tile di openstreetmap.org vengono rifiutate (es. file aperto dal disco, senza Referer),
       passa alle tile CARTO, che usano gli stessi dati OpenStreetMap */
    var errors = 0, switched = false;
    osm.on('tileerror', function(){
      if (switched || ++errors < 3) return;
      switched = true; map.removeLayer(osm);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20, subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">contributori di OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map);
    });
    var icon = L.divIcon({className: '', html: '<div class="pin-tag"><span>B</span></div>', iconSize: [44, 44], iconAnchor: [22, 44], popupAnchor: [0, -46]});
    L.marker(SHOP, {icon: icon, title: "Bleummer's, Via Domenico Fiasella 27/R", alt: "Bleummer's"}).addTo(map)
      .bindPopup("<b>Bleummer's</b><br>Via Domenico Fiasella 27/R<br>16121 Genova<br><a href=\"https://www.google.com/maps/dir/?api=1&destination=Via+Domenico+Fiasella+27R%2C+16121+Genova\" target=\"_blank\" rel=\"noopener\">Indicazioni stradali ↗</a>")
      .openPopup();
    map.on('click focus', function(){ map.scrollWheelZoom.enable(); });
    map.on('mouseout blur', function(){ map.scrollWheelZoom.disable(); });
  }
  /* la mappa si crea quando la pagina "Dove siamo" è visibile (serve la sua dimensione reale) */
  document.addEventListener('bl:view', function(e){ if (e.detail === 'dove') setTimeout(init, 30); });
  if (el.offsetWidth) init();
})();
