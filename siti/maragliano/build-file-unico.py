# Genera siti/export/maragliano-dal-1920.html: tutto il sito in un solo file HTML (CSS, JS, font e immagini inline).
import re, base64, pathlib
R = pathlib.Path('/home/user/matteo/siti/maragliano')
def b64(p, mime): return f"data:{mime};base64," + base64.b64encode((R/p).read_bytes()).decode()
def rd(p): return (R/p).read_text(encoding='utf-8')

html = rd('index.html')

# --- CSS: font e immagini inline
css = rd('assets/css/style.css')
css = re.sub(r'url\("\.\./fonts/([^"]+)"\)', lambda m: f'url("{b64("assets/fonts/"+m.group(1), "font/woff2")}")', css)
lcss = rd('assets/vendor/leaflet/leaflet.css')
lcss = re.sub(r'url\(images/([^)]+)\)', lambda m: f'url("{b64("assets/vendor/leaflet/images/"+m.group(1), "image/png")}")', lcss)
legali_css = """
.legali{border-top:2px solid var(--inchiostro)}
.legali details{border-bottom:1px dashed var(--inchiostro);padding:6px 0}
.legali summary{cursor:pointer;font-family:var(--testo);font-weight:800;text-transform:uppercase;letter-spacing:.03em;font-size:1.05rem;padding:14px 0;min-height:44px}
.legali summary:hover{color:var(--rosso)}
.legali .doc{padding:8px 0 28px;max-width:78ch}
.legali .doc h1{font-size:clamp(1.8rem,3.5vw,2.6rem)}
"""
html = html.replace('<link rel="stylesheet" href="assets/css/style.css">', '<style>\n' + css + legali_css + '\n</style>')
html = html.replace('<link rel="stylesheet" href="assets/vendor/leaflet/leaflet.css">', '<style>\n' + lcss + '\n</style>')
html = html.replace('<link rel="preload" href="assets/fonts/ultra-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>\n', '')
html = html.replace('<meta property="og:image" content="assets/img/burger.svg">\n', '')

# --- immagini SVG inline
MIMES = {'svg':'image/svg+xml','webp':'image/webp','jpg':'image/jpeg','png':'image/png'}
html = re.sub(r'(src|href|content)="assets/img/([^"]+\.(svg|webp|jpg|png))"', lambda m: f'{m.group(1)}="{b64("assets/img/"+m.group(2), MIMES[m.group(3)])}"' if m.group(1)!='content' else '', html)
html = html.replace('<meta property="og:image" >\n', '').replace('<meta property="og:image" >', '')

# --- script: tolti dalla head, inline in fondo al body nello stesso ordine
srcs = re.findall(r'<script src="([^"]+)" defer></script>\n', html)
html = re.sub(r'<script src="[^"]+" defer></script>\n', '', html)
main_js = rd('assets/js/main.js')
icon = "L.icon({iconUrl:'%s',iconRetinaUrl:'%s',shadowUrl:'%s',iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowSize:[41,41]})" % (
  b64('assets/vendor/leaflet/images/marker-icon.png','image/png'), b64('assets/vendor/leaflet/images/marker-icon-2x.png','image/png'), b64('assets/vendor/leaflet/images/marker-shadow.png','image/png'))
main_js = main_js.replace("    L.Icon.Default.imagePath = 'assets/vendor/leaflet/images/';\n", "")
main_js = main_js.replace("{ alt: 'Maragliano, Via Innocenzo Frugoni 15r' }", "{ alt: 'Maragliano, Via Innocenzo Frugoni 15r', icon: " + icon + " }")
apri = """
/* Versione file unico: le note legali sono sezioni apribili nella pagina */
(function () {
  function apri() {
    var id = location.hash.slice(1); if (!id) return;
    var d = document.getElementById(id);
    if (d && d.tagName === 'DETAILS') { d.open = true; d.scrollIntoView(); }
  }
  window.addEventListener('hashchange', apri); apri();
  // lo scroll fluido intercetta i link interni: apre la sezione prima che lo faccia
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    var d = document.getElementById(a.getAttribute('href').slice(1));
    if (d && d.tagName === 'DETAILS') d.open = true;
  }, true);
})();
"""
blocchi = []
for s in srcs:
    code = main_js if s == 'assets/js/main.js' else rd(s)
    assert '</script' not in code.lower()
    blocchi.append(f'<script>/* {s} */\n{code}\n</script>')
blocchi.append('<script>' + apri + '</script>')

# --- pagine legali come <details> dentro la pagina
pagine = [('privacy','privacy.html','Informativa privacy'),('cookie','cookie.html','Cookie policy'),('accessibilita','accessibilita.html','Accessibilità'),('crediti','crediti.html','Crediti e licenze')]
sez = ['<section class="sez legali" aria-labelledby="legali-t">','<h2 class="titolo" id="legali-t">Note <em>legali</em></h2>',
       '<p class="avviso">Bozze da far validare a un professionista prima della pubblicazione. I dati tra [DA CONFERMARE] vanno verificati con il titolare.</p>']
for pid, f, tit in pagine:
    body = re.search(r'<main id="contenuto" class="doc">(.*)</main>', rd(f), re.S).group(1)
    body = re.sub(r'<p><a class="indietro".*?</p>\n', '', body)
    body = re.sub(r'<p class="avviso">.*?</p>\n', '', body, flags=re.S)
    body = re.sub(r'<p><a href="privacy.html">Privacy</a>.*?</p>\n', '', body, flags=re.S)
    body = re.sub(r'<h1>.*?</h1>\n', '', body)
    sez.append(f'<details id="{pid}"><summary>{tit}</summary><div class="doc">{body}</div></details>')
sez.append('</section>')
html = html.replace('</main>\n\n<footer>', '\n'.join(sez) + '\n</main>\n\n<footer>')
html = html.replace('</body>', '\n'.join(blocchi) + '\n</body>')
for pid, f, _ in pagine:
    html = html.replace(f'href="{f}"', f'href="#{pid}"')
assert not re.search(r'href="(privacy|cookie|crediti|accessibilita|index)\.html"', html)
assert 'assets/' not in re.sub(r'/\* assets/[^*]+\*/', '', html), [m for m in re.findall(r'.{40}assets/.{40}', html)][:5]
out = R.parent / 'export' / 'maragliano-dal-1920.html'
out.write_text(html, encoding='utf-8')
print(out, round(out.stat().st_size/1024), 'KB')
