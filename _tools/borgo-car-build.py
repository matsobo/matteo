#!/usr/bin/env python3
"""Genera le pagine statiche di Borgo Car (shell condivisa + contenuti per tavola)."""
import json, pathlib

OUT = pathlib.Path("/home/user/matteo/borgo-car")

# ---------- dati verificati (fonti: PagineGialle / PagineBianche, demo precedente) ----------
NAME = "Borgo Car"
LEGAL = "Borgo Car di Grimaldi Alessandro"
STREET = "Via del Borgo 18R"
CAP = "16132"
CITY = "Genova"
TEL_H = "010 373 2127"
TEL = "+390103732127"
MAIL = "carrozzeriaborgocar@libero.it"
PIVA = "03767270105"
LAT, LNG = 44.4087, 8.9893
Q = "Borgo+Car+Via+del+Borgo+18R+16132+Genova"
GMAPS_DIR = f"https://www.google.com/maps/dir/?api=1&amp;destination={Q}"
GMAPS_REV = f"https://www.google.com/maps/search/?api=1&amp;query={Q}"
WAZE = f"https://waze.com/ul?ll={LAT}%2C{LNG}&amp;navigate=yes"
OSM = f"https://www.openstreetmap.org/?mlat={LAT}&amp;mlon={LNG}#map=18/{LAT}/{LNG}"
TRIP = "https://www.tripadvisor.it/Search?q=Borgo%20Car%20Genova"
FB = "https://www.facebook.com/people/Borgo-Car/100066378201898/"
PG = "https://www.paginegialle.it/genova-ge/autocarrozzeria/borgo-car-grimaldi-alessandro"

ICONS = {
 "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>',
 "chat": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
 "nav": '<path d="m3 11 19-9-9 19-2-8-8-2Z"/>',
 "mail": '<rect x="2" y="4" width="20" height="16" rx="1"/><path d="m22 7-10 6L2 7"/>',
 "pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
 "arr": '<path d="M5 12h14M13 6l6 6-6 6"/>',
 "ext": '<path d="M7 17 17 7M8 7h9v9"/>',
 "x": '<path d="M18 6 6 18M6 6l12 12"/>',
 "left": '<path d="m15 18-6-6 6-6"/>',
 "right": '<path d="m9 18 6-6-6-6"/>',
 "star": '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1Z"/>',
}
def ic(name, cls=""):
    c = f' class="{cls}"' if cls else ""
    return f'<svg{c} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">{ICONS[name]}</svg>'

MARK = ('<svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">'
        '<rect x="2" y="2" width="60" height="60" fill="#ecebe6"/>'
        '<path d="M2 46 46 2h10L2 56Z" fill="#e2531b"/>'
        '<rect x="2" y="2" width="60" height="60" fill="none" stroke="#151515" stroke-width="4"/>'
        '<path d="M14 15h12.5c5 0 7.5 2.4 7.5 6.1 0 2.6-1.4 4.3-3.6 5 2.9.6 4.6 2.6 4.6 5.6 0 4.2-3 6.8-8.3 6.8H14Zm6 9.4h5.4c1.9 0 2.8-.9 2.8-2.3s-.9-2.2-2.8-2.2H20Zm0 9.7h6c2 0 3-.9 3-2.5S28 29 26 29h-6Z" fill="#151515"/>'
        '<path d="M50.5 40.6c-1.1-2.3-3-3.6-5.6-3.6-3.9 0-6.4 3-6.4 7.4s2.5 7.4 6.4 7.4c2.7 0 4.6-1.3 5.7-3.7l4.9 2.2c-1.9 4-5.6 6.4-10.6 6.4-7.2 0-12.3-5-12.3-12.3S37.7 32.1 44.9 32.1c4.9 0 8.6 2.3 10.5 6.3Z" fill="#151515"/>'
        '</svg>')

CUR = ' aria-current="page"'
PAGES = [("index.html", "01", "Officina"), ("storia.html", "02", "Storia"),
         ("lavorazioni.html", "03", "Lavorazioni"), ("contatti.html", "04", "Contatti")]

