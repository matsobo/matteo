# Scuola Benedettine – Genova · Riprogettazione del sito

Documento di accompagnamento a `index.html` (sito completo in un unico file).

> **Metodo e limiti dell'analisi.** Durante il lavoro il dominio `www.benedettineprovvidenza.net` non era raggiungibile dall'ambiente di sviluppo (bloccato dalla policy di rete). L'inventario è stato quindi ricostruito dalle pagine e dai PDF del sito **indicizzati dai motori di ricerca** (titoli, URL, estratti di testo). Tutto ciò che non si è potuto leggere integralmente è marcato nel sito come segnaposto esplicito `[COSÌ]` ed è elencato nella nota finale.

---

## 1. Inventario dei contenuti del sito attuale

### 1.1 Dati identificativi (presenti in testata / titolo del sito)
- Nome: **Scuola Benedettine – Genova**
- Ente: Istituto delle Suore Benedettine della Provvidenza
- Codici meccanografici: **Scuola Primaria GE1E00800L** · **Scuola dell'Infanzia GE1A00300G**
- Indirizzo: **Via San Giuliano, 10 – Via Bovio, 12r – 16145 Genova**
- Telefono: **010-3629131**
- Email: **direzione@benedettineprovvidenza.net**
- Certificazione del Sistema di Gestione per la Qualità **UNI EN ISO 9001:2015**

### 1.2 Pagine e sezioni

| # | Pagina attuale | URL | Contenuti chiave rilevati |
|---|---|---|---|
| 1 | Home | `/` | Presentazione: "una scuola dove ogni bambino è speciale", "da 80 anni nel cuore di Albaro, nel verde, vicino al mare"; codici meccanografici; contatti. |
| 2 | SCUOLA | `/index.php/scuola/` | Ubicazione (Albaro, via San Giuliano 10, accesso anche da via Bovio 12 o 10). Spazi: ampio cortile; Infanzia 3 aule al piano terra; Primaria 2 aule al piano terra e 3 al primo piano; palestra attrezzata; campo in erba sintetica; refettorio (con cucina interna); aula informatica; infermeria; biblioteca; laboratorio-museo di scienze naturali; cappella; spazi verdi e ombreggiati con strutture per giochi all'aperto. Testo sulle insegnanti: cura di tutti gli alunni senza distinzione, sensibilità, fiducia, apertura al dialogo (in particolare con i bambini in difficoltà), educazione alla responsabilità e alla solidarietà. Ambiente sereno e accogliente. |
| 3 | CENNI STORICI (Chi siamo) | `/index.php/chi-siamo/` | Testo storico **non leggibile** durante l'analisi → segnaposto. |
| 4 | AVVISI | `/index.php/news/` | Open day sab. 15/11/2025 e sab. 10/01/2026, 9:30–12:00, senza prenotazione; riunione genitori futura classe prima a.s. 2026/27 lun. 02/02/2026 ore 17:00; riunione analoga a.s. 2025/26 gio. 30/01/2025 ore 17:00; interpello docente Infanzia 2026/27. |
| 5 | CALENDARIO SCOLASTICO | `/index.php/2019/07/08/calendario-scolastico/` | Articolo del 2019; PDF `CALENDARIO-protetto-ILEX-2021.pdf`. Date dell'anno in corso non leggibili → segnaposto. |
| 6 | MODULISTICA | `/index.php/modulistica/` | Moduli di iscrizione Infanzia + informativa privacy; moduli di iscrizione Primaria + informativa privacy; "Autorizzazione-delega-ritiro-alunno". URL dei singoli moduli non rilevati (tranne le informative sotto). |
| 7 | Rette e pagamenti | `/index.php/rette-e-pagamenti/` | IBAN **IT60 T030 6909 6061 0000 0003 927** intestato a Istituto delle Suore Benedettine della Provvidenza – Via San Giuliano, 10 – 16145 Genova; documenti rette **2026-2027** Infanzia e Primaria (PDF). |
| 8 | Libri di testo | `/index.php/libri-di-testo/` | PDF elenco libri adottati 2025/26 per classe (es. classe 3ª: "Learn with us 3", "Ponti Arcobaleno Plus"). |
| 9 | CONTATTI | `/index.php/contatti/` | Indirizzo, telefono, email. Orari segreteria non rilevati. |
| 10 | Area riservata docenti | `/index.php/area-riservata-docenti/` | Pagina WordPress **protetta da password**. |

