#!/usr/bin/env python3
"""Compone le pagine: src/pages/*.html + parti condivise -> ../*.html
Segnaposto: {{HEAD title|description}}, {{BAR page}}, {{BAR page scroll}}, {{SPRITE}}, {{SHEET}}, {{DOCK}}, {{FOOT}}
"""
import re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / "src" / "pages"

ADDR_Q = "Pizza+Sbrano%2C+Via+Carlo+Barabino+98r%2C+16129+Genova"
LINKS = {
    "gdir": f"https://www.google.com/maps/dir/?api=1&destination={ADDR_Q}",
    "gsearch": f"https://www.google.com/maps/search/?api=1&query={ADDR_Q}",
    "trip": "https://www.tripadvisor.it/Restaurant_Review-g187823-d11772301-Reviews-Pizza_Sbrano-Genoa_Italian_Riviera_Liguria.html",
    "tel": "tel:+393319428164",
}

NAV = [("index", "index.html", "Vetrina", "00"), ("banco", "banco.html", "Il banco", "01"),
       ("storia", "storia.html", "La storia", "02"), ("dove", "dove.html", "Dove", "03")]

def head(title, desc):
    return f"""<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:locale" content="it_IT">
<meta name="theme-color" content="#efe8da">
<link rel="stylesheet" href="assets/css/fonts.css">
<link rel="stylesheet" href="assets/css/site.css">
<script>(function(){{var r=document.documentElement,t=null;try{{var s=JSON.parse(localStorage.getItem('sbrano-theme'));if(s&&Date.now()-s.at<216e5)t=s.t}}catch(e){{}}if(!t){{var h=new Date().getHours();t=(h>=7&&h<20)?'light':'dark'}}r.dataset.theme=t;r.classList.add('js');var m=document.querySelector('meta[name=theme-color]');if(m&&t==='dark')m.content='#0f0d0b'}})()</script>"""

SPRITE = """<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="i-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
<symbol id="i-ext" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></symbol>
<symbol id="i-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></symbol>
<symbol id="i-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 19-9-9 19-2-8-8-2Z"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></symbol>
<symbol id="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></symbol>
<symbol id="i-star" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></symbol>
<symbol id="i-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></symbol>
<symbol id="i-rotate" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></symbol>
<symbol id="i-hand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></symbol>
</defs></svg>"""

def bar(page, scroll=False):
    cur = ' aria-current="page"'
    links = "".join(
        f'<a href="{href}"{cur if key == page else ""}>{label}</a>' for key, href, label, _ in NAV)
    return f"""<header class="bar"{" data-scroll" if scroll else ""}>
  <a class="brand" href="index.html" aria-label="Pizza Sbrano, home"><b>Sbrano</b><span>Foce · Genova</span></a>
  <nav class="menu" aria-label="Pagine">{links}</nav>
  <div class="bar-right">
    <span class="status" title="Aperto 24 ore su 24"><i></i><span class="lbl">Aperto ·</span> <span data-clock>--:--</span></span>
    <button class="theme-btn" data-theme-toggle aria-label="Passa da giorno a notte"><svg class="sun"><use href="#i-sun"/></svg><svg class="moon"><use href="#i-moon"/></svg></button>
    <button class="menu-btn" data-menu aria-expanded="false" aria-controls="sheet">Menu</button>
  </div>
</header>"""

def sheet():
    links = "".join(f'<a href="{href}"><small>{n}</small>{label}</a>' for _, href, label, n in NAV)
    return f"""<div class="sheet" id="sheet" role="dialog" aria-label="Menu">
  <button class="menu-btn close" data-menu style="display:inline-flex" aria-label="Chiudi il menu"><svg class="ico"><use href="#i-x"/></svg></button>
  {links}
  <p class="mono" style="margin-top:auto;color:var(--ink-2)">Via Carlo Barabino 98r · 16129 Genova · sempre aperto</p>
</div>"""

DOCK = f"""<nav class="dock" aria-label="Azioni rapide">
  <a href="{LINKS['tel']}"><svg class="ico"><use href="#i-phone"/></svg>Chiama</a>
  <a class="main" href="{LINKS['gdir']}" target="_blank" rel="noopener"><svg class="ico"><use href="#i-nav"/></svg>Portami lì</a>
  <a href="{LINKS['trip']}" target="_blank" rel="noopener"><svg class="ico"><use href="#i-star"/></svg>Recensioni</a>
</nav>"""

FOOT = f"""<footer class="foot">
  <div>
    <span class="big" aria-hidden="true">Sbrano</span>
    <p>Pizza Sbrano · Via Carlo Barabino 98r, 16129 Genova<br>Aperto 24 ore su 24, tutti i giorni.</p>
    <p style="margin-top:10px">Ragione sociale e P.IVA <span class="tbc">da confermare</span></p>
  </div>
  <div><h4>Pagine</h4><ul>{"".join(f'<li><a href="{h}">{l}</a></li>' for _, h, l, _n in NAV)}</ul></div>
  <div><h4>Fuori di qui</h4><ul>
    <li><a href="{LINKS['gsearch']}" target="_blank" rel="noopener">Google Maps</a></li>
    <li><a href="{LINKS['trip']}" target="_blank" rel="noopener">TripAdvisor</a></li>
    <li><a href="https://www.facebook.com/107380938220185" target="_blank" rel="noopener">Facebook</a></li>
  </ul><p style="margin-top:14px;font-size:.8rem">La focaccia 3D è un'illustrazione generata al computer, non una foto del negozio.</p></div>
</footer>"""

def render(src):
    def rep(m):
        tag, arg = m.group(1), (m.group(2) or "").strip()
        if tag == "HEAD":
            t, d = arg.split("|", 1); return head(t.strip(), d.strip())
        if tag == "BAR":
            parts = arg.split(); return bar(parts[0], "scroll" in parts)
        if tag == "LINK":
            return LINKS[arg]
        return {"SPRITE": SPRITE, "SHEET": sheet(), "DOCK": DOCK, "FOOT": FOOT}[tag]
    return re.sub(r"\{\{(HEAD|BAR|SPRITE|SHEET|DOCK|FOOT|LINK)\s*([^}]*)\}\}", rep, src)

for p in sorted(PAGES.glob("*.html")):
    out = ROOT / p.name
    out.write_text(render(p.read_text()))
    print("scritto", out.relative_to(ROOT))
