# Gotti e Panetti — sito demo (v2)

Affetteria Gotti e Panetti · Via Domenico Fiasella 28R, 16121 Genova.
Sito statico multipagina, nessuna dipendenza esterna a runtime (font e librerie self-hosted). Si apre anche con doppio clic su `index.html`.

## Nota di concept
- **Direzione visiva — "il banco dell'affettatrice"**: marmo del bancone, nero ghisa, rosso affettatrice (Berkel), rosa del grasso. Niente foto stock: l'oggetto protagonista è il prodotto stesso.
- **Font**: Gloock (display, serif ad alto contrasto da insegna) + Atkinson Hyperlegible (testo, alta leggibilità) + Courier Prime per cartellini, scontrini e numeri dell'eliminacode.
- **Struttura**: 4 pagine reali, navigate come i biglietti dell'eliminacode del banco (N° 01 Il banco · 02 Chi siamo · 03 Listino · 04 Dove siamo), con display a LED che anticipa il numero al passaggio e transizione "lama" tra le pagine.
  - Home: **split-screen** — a sinistra la scena 3D fissa, a destra la colonna che scorre (indice dei panini, scontrino della giornata, timbri delle recensioni).
  - Chi siamo: **impaginato editoriale da vocabolario** (voci "gòtto" e "panétto" che si traducono), griglia asimmetrica a 12 colonne.
  - Listino: **cartellini orizzontali appesi a un binario**, che oscillano al passaggio del mouse/scorrimento; filtri per categoria.
  - Dove siamo: mappa OSM fissa + colonna contatti a scontrino.
- **3D**: salame con budello, muffa nobile e spago, sezione con grasso a grana grossa e pepe; affettatrice con lama in acciaio e carter rosso. Si affetta trascinando, toccando, col pulsante o scorrendo la pagina; le fette cadono a ventaglio sulla carta. Perché è adatto: è letteralmente il mestiere dell'affetteria.

## Struttura file
```
index.html storia.html listino.html dove.html privacy.html cookie.html crediti.html
assets/css/style.css
assets/js/main.js consent.js scene3d.js map.js
assets/vendor/  gsap, ScrollTrigger, lenis, three (bundle ridotto), leaflet
assets/fonts/   woff2 self-hosted
assets/img/     favicon.svg, salame.svg (fallback senza WebGL)
_headers .htaccess  (CSP e header di sicurezza per Netlify / Apache)
```

## Dati da chiedere al cliente
Vedi elenco nel messaggio di consegna e i segnaposto gialli `[DA CONFERMARE]` nelle pagine.
