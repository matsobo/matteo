# Verifica di sicurezza – Scuola Benedettine

Data della verifica: 28 settembre 2026 · Ambito: tutto il repository (`index.html`, `documenti/`, `vendor/`, `tools/`, `docs/`, configurazioni) e la cronologia git.

## Com'è fatto il sito (e perché conta)

Oggi il sito è **statico**: un file HTML, due PDF e una libreria JavaScript. **Non c'è** un server applicativo, un database, un login vero, un pannello di amministrazione, delle API o dei pacchetti npm/Composer. Per questo alcune voci della verifica riguardano componenti che ancora non esistono: sono segnate come **"da fare con il backend"**, con le indicazioni per quando il sito verrà collegato a WordPress (o a un altro sistema).

Legenda: ✅ fatto in questa verifica · ✔️ controllato, nessun problema · ⏳ da fare quando ci sarà il backend

## Esito per voce

| # | Voce | Esito | Cosa è stato fatto / trovato |
|---|---|---|---|
| 1 | Pacchetti inutilizzati | ✅ | Nessun `package.json` nel sito. Rimossi 4 simboli SVG mai usati (`i-down`, `i-right`, `i-link`, `i-rotate`) e un aggancio di debug. Le skill in `.claude/` sono strumenti di lavoro, non parte del sito, e non vengono pubblicate (bloccate da `.htaccess`). |
| 2 | Segreti nel codice | ✔️ | Cercati chiavi API, token, password e chiavi private in tutti i file e in **tutti i 9 commit** della cronologia: nessuno trovato. Le uniche "password" sono etichette del modulo di login. |
| 3 | Limiti di invio (rate limiting) | ✅ lato browser · ⏳ server | Nei moduli: massimo 5 invii al minuto, poi pausa di 60 s; pulsante bloccato 10 s dopo ogni invio. **Il limite vero va messo sul server**: quello nel browser si aggira facilmente. |
| 4 | Controllo accessi utenti | ⏳ | Non esistono utenti né ruoli. L'area riservata è solo un'interfaccia dimostrativa: non contiene dati e non dà accesso a nulla. |
| 5 | Password protette con hash | ⏳ | Il sito non salva né invia password. Verificato: la password non va mai nell'indirizzo, non viene conservata e viene cancellata dal campo dopo l'invio. WordPress 6.8+ usa già bcrypt. |
| 6 | Chiavi API nascoste | ✔️ | Il sito non usa chiavi API. `.gitignore` ora esclude `.env`, `*.pem`, `*.key`, `credentials*.json` e simili, per evitare che finiscano nel repository in futuro. |
| 7 | Autenticazione | ⏳ | Da realizzare sul server (vedi sotto). Il modulo è già pronto: campi con `autocomplete` corretti per i password manager e invio in POST. |
| 8 | Aggiornamento dipendenze | ✅ | Three.js aggiornato da 0.169.0 a **0.186.1** (ultima versione), con un pacchetto ridotto alle sole parti usate: 135 KB compressi invece di 170 KB. Ora è **ospitato sul sito** (`vendor/`), con jsDelivr solo come riserva. Rigenerabile con `sh tools/build-three.sh`. |
| 9 | Pulizia dei moduli | ✅ | Tolti caratteri di controllo e invisibili, spazi superflui e lunghezze eccessive; lunghezza massima su ogni campo; telefono con caratteri ammessi; campo trappola invisibile per i bot; scarto degli invii troppo rapidi (meno di 2,5 s). **Il server dovrà ripetere validazione e pulizia.** |
| 10 | Protezione da XSS | ✅ | 1) Corretti 7 punti dove un testo veniva reinserito come HTML: innocui oggi, pericolosi con contenuti da un gestionale. 2) Aggiunta una **Content-Security-Policy** che autorizza solo i 3 script della pagina tramite la loro impronta SHA-256. Test: un titolo con codice malevolo resta testo, con e senza CSP; uno script iniettato viene bloccato. |
| 11 | Modalità debug | ✅ | Nessun `console.log` né `debugger`. Rimossi l'aggancio di debug della mascotte (`_dbg`) e una variabile globale superflua. |
| 12 | Verifica completa | ✅ | Questo documento, con i test automatici elencati in fondo. |
| 13 | Variabili d'ambiente | ✔️ | Nessun file `.env` né variabile d'ambiente usata. `.gitignore` aggiornato. |
| 14 | File esposti | ✅ | `.htaccess` blocca `.git`, `docs/`, `tools/`, `.claude/`, `CLAUDE.md`, file nascosti, `.md`, `.py`, `.sh`, `.env`, `_headers` e l'elenco delle cartelle. Verificato su **Apache 2.4 reale**. Le immagini pubblicate non contengono dati EXIF: la foto originale del cortile riportava il modello del telefono, nessuna posizione GPS, e quei dati non sono nel sito. |
| 15 | Rotte di amministrazione | ⏳ | Non esistono. Vedi indicazioni per WordPress. |
| 16 | Endpoint API | ⏳ | Non esistono. Quando il modulo contatti verrà collegato: solo HTTPS, solo POST, validazione lato server, limiti di invio, protezione CSRF. |
| 17 | CORS | ✔️ | Il sito non espone API e non abilita il CORS: `.htaccess` rimuove `Access-Control-Allow-Origin`. Le uniche richieste verso altri siti (font Google e, come riserva, jsDelivr) sono in lettura e previste dalla CSP. |
| 18 | Intestazioni di sicurezza | ✅ | `.htaccess` (Apache) e `_headers` (Netlify/Cloudflare): HTTPS obbligatorio + HSTS, `nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, CSP `frame-ancestors`. Verificate su Apache. |
| 19 | Accesso al database | ⏳ | Non c'è un database. |

## Cosa è cambiato nei file

- `index.html`: CSP con hash, escape del testo, moduli rinforzati (POST, limiti, pulizia, trappola anti-bot, pausa tra invii), caricamento di Three.js locale con riserva CDN, rimozione del codice di debug e dei simboli inutilizzati, testo della pagina Cookie aggiornato.
- `vendor/three-guglielmo.min.js`: Three.js 0.186.1 ridotto (licenza MIT, indicata nel file).
- `tools/build-three.sh`, `tools/three-guglielmo.entry.js`: per rigenerare la libreria.
- `tools/aggiorna-csp.py`: ricalcola la CSP. **Va lanciato dopo ogni modifica agli script di `index.html`**, altrimenti il browser blocca lo script modificato. `--check` verifica senza modificare.
- `.htaccess`, `_headers`: intestazioni di sicurezza, HTTPS, blocco dei file non pubblici.
- `.gitignore`: esclusione di segreti e file locali.

## Errori trovati e corretti durante il ricontrollo

- **Copia locale di Three.js mai usata**: nell'`import()` dinamico il percorso `vendor/…` senza `./` viene letto come nome di un pacchetto e rifiutato; il sito passava sempre al CDN. Corretto in `./vendor/…` e verificato.
- **Controllo del telefono inattivo**: il `pattern` scritto all'inizio non è valido per Chrome 112+ (che interpreta i pattern in modalità `v`) e veniva ignorato in silenzio. Riscritto con i caratteri speciali protetti; verificato con numeri validi e non validi.
- **Pulizia dei campi durante la digitazione**: con un campo già segnato come errato, lo spazio finale veniva tolto mentre si scriveva (non si riusciva a digitare "Mario Rossi"). Ora la pulizia avviene solo uscendo dal campo e all'invio; aggiunto un test.
- **Campo trappola senza lunghezza massima**: aggiunta.
- **Un test che risultava sempre superato** (quello sulla password cancellata) è stato riscritto perché verifichi davvero.

## Da sapere

- Aprendo `index.html` **direttamente dal computer** (`file://`), Chrome non permette di caricare la copia locale di Three.js: il sito passa al CDN e, senza Internet, mostra Guglielmo in 2D. Pubblicato su un server funziona dalla copia locale.
- Dopo ogni modifica a uno `<script>` di `index.html`: `python3 tools/aggiorna-csp.py`.