JSONLD = json.dumps({
  "@context": "https://schema.org",
  "@type": ["AutoBodyShop", "AutoRepair"],
  "name": NAME, "legalName": LEGAL,
  "address": {"@type": "PostalAddress", "streetAddress": STREET, "postalCode": CAP,
              "addressLocality": CITY, "addressRegion": "GE", "addressCountry": "IT"},
  "geo": {"@type": "GeoCoordinates", "latitude": LAT, "longitude": LNG},
  "telephone": TEL, "email": MAIL, "vatID": "IT" + PIVA, "foundingDate": "1999",
  "openingHoursSpecification": [{"@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:30", "closes": "12:30"},
      {"@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "14:00", "closes": "19:00"}],
  "sameAs": [FB.replace("&amp;", "&")]
}, ensure_ascii=False, indent=1)


def shell(fname, title, desc, tav, tav_name, body, scripts=(), extra_head=""):
    nav_rail = "".join(
        f'<li><a href="{f}"{CUR if f == fname else ""}><span>{n}</span><span>{l}</span></a></li>'
        for f, n, l in PAGES)
    nav_mob = "".join(
        f'<li><a href="{f}"{CUR if f == fname else ""}><span>{n}</span>{l}</a></li>'
        for f, n, l in PAGES)
    sc = "\n".join(f'<script src="{s}" defer></script>' for s in scripts)
    return f"""<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#151515">
<meta property="og:type" content="website">
<meta property="og:locale" content="it_IT">
<meta property="og:site_name" content="Borgo Car">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="assets/img/dopo.jpg">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/anybody-latin-standard-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/style.css">
{extra_head}<script type="application/ld+json">
{JSONLD}
</script>
</head>
<body class="pg-{tav}">
<a class="skip" href="#main">Vai al contenuto</a>

<header class="rail" aria-label="Borgo Car">
  <a class="brand" href="index.html" aria-label="Borgo Car, tavola 01: officina">{MARK}<span class="brand-word">BORGO CAR</span></a>
  <nav aria-label="Pagine"><ol>{nav_rail}</ol></nav>
  <a class="rail-tel" href="tel:{TEL}">Tel.<b>{TEL_H}</b></a>
</header>

<div class="topbar">
  <a class="brand" href="index.html" aria-label="Borgo Car, home">{MARK}<span class="brand-word">BORGO CAR</span></a>
  <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="mnav">Indice</button>
</div>
<nav class="mnav" id="mnav" aria-label="Pagine (mobile)"><ol>{nav_mob}</ol></nav>

<div class="page">
<main id="main" class="sheet">
  <div class="sheet-head">
    <span class="tape">Tav. {tav} — {tav_name}</span>
    <span class="mono">Borgo Car · {STREET} · Genova Borgoratti</span>
  </div>
{body}
  <dl class="cartiglio">
    <div><dt>Oggetto</dt><dd>{LEGAL}</dd></div>
    <div><dt>Tavola</dt><dd>{tav + " / 04" if tav.isdigit() else "Allegato"}</dd></div>
    <div><dt>Luogo</dt><dd>Borgoratti, GE</dd></div>
    <div><dt>Telefono</dt><dd><a href="tel:{TEL}">{TEL_H}</a></dd></div>
  </dl>
</main>

<footer class="foot">
  <div>
    <strong>{LEGAL}</strong><br>
    {STREET}, {CAP} {CITY} (GE)<br>
    P.IVA {PIVA} <span class="tbd">da confermare</span> · REA <span class="tbd">da confermare</span><br>
    <a href="mailto:{MAIL}">{MAIL}</a> <span class="tbd">da confermare</span>
  </div>
  <ul>
    <li><a href="privacy.html">Privacy</a></li>
    <li><a href="cookie.html">Cookie</a></li>
    <li><button type="button" class="linklike" data-consent-open>Preferenze cookie</button></li>
    <li><a href="crediti.html">Crediti e accessibilità</a></li>
  </ul>
  <ul>
    <li><a href="{GMAPS_REV}" target="_blank" rel="noopener">Recensioni su Google</a></li>
    <li><a href="{FB}" target="_blank" rel="noopener">Facebook</a> <span class="tbd">verificare</span></li>
    <li><a href="{PG}" target="_blank" rel="noopener">PagineGialle</a></li>
  </ul>
</footer>
</div>

<nav class="mbar" aria-label="Contatto rapido">
  <a href="tel:{TEL}">{ic("phone")}Chiama</a>
  <a href="{GMAPS_DIR}" target="_blank" rel="noopener">{ic("nav")}Indicazioni</a>
  <a href="#" data-k="wa">{ic("chat")}WhatsApp</a>
</nav>
<div class="wipe" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
<div id="toast" role="status" aria-live="polite"></div>

<script src="assets/js/consent.js" defer></script>
<script src="assets/vendor/gsap.min.js" defer></script>
<script src="assets/vendor/ScrollTrigger.min.js" defer></script>
<script src="assets/vendor/lenis.min.js" defer></script>
{sc}
<script src="assets/js/main.js" defer></script>
</body>
</html>
"""

# =====================================================================
# TAVOLA 01 — HOME
# =====================================================================
home = f"""
  <div class="t01">
    <section class="c-title" aria-labelledby="h-home">
      <div>
        <p class="mono">Carrozzeria · Meccanica · Elettrauto</p>
        <h1 id="h-home" class="split">Borgo<span class="w2">Car</span></h1>
      </div>
      <p class="lead">L'officina di <strong>Alessandro Grimaldi</strong> in <strong>{STREET}</strong>, a Borgoratti. Lamiera, motore, impianto elettrico, auto ibride e ricarica del clima: <strong>dal 1999</strong> nello stesso quartiere.</p>
    </section>

    <section class="c-bench" aria-labelledby="h-bench">
      <div class="bench-head"><h2 id="h-bench" class="mono">Banco di prova · pannello porta</h2><span aria-hidden="true">Luce a strisce · 5000 K</span></div>
      <div class="bench-stage" id="benchStage">
        <canvas id="panel3d" aria-hidden="true"></canvas>
        <span class="lamp-dot" id="lampDot" aria-hidden="true"></span>
        <div class="bench-fallback"><img src="assets/img/dopo.jpg" alt="Utilitaria blu riparata e riverniciata, fotografia dimostrativa" width="900" height="900"></div>
        <p class="bench-hint" id="benchHint">Muovi il cursore sul pannello: è la luce che usa il carrozziere per leggere le bozze.</p>
      </div>
      <div class="bench-ctrl">
        <ol class="steps" aria-label="Fasi della riparazione">
          <li><button type="button" data-t="0" aria-pressed="true"><span>Fase 1</span><b>Bozza</b></button></li>
          <li><button type="button" data-t="0.33" aria-pressed="false"><span>Fase 2</span><b>Lattoneria</b></button></li>
          <li><button type="button" data-t="0.58" aria-pressed="false"><span>Fase 3</span><b>Fondo</b></button></li>
          <li><button type="button" data-t="1" aria-pressed="false"><span>Fase 4</span><b>Vernice</b></button></li>
        </ol>
        <div class="range"><label for="repair">Avanzamento</label><input id="repair" type="range" min="0" max="100" value="0" aria-describedby="stageOut"></div>
        <p class="stage-out" id="stageOut" aria-live="polite">Bozza: la lamiera è deformata. Sotto la luce a strisce le linee si spezzano, ed è così che si legge un danno.</p>
        <div class="chips" role="group" aria-label="Colore della vernice">
          <span>Tinta</span>
          <button type="button" class="chip c-blu" data-paint="#1d3557" aria-pressed="true" aria-label="Blu scuro metallizzato"></button>
          <button type="button" class="chip c-ner" data-paint="#121212" aria-pressed="false" aria-label="Nero pastello"></button>
          <button type="button" class="chip c-ros" data-paint="#8f1d1d" aria-pressed="false" aria-label="Rosso scuro"></button>
          <button type="button" class="chip c-ver" data-paint="#2f4a3a" aria-pressed="false" aria-label="Verde inglese"></button>
          <button type="button" class="chip c-bia" data-paint="#e9e7e1" aria-pressed="false" aria-label="Bianco"></button>
        </div>
      </div>
    </section>

    <section class="c-ticket" aria-labelledby="h-ticket">
      <h2 id="h-ticket" class="mono">Ordine di lavoro · come raggiungerci</h2>
      <dl>
        <div class="ticket-row"><dt>Dove</dt><dd>{STREET}, {CAP} Genova</dd></div>
        <div class="ticket-row"><dt>Telefono</dt><dd><a href="tel:{TEL}">{TEL_H}</a></dd></div>
        <div class="ticket-row"><dt>Orari</dt><dd>Lun–Ven 8:30–12:30 · 14:00–19:00 <span class="tbd">da confermare</span></dd></div>
      </dl>
      <div class="ticket-btns">
        <a class="btn" href="tel:{TEL}">{ic("phone")}Chiama</a>
        <a class="btn line" href="{GMAPS_DIR}" target="_blank" rel="noopener">{ic("nav")}Indicazioni</a>
        <a class="btn tape-btn" href="contatti.html#preventivo">Preventivo con foto</a>
      </div>
    </section>

    <a class="c-idx i1" href="storia.html">
      <span class="mono">Tav. 02 — Storia</span>
      <span class="idx-year" aria-hidden="true">1999</span>
      <h2>Stesso indirizzo dal 1999</h2>
      {ic("ext", "go")}
    </a>
    <a class="c-idx i2" href="lavorazioni.html">
      <span class="mono">Tav. 03 — Lavorazioni</span>
      <h2>Sei schede di lavoro, dal paraurti alla centralina</h2>
      <ul class="svc-mini" aria-label="Servizi">
        <li>Carrozzeria</li><li>Verniciatura</li><li>Meccanica</li><li>Elettrauto</li><li>Ibride</li><li>Ricarica clima</li>
      </ul>
      {ic("ext", "go")}
    </a>
    <a class="c-idx i3" href="contatti.html">
      <span class="mono">Tav. 04 — Contatti</span>
      <h2>Via del Borgo, Borgoratti</h2>
      <span class="mono">{LAT}° N · {LNG}° E</span>
      {ic("ext", "go")}
    </a>
  </div>
"""

# =====================================================================
# TAVOLA 02 — STORIA
# =====================================================================
storia = f"""
  <div class="year-wrap"><p class="big-year" id="bigYear" aria-hidden="true">19<span>99</span></p></div>
  <div class="ed">
    <div class="ed-kicker"><h1>Un'officina, un quartiere, un nome sul campanello</h1></div>
    <div class="ed-body">
      <p>Borgo Car è l'officina di Alessandro Grimaldi in Via del Borgo, a Borgoratti, sulle alture del Levante genovese. L'attività risulta iscritta dal 7 gennaio 1999 <span class="tbd">verificare in visura</span>: da allora l'indirizzo non è cambiato.</p>
      <p>Nasce come carrozzeria, e il nome sull'insegna lo dice ancora. Oggi le schede online la descrivono anche come officina meccanica ed elettrauto, con interventi su vetture ibride e ricarica dell'aria condizionata: chi porta l'auto per un paraurti può lasciarla anche per il tagliando, nello stesso posto.</p>
      <p>Qui il cliente parla con chi mette le mani sulla macchina. <span class="tbd">Racconto di Alessandro da raccogliere: come è iniziato, chi lavora in officina oggi</span></p>
    </div>
    <aside class="ed-facts" aria-label="Dati dell'attività">
      <dl>
        <dt>Titolare</dt><dd>Alessandro Grimaldi</dd>
        <dt>Ragione sociale</dt><dd>{LEGAL}</dd>
        <dt>In attività dal</dt><dd>1999</dd>
        <dt>Indirizzo</dt><dd>{STREET}, {CAP} Genova</dd>
        <dt>Quartiere</dt><dd>Borgoratti</dd>
      </dl>
    </aside>
  </div>

  <section class="tl" aria-labelledby="h-tl">
    <h2 id="h-tl" class="sr">Linea del tempo</h2>
    <article class="tl-item rv">
      <span class="tl-y">1999</span>
      <div><h3>Apertura in Via del Borgo</h3><p>Iscrizione dell'attività di Alessandro Grimaldi come carrozzeria al civico 18 rosso.</p></div>
      <span class="tl-src">Fonte: registro imprese <span class="tbd">da confermare</span></span>
    </article>
    <article class="tl-item rv">
      <span class="tl-y">[ANNO]</span>
      <div><h3>Dalla lamiera al motore</h3><p>Alla carrozzeria si aggiungono meccanica ed elettrauto. <span class="tbd">Anno e dettagli da chiedere al titolare</span></p></div>
      <span class="tl-src">Fonte: titolare</span>
    </article>
    <article class="tl-item rv">
      <span class="tl-y">[ANNO]</span>
      <div><h3>Auto ibride</h3><p>Interventi su vetture ibride, come riportato nelle schede dell'attività. <span class="tbd">Formazione o certificazioni da confermare</span></p></div>
      <span class="tl-src">Fonte: PagineGialle</span>
    </article>
    <article class="tl-item rv">
      <span class="tl-y">Oggi</span>
      <div><h3>Carrozzeria, meccanica, elettrauto</h3><p>Dal lunedì al venerdì, mattina e pomeriggio, in Via del Borgo 18R. Si prenota per telefono allo <a href="tel:{TEL}">{TEL_H}</a>.</p></div>
      <span class="tl-src">Fonte: PagineGialle / PagineBianche</span>
    </article>
  </section>

  <div class="photo-slot">
    <div class="slot"><p><b>Foto da scattare</b>Alessandro al lavoro sul banco, luce naturale dal portone. Formato orizzontale.</p></div>
    <div class="slot"><p><b>Foto da scattare</b>L'insegna su Via del Borgo. Formato verticale.</p></div>
  </div>
"""

# =====================================================================
# TAVOLA 03 — LAVORAZIONI
# =====================================================================
def pict(kind):
    p = {
     "lamiera": '<path d="M6 44c10-4 18-14 26-14s14 8 26 4" /><path d="M6 52c10-4 18-14 26-14s14 8 26 4" opacity=".35"/><circle cx="30" cy="30" r="5"/><path d="M40 12 52 24M46 10l8 8"/>',
     "vernice": '<rect x="10" y="20" width="28" height="34"/><path d="M14 20v-6h20v6M38 30h10l6 6v14"/><path d="M18 34h12M18 42h12" opacity=".5"/>',
     "mecc": '<circle cx="32" cy="32" r="10"/><path d="M32 8v8M32 48v8M8 32h8M48 32h8M15 15l6 6M43 43l6 6M15 49l6-6M43 21l6-6"/>',
     "elet": '<path d="M36 6 16 36h14l-4 22 22-32H34Z"/>',
     "ibr": '<rect x="8" y="22" width="40" height="22"/><path d="M48 28h6v10h-6M18 30l6 6M30 30h10"/>',
     "clima": '<path d="M32 6v52M10 19l44 26M10 45l44-26"/><path d="M26 10l6 6 6-6M26 54l6-6 6 6" />',
    }[kind]
    return f'<svg class="pict" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true" focusable="false">{p}</svg>'

cards = [
  ("w-l", "", "CAR-01", "Carrozzeria", "lamiera",
   "<p>Riparazione della lamiera dopo urti, bozze e strisciate: si raddrizza dove si può, si sostituisce dove serve.</p>",
   "Attività principale dal 1999 · Fonte: PagineGialle"),
  ("w-m", "dark", "CAR-02", "Verniciatura", "vernice",
   "<p>Preparazione, fondo e verniciatura della parte riparata, con la tinta della vettura.</p><p><span class=\"tbd\">Forno di verniciatura e sistema tinte da confermare</span></p>",
   "Da confermare con il titolare"),
  ("w-s", "", "MEC-03", "Meccanica", "mecc",
   "<p>Manutenzione e riparazioni meccaniche: tagliandi, freni, sospensioni, distribuzione.</p><p><span class=\"tbd\">Elenco interventi da confermare</span></p>",
   "Fonte: PagineGialle (categoria Meccanica)"),
  ("w-m", "orange", "ELE-04", "Elettrauto", "elet",
   "<p>Impianto elettrico, batteria, avviamento e ricarica, diagnosi delle spie sul cruscotto.</p>",
   "Fonte: PagineGialle (categoria Elettrauto)"),
  ("w-s", "", "IBR-05", "Vetture ibride", "ibr",
   "<p>Assistenza su auto ibride.</p><p><span class=\"tbd\">Marchi trattati e abilitazioni (PES/PAV) da confermare</span></p>",
   "Fonte: PagineGialle (Vetture ibride)"),
  ("w-m", "dark", "CLI-06", "Ricarica clima", "clima",
   "<p>Controllo e ricarica del gas dell'impianto di climatizzazione, da fare prima dell'estate.</p><p><span class=\"tbd\">Gas trattati (R134a / R1234yf) da confermare</span></p>",
   "Fonte: PagineGialle (Ricarica clima)"),
]
cards_html = "\n".join(f"""      <article class="card {w} {tone}" aria-labelledby="c{i}">
        <div class="card-code"><span>{code}</span><span>{i+1:02d}/06</span></div>
        {pict(p)}
        <h2 id="c{i}">{t}</h2>
        {txt}
        <p class="card-meta">{meta}</p>
      </article>""" for i, (w, tone, code, t, p, txt, meta) in enumerate(cards))

lavorazioni = f"""
  <div class="intro-split">
    <h1>Sei schede di lavoro</h1>
    <p>Carrozzeria prima di tutto, poi motore, impianto elettrico, auto ibride e clima. Le schede riportano solo ciò che risulta dalle fonti pubbliche: i dettagli segnati in giallo vanno confermati in officina.</p>
  </div>

  <section class="rail-wrap" aria-labelledby="h-cards">
    <h2 id="h-cards" class="sr">Servizi</h2>
    <div class="cards" id="cards" tabindex="0" aria-label="Schede servizi, scorrimento orizzontale">
{cards_html}
    </div>
    <div class="rail-ctrl">
      <span class="mono">Trascina o usa le frecce</span>
      <div class="progress" aria-hidden="true"><i id="cardsBar"></i></div>
      <div class="btns">
        <button type="button" id="cPrev" aria-label="Scheda precedente">{ic("left")}</button>
        <button type="button" id="cNext" aria-label="Scheda successiva">{ic("right")}</button>
      </div>
    </div>
  </section>

  <section class="ba-sec" aria-labelledby="h-ba">
    <div>
      <div class="ba" id="ba">
        <img src="assets/img/prima.jpg" alt="Utilitaria blu con il frontale distrutto e il cofano piegato, prima della riparazione" width="900" height="900" draggable="false">
        <img class="after" src="assets/img/dopo.jpg" alt="La stessa utilitaria con frontale, cofano e fari rifatti e la carrozzeria lucida" width="900" height="900" draggable="false">
        <span class="lbl l" aria-hidden="true">Dopo</span><span class="lbl r" aria-hidden="true">Prima</span>
        <span class="handle" aria-hidden="true"></span>
        <input type="range" id="baRange" min="0" max="100" value="50" aria-label="Confronto prima e dopo: sposta per vedere più prima o più dopo">
      </div>
      <p class="ba-cap">Immagini dimostrative, non un lavoro di Borgo Car: da sostituire con un intervento reale fotografato in officina.</p>
    </div>
    <div class="ba-text">
      <h2 id="h-ba">Prima, dopo</h2>
      <p>Il lavoro di carrozzeria si giudica così: stessa auto, stessa luce, prima e dopo. Trascina la maniglia arancione.</p>
      <h3 class="mono">Dopo un incidente, cosa portare</h3>
      <ol class="checklist">
        <li><span>Il modulo di constatazione amichevole (CAI), se compilato.</span></li>
        <li><span>Libretto di circolazione e dati dell'assicurazione.</span></li>
        <li><span>Foto del danno e della scena, se le hai fatte.</span></li>
        <li><span>Gestione della pratica col perito e auto sostitutiva: <span class="tbd">da confermare</span></span></li>
      </ol>
      <p><a class="arrow-link" href="contatti.html#preventivo">Manda le foto per un preventivo {ic("arr")}</a></p>
    </div>
  </section>
"""

# =====================================================================
# TAVOLA 04 — CONTATTI
# =====================================================================
contatti = f"""
  <div class="c04">
    <section class="c04-info" aria-labelledby="h-c">
      <h1 id="h-c">Via del Borgo, 18 rosso</h1>
      <address class="addr">{STREET}<br>{CAP} Genova · Borgoratti</address>
      <table class="hours" id="hours">
        <caption class="sr">Orari di apertura</caption>
        <tbody>
          <tr data-d="1"><th scope="row">Lunedì</th><td>8:30–12:30 · 14:00–19:00</td></tr>
          <tr data-d="2"><th scope="row">Martedì</th><td>8:30–12:30 · 14:00–19:00</td></tr>
          <tr data-d="3"><th scope="row">Mercoledì</th><td>8:30–12:30 · 14:00–19:00</td></tr>
          <tr data-d="4"><th scope="row">Giovedì</th><td>8:30–12:30 · 14:00–19:00</td></tr>
          <tr data-d="5"><th scope="row">Venerdì</th><td>8:30–12:30 · 14:00–19:00</td></tr>
          <tr data-d="6"><th scope="row">Sabato</th><td>Chiuso</td></tr>
          <tr data-d="0"><th scope="row">Domenica</th><td>Chiuso</td></tr>
        </tbody>
      </table>
      <p class="note">Orari da PagineGialle. <span class="tbd">Da confermare</span>: un'altra scheda riporta 8:00–12:30 · 14:00–19:30.</p>

      <div class="keys">
        <a class="key" href="tel:{TEL}"><span>Telefono</span><b>{TEL_H}</b>{ic("phone")}</a>
        <a class="key" href="#" data-k="wa" data-missing><span>WhatsApp</span><b>Scrivici</b>{ic("chat")}</a>
        <a class="key" href="{GMAPS_DIR}" target="_blank" rel="noopener"><span>Google Maps</span><b>Indicazioni stradali</b>{ic("nav")}</a>
        <a class="key" href="{WAZE}" target="_blank" rel="noopener"><span>Waze</span><b>Naviga fin qui</b>{ic("nav")}</a>
        <a class="key" href="mailto:{MAIL}?subject=Richiesta%20informazioni"><span>Email</span><b>Scrivici una mail</b>{ic("mail")}</a>
        <a class="key" href="{GMAPS_REV}" target="_blank" rel="noopener"><span>Google</span><b>Leggi le recensioni</b>{ic("star")}</a>
        <a class="key" href="{TRIP}" target="_blank" rel="noopener"><span>TripAdvisor</span><b>Cerca Borgo Car</b>{ic("ext")}</a>
        <a class="key" href="{OSM}" target="_blank" rel="noopener"><span>OpenStreetMap</span><b>Apri la mappa</b>{ic("pin")}</a>
      </div>
    </section>

    <section class="map-box" aria-labelledby="h-map">
      <h2 id="h-map" class="sr">Mappa</h2>
      <div id="map" role="region" aria-label="Mappa OpenStreetMap con la posizione di Borgo Car"></div>
      <div class="map-gate" id="mapGate">
        <div>
          {ic("pin", "pin")}
          <p class="coords">{LAT}° N · {LNG}° E · Via del Borgo</p>
          <p>La mappa scarica i riquadri da OpenStreetMap: il tuo indirizzo IP arriva ai loro server. La carichiamo solo se lo chiedi tu.</p>
          <button type="button" class="btn" id="mapLoad">{ic("pin")}Mostra la mappa</button>
        </div>
      </div>
    </section>
  </div>

  <section class="form-sec" id="preventivo" aria-labelledby="h-f">
    <div>
      <h2 id="h-f">Preventivo con le foto del danno</h2>
      <p>Scrivi cosa è successo e allega due o tre foto: una da lontano, una da vicino, una di lato con la luce radente. Ti richiamiamo noi.</p>
      <p class="note">Demo: il modulo non invia dati. In produzione serve un servizio di invio (vedi elenco dati mancanti).</p>
    </div>
    <form class="quote" id="quote" novalidate>
      <div><label for="f-nome">Nome e cognome</label><input id="f-nome" name="nome" type="text" autocomplete="name" required aria-describedby="e-nome"><span class="err" id="e-nome"></span></div>
      <div><label for="f-tel">Telefono</label><input id="f-tel" name="tel" type="tel" autocomplete="tel" required aria-describedby="e-tel"><span class="err" id="e-tel"></span></div>
      <div><label for="f-tipo">Di cosa hai bisogno</label>
        <select id="f-tipo" name="tipo" required aria-describedby="e-tipo">
          <option value="">Scegli</option><option>Carrozzeria dopo un urto</option><option>Bozze e graffi</option><option>Meccanica / tagliando</option><option>Elettrauto</option><option>Auto ibrida</option><option>Ricarica clima</option><option>Altro</option>
        </select><span class="err" id="e-tipo"></span></div>
      <div><label for="f-auto">Auto (marca e modello)</label><input id="f-auto" name="auto" type="text" autocomplete="off"></div>
      <div class="full"><label for="f-msg">Cosa è successo</label><textarea id="f-msg" name="msg"></textarea></div>
      <div class="full"><label for="f-foto">Foto del danno (facoltative)</label><input id="f-foto" name="foto" type="file" accept="image/*" multiple aria-describedby="f-files"><span class="note" id="f-files"></span></div>
      <div class="hp" aria-hidden="true"><label for="f-web">Lascia vuoto</label><input id="f-web" name="web" type="text" tabindex="-1" autocomplete="off"></div>
      <div class="full"><label class="chk"><input type="checkbox" id="f-priv" required aria-describedby="e-priv"><span>Ho letto l'<a href="privacy.html">informativa privacy</a> e chiedo di essere ricontattato per questa richiesta.</span></label><span class="err" id="e-priv"></span></div>
      <div class="full"><button class="btn" type="submit">Invia la richiesta {ic("arr")}</button></div>
      <div class="ok" id="ok" role="status" tabindex="-1" hidden></div>
    </form>
  </section>
"""

# =====================================================================
# PAGINE LEGALI
# =====================================================================
privacy = f"""
  <div class="legal-txt">
    <h1>Informativa privacy</h1>
    <p><span class="tbd">Bozza da far validare a un professionista</span> · Ultimo aggiornamento: <span class="tbd">data</span></p>
    <h2>Titolare del trattamento</h2>
    <p>{LEGAL}, {STREET}, {CAP} {CITY}. P.IVA {PIVA} <span class="tbd">da confermare</span>. Email: <a href="mailto:{MAIL}">{MAIL}</a> <span class="tbd">da confermare</span>.</p>
    <h2>Quali dati trattiamo</h2>
    <table>
      <tr><th>Origine</th><th>Dati</th><th>Finalità</th><th>Base giuridica</th><th>Conservazione</th></tr>
      <tr><td>Modulo preventivo</td><td>Nome, telefono, descrizione, foto del veicolo, modello dell'auto</td><td>Rispondere alla richiesta e formulare il preventivo</td><td>Misure precontrattuali su richiesta dell'interessato (art. 6.1.b GDPR)</td><td><span class="tbd">es. 12 mesi</span></td></tr>
      <tr><td>Telefono, email, WhatsApp</td><td>Dati che scegli di comunicarci</td><td>Rispondere alla richiesta</td><td>Art. 6.1.b GDPR</td><td>Per il tempo necessario alla risposta</td></tr>
      <tr><td>Navigazione</td><td>Log tecnici del server (IP, data, pagina)</td><td>Sicurezza e funzionamento del sito</td><td>Legittimo interesse (art. 6.1.f)</td><td><span class="tbd">secondo l'hosting</span></td></tr>
    </table>
    <p>Le foto del danno possono mostrare targhe o persone: ti chiediamo di inquadrare solo il veicolo.</p>
    <h2>Destinatari</h2>
    <p>Fornitore di hosting <span class="tbd">nome e paese</span>; servizio di invio del modulo <span class="tbd">nome</span>. Se carichi la mappa, OpenStreetMap Foundation riceve il tuo indirizzo IP (vedi <a href="cookie.html">cookie policy</a>). Nessun dato è venduto o usato per pubblicità.</p>
    <h2>I tuoi diritti</h2>
    <p>Accesso, rettifica, cancellazione, limitazione, portabilità e opposizione (artt. 15–22 GDPR) scrivendo a <a href="mailto:{MAIL}">{MAIL}</a>. Puoi presentare reclamo al Garante per la protezione dei dati personali (garanteprivacy.it).</p>
  </div>
"""
cookie = f"""
  <div class="legal-txt">
    <h1>Cookie e contenuti esterni</h1>
    <p><span class="tbd">Bozza da far validare a un professionista</span></p>
    <h2>In breve</h2>
    <p>Questo sito non usa cookie di profilazione né strumenti di statistica. Font, script e immagini sono serviti dal nostro dominio. L'unico contenuto di terze parti è la mappa di OpenStreetMap, che si carica solo se la chiedi.</p>
    <h2>Cosa salviamo nel tuo browser</h2>
    <table>
      <tr><th>Nome</th><th>Tipo</th><th>Scopo</th><th>Durata</th></tr>
      <tr><td>bc-consent</td><td>Archiviazione locale (tecnica)</td><td>Ricordare la tua scelta sui contenuti esterni</td><td>6 mesi</td></tr>
    </table>
    <h2>Contenuti esterni</h2>
    <table>
      <tr><th>Servizio</th><th>Fornitore</th><th>Dati</th><th>Quando</th></tr>
      <tr><td>Mappa (riquadri)</td><td>OpenStreetMap Foundation, Regno Unito (paese con decisione di adeguatezza UE)</td><td>Indirizzo IP, user agent</td><td>Solo dopo il clic su "Mostra la mappa" o il consenso a "Contenuti esterni"</td></tr>
    </table>
    <p>I link a Google Maps, Waze, TripAdvisor, Facebook e WhatsApp sono semplici collegamenti: nessun dato viene inviato finché non ci clicchi.</p>
    <h2>Cambiare idea</h2>
    <p><button type="button" class="btn line" data-consent-open>Apri le preferenze</button></p>
  </div>
"""
crediti = f"""
  <div class="legal-txt">
    <h1>Crediti e accessibilità</h1>
    <h2>Caratteri</h2>
    <p>Anybody (Tyler Finck / ETC), Atkinson Hyperlegible (Braille Institute), IBM Plex Mono (IBM): licenza SIL Open Font License 1.1, ospitati su questo dominio.</p>
    <h2>Librerie</h2>
    <p>GSAP (licenza standard GreenSock, gratuita), Lenis (MIT), three.js (MIT), Leaflet (BSD-2). Dati cartografici © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>, ODbL.</p>
    <h2>Immagini</h2>
    <p>Il pannello 3D del banco di prova è generato dal codice, senza fotografie. Le due foto prima/dopo sono dimostrative, provengono dalla bozza precedente e <span class="tbd">vanno sostituite con foto reali dell'officina</span>.</p>
    <h2>Accessibilità</h2>
    <p>Il sito punta al livello AA delle WCAG 2.1: contrasto del testo almeno 4,5:1, navigazione completa da tastiera, testo alternativo per le immagini, rispetto dell'impostazione "riduci movimento" del sistema (animazioni e scena 3D si fermano). Il pannello 3D è decorativo: le stesse informazioni sono scritte nel testo accanto. Segnalazioni: <a href="mailto:{MAIL}">{MAIL}</a>.</p>
  </div>
"""

DESC = "Borgo Car, carrozzeria, meccanica ed elettrauto in Via del Borgo 18R a Genova Borgoratti. Officina di Alessandro Grimaldi dal 1999."
files = {
 "index.html": shell("index.html", "Borgo Car · Carrozzeria e officina a Borgoratti, Genova", DESC, "01", "Officina", home,
                     ["assets/vendor/three.min.js", "assets/js/scene3d.js"]),
 "storia.html": shell("storia.html", "Storia · Borgo Car, Via del Borgo dal 1999", "Dal 1999 in Via del Borgo 18R, Borgoratti: la storia dell'officina di Alessandro Grimaldi.", "02", "Storia", storia),
 "lavorazioni.html": shell("lavorazioni.html", "Lavorazioni · Borgo Car: carrozzeria, meccanica, elettrauto", "Carrozzeria, verniciatura, meccanica, elettrauto, vetture ibride e ricarica clima a Genova Borgoratti.", "03", "Lavorazioni", lavorazioni),
 "contatti.html": shell("contatti.html", "Contatti · Borgo Car, Via del Borgo 18R Genova", "Indirizzo, orari, telefono e mappa di Borgo Car a Genova Borgoratti. Preventivo con le foto del danno.", "04", "Contatti", contatti,
                        ["assets/vendor/leaflet/leaflet.js"], '<link rel="stylesheet" href="assets/vendor/leaflet/leaflet.css">\n'),
 "privacy.html": shell("privacy.html", "Privacy · Borgo Car", "Informativa sul trattamento dei dati personali di Borgo Car.", "P", "Privacy", privacy),
 "cookie.html": shell("cookie.html", "Cookie · Borgo Car", "Cookie e contenuti esterni sul sito di Borgo Car.", "C", "Cookie", cookie),
 "crediti.html": shell("crediti.html", "Crediti e accessibilità · Borgo Car", "Crediti di font, librerie e immagini, dichiarazione di accessibilità.", "K", "Crediti", crediti),
}
for f, html in files.items():
    (OUT / f).write_text(html, encoding="utf-8")
(OUT / "assets/img/favicon.svg").write_text(MARK.replace(' class="brand-mark"', ' xmlns="http://www.w3.org/2000/svg"').replace(' aria-hidden="true" focusable="false"', ''), encoding="utf-8")
print("ok", list(files))
