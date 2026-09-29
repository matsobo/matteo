#!/usr/bin/env python3
"""Unisce le 4 pagine in un unico file autosufficiente: dist/pizza-sbrano.html
Ogni pagina diventa una vista (#/, #/banco, #/storia, #/dove) con CSS isolato,
font, librerie e scena 3D incorporati. Eseguire dopo src/build.py.
"""
import re, base64, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = [("index", "Pizza Sbrano"), ("banco", "Il banco · Pizza Sbrano"), ("storia", "La storia · Pizza Sbrano"), ("dove", "Dove siamo · Pizza Sbrano")]
ROUTE = {"index.html": "#/", "banco.html": "#/banco", "storia.html": "#/storia", "dove.html": "#/dove"}

def read(p): return (ROOT / p).read_text()

def css_file(path):
    p = ROOT / path; s = p.read_text()
    return re.sub(r"url\((\.\./fonts/[^)]+\.woff2)\)",
                  lambda m: "url(data:font/woff2;base64," + base64.b64encode((p.parent / m.group(1)).read_bytes()).decode() + ")", s)

def js_file(path): return read(path).replace("</script", "<\\/script")

# ---------- isolamento CSS: ogni regola della pagina vale solo dentro la sua vista ----------
GLOBAL_HEAD = re.compile(r"^(:root(\[[^\]]*\])*|html|body|\.no-webgl|\.ready|\.js)(?=[\s>]|$)")
def prefix_sel(sel, pre):
    sel = sel.strip()
    m = GLOBAL_HEAD.match(sel)
    if m:
        rest = sel[m.end():].strip()
        return f"{m.group(0)} {pre}" + (f" {rest}" if rest else "")
    return f"{pre} {sel}"

def split_top(s, ch=","):
    out, depth, cur = [], 0, ""
    for c in s:
        if c in "([": depth += 1
        elif c in ")]": depth -= 1
        if c == ch and depth == 0: out.append(cur); cur = ""
        else: cur += c
    out.append(cur); return out

def scope_css(css, pre):
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    out, i = [], 0
    while i < len(css):
        j = css.find("{", i)
        if j < 0: break
        head = css[i:j].strip()
        # trova la graffa di chiusura corrispondente
        depth, k = 1, j + 1
        while depth:
            if css[k] == "{": depth += 1
            elif css[k] == "}": depth -= 1
            k += 1
        body = css[j + 1:k - 1]
        if head.startswith("@media") or head.startswith("@supports"):
            out.append(f"{head}{{{scope_css(body, pre)}}}")
        elif head.startswith("@"):
            out.append(f"{head}{{{body}}}")
        else:
            out.append(",".join(prefix_sel(s, pre) for s in split_top(head)) + "{" + body + "}")
        i = k
    return "\n".join(out)

def between(s, a, b, start=0):
    i = s.index(a, start); j = s.index(b, i + len(a)); return s[i:j + len(b)]

shared_src = read("banco.html")
sprite = between(shared_src, '<svg width="0" height="0"', "</defs></svg>")
bar = between(shared_src, '<header class="bar"', "</header>").replace(' aria-current="page"', "")
sheet = between(shared_src, '<div class="sheet"', "</div>")
dock = between(shared_src, '<nav class="dock"', "</nav>")

styles, views, inits = [], [], []
for key, _ in PAGES:
    h = read(f"{key}.html")
    head = h[:h.index("</head>")]
    page_css = re.findall(r"<style>(.*?)</style>", head, re.S)
    styles.append(f"/* ===== vista: {key} ===== */\n" + scope_css("".join(page_css), f"#p-{key}"))
    body = h[h.index("<body>") + 6:h.index("</body>")]
    for part in (sprite, bar, sheet, dock):
        body = body.replace(part if key == "banco" else part, "")
    body = re.sub(r'<svg width="0" height="0".*?</defs></svg>', "", body, flags=re.S)
    body = re.sub(r'<header class="bar".*?</header>', "", body, flags=re.S)
    body = re.sub(r'<div class="sheet".*?</div>', "", body, count=1, flags=re.S)
    body = re.sub(r'<nav class="dock".*?</nav>', "", body, flags=re.S)
    scripts = re.findall(r"<script>(.*?)</script>", body, re.S)
    body = re.sub(r"<script.*?</script>", "", body, flags=re.S).strip()
    views.append(f'<div class="view" id="p-{key}" data-view="{key}" hidden>\n{body}\n</div>')
    js = scripts[-1].strip()
    assert js.startswith("(function(){") and js.endswith("})();"), key
    inits.append(f"SBPages[{key!r}] = function(){{{js[len('(function(){'):-len('})();')]}}};")

