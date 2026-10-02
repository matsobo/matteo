#!/usr/bin/env python3
"""Impacchetta il sito multipagina di Borgo Car in un unico file HTML autonomo.
Le pagine diventano sezioni mostrate una alla volta (navigazione con #officina, #storia, ...);
CSS, JS, font e immagini sono incorporati. Uso: python3 _tools/borgo-car-singlefile.py"""
import base64, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "borgo-car"
OUT = ROOT / "borgo-car-demo.html"

PAGES = [("index", "officina"), ("storia", "storia"), ("lavorazioni", "lavorazioni"),
         ("contatti", "contatti"), ("privacy", "privacy"), ("cookie", "cookie"), ("crediti", "crediti")]
SLUG = dict(PAGES)

def read(p): return (SRC / p).read_text(encoding="utf-8")
def b64(p, mime): return f"data:{mime};base64," + base64.b64encode((SRC / p).read_bytes()).decode()

def relink(html):
    """file.html#ancora -> #ancora ; file.html -> #pagina"""
    def rep(m):
        page, anchor = m.group(1), m.group(2)
        return f'href="{anchor}"' if anchor else f'href="#{SLUG[page]}"'
    return re.sub(r'href="(index|storia|lavorazioni|contatti|privacy|cookie|crediti)\.html(#[\w-]+)?"', rep, html)

def js(p):
    return read(p).replace("</script", "<\\/script")

# ---------- CSS con font e immagini incorporati ----------
css = read("assets/css/style.css")
for f in re.findall(r'url\(\.\./fonts/([^)]+)\)', css):
    css = css.replace(f"url(../fonts/{f})", f"url({b64('assets/fonts/' + f, 'font/woff2')})")
leaflet_css = read("assets/vendor/leaflet/leaflet.css")

# ---------- pagine ----------
index = read("index.html")
titles, sections = {}, []
for fname, slug in PAGES:
    html = read(f"{fname}.html")
    titles[slug] = re.search(r"<title>(.*?)</title>", html).group(1)
    sheet = re.search(r'<main id="main" class="sheet">(.*?)</main>', html, re.S).group(1)
    hidden = "" if slug == "officina" else " hidden"
    sections.append(f'<div class="sheet" data-page="{slug}" tabindex="-1"{hidden}>{sheet}</div>')
body_pages = relink("\n".join(sections))

def between(a, b, s=index):
    i = s.index(a); j = s.index(b, i)
    return s[i:j]

head_meta = between('<meta charset="utf-8">', '<link rel="icon"')
jsonld = re.search(r'(<script type="application/ld\+json">.*?</script>)', index, re.S).group(1)
chrome_top = relink(between('<a class="skip"', '<div class="page">').replace(' aria-current="page"', ''))
footer = relink(between('<footer class="foot">', '</footer>') + "</footer>")
bottom = relink(between('<nav class="mbar"', '<script src="assets/js/consent.js"'))

for img in ("prima.jpg", "dopo.jpg"):
    body_pages = body_pages.replace(f'src="assets/img/{img}"', f'src="{b64("assets/img/" + img, "image/jpeg")}"')
favicon = "data:image/svg+xml;base64," + base64.b64encode(read("assets/img/favicon.svg").encode()).decode()
head_meta = head_meta.replace('content="assets/img/dopo.jpg"', 'content=""')

consent = js("assets/js/consent.js").replace('href="cookie.html"', 'href="#cookie"')
main = js("assets/js/main.js").replace("var lenis = new window.Lenis({ lerp: 0.12 });",
                                        "var lenis = new window.Lenis({ lerp: 0.12 }); window.bcLenis = lenis;")

ROUTER = r"""
(function () {
  var TITLES = %s;
  var secs = [].slice.call(document.querySelectorAll('[data-page]'));
  var wipe = document.querySelector('.wipe');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = 'officina', first = true;
  function closeMenu() {
    var mn = document.getElementById('mnav'), mb = document.getElementById('menuBtn');
    if (mn && mn.classList.contains('open')) { mn.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); mb.textContent = 'Indice'; }
  }
  function toTop() {
    if (window.bcLenis) window.bcLenis.scrollTo(0, { immediate: true, force: true }); else window.scrollTo(0, 0);
  }
  function show(name, anchor) {
    secs.forEach(function (s) { s.hidden = s.dataset.page !== name; });
    document.querySelectorAll('.rail a[href^="#"], .mnav a[href^="#"]').forEach(function (a) {
      if (a.getAttribute('href') === '#' + name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = TITLES[name] || TITLES.officina;
    current = name;
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    window.dispatchEvent(new Event('resize'));
    if (window.bcLenis && window.bcLenis.resize) window.bcLenis.resize();
    if (anchor) {
      var y = anchor.getBoundingClientRect().top + window.scrollY - 20;
      if (window.bcLenis) window.bcLenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
    } else toTop();
    if (!first) { var s = document.querySelector('[data-page="' + name + '"]'); s.focus({ preventScroll: true }); }
    first = false;
  }
  function route() {
    var h = decodeURIComponent(location.hash.slice(1));
    if (h === 'main') return;
    var name = h || 'officina', anchor = null;
    if (!document.querySelector('[data-page="' + name + '"]')) {
      var el = h && document.getElementById(h), s = el && el.closest('[data-page]');
      if (s) { name = s.dataset.page; anchor = el; } else name = 'officina';
    }
    closeMenu();
    if (name === current && !first) {
      if (anchor) show(name, anchor);
      return;
    }
    if (first || reduce || !wipe) { show(name, anchor); return; }
    wipe.classList.add('on');
    setTimeout(function () { show(name, anchor); requestAnimationFrame(function () { wipe.classList.remove('on'); }); }, 340);
  }
  addEventListener('hashchange', route);
  route();
})();
""" % (repr(titles).replace("'", '"'),)

out = f"""<!doctype html>
<html lang="it">
<head>
{head_meta}<link rel="icon" href="{favicon}" type="image/svg+xml">
<!-- Borgo Car · demo in file unico. Fonte: cartella borgo-car/ (versione multipagina). -->
<style>
{leaflet_css}
{css}
</style>
{jsonld}
</head>
<body>
{chrome_top}<div class="page">
<main id="main">
{body_pages}
</main>

{footer}
</div>

{bottom}
<script>{consent}</script>
<script>{js("assets/vendor/gsap.min.js")}</script>
<script>{js("assets/vendor/ScrollTrigger.min.js")}</script>
<script>{js("assets/vendor/lenis.min.js")}</script>
<script>{js("assets/vendor/three.min.js")}</script>
<script>{js("assets/vendor/leaflet/leaflet.js")}</script>
<script>{js("assets/js/car-model.js")}</script>
<script>{js("assets/js/car3d.js")}</script>
<script>{main}</script>
<script>{ROUTER}</script>
</body>
</html>
"""
OUT.write_text(out, encoding="utf-8")
print(OUT, round(OUT.stat().st_size / 1024), "KB")
