"""Genera bleummers-sartoria/index.html: un unico file autosufficiente
(CSS, JavaScript, librerie e immagini incorporati). Uso: python3 src/build.py"""
import json, os, re, base64
SRC=os.path.dirname(os.path.abspath(__file__))+'/'
OUT=os.path.normpath(SRC+'../index.html')
def read(p): return open(SRC+p,encoding='utf-8').read()
with open(SRC+'img/logo-path.txt') as f: LW,LH=f.readline().split(); LOGO=f.read().strip()

ADDR='Via Domenico Fiasella 27/R, 16121 Genova'
Q='Via+Domenico+Fiasella+27R%2C+16121+Genova'
GDIR='https://www.google.com/maps/dir/?api=1&amp;destination='+Q
TEL='tel:+39010542234'
WA='https://wa.me/39010542234'
FONTS='https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&amp;family=Gloock&amp;family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..600&amp;display=swap'
TBC='<span class="tbc">[DA CONFERMARE]</span>'

ICON={
 'phone':'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
 'chat':'<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z"/>',
 'nav':'<path d="M3 11l18-8-8 18-2-8z"/>',
 'pin':'<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
 'mail':'<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/>',
 'star':'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 'owl':'<circle cx="8" cy="12" r="3.2"/><circle cx="16" cy="12" r="3.2"/><path d="M4.8 12a7.2 7.2 0 0 1 14.4 0M12 15.5v2"/>',
 'map':'<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
 'apple':'<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><path d="M9.5 10h5"/>',
}
def ic(n,cls=''): return f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICON[n]}</svg>'
def logo(cls=''): return f'<svg class="{cls}" viewBox="0 0 {LW} {LH}" aria-hidden="true" focusable="false"><use href="#logo"/></svg>'

SPRITE=f'''<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <symbol id="logo" viewBox="0 0 {LW} {LH}"><path fill="currentColor" d="{LOGO}"/></symbol>
  <linearGradient id="wood" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#a87445"/><stop offset=".5" stop-color="#7d5130"/><stop offset="1" stop-color="#4f311b"/></linearGradient>
  <linearGradient id="steel" x1="0" x2="1"><stop offset="0" stop-color="#5d6068"/><stop offset=".5" stop-color="#e9eaec"/><stop offset="1" stop-color="#55585f"/></linearGradient>
  <symbol id="hanger" viewBox="0 0 200 96"><path d="M100 36V22c0-5 9-6 9-13a9 9 0 0 0-18 0" fill="none" stroke="url(#steel)" stroke-width="4" stroke-linecap="round"/><path d="M100 34C78 46 44 62 16 72c-9 3-7 12 2 12h164c9 0 11-9 2-12-28-10-62-26-84-38z" fill="url(#wood)"/><path d="M24 78h152" stroke="#2c1a0d" stroke-opacity=".35" stroke-width="1.5"/></symbol>
</svg>'''

HOURS_ROWS=[(1,'Lunedì','15:30 – 19:00'),(2,'Martedì','9:00–12:30 · 15:30–19:00'),(3,'Mercoledì','9:00–12:30 · 15:30–19:00'),(4,'Giovedì','9:00–12:30 · 15:30–19:00'),(5,'Venerdì','9:00–12:30 · 15:30–19:00'),(6,'Sabato','9:00–12:30 · 15:30–19:00'),(0,'Domenica','Chiuso')]
def hours_table(): 
    rows=''.join(f'<tr data-day="{d}"><th scope="row">{n}</th><td>{h}</td></tr>' for d,n,h in HOURS_ROWS)
    return f'<table class="hours"><caption class="sr-only">Orari di apertura</caption><tbody>{rows}</tbody></table>'
def status(): return '<p class="status" data-status role="status" aria-live="polite"><i aria-hidden="true"></i><span>Orari</span></p>'