## Cosa resta da fare (in ordine di importanza)

1. **Quando si collega il backend (es. WordPress):**
   - HTTPS su tutto il dominio (poi l'HSTS del `.htaccess` è già pronto).
   - Login: limite ai tentativi (es. plugin *Limit Login Attempts Reloaded*), autenticazione a due fattori per amministratori e personale, password robuste.
   - Ruoli: ogni docente con un account personale (ruolo minimo "Sottoscrittore" o ruolo dedicato), mai account condivisi; area riservata visibile solo agli utenti con quel ruolo.
   - `/wp-admin` e `/wp-login.php`: accesso limitato (lista IP o protezione aggiuntiva); XML-RPC disattivato se non serve; `define('DISALLOW_FILE_EDIT', true);` e `WP_DEBUG` a `false` in `wp-config.php`.
   - Database: utente MySQL dedicato con i soli permessi sul proprio database, password lunga e unica, nessun accesso da remoto, prefisso tabelle non standard, backup cifrati e periodici.
   - Segreti (`wp-config.php`, chiavi SMTP, ecc.) fuori dal repository e fuori dalla cartella pubblica.
   - Modulo contatti: validazione e pulizia **sul server**, limite di invii per IP, token CSRF, invio via SMTP autenticato; conservazione dei dati come da informativa.
   - Aggiornamenti automatici di sicurezza per WordPress, tema e plugin; pochi plugin, solo se mantenuti.
2. **Hosting:** chiedere `ServerTokens Prod` (oggi Apache dichiara la sua versione: da `.htaccess` non si può togliere).
3. **Font:** ospitarli sul sito invece che da Google Fonts (GDPR); poi togliere `fonts.googleapis.com` e `fonts.gstatic.com` dalla CSP in `tools/aggiorna-csp.py`.
4. **PDF delle rette:** i metadati riportano come autore "Casa" (il nome del computer usato per crearli). Innocuo; se si preferisce, si può togliere quando verranno rigenerati.

## Test eseguiti per la verifica

- Ricerca di segreti in file e cronologia git (9 commit).
- 33 pagine visitate seguendo ogni link, in un'anteprima simulata a iframe, anche nella configurazione più restrittiva: 0 errori.
- 99 clic sui link interni in 3 configurazioni: 0 falliti; navigazione, Indietro/Avanti e link diretti su server e da file.
- CSP: nessuna violazione con il sito completo; uno script iniettato viene bloccato.
- XSS: un titolo malevolo di un avviso non viene eseguito in nessuna pagina (con e senza CSP).
- Moduli: invio rapido (bot) scartato, campo trappola, pausa dopo l'invio, blocco dopo 5 tentativi al minuto, pulizia dell'input (anche durante la digitazione), lunghezze massime, telefono non valido segnalato, POST, password cancellata.
- Three.js 0.186.1: modello identico alla versione precedente; caricamento dalla copia locale e, se manca, dal CDN.
- Apache 2.4 reale con HTTPS: reindirizzamento da HTTP, intestazioni, file bloccati (403/404) e sito funzionante.
- Tastiera, mascotte, Memory, riduci movimento: invariati.
