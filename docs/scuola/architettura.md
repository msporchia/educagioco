# L'architettura

## Due pagine, ognuna un file unico

| Pagina | Sorgente | Esce come |
|---|---|---|
| dei bambini | `scuola/index.html` → `src/scuola/bambini/main.js` | `dist-scuola/index.html` |
| della maestra | `scuola/maestra.html` → `src/scuola/maestra/main.js` | `dist-scuola/maestra.html` |

Sono **file unici** (`vite-plugin-singlefile`, come `dist/index.html`): piccoli, si aprono dal disco e
dal sito allo stesso modo, e il file per la chiavetta è proprio `index.html` (la pagina della maestra
lo offre da scaricare come `educagioco-classe.html`). Niente service worker, niente `versione.json`
letto a caldo: `dist-scuola/versione.json` serve solo al controllo della pipeline.

`npm run build:scuola` costruisce le due pagine (`vite.scuola.config.js`, una passata per pagina);
`npm run dev:scuola` le serve in sviluppo (porta 5174, `.claude/launch.json` → `scuola`): si aprono
`/scuola/index.html` e `/scuola/maestra.html` (la radice del server è quella del repo, dove stanno i sorgenti
delle due pagine). La build è una passata per pagina (`PAGINA_SCUOLA=index|maestra`) e le pagine escono alla radice di
`dist-scuola/`; `versione.json` è `{ id, data }` (`id` = il tag se `GITHUB_REF_NAME` comincia con `scuola-`, se no lo sha
corto col `+` delle modifiche non committate). In sviluppo i sostituti si applicano come nella build. In sviluppo
`#servizio=http://localhost:8787` fa parlare le pagine col servizio in locale (`npx wrangler dev`).

## Il codice: `src/scuola/`

- `comune/` — `rete.js` (il collegamento, [protocollo.md](protocollo.md)), `esercizi.js`
  ([esercizi.md](esercizi.md)), quello che serve a tutte e due le pagine;
- `bambini/` — l'app del bambino ([bambini.md](bambini.md));
- `maestra/` — l'app della maestra e il quaderno ([quaderno.md](quaderno.md));
- `sostituti/` — i moduli di casa che a scuola si rimpiazzano (sotto).

Lo stile è quello di casa (`src/style.css`, la pelle `.schermo.pulito` di [../core/pelle.md](../core/pelle.md))
e le emoji sono il font di casa (`src/emoji/emoji.css`).

## I sostituti: il codice di casa senza l'archivio di casa

`quiz/Domanda.vue`, i moduli e gli Asteroidi ([../asteroidi/scuola.md](../asteroidi/scuola.md)) si usano così come
sono, ma importano pezzi dell'app di casa (preferenze dei grandi, ripasso, archivio, home, amici) che a scuola non
servono. La build della scuola **rimpiazza quei file** con quelli di `src/scuola/sostituti/` (stessi nomi esportati):
l'elenco `originale → sostituto` sta in un file solo, `src/scuola/sostituti/elenco.js`, che la config di Vite, i test
e `test/aiuto/sostituti-scuola.mjs` (gli stessi sostituti in Node) leggono insieme. Un test (`unita/scuola-sostituti`)
controlla che ogni sostituto esporti tutti i nomi dell'originale. Il codice di casa non cambia.

