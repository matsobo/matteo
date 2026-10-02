# Borgo Car — demo v2 "Tavole d'officina"

Apri `index.html` con doppio clic oppure servi la cartella da qualsiasi hosting statico.
Header di sicurezza: `_headers` (Netlify/Cloudflare Pages) o `.htaccess` (Apache).
Le pagine sono generate da `../_tools/borgo-car-build.py`: modifica i testi lì e rilancia `python3 _tools/borgo-car-build.py`.

Il modello 3D dell'auto (`assets/js/car-model.js`) **non è nel repository**: deriva da un file Free3D con licenza per solo uso personale. Per la demo si rigenera dal .c4d con `_tools/c4d-to-bcm` (vedi il suo LEGGIMI); senza il file il simulatore mostra la foto di riserva. Prima di pubblicare il sito va sostituito con un modello a licenza commerciale (vedi `assets/CREDITS.md`).

Anche `borgo-car-demo.html` (versione in un file unico, generata da `_tools/borgo-car-singlefile.py`) resta fuori dal repository perché incorpora il modello.

Da completare: numero WhatsApp in `assets/js/main.js` (`CFG.wa`), foto reali al posto di `assets/img/prima.jpg` e `dopo.jpg`, tutti i segnaposto gialli "da confermare".
