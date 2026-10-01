/* Mappa OpenStreetMap con Leaflet e marker sull'indirizzo del negozio */
(function(){
  var el = document.getElementById('map');
  if (!el || !window.L) return;
  /* Coordinate da fonti online (due valori leggermente diversi): [DA CONFERMARE] */
  var SHOP = [44.4051, 8.9412];
  var map = L.map(el, {scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: false, zoomControl: true}).setView(SHOP, 17);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">contributori di OpenStreetMap</a>'
  }).addTo(map);
  var icon = L.divIcon({className: '', html: '<div class="pin-tag"><span>B</span></div>', iconSize: [44, 44], iconAnchor: [22, 44], popupAnchor: [0, -46]});
  L.marker(SHOP, {icon: icon, title: "Bleummer's, Via Domenico Fiasella 27/R", alt: "Bleummer's"}).addTo(map)
    .bindPopup("<b>Bleummer's</b><br>Via Domenico Fiasella 27/R<br>16121 Genova<br><a href=\"https://www.google.com/maps/dir/?api=1&destination=Via+Domenico+Fiasella+27R+16121+Genova\" target=\"_blank\" rel=\"noopener\">Indicazioni stradali ↗</a>")
    .openPopup();
  /* La rotellina zooma solo dopo un clic sulla mappa, per non bloccare lo scorrimento della pagina */
  map.on('click focus', function(){ map.scrollWheelZoom.enable(); });
  map.on('mouseout blur', function(){ map.scrollWheelZoom.disable(); });
})();
