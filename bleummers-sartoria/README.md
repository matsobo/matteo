# Bleummer's — sito demo "Il Cartellino"

**Da aprire o inviare: `index.html`.** È un file unico e autosufficiente (stili, script, Three.js, Leaflet e immagini incorporati): funziona anche scaricato da solo e aperto con doppio clic. Servono solo internet per i font Google e per la mappa.

Pagine interne, ciascuna con il proprio indirizzo (`#bottega`, `#storia`, `#collezioni`, `#dove`), tasti indietro/avanti del browser funzionanti:
- Bottega: copertina asimmetrica con campione di gessato 3D interattivo
- Storia: registro a righe con metro da sarta legato allo scroll e punti sulla foto della vetrina
- Collezioni: stender orizzontale con grucce in prospettiva e scheda del capo
- Dove siamo: mappa OpenStreetMap (Leaflet) e scontrino con i link diretti

## Modificare il sito
I sorgenti sono in `src/` (CSS, JavaScript, immagini, librerie, testi in `src/build.py`).
Dopo una modifica rigenera il file unico con:

    python3 src/build.py

I dati da verificare sono marcati `[DA CONFERMARE]`.