head_extra = between(read("index.html"), '<script type="application/ld+json">', "</script>")

ROUTER = """
(function(){
  const titles = %s;
  const sheet = document.getElementById('sheet');
  let started = false;
  function show(k){
    document.querySelectorAll('[data-view]').forEach(v => v.hidden = v.dataset.view !== k);
    document.querySelectorAll('.menu a, .sheet a').forEach(a => { const on = a.getAttribute('href') === (k === 'index' ? '#/' : '#/' + k); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
    document.title = titles[k];
    sheet.classList.remove('open'); document.body.style.overflow = '';
    document.querySelectorAll('[data-menu]').forEach(x => x.setAttribute('aria-expanded', 'false'));
    window.scrollTo(0, 0);
    if (!SBPages.done[k]) { SBPages.done[k] = true; try { SBPages[k](); } catch (e) { console.error(e); } }
    dispatchEvent(new Event('scroll'));
  }
  function route(){
    const key = location.hash.replace(/^#\\/?/, '') || 'index';
    const k = titles[key] ? key : 'index';
    if (started && document.startViewTransition && !SB.reduced) document.startViewTransition(() => show(k)); else show(k);
    started = true;
  }
  addEventListener('hashchange', route);
  route();
})();
""" % ("{" + ",".join(f"{k!r}:{t!r}" for k, t in PAGES) + "}")

html = f"""<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Pizza Sbrano</title>
<meta name="description" content="Pizza Sbrano, via Carlo Barabino 98r, Genova Foce. Focaccia, pizza e panini a qualunque ora: aperto 24 ore su 24, 7 giorni su 7.">
<meta name="theme-color" content="#efe8da">
<script>(function(){{var r=document.documentElement,t=null;try{{var s=JSON.parse(localStorage.getItem('sbrano-theme'));if(s&&Date.now()-s.at<216e5)t=s.t}}catch(e){{}}if(!t){{var h=new Date().getHours();t=(h>=7&&h<20)?'light':'dark'}}r.dataset.theme=t;r.classList.add('js');var m=document.querySelector('meta[name=theme-color]');if(m&&t==='dark')m.content='#0f0d0b'}})()</script>
{head_extra}
<style>
{css_file("assets/css/fonts.css")}
{css_file("assets/css/site.css")}
{css_file("assets/vendor/leaflet/leaflet.css")}
[hidden]{{display:none!important}}
::view-transition-old(root){{animation:vt-out .35s var(--ease) both}}
::view-transition-new(root){{animation:vt-in .55s var(--ease) both}}
{chr(10).join(styles)}
</style>
</head>
<body>
{sprite}
{bar}
{sheet}
{chr(10).join(views)}
{dock}
<script>{js_file("assets/vendor/gsap.min.js")}</script>
<script>{js_file("assets/js/site.js")}</script>
<script>{js_file("assets/js/focaccia.bundle.js")}</script>
<script>{js_file("assets/vendor/leaflet/leaflet.js")}</script>
<script>
window.SBPages = {{ done: {{}} }};
{chr(10).join(inits)}
{ROUTER}
</script>
</body>
</html>
"""
for a, b in ROUTE.items():
    html = html.replace(f'href="{a}"', f'href="{b}"')
(ROOT / "dist").mkdir(exist_ok=True)
out = ROOT / "dist" / "pizza-sbrano.html"
out.write_text(html)
print(out.relative_to(ROOT), round(len(html) / 1024), "KB")
