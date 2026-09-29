# Pizza Sbrano — sito demo multipagina

Via Carlo Barabino 98r, Genova Foce · aperto 24/7.

## Pagine

| File | Struttura |
|---|---|
| `index.html` | **Vetrina**: la pagina intera è una scena 3D (teglia di focaccia su bancone di marmo). Si gira trascinando, si solleva un pezzo toccandolo. Indice numerato, scontrino con ora live. |
| `banco.html` | **Listino** editoriale a sinistra + **vetrina 3D fissa** a destra: scegliendo una focaccia (classica, patate, cipolle, olive, rosmarino) i condimenti cadono sulla teglia. |
| `storia.html` | **Impaginato da rivista** (testata, capolettera, colonne) + **quadrante delle 24 ore** trascinabile che cambia colore del cielo e racconta chi entra a quell'ora. Rassegna stampa con articoli veri. |
| `dove.html` | **Mappa OpenStreetMap** (Leaflet) a tutta altezza + pannello con link diretti a Google Maps, TripAdvisor, Apple Mappe, Waze, OSM, Facebook. Nessuna API key. |

Tema **giorno/notte** automatico sull'ora locale (07–20 giorno), con interruttore manuale: di notte cambia tutto, anche le luci della scena 3D (lampione al sodio).

## Tecnica

- Font (self-hosted in `assets/fonts`): Shrikhand (logo), Gloock (titoli), Familjen Grotesk (testo), Martian Mono (etichette).
- 3D: Three.js, tutto procedurale (`src/focaccia.js`): campo di altezze con buchi, mappe colore/rugosità/olio (clearcoat)/normal generate su canvas, mollica alveolata sui tagli, sale e condimenti instanziati, ombre morbide, vapore.
- GSAP per le animazioni, View Transitions tra le pagine (Chromium).
- `prefers-reduced-motion` rispettato; fallback senza WebGL.

## Modificare

```bash
# pagine: modifica src/pages/*.html, poi
python3 src/build.py
# motore 3D: modifica src/focaccia.js, poi (con three@0.169 installato)
npx esbuild src/focaccia.js --bundle --minify --format=iife --global-name=Focaccia --outfile=assets/js/focaccia.bundle.js
```

## Da confermare con il titolare

- Prezzi (l'unico trovato online è 12 €/kg, fonte non ufficiale), assortimento (cipolle, olive, rosmarino, pizza, panini, dolci).
- Telefono: 331 942 8164 trovato online (fonte non ufficiale); la versione precedente del sito usava 010 540437.
- Civico: 98r (varie schede online) vs 94-96r (TripAdvisor). Posizione esatta del segnaposto sulla mappa.
- Titolo del brano di Olly che cita Sbrano; anno di fondazione.
- Pagamenti, vendita a peso, vassoi per feste, ragione sociale e P.IVA.
- Foto vere del negozio (la focaccia 3D è un'illustrazione).