LD={"@context":"https://schema.org","@type":"ClothingStore","name":"Bleummer's","alternateName":"Bleummer's dal 1964","foundingDate":"1964",
 "address":{"@type":"PostalAddress","streetAddress":"Via Domenico Fiasella 27/R","postalCode":"16121","addressLocality":"Genova","addressRegion":"GE","addressCountry":"IT"},
 "telephone":"+39 010 542234",
 "openingHoursSpecification":[{"@type":"OpeningHoursSpecification","dayOfWeek":"Monday","opens":"15:30","closes":"19:00"},
  {"@type":"OpeningHoursSpecification","dayOfWeek":["Tuesday","Wednesday","Thursday","Friday","Saturday"],"opens":"09:00","closes":"12:30"},
  {"@type":"OpeningHoursSpecification","dayOfWeek":["Tuesday","Wednesday","Thursday","Friday","Saturday"],"opens":"15:30","closes":"19:00"}]}

PAGES=[('bottega','01','Bottega'),('storia','02','Storia'),('collezioni','03','Collezioni'),('dove','04','Dove siamo')]

def assemble(views):
    CUR=''
    nav=''.join(f'<li><a href="#{r}"><span>{n}</span>{t}</a></li>' for r,n,t in PAGES)
    sections=''.join(f'<section class="view{" active" if i==0 else ""}" id="{r}" data-title="{title}" aria-label="{t}">\n{body}\n    </section>\n' for i,(r,title,t,body) in enumerate(views))
    def js(p): return read(p).replace('</script','<\\/script')
    title=views[0][1]
    html=f'''<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{D}">
<meta name="theme-color" content="#1F3B2D">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{D}">
<meta property="og:locale" content="it_IT">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%231F3B2D'/%3E%3Cpath d='M8 0v32M16 0v32M24 0v32' stroke='%23ECE8DE' stroke-opacity='.25'/%3E%3Cpath d='M5 26h22' stroke='%23D8B77A' stroke-width='2' stroke-dasharray='3 2'/%3E%3C/svg%3E">
<script>document.documentElement.classList.add('js')</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<style>
{read('vendor/leaflet.css')}
{read('site.css')}
</style>
<script type="application/ld+json">{json.dumps(LD,ensure_ascii=False)}</script>
</head>
<body>
{SPRITE}
<a class="skip" href="#main">Vai al contenuto</a>
<div class="frame">
  <header class="label">
    <div class="label-inner">
      <a class="brand" href="#bottega" aria-label="Bleummer's, pagina iniziale">{logo()}<small>Genova · dal 1964</small></a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="label-nav"><i aria-hidden="true"></i><span class="txt">Menu</span></button>
      <div class="label-nav" id="label-nav">
        <nav aria-label="Pagine del sito"><ol class="index">{nav}</ol></nav>
        <div class="label-foot">
          {status()}
          <p>Via Domenico Fiasella 27/R<br>16121 Genova</p>
          <p><a class="stitch" href="{TEL}">010 542234</a></p>
        </div>
      </div>
    </div>
  </header>
  <main class="page" id="main">
{sections}
    <footer class="page-foot">
      <span>Bleummer's · {ADDR} · tel. <a href="{TEL}">010 542234</a></span>
      <span>P.IVA {TBC} · Proposta di sito dimostrativa</span>
    </footer>
  </main>
</div>
<nav class="actions" aria-label="Azioni rapide">
  <a href="{TEL}">{ic('phone')}Chiama</a>
  <a href="{WA}" target="_blank" rel="noopener">{ic('chat')}WhatsApp</a>
  <a href="{GDIR}" target="_blank" rel="noopener">{ic('nav')}Indicazioni</a>
</nav>
<div class="curtain" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><span>{logo()}</span></div>
{DIALOG}
<script>{js('vendor/three.min.js')}</script>
<script>{js('vendor/leaflet.js')}</script>
<script>{js('js/site.js')}</script>
<script>{js('js/cloth.js')}</script>
<script>{js('js/storia.js')}</script>
<script>document.querySelectorAll("[data-years]").forEach(function(e){{e.textContent=new Date().getFullYear()-1964}});</script>
<script>{js('js/rack.js')}</script>
<script>{js('js/map.js')}</script>
<script>{js('js/compose.js')}</script>
</body>
</html>
'''
    # immagini incorporate come data URI
    def uri(m): return 'src="data:image/webp;base64,'+base64.b64encode(open(SRC+'img/'+m.group(1)+'.webp','rb').read()).decode()+'"'
    return re.sub(r'src="assets/img/([\w-]+)\.webp"', uri, html)

