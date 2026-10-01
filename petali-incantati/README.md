# Petali Incantati — sito demo

Fiorista a Manesseno (Sant'Olcese, GE). Sito statico multi-file, nessuna dipendenza esterna a runtime.

- Apri `index.html` con doppio clic (funziona anche da `file://`) oppure servi la cartella con un server statico.
- `src/scene3d.src.js` è il sorgente della peonia 3D; per ricompilare:
  `npx esbuild src/scene3d.src.js --bundle --minify --format=iife --outfile=assets/js/scene3d.js` (con `three` installato).
- Header di sicurezza: `_headers` (Netlify/Cloudflare Pages) o `.htaccess` (Apache).
- Tutti i `[DA CONFERMARE]` vanno verificati con il titolare prima della pubblicazione.
- Versione in un unico file: `python3 tools/build-singolo.py` genera `../petali-incantati-singolo.html`.