| Originale | Perché a scuola no |
|---|---|
| `store/giudizi.js`, `store/salto.js` | preferenze dei grandi salvate nell'archivio |
| `quiz/memoria.js` | il ripasso (annota sul profilo) |
| `giochi/tastiera-accesa.js` | al contrario: a casa la tastiera dei giochi è spenta, i PC della scuola la accendono ([../core/tastiera.md](../core/tastiera.md)) |
| `components/Giudizio.vue` | si porta dietro `store/profile.js` |
| `quiz/nucleo/registro.js` | raccoglie *tutti* i moduli con `import.meta.glob`, e `ing-frasi` arriva fino a `store/srs.js`: a scuola elenca solo quelli che il catalogo usa |
| `store/storage.js` | l'archivio su disco: a scuola il profilo del gioco vive **in memoria** (una `Map` che salva e rilegge copie) e muore con la pagina; niente IndexedDB né localStorage del PC della classe |
| `components/Barra.vue`, `giochi/VeloPausa.vue` | dal gioco non si esce: la barra ha solo ⏸ e il `?` che accende la guida del gioco (niente ←, 🔊, fogli di testo né monete: [../core/come-si-gioca.md](../core/come-si-gioca.md)), la pausa non ha «torno ai giochi» e non sfoca |
| `giochi/spiegazioni.js` | «salta le spiegazioni» sta in `guide/aiuto.js` e legge localStorage: a scuola non si saltano |
| `store/progressi.js` | traguardi, livelli e giorni di fila, coi vocabolari di tutti i giochi: a scuola non c'è niente da riscuotere, quindi `state.festa` resta vuota e non ferma il gioco |
| `giochi/indice.js`, `data/portata-giochi.js` | i manifesti e le campagne di tutti i giochi nuovi (la home e l'età): a scuola nessun gioco nuovo e tutto aperto |
| `guide/novita-bambini.js`, `amici/servizio.js`, `amici/usaAmici.js` | le novità e gli amici: nessuna notizia, nessun collegamento |
| `components/RottaAsteroidi.vue`, `MappaTabelline.vue`, `MappaConcetti.vue`, `HangarAsteroidi.vue`, `RegaloHangar.vue` | le pagine attorno agli Asteroidi, che con `limite` non si aprono: un solo `Vuoto.vue` |

## La guardia del peso

`unita/scuola-pacchetto` segue gli import a partire dalle due `main.js`, coi sostituti applicati, e
fallisce se il pacchetto tocca un modulo vietato, dicendo **la catena di import** che ce l'ha portato. Così una
modifica su `main` che ingrassa la scuola è rossa subito, non al tag. Le regole sono **per pagina**:

- **la maestra**: niente `three`, `src/store/`, `aggiornamento.js`, `src/amici/`, `src/guide/`, `App.vue` di casa,
  `import.meta.glob`;
- **i bambini** giocano ai giochi veri, quindi `three`, `src/views/MathGame.vue` e `src/store/*` entrano; restano
  vietati l'originale `src/store/storage.js` (vuol dire che il sostituto non è collegato), `src/store/{amici,posta,pin}.js`,
  `aggiornamento.js`, `incidenti.js`, `App.vue` e `main.js` di casa, `src/amici/`, `src/guide/`, `src/insieme/` (tranne
  `rete.js`), gli altri giochi (`src/giochi/<cartella>/`, gli altri `src/views/*`), `import.meta.glob`, la parola
  `indexedDB` in qualunque file e `localStorage`/`sessionStorage` fuori da `src/scuola/` (i commenti non contano).

**Il peso non è un problema** (scelta dell'utente): coi dieci giochi la pagina dei bambini pesa ~20 MB e quella della
maestra ~1,2 MB; il tetto in byte di `vite.scuola.config.js` resta solo contro uno sbaglio grosso. I sostituti servono
a tenere fuori quello che a scuola non deve esserci, non ad alleggerire. `PESI_SCUOLA=20 npm run build:scuola` stampa
i venti moduli che pesano di più.

## La pipeline: il tag `scuola-*`

- **`.github/workflows/scuola.yml`** parte a un tag `scuola-*` (es. `scuola-2026-11-20`): unità,
  `build:scuola`, e una **release GitHub** su quel tag con allegati `index.html`, `maestra.html` e
  `versione.json` (la versione è il nome del tag). Poi fa partire `pubblica.yml`.
- **`pubblica.yml`** resta l'unico che pubblica su Pages (Pages pubblica il sito intero in un blocco:
  due pipeline che pubblicano metà sito si cancellerebbero a vicenda). Costruisce l'app di casa come
  sempre e poi scarica gli allegati dell'**ultima release `scuola-*`** (la «latest» se è una `scuola-*`, se no la più recente delle `scuola-*`) in `dist-sito/scuola/`; se non ce
  n'è nessuna salta. Il controllo finale guarda anche `scuola/versione.json`.
  Permessi: `scuola.yml` ha `contents: write` e `actions: write`, `pubblica.yml` solo `contents: read` per scaricare.
- **Tornare indietro**: si segna come ultima la release precedente e si rilancia `pubblica.yml`.
- Si rilascia con `git tag scuola-AAAA-MM-GG && git push origin scuola-AAAA-MM-GG`.

## Il service worker di casa lascia passare `/scuola/`

Il service worker dell'app di casa sta alla radice del sito e controllerebbe anche `/scuola/`: con la rete
lenta risponderebbe con la pagina di casa che ha in cache. Il suo `fetch` (`vite.config.js`) lascia
passare ogni indirizzo sotto `/scuola/`; questa riga deve uscire con l'app di casa prima della prima
release della scuola. Le due pagine hanno un service worker loro, `scuola/sw.js` con lo scope `/scuola/`, che la build
copia in `dist-scuola/` e la release allega accanto alle pagine: le riapre senza rete ([ripieghi.md](ripieghi.md)).

Nei test: `unita/scuola-sostituti` (ogni sostituto esporta i nomi dell'originale), `unita/scuola-pacchetto` (la
guardia degli import, per pagina), `unita/scuola-archivio` (l'archivio in memoria rilegge copie e non tocca un
IndexedDB e un localStorage finti); i bersagli `[data-…]` delle schermate stanno in [bambini.md](bambini.md) e [quaderno.md](quaderno.md).