# ------------------------------------------------------------------ HOME
home=f'''    <p class="masthead"><span>N° 27/R</span><span>Via Domenico Fiasella · Genova</span><span>Abbigliamento uomo · Camiceria</span><b>Dal 1964</b></p>
    <div class="cover">
      <div class="cover-title">
        <p class="kicker" data-reveal>01 — Bottega</p>
        <h1 data-reveal="80"><span class="line">Abbigliamento</span><span class="line">uomo e <em>camiceria</em></span><span class="line">dal 1964.</span></h1>
        <p class="lede" data-reveal="160">Bleummer's è un negozio di abbigliamento maschile nel centro di Genova, al 27/R di Via Domenico Fiasella. {TBC.replace('[DA CONFERMARE]','[DA CONFERMARE: una frase del titolare sul negozio]')}</p>
        <p data-reveal="220" style="display:flex;flex-wrap:wrap;gap:12px;margin-top:22px"><a class="tag-btn red" href="collezioni.html">Sfoglia lo stender</a><a class="tag-btn" href="contatti.html">Come arrivare</a></p>
      </div>
      <figure class="cover-photo" data-reveal="120">
        <div class="photo"><img src="assets/img/vetrina.webp" width="765" height="1020" alt="La vetrina di Bleummer's al 27/R di Via Fiasella, con la tenda chiara e la scritta verde del negozio" fetchpriority="high"></div>
        <figcaption>Fig. 1 — La vetrina al 27/R, con la tenda e la scritta originale.</figcaption>
      </figure>
      <figure class="cover-cloth" data-reveal>
        <div class="cloth">
          <img class="fallback" src="assets/img/tessuto.webp" width="1200" height="800" alt="Campioni di tessuto gessato blu e grigio">
          <span class="cloth-hint">Tocca il tessuto</span>
        </div>
        <figcaption>Fig. 2 — Campione di gessato in 3D: passa il cursore o il dito sulla stoffa. Immagine illustrativa, non un articolo in vendita.</figcaption>
      </figure>
      <section class="cover-hours card-tag" aria-labelledby="h-orari" data-reveal="80">
        <h2 id="h-orari">Orari</h2>
        {status()}
        {hours_table()}
        <p class="caption">Festività e chiusure estive {TBC}</p>
      </section>
      <nav class="cover-index" aria-label="Le altre pagine">
        <a class="entry entry-story" href="storia.html" data-reveal>
          <span class="kicker" style="color:inherit;opacity:.8">02 — Storia</span>
          <span class="year">1964<small>Il registro della bottega</small></span>
          <span class="go">Leggi la storia</span>
        </a>
        <a class="entry entry-rack" href="collezioni.html" data-reveal="80">
          <span class="photo"><img src="assets/img/1.webp" width="640" height="800" alt="" loading="lazy" style="object-position:50% 30%"><span class="badge-ex">Foto di esempio</span></span>
          <span class="txt"><span class="kicker" style="color:inherit">03 — Collezioni</span><h3 style="margin:.3em 0 .2em">Lo stender</h3><span class="go">Sfoglia i capi</span></span>
        </a>
        <a class="entry entry-map" href="contatti.html" data-reveal="160">
          <svg class="streets" viewBox="0 0 200 160" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M0 60l200 30M40 0l30 160M140 0l-20 160M0 130l200-20"/><circle cx="96" cy="78" r="6" fill="currentColor"/></svg>
          <span class="kicker" style="color:inherit">04 — Dove siamo</span>
          <span><span class="civic">27/R</span><br>Via Domenico Fiasella<br>16121 Genova</span>
          <span class="go">Mappa e contatti</span>
        </a>
      </nav>
    </div>'''

