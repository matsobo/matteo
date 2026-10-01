"""Crea petali-incantati-singolo.html: tutto in un file (font, CSS, JS, Leaflet inclusi).
Uso: python3 tools/build-singolo.py  (dalla cartella petali-incantati)"""
import base64, re
r = lambda p: open(p, encoding='utf-8').read()
b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()
css = re.sub(r'url\(\.\./fonts/([^)]+)\)', lambda m: 'url(data:font/woff2;base64,' + b64('assets/fonts/' + m.group(1)) + ')', r('assets/css/style.css'))
html = r('index.html')
html = html.replace('href="assets/img/favicon.svg"', 'href="data:image/svg+xml;base64,%s"' % b64('assets/img/favicon.svg'))
html = re.sub(r'<link rel="preload"[^>]*>\n', '', html)
html = html.replace('<link rel="stylesheet" href="assets/css/style.css">', '<style>\n' + css + '\n' + r('assets/vendor/leaflet/leaflet.css') + '\n</style>')
main = r('assets/js/main.js')
a = main.index("    var css = document.createElement('link');"); b = main.index("    s.onload = function () {")
main = main[:a] + "    var s = { set onload(fn) { fn(); } };\n" + main[b:]
main = main.replace("    document.head.appendChild(s);\n  }", "  }", 1)
main = main.replace("L.Icon.Default.imagePath = 'assets/vendor/leaflet/images/';", '')
img = lambda n: 'data:image/png;base64,' + b64('assets/vendor/leaflet/images/' + n)
main = main.replace("L.marker([LAT, LON])", "L.marker([LAT, LON], { icon: L.icon({ iconUrl: '%s', iconRetinaUrl: '%s', shadowUrl: '%s', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }) })" % (img('marker-icon.png'), img('marker-icon-2x.png'), img('marker-shadow.png')))
order = ['assets/js/consent.js', 'assets/vendor/gsap.min.js', 'assets/vendor/ScrollTrigger.min.js', 'assets/vendor/lenis.min.js', 'assets/js/scene3d.js']
for p in order + ['assets/js/main.js']:
    html = html.replace('<script src="%s" defer></script>\n' % p, '')
scripts = ''.join('<script>\n%s\n</script>\n' % r(p).replace('</script', '<\\/script') for p in order + ['assets/vendor/leaflet/leaflet.js'])
scripts += '<script>\n%s\n</script>\n' % main
# immagini (foto) incorporate come data URI
import glob
imgs = {}
for f in sorted(glob.glob('assets/img/peonia/*') + glob.glob('assets/img/mazzi/*')):
    mime = 'image/webp' if f.endswith('.webp') else 'image/png'
    imgs[f] = 'data:%s;base64,%s' % (mime, b64(f))
for f, uri in imgs.items():
    html = html.replace('src="%s"' % f, 'src="%s"' % uri)
import json
scripts = '<script>window.__PI_IMG = %s;</script>\n' % json.dumps({k: v for k, v in imgs.items() if '/mazzi/' in k or 'profondita' in k or 'ombra' in k}) + scripts
html = html.replace('</body>', scripts + '</body>')
open('../petali-incantati-singolo.html', 'w', encoding='utf-8').write(html)
print('ok', len(html))