### 1.3 Documenti scaricabili rilevati

| Documento | URL |
|---|---|
| PTOF 2019–22 (revisione) | `/wp-content/uploads/2021/12/GE1E00800L-PTOF-19-22-revisione.pdf` |
| Rette 2022–2023 | `/wp-content/uploads/2022/01/Rette-2022-2023-.pdf` |
| Rette 2026–2027 Infanzia / Primaria | URL non rilevato |
| Elenco libri di testo 2025/26 | `/wp-content/uploads/2025/05/StampePerClasse.pdf` |
| Interpello docente Infanzia 2026/27 | `/wp-content/uploads/2026/07/INTERPELLO-INFANZIA.pdf` |
| Informativa iscritti Infanzia Rev. 3 | `/wp-content/uploads/2023/01/ALL.-02-INF_INFORMATIVA_ISCRITTI_INFANZIA_Rev.-3-docx.pdf` |
| Informativa iscritti Infanzia (2019) | `/wp-content/uploads/2019/11/INFORMATIVA_ISCRITTI-INFANZIA-_scuola-SGiuliano_Genova.pdf` |
| Calendario 2021 | `/wp-content/uploads/2021/01/CALENDARIO-protetto-ILEX-2021.pdf` |
| Moduli di iscrizione, informativa Primaria, delega ritiro | URL non rilevati |

### 1.4 Contenuti dal PTOF (documento pubblicato sul sito)
- Primaria paritaria dal 26 settembre 2001.
- Attività dal lunedì al venerdì (orario dettagliato non verificato).
- Mensa: buono pasto acquistabile in segreteria o con bonifico, gestito con la funzione "TIM – Tutti in mensa" del **registro elettronico**.
- Spazi aggiuntivi: ampia terrazza, aula con LIM.
- Valori: educazione interculturale e alla pace, rispetto delle differenze e dialogo tra culture, responsabilità, solidarietà, cura dei beni comuni.