# ------------------------------------------------------------------ STORIA
SPOTS=[(15,33,"La tenda chiara con la scritta «Bleummer's» in corsivo verde: il logo di questo sito è ricavato da lì."),
       (81,11.5,"Il numero civico 27 sul pilastro in pietra."),
       (47,49,"Giacche appese in vetrina, in diversi colori."),
       (34,41,"Camicie esposte nella loro confezione."),
       (51,63,"Capi piegati sul ripiano basso."),
       (28.5,57,"La vetrina in legno, illuminata dall'interno.")]
spots=''.join(f'<button class="spot" type="button" style="left:{x}%;top:{y}%" aria-label="Dettaglio {i+1}: {t}" aria-pressed="false">{i+1}</button>' for i,(x,y,t) in enumerate(SPOTS))
spotlist=''.join(f'<li><button type="button" aria-pressed="false"><b>{i+1}</b><span>{t}</span></button></li>' for i,(x,y,t) in enumerate(SPOTS))
storia=f'''    <p class="masthead"><span>Il registro</span><span>Bleummer's dal 1964</span><b>Genova</b></p>
    <div class="story-head">
      <div>
        <p class="kicker" data-reveal>02 — Storia</p>
        <h1 data-reveal="80">Il registro della bottega</h1>
        <p class="lede" data-reveal="160" style="font-size:1.2rem">Dal 1964 Bleummer's vende abbigliamento da uomo a Genova. Il registro qui sotto riporta solo fatti verificati; le righe in giallo vanno completate con il titolare.</p>
      </div>
      <p data-reveal="200" style="font-family:var(--display);font-size:clamp(4rem,10vw,7.5rem);line-height:.85;margin:0"><span data-years>62</span><span style="display:block;font-family:var(--mono);font-size:.85rem;letter-spacing:.14em;text-transform:uppercase;margin-top:10px;color:var(--muted)">anni di attività · dal 1964</span></p>
    </div>
    <div class="story-body">
      <div class="tape-wrap" aria-hidden="true"><div class="tape"></div><span class="tape-pin">1964</span></div>
      <ol class="ledger">
        <li data-reveal><div><div class="y">1964</div><p class="src">Fonte: registri delle imprese</p></div>
          <div><h3>Apre Bleummer's</h3><p>L'attività è registrata con il nome «Bleummer's dal 1964». {TBC.replace('[DA CONFERMARE]',"[DA CONFERMARE: chi l'ha fondata e perché si chiama così]")}</p></div></li>
        <li data-reveal><div><div class="y"><span class="tbc">[ANNO]</span></div><p class="src">Fonte: visure camerali</p></div>
          <div><h3>Cambio di titolarità</h3><p>Le fonti camerali riportano titolari diversi in epoche diverse. {TBC.replace('[DA CONFERMARE]','[DA CONFERMARE: nomi e anni dei passaggi, da concordare con il negozio prima di pubblicarli]')}</p></div></li>
        <li data-reveal><div><div class="y"><span class="tbc">[ANNO]</span></div></div>
          <div><h3>Il negozio di Via Fiasella</h3><p>{TBC.replace('[DA CONFERMARE]','[DA CONFERMARE: il negozio è sempre stato al 27/R o si è trasferito qui?]')}</p></div></li>
        <li data-reveal><div><div class="y">Oggi</div><p class="src">Fonte: dati camerali</p></div>
          <div><h3>Ditta individuale al 27/R</h3><p>Commercio al dettaglio di abbigliamento per adulti (codice ATECO 47.71.1): abbigliamento da uomo e camiceria, in Via Domenico Fiasella 27/R, 16121 Genova.</p></div></li>
        <li data-reveal><div><div class="y">…</div></div>
          <div><h3>Le righe da scrivere</h3><p><span class="tbc">[DA RACCOGLIERE: foto d'epoca, ricordi dei clienti storici, marchi trattati negli anni]</span></p></div></li>
      </ol>
    </div>
    <section class="shopfront" aria-labelledby="h-vetrina">
      <figure class="spots" data-reveal>
        <img src="assets/img/vetrina.webp" width="765" height="1020" alt="La vetrina di Bleummer's al 27/R di Via Fiasella" loading="lazy">
        {spots}
        <figcaption>Tocca i numeri per leggere i dettagli della vetrina.</figcaption>
      </figure>
      <div data-reveal="100">
        <p class="kicker">La vetrina oggi</p>
        <h2 id="h-vetrina">Cosa si vede al 27/R</h2>
        <ol class="spot-list">{spotlist}</ol>
      </div>
    </section>'''

# ------------------------------------------------------------------ COLLEZIONI
ITEMS=[('camiceria','Camiceria',None,'','Camicie da uomo','La camiceria è una delle specialità del negozio.',f'La camiceria è indicata tra le specialità del negozio. {TBC.replace("[DA CONFERMARE]","[DA CONFERMARE: modelli, tessuti, marchi, eventuale su misura]")}',.92,'0'),
 ('giacche','Giacche','1','Uomo con giacca marrone, camicia bianca e pantaloni chino beige',f'Giacca spezzata {TBC}','Marrone, su camicia bianca e chino chiaro.','Esempio di giacca spezzata portata con camicia bianca e chino chiaro. In vetrina si vedono giacche in diversi colori. '+TBC.replace('[DA CONFERMARE]','[DA CONFERMARE: modelli e marchi disponibili]'),1.08,'1'),
 ('maglieria','Maglieria','2','Uomo con maglione dolcevita bianco lavorato a trecce',f'Dolcevita a trecce {TBC}','Lana bianca, collo alto.','Esempio di dolcevita a trecce. '+TBC.replace('[DA CONFERMARE]','[DA CONFERMARE: filati e colori disponibili]'),1,'1'),
 ('capispalla','Capispalla','3','Uomo con giacca nera effetto rettile con zip',f'Giacca in pelle {TBC}','Nera, effetto rettile, con zip.','Esempio di giacca in pelle con zip e revers. '+TBC.replace('[DA CONFERMARE]','[DA CONFERMARE: materiali e modelli]'),.95,'1'),
 ('maglieria','Maglieria','4','Uomo con cardigan grigio a trecce con collo sciallato',f'Cardigan sciallato {TBC}','Grigio mélange, bottoni in contrasto.','Esempio di cardigan a trecce con collo sciallato. '+TBC.replace('[DA CONFERMARE]','[DA CONFERMARE: disponibilità]'),1.05,'1'),
 ('capispalla','Capispalla','5','Uomo con gilet imbottito blu su maglione a trecce',f'Gilet imbottito {TBC}','Blu, trapuntato, da mezza stagione.','Esempio di gilet trapuntato per le mezze stagioni. '+TBC.replace('[DA CONFERMARE]','[DA CONFERMARE: modelli e marchi]'),.98,'1')]