### 1.5 Materiali forniti dalla scuola (seconda fase)
- **Logo** "Suore Benedettine della Provvidenza" con stemma: ne è stato ritagliato lo stemma per header, footer e favicon. Il blu petrolio del lettering (#335566) è diventato il colore primario del sito.
- **Guglielmo**, lo scoiattolo mascotte (illustrazione): scontornato e usato nell'area bambini e come versione 2D della mascotte.
- **Foto del cortile** con i bambini (volti già oscurati nella foto originale) e **foto dell'edificio**: usate in Home, Chi siamo, Infanzia, Spazi e negli header delle sezioni La scuola e Famiglie.
- **Testo "Perché sceglierci"**: inserito in Home così com'è stato fornito.

### 1.6 Documenti forniti dalla scuola (terza fase)
- **PTOF 2025–2028** (67 pagine, approvato il 09/01/2026). Da qui vengono: identità e fondatrice (Santa Benedetta Cambiagio), date di parità e parifica, orari di Infanzia e Primaria, settimana tipo dell'Infanzia, quadro orario per materia, pre-scuola, doposcuola, mensa (ditta ELIOR), organico, progetti e laboratori, valutazione, ISO dal 2007 con AGIQUALITAS, accessi da via Bovio (n. 12 varco carrabile, n. 10 ascensore), ricevimento su appuntamento.
- **Rette 2026/2027** Infanzia (€ 1.600) e Primaria (€ 1.776): iscrizione, pasti, materiale, segreteria telematica, sconto fratelli.
- **Coordinate per i pagamenti**: IBAN e intestatario del conto, confermati.
- I tre PDF sono pubblicati nella cartella `documenti/` e collegati dal sito.

### 1.7 Link esterni
- Pagina Facebook "Scuola Benedettine – Genova" (non è stato possibile verificare se sia linkata dal sito attuale)
- Sito della Congregazione: benedettineprovvidenza.it
- Scuola in Chiaro (schede GE1E00800L e GE1A00300G)
- Registro elettronico: citato nel PTOF, URL non rilevato

---

## 2. Sitemap del nuovo sito (massimo 2 livelli)

```
Home  (hero con cubo 3D "Scegli il tuo percorso", percorsi Famiglie / Docenti / Bambini)
├── La scuola
│   ├── Chi siamo e storia        ← ex "Cenni storici" + testi valoriali di "Scuola"
│   ├── Scuola dell'Infanzia      ← NUOVA: dati sparsi tra "Scuola", Modulistica e PTOF
│   ├── Scuola Primaria           ← NUOVA: idem
│   ├── Progetti e laboratori     ← NUOVA: iniziative del PTOF 2025–2028
│   ├── Spazi e strutture         ← ex "Scuola" (elenco degli spazi)
│   └── PTOF e qualità            ← PDF PTOF + certificazione ISO (prima non avevano una pagina)
├── Famiglie
│   ├── Iscrizioni e open day     ← NUOVA: open day e riunioni presi dagli Avvisi + link ai moduli
│   ├── Rette e pagamenti         ← ex "Rette e pagamenti" (+ pulsante "Copia IBAN")
│   ├── Modulistica               ← ex "Modulistica" (raggruppata per argomento + ricerca)
│   ├── Calendario scolastico     ← ex articolo del 2019 "Calendario scolastico"
│   ├── Libri di testo            ← ex "Libri di testo"
│   └── Mensa                     ← NUOVA: contenuti presi dal PTOF
├── Avvisi                        ← ex "Avvisi" (filtri per pubblico, stato "In programma/Concluso")
├── Docenti
│   ├── Area riservata            ← ex "Area riservata docenti" (solo interfaccia di login)
│   └── Lavora con noi            ← NUOVA: interpello preso dagli Avvisi/PDF
├── Spazio bambini                ← NUOVA: Memory, "Scopri la tua scuola"
├── Contatti                      ← ex "Contatti" + modulo di contatto
└── Privacy e note legali (footer) ← NUOVA: segnaposto informativa, cookie, accessibilità
```

**Sezioni accorpate o spostate**
- "SCUOLA" è stata divisa in *Chi siamo* (valori), *Spazi e strutture* (ambienti) e nelle pagine *Infanzia* / *Primaria*.
- "CENNI STORICI" è confluita in *Chi siamo e storia*.
- Open day e riunioni per i nuovi iscritti sono in *Avvisi* e riassunti in *Iscrizioni e open day*.
- L'interpello è in *Avvisi* e ha anche una scheda in *Docenti › Lavora con noi*.
- Il calendario era un articolo del blog datato 2019: ora è una pagina stabile in *Famiglie*.
- Le informazioni sulla mensa, prima solo nel PTOF, hanno una pagina dedicata.
- I documenti vecchi (rette 2022/23, calendario 2021, informativa 2019) restano disponibili nelle sezioni "Archivio".

---

## 3. Verifica di copertura (inventario → nuovo sito)

| Contenuto dell'inventario | Dove si trova nel nuovo sito | Stato |
|---|---|---|
| Nome, ente, codici meccanografici | Header, Home, Chi siamo, Infanzia/Primaria, Contatti, Footer | ✅ |
| Indirizzo con i due ingressi | Contatti, Footer, La scuola | ✅ |
| Telefono ed email | Barra superiore, Contatti, Iscrizioni, Footer | ✅ |
| Certificazione ISO 9001:2015 | Home, Chi siamo, PTOF e qualità, Footer | ✅ |
| Slogan "ogni bambino è speciale / 80 anni ad Albaro" | Hero della Home, Chi siamo | ✅ |
| Testo "Scuola" (insegnanti, valori, ambiente) | Chi siamo | ✅ |
| Elenco spazi e aule | Spazi e strutture, Infanzia, Primaria, Home, Spazio bambini | ✅ |
| Cenni storici | Chi siamo › Cenni storici | ⚠️ fondatrice e date dal PTOF · testo storico ancora segnaposto |
| Avvisi (open day, riunioni, interpello) | Avvisi, Home, Iscrizioni, Lavora con noi | ✅ |
| Calendario scolastico | Famiglie › Calendario (+ archivio 2021) | ⚠️ date segnaposto |
| Modulistica (iscrizioni, informative, delega) | Famiglie › Modulistica, Infanzia, Primaria | ⚠️ link parziali |
| IBAN e intestatario | Famiglie › Rette | ✅ |
| Rette 2026/27 Infanzia e Primaria | Famiglie › Rette (tabelle + PDF), Infanzia, Primaria | ✅ |
| Rette 2022/23 | Rette › Archivio | ✅ |
| Libri di testo 2025/26 | Famiglie › Libri di testo | ✅ |
| PTOF | La scuola › PTOF e qualità (2025–28 + archivio 2019–22) | ✅ |
| Informative privacy | Modulistica, Infanzia, Privacy | ✅ Infanzia · ⚠️ Primaria |
| Area riservata docenti | Docenti › Area riservata | ✅ interfaccia · ⚠️ integrazione |
| Registro elettronico | Docenti, Primaria (colloqui), Home | ⚠️ URL segnaposto |
| Orari, mensa, progetti (PTOF 2025–28) | Infanzia, Primaria, Mensa, Progetti e laboratori | ✅ |
| Link esterni (Facebook, Congregazione, Scuola in Chiaro) | Contatti, Chi siamo, Infanzia, Primaria | ✅ |

---

## 4. Scelte di progetto (sintesi)

- **Palette**: blu petrolio ricavato dal logo (#2A5A72, dal lettering #335566), mare (#0E7C86), verde (#2F7447) e oro caldo (#E3A63A), con gradienti morbidi. Tutti i colori sono token CSS in `:root`.
- **Immagini**: convertite in WebP e incorporate nel file (circa 170 KB in tutto), una sola copia per immagine, assegnate via JS.
- **3D leggero**: il cubo dei percorsi nella hero è fatto solo con CSS 3D (nessuna libreria, 0 KB aggiuntivi). Si ruota trascinando, con i pulsanti o con le frecce della tastiera. Anche le carte del Memory si girano in 3D.
- **Guglielmo 3D (mascotte)**: modello procedurale in Three.js con stile "cartoon" e contorno. Ha coda soffice, orecchie con ciuffi, occhi grandi, la nocciola in mano e il filo d'erba in bocca, come nell'illustrazione.
  - *Presenza*: è sempre visibile in un angolo in basso. A ogni cambio pagina attraversa lo schermo saltellando fino all'altro angolo.
  - *Comportamento*: segue il mouse con lo sguardo, sbatte le palpebre e respira. Se lo tocchi saluta.
  - *Fumetti*: dice un consiglio legato alla pagina solo alla prima visita di quella pagina nella sessione; il fumetto si chiude da solo dopo 5 secondi.
  - *Area bambini*: esulta nel Memory quando si trova una coppia e fa una piroetta quando si vince.
  - *Discrezione*: si abbassa mentre si scorre la pagina e quando il focus da tastiera finisce sotto di lui, così non copre mai il contenuto. Si nasconde con l'interruttore "Guglielmo" nella barra in alto (la scelta viene ricordata).
  - *Prestazioni*: Three.js (circa 170 KB compressi) si carica solo dopo il caricamento della pagina, nei momenti di inattività del browser. In riposo il rendering va a circa 30 fps e si ferma quando la scheda non è visibile. Sui dispositivi di fascia bassa, con "risparmio dati" o senza WebGL, compare l'illustrazione 2D con un'animazione CSS. Con "riduci movimento" resta fermo in un angolo.
- **Animazioni**: comparsa delle sezioni allo scroll (IntersectionObserver), transizioni tra pagine (View Transitions API con fallback CSS), micro-interazioni. Tutte si disattivano con `prefers-reduced-motion` **o** con il pulsante "Animazioni" nella barra superiore (la scelta viene ricordata).
- **Accessibilità**: link "salta al contenuto", menu a tendina accessibili da tastiera (Esc chiude), menu mobile con focus intrappolato, focus sul titolo a ogni cambio pagina, breadcrumb, contrasti AA, testi alternativi per i segnaposto delle foto, moduli con etichette visibili, errori accanto ai campi e riepilogo degli errori, annunci `aria-live` nel Memory.
- **Spazio bambini**: colori vivaci, pulsanti grandi, testi brevi. Non raccoglie dati, non contiene campi di input e non ha link esterni (l'unica uscita riporta al sito).
- **Prestazioni**: un solo file HTML con icone SVG inline e foto WebP incorporate. Nessun framework: il JS è vanilla. I PDF sono file separati nella cartella `documenti/`.

---

## 5. Nota finale

### Contenuti mancanti o da verificare
1. **Testo "Cenni storici"**: la fondatrice e le date di parità ci sono (dal PTOF), manca la storia della casa di Genova, da copiare dalla pagina attuale.
2. **Logo**: lo stemma è ritagliato da una GIF a bassa risoluzione. Per una resa nitida serve la versione vettoriale (SVG) o un PNG ad alta risoluzione.
3. **Orari**: quelli di Infanzia e Primaria sono completi (dal PTOF). Manca l'orario della segreteria. La settimana tipo dell'Infanzia nel PTOF è quella dell'a.s. 2025/26: va aggiornata se cambia.
4. **Calendario 2026/27**: tutte le date.
5. **Link ai PDF**: moduli di iscrizione Infanzia e Primaria, informativa Primaria, delega ritiro, libri 2026/27, menù, eventuali altri moduli non rilevati. (Rette 2026/27 e PTOF 2025–28 ora sono collegati.)
   - Nel PDF delle **rette della Primaria** l'intestazione della tabella dice "INFANZIA": è un refuso da correggere nel documento originale.
6. **Iscrizioni**: modalità e scadenze di consegna, date degli open day per l'a.s. 2027/28.
7. **Mensa**: aggiornata con il PTOF 2025–28 e le rette (ditta ELIOR, € 6,60 a pasto pagato a fine mese, certificato medico per allergie). Il "buono pasto" del vecchio PTOF è stato tolto perché non compare più. Manca il file del menù. **Costi dei corsi facoltativi** (inglese, teatro, pallavolo, rugby): da indicare.
8. **Dati legali**: C.F./P.IVA, PEC, numero del certificato ISO (l'ente, AGIQUALITAS, è indicato), testo dell'informativa privacy del sito, cookie policy, DPO, dichiarazione di accessibilità AgID.
9. **Foto**: le due foto fornite sono già inserite. I riquadri `[FOTO …]` rimasti (aule, palestra, campo, refettorio, laboratori, cappella, foto storica) vanno completati. Per la foto del cortile, e per tutte le altre con bambini, verificare le liberatorie anche se i volti sono oscurati.
10. **Numero di telefono secondario** (010 3106429): compare su elenchi esterni ma non sul sito, quindi non è stato inserito; da confermare.
11. **Pagina Facebook**: verificare che sia la pagina ufficiale prima di pubblicare il link.

### Funzionalità da collegare a sistemi reali
- **Modulo "Scrivici"** (Contatti): oggi è solo dimostrativo e non invia nulla. Va collegato a un endpoint (es. servizio email o CMS) con protezione antispam e registrazione del consenso privacy.
- **Area riservata docenti**: c'è solo l'interfaccia di login (con supporto ai password manager). Va collegata al sistema di autenticazione, per esempio il login di WordPress, un SSO Google Workspace/Microsoft 365 o l'area del registro, insieme a circolari e documenti interni.
- **Registro elettronico**: inserire l'URL ufficiale di accesso per famiglie e docenti (anche per la funzione mensa).
- **Avvisi**: oggi sono scritti a mano nell'HTML. Conviene gestirli da un CMS o da un feed per aggiornarli senza toccare il codice. Lo stato "In programma/Concluso" si calcola già in automatico dalla data.
- **Calendario sincronizzabile**: eventuale feed ICS/Google Calendar.
- **Pagamenti online**: se la scuola adotta una piattaforma (es. PagoPA/gestionale), collegarla alla pagina Rette.
- **Font e Three.js**: prima della pubblicazione è consigliabile ospitare in locale i font Nunito e Baloo 2 (oggi da Google Fonts) e la libreria Three.js (oggi da cdn.jsdelivr.net), così da non inviare dati dei visitatori a terzi (GDPR). Basta cambiare la costante `THREE_URL` nello script.
- **Hosting**: il sito usa la navigazione a hash (`#/pagina`). Con un CMS o un generatore statico si possono avere URL "puliti" e pagine indicizzabili singolarmente (SEO).