hangers=''
for cat,catl,img,alt,name,short,desc,w,ex in ITEMS:
    if img:
        ph=f'<span class="photo"><img src="assets/img/{img}.webp" width="640" height="800" alt="{alt}" decoding="async" draggable="false"><span class="badge-ex">Foto di esempio</span></span>'
        gcls='garment'; dimg=f'assets/img/{img}.webp'
    else:
        ph='<span class="photo"><p>Foto da scattare in negozio<br><span class="tbc">[DA CONFERMARE]</span></p></span>'
        gcls='garment empty'; dimg=''
    desc_attr=desc.replace('"','&quot;')
    hangers+=f'''        <li class="hanger" style="--w:{w}" data-cat="{cat}" data-cat-label="{catl}" data-alt="{alt}" data-example="{ex}" data-desc="{desc_attr}">
          <svg class="hook" aria-hidden="true"><use href="#hanger"/></svg>
          <button class="{gcls}" type="button" aria-haspopup="dialog">{ph}<span class="tag"><b>{name}</b>{catl}</span></button>
        </li>
'''
collezioni=f'''    <p class="masthead"><span>Lo stender</span><span>Abbigliamento uomo</span><b>Camiceria</b></p>
    <div class="rack-head">
      <div>
        <p class="kicker" data-reveal>03 — Collezioni</p>
        <h1 data-reveal="80">Lo stender</h1>
        <p data-reveal="140" style="font-size:1.15rem">Scorri le grucce trascinando, con la rotellina o con le frecce; tocca un capo per aprirne il cartellino e chiedere se è disponibile.</p>
      </div>
      <div class="filters" role="group" aria-label="Filtra per categoria" data-reveal="200">
        <button class="tag-btn light" type="button" data-filter="tutto" aria-pressed="true">Tutto</button>
        <button class="tag-btn light" type="button" data-filter="camiceria" aria-pressed="false">Camiceria</button>
        <button class="tag-btn light" type="button" data-filter="giacche" aria-pressed="false">Giacche</button>
        <button class="tag-btn light" type="button" data-filter="maglieria" aria-pressed="false">Maglieria</button>
        <button class="tag-btn light" type="button" data-filter="capispalla" aria-pressed="false">Capispalla</button>
      </div>
    </div>
    <div class="stender" data-reveal="120">
      <div class="rod" aria-hidden="true"></div>
      <ul class="rack" aria-label="Capi sullo stender">
{hangers}      </ul>
    </div>
    <div class="rack-ui">
      <span class="count" aria-hidden="true">01 / 06</span>
      <span class="nav-btns"><button class="tag-btn light" type="button" data-rack="prev">← Prima</button><button class="tag-btn" type="button" data-rack="next">Dopo →</button></span>
    </div>
    <p class="rack-note">Le foto con l'etichetta «Foto di esempio» servono solo a mostrare l'impaginazione e andranno sostituite con i capi realmente in negozio. Categorie viste nella vetrina reale: giacche, camicie in confezione, capi piegati.</p>
'''

DIALOG=f'''    <dialog class="detail" id="detail" aria-labelledby="d-name">
      <button class="close" type="button" aria-label="Chiudi il cartellino">×</button>
      <div class="detail-in">
        <figure class="photo"><img data-f="img" src="" alt=""><span class="badge-ex" data-f="ex">Foto di esempio</span></figure>
        <div class="body">
          <p class="kicker" data-f="cat"></p>
          <h2 id="d-name" data-f="name"></h2>
          <p data-f="desc"></p>
          <div class="cta">
            <a class="tag-btn red" data-f="wa" href="{WA}" target="_blank" rel="noopener">{ic('chat')}Chiedi su WhatsApp</a>
            <a class="tag-btn" href="{TEL}">{ic('phone')}Chiama</a>
          </div>
          <p class="caption">Numero WhatsApp {TBC}</p>
        </div>
      </div>
    </dialog>'''

# ------------------------------------------------------------------ CONTATTI
LINKS=[(GDIR,'nav','Indicazioni con Google Maps',''),
 ('https://www.google.com/maps/search/?api=1&amp;query=Bleummer%27s+'+Q,'star','Recensioni su Google',''),
 ('https://www.tripadvisor.it/Search?q=Bleummer%27s%20Genova','owl','TripAdvisor',' <span class="tbc">[scheda da verificare]</span>'),
 ('https://maps.apple.com/?daddr='+Q,'apple','Apple Mappe',''),
 ('https://www.openstreetmap.org/?mlat=44.4051&amp;mlon=8.9412#map=19/44.4051/8.9412','map','OpenStreetMap',''),
 (TEL,'phone','Telefono 010 542234',''),
 (WA,'chat','WhatsApp',' '+TBC),
 ('mailto:EMAIL-DA-CONFERMARE@esempio.it','mail','Email',' '+TBC)]
EXT=' target="_blank" rel="noopener"'
links=''.join(f'<li><a href="{h}"{"" if h.startswith(("tel:","mailto:")) else EXT}><span>{ic(i)}{t}{x}</span></a></li>' for h,i,t,x in LINKS)
contatti=f'''    <p class="masthead"><span>Dove siamo</span><span>Via Domenico Fiasella 27/R</span><b>16121 Genova</b></p>
    <p class="kicker" data-reveal>04 — Dove siamo</p>
    <h1 data-reveal="80" style="max-width:14ch">Al 27/R di Via Fiasella</h1>
    <div class="visit">
      <div class="map-box" data-reveal>
        <div id="map" role="region" aria-label="Mappa OpenStreetMap con la posizione di Bleummer's"></div>
        <p class="caption">Mappa © contributori di OpenStreetMap · posizione del segnaposto {TBC}</p>
      </div>
      <aside class="receipt" aria-labelledby="h-receipt" data-reveal="100">
        <h2 id="h-receipt">Bleummer's</h2>
        <p class="center">Abbigliamento uomo · dal 1964</p>
        <hr>
        <p>Via Domenico Fiasella 27/R<br>16121 Genova (GE)</p>
        {status()}
        {hours_table()}
        <hr>
        <ul class="links">{links}</ul>
        <hr>
        <p class="center">P.IVA {TBC}</p>
      </aside>
    </div>
    <section class="compose" aria-labelledby="h-compose">
      <h2 id="h-compose" data-reveal>Scrivi al negozio</h2>
      <p data-reveal="60">Il messaggio si apre già pronto su WhatsApp o nella tua app di posta: questo sito non raccoglie dati.</p>
      <form id="compose" novalidate>
        <div class="row two">
          <div><label for="nome">Il tuo nome</label><input id="nome" name="nome" autocomplete="name" aria-describedby="nome-err"><p class="err" id="nome-err"></p></div>
          <div><label for="cosa">Argomento</label><select id="cosa" name="cosa"><option>Disponibilità di un capo</option><option>Camiceria</option><option>Orari e visita</option></select></div>
        </div>
        <div class="row"><div><label for="msg">Messaggio</label><textarea id="msg" name="msg" aria-describedby="msg-err" placeholder="Es. cerco una camicia bianca collo 41"></textarea><p class="err" id="msg-err"></p></div></div>
        <div class="send"><button class="tag-btn red" type="button" data-send="wa">{ic('chat')}Apri su WhatsApp</button><button class="tag-btn" type="button" data-send="mail">{ic('mail')}Apri nell'email</button></div>
        <p class="caption">WhatsApp ed email del negozio {TBC}</p>
      </form>
    </section>'''

D="Bleummer's, abbigliamento uomo e camiceria a Genova dal 1964. Via Domenico Fiasella 27/R, tel. 010 542234."
def links(h):
    for a,b in [('index.html','#bottega'),('storia.html','#storia'),('collezioni.html','#collezioni'),('contatti.html','#dove')]: h=h.replace(f'href="{a}"',f'href="{b}"')
    return h
VIEWS=[('bottega',"Bleummer's · Abbigliamento uomo e camiceria a Genova dal 1964",'Bottega',links(home)),
       ('storia',"Storia · Bleummer's dal 1964, Genova",'Storia',links(storia)),
       ('collezioni',"Collezioni · Bleummer's, Genova",'Collezioni',links(collezioni)),
       ('dove',"Dove siamo · Bleummer's, Via Fiasella 27/R Genova",'Dove siamo',links(contatti))]
out=assemble(VIEWS)
open(OUT,'w',encoding='utf-8').write(out)
print(OUT, round(len(out)/1024), 'KB')
