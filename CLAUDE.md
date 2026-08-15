# Educagioco

Giochi educativi per bambini in Vue 3 + Vite. Il prodotto finale è **un unico
file HTML** apribile con doppio click, offline, senza server.

**Dove sta cosa.** Questo file dice come si lavora sul repo. Il *perché* delle
regole di gioco e i numeri esatti stanno in [`LEGGIMI.md`](LEGGIMI.md) —
leggilo prima di toccare `src/store/srs.js` o il bilanciamento. Il taglio per
chi arriva da fuori è nel [`README.md`](README.md), con una pagina per gioco
in `docs/`.

## Comandi

```bash
npm ci                 # installazione pulita (non npm install)
npm run dev            # server di sviluppo
npm run build          # produce dist/index.html, il file unico
npm test               # il giro di sempre: senza browser, una decina di secondi
npm run test:svelto    # solo i test sotto il secondo, mentre si scrive
npm run test:browser   # solo dentro Chrome, ~5 minuti e mezzo — vedi sotto
npm run test:tutto     # tutto, browser compreso: prima di pubblicare
node test/esegui.mjs animali            # solo i file che contengono "animali"
node test/esegui.mjs --niente-build     # non ricompilare prima
node test/esegui.mjs torri --scatti     # e lascia anche le foto
```

`npm test` (= `npm run test:unita`) è il comando di ogni giorno: nessun
browser, nessuna build, un risultato in secondi. La cartella
`test/integrazione/` apre Chrome e da sola vale 327 dei 340 secondi
dell'intera suite (misurato in
[`docs/tempi-dei-test.md`](docs/tempi-dei-test.md)) — costa un caffè, non
va lanciata a ogni riga scritta. Si chiede quando serve davvero: tutta con
`npm run test:tutto` o `npm run test:browser`, o **un file solo** con
`node test/esegui.mjs <nome>` — il modo giusto quando si è appena toccata
una schermata (`node test/esegui.mjs pozioni`, per dire, prova solo il
gioco delle pozioni). La CI lancia solo `npm run test:unita` prima di
costruire e pubblicare — Chrome non lo scarica, non l'ha mai fatto — quindi
un guasto che vive solo dentro `test/integrazione/` lo scopre chi l'ha
lanciato a mano, non la pipeline: un motivo in più per chiederlo quando si
tocca lo schermo, non solo quando si scrive la logica sotto.

Strumenti che si usano di rado:

```bash
npm run voci           # incide la pronuncia (solo dopo aver aggiunto parole)
npm run voci -- --lingua es
npm run simula         # gioca il tower defense senza browser
npm run tara           # rimisura la vita dei nemici e riscrive i dati
npm run mappe          # valida i livelli del Generale
npm run quiz:banco     # prova tutti i moduli di quiz senza browser
npm run scatti         # rifà le immagini di docs/img/
node strumenti/icone.mjs   # rigenera i PNG delle icone da public/icona.svg
```

`npm run voci` è incrementale (cache in `.voci-cache/`) ma vuole rete e
ffmpeg. Se in coda dice «non incise: …», **rilancia lo stesso comando**.

`npm run tara` riscrive `src/data/taratura-castello.js`, che è **generato**:
non si modifica a mano. Va rilanciato quando cambiano prezzi, potenza delle
torri o tappe — un test confronta una firma e diventa rosso se è stantio.

## Verifiche

I test stanno in `test/`, un file per argomento, e il lanciatore li raccoglie
da solo: basta che il nome finisca in `.test.mjs`. Un test nuovo non si rifà
né il browser né i controlli: importa da `../aiuto/`.

- **`test/unita/`** — nessun browser. I motori girano senza schermo, quindi
  qui si *giocano le partite per davvero*: il castello tappa per tappa con un
  finto giocatore, i livelli del Generale risolti, il codice segreto vinto
  ragionando.
- **`test/integrazione/`** — Chrome su `dist/index.html`, si gioca col dito.
- **`test/aiuto/`** — `verifica.mjs` (controlla / uguale / nota / riassunto),
  `browser.mjs` (apre Chrome, semina o rilegge un profilo, azzera, scatta) e
  `livello.mjs` (banco di prova di un livello del Generale).

**Le foto non si fanno da sole.** Nessun test guarda i pixel: gli scatti
servono a un occhio umano, quindi sono spenti e si chiedono con `--scatti`.
Un test non chiama mai `page.screenshot`: passa da `scatto(page, nome)`, che
a foto spente non fa niente e a foto accese scrive solo in `test/scatti/`,
che git ignora.

**Il roster va scritto prima del reload.** Da quando i giocatori non stanno
più nel codice, un archivio vuoto manda all'onboarding: `apriGioco` semina un
giocatore di prova da sé, e `giocatori: null` serve a provare il primo avvio
vero. Gli id di prova sono `GIOCATORE` e `ALTRO`, non nomi veri.

**Un livello del Generale non si porta dietro un test suo.** Ce n'è uno per
tutti (`unita/livelli`), che raccoglie i livelli dalla cartella e li passa al
banco. Quello che uno scenario ha *di suo* si dichiara nel campo `verifiche`
dello scenario, e il banco lo esegue: il contratto sta in testa a
`test/aiuto/livello.mjs`, e una chiave sconosciuta è un guasto.

**`npm run test:svelto` è quello da tenere acceso mentre si scrive.** La
suite unità intera costa una decina di secondi, e gran parte li spende un
pugno di test che giocano una campagna intera per davvero (il castello
tappa per tappa, la bancarella, i saperi citati e non). Sono giusti così —
è il prezzo di provare sul serio invece che a occhio — ma quel prezzo non
va pagato a ogni riga scritta, solo quando si tocca quella parte lì. Un
test si dichiara pesante scrivendo `tempo: 100` (o più) fra i primi
commenti — la stessa riga che allunga il tempo massimo prima di essere
segnato ⏱, letta in testa al file entro i primi 1200 caratteri — e resta
fuori da `--svelti`; chi non dice niente resta dentro, ed è la maggioranza.
I test di integrazione non ci entrano mai, dichiarino o no: aprono Chrome,
e Chrome da solo costa più di un secondo. Il contratto è in testa a
`test/esegui.mjs`.

### In un ambiente pulito

Niente percorsi cablati: `test/aiuto/browser.mjs` cerca Chrome nei posti
soliti, e `CHROME=…` lo forza. Se non c'è nessun Chrome di sistema,
`npx playwright install chromium`.

## Pubblicare

Ogni push su `main` fa partire `.github/workflows/pubblica.yml`: costruisce,
fa girare le prove senza browser, pubblica su GitHub Pages e **richiede al
sito che versione sta servendo** finché non combacia.

C'è anche `pubblica.sh` per un server di casa, che **non è versionato**
(insieme a `pubblico/`): è roba di casa e non riguarda chi clona il repo.
Legge l'indirizzo da `.nas`, ignorato da git.

Il numero di versione lo genera il build. Il `+` in coda al commit
(`922257a+`) vuol dire che il build è stato fatto con modifiche non
committate: non è ricostruibile da git.

`index.html` in radice è il **template di Vite**, non un file giocabile.

## Struttura

- **`src/store/`** — persistenza e stato: `storage.js` (archivio a tre
  livelli: IndexedDB → localStorage → memoria, non lancia mai eccezioni),
  `srs.js` (il motore di apprendimento), `profile.js` (il profilo condiviso e
  il roster dei giocatori), `progressi.js` (livelli, padronanza, traguardi).
- **`src/data/`** — vocaboli, negozio, operazioni, campagne, traguardi.
- **`src/giochi/`** — **la casa dei giochi nuovi, e la convenzione da seguire
  d'ora in poi.** Il calco è `codice-segreto/`, e `CONVENZIONE.md` lo spiega.
  In due righe: ogni pezzo sa una cosa e non sa le altre — `dati/` (tabelle),
  `motore/` (regole a classi, girano anche in Node), `scena/` (canvas, non sa
  niente di regole), `viste/`, `Gioco.vue` (il coordinatore), `gioco.js` (il
  manifesto). L'avanzamento **non aggiunge un campo al profilo**: sta in
  `profile.campagne[<chiave>]` e lo muove `src/giochi/campagne.js`. Anche i
  traguardi si dichiarano nel manifesto, non in `data/traguardi.js`. Un gioco
  nuovo si registra in `indice.js` (dato puro) e `schermate.js` (i `.vue`):
  sono due file perché sono due catene di import diverse.
- **`src/views/`** — i giochi vecchi, fatti in quattro modi diversi. **Non
  sono un modello**: sono il motivo per cui esiste `src/giochi/`.
- **`src/motore/battaglia.js`** — le regole del tower defense senza schermo.
  Gira uguale nel gioco e in Node, ed è l'unico motivo per cui il
  bilanciamento si può misurare invece di provarlo a occhio.
- **`src/grafica/`** — `tela.js` (canvas, sfondo in cache, ordinamento per
  profondità, e una **telecamera**: un mondo può dichiarare le sue misure
  e la sua scala, e la tela lo incornicia dove c'è posto — è così che il
  castello resta lo stesso su ogni schermo), `geometria.js` (tracciati: è
  l'unico posto dove gioco e disegno devono essere d'accordo su dove
  passa la strada), `castello.js`
  (i pittori, nella tabella `PITTORI`), `spazio.js` (il cielo degli
  asteroidi: nave, pianeta, sassi, raggi — riceve `danno: 0.5`, non sa
  che esistano le vite), `corpo.js` (**lo scheletro**: `persona()` per
  chi cammina su due gambe, `bestia()` per tutti gli altri — chi lo usa
  scrive una *scheda di dati*, e si ritrova ombra, respiro, il lampo
  bianco della botta e il ribaltamento da ko senza chiederli).
  Le schede stanno in tre cassetti: `personaggi/` (il Generale),
  `castello/corpi-mostri.js` (il tower defense) e `bestiario/` (il
  dungeon — venti creature viste **grandi e di fronte**, dove la
  paura la fa la forma e mai il macabro, con l'`ingombro` che le tiene
  dentro il riquadro). Un mostro del dungeon **non è un'emoji**: le
  emoji le disegna il telefono, quindi hanno lo stile di Apple in mezzo
  a uno schermo disegnato a mano, non si tingono dell'ambiente e non
  tremano quando le colpisci.
  Poi ci sono due file **predisposti e non ancora agganciati a niente**,
  che servono a disegnare con degli sprite invece che coi poligoni:
  `atlante.js` (un foglio di figure e come si posano: il piede, lo
  specchio, la scala intera) e `tessere.js` (*quale* tessera va in una
  cella, ricavata dai vicini — strade, pozze, recinti; niente canvas,
  gira in Node e si prova in `unita/tessere`). Un mondo a tessere chiede
  alla tela `passoIntero: true`, se no gli sprite si sfrangiano. Il
  prototipo che li giustifica è `poc/castello-gfx.html`.
- **`src/quiz/`** — i moduli di quiz, staccati da qualunque gioco: servono a
  far *pagare* un potenziamento con un esercizio. Il patto è che **un modulo
  consegna una domanda e non sa chi gliel'ha chiesta**: `genera(grado, sorte)`
  e basta. Un modulo nuovo è **un file in `moduli/`** e niente altro — il
  registro lo raccoglie dalla cartella. Contratto in `src/quiz/LEGGIMI.md`.
- **`strumenti/mappe/`** — il banco da lavoro dei livelli del Generale, che
  sono dato puro (ASCII art + metadati). `FORMATO.md` è la specifica,
  `nucleo.js` l'unica copia delle regole, `editor.html` si apre col doppio
  click. `campagne.js` è **generato** da `estrai-campagne.mjs`.
- **`src/incidenti.js`** — la rete di sicurezza: un errore, ovunque
  scatti, finisce in archivio sotto `incidenti` (fuori dai profili, come
  il codice dei genitori) e mette a schermo un cartello in DOM puro —
  puro perché quando è Vue quello rotto un componente Vue non
  comparirebbe. I guasti si rileggono dalla pagina dei grandi, che è
  come si diagnostica un telefono che non è il proprio. `ripara()` e
  `#ripara` buttano cache e service worker e ricaricano: **non toccano
  IndexedDB né localStorage**, e questa è tutta la differenza con
  «cancella i dati del sito».
- **`src/store/giudizi.js`** — il quaderno dei giudizi sulle domande.
  Acceso l'interruttore nella pagina dei grandi, sopra ogni domanda dei
  quiz compaiono tre tastini (😴 troppo facile, 😰 troppo difficile, 🐛
  storta): il verdetto lo dà il grande, il contesto — modulo, grado,
  tipologia, tempo, esito — se lo annota il gioco. Sta **fuori dai
  profili** come il codice dei genitori, e esce da lì per l'unica strada
  che c'è: il modulo di segnalazione, precompilato. È il difetto che
  nessun controllo automatico trova, perché una domanda fuori misura è
  formalmente ineccepibile.
- **`docs/`** — la documentazione per chi arriva da fuori, e le immagini.

## Convenzioni

- **Il codice è in italiano**: nomi, funzioni, commenti (`colonnaAdd`,
  `guasti`, `forza`, `ripassoFraGiorni`).
- **Niente dipendenze a runtime oltre a Vue.** Suoni sintetizzati, icone
  emoji, nessun file esterno: il build deve restare un HTML unico.
- **La barra in cima è una sola** (`components/Barra.vue`): indietro sempre
  primo a sinistra, sempre `←`, unico tasto pieno. Nei test si trova con
  `button[aria-label="indietro"]`, non col carattere.
- **I giochi sono verticali**: il manifest chiede `portrait`, e dal browser
  esce il cartello «gira il telefono» (`.gira`).
- **Chi gioca non disegna.** Una view costruisce la lista delle cose in scena
  — `{ che: 'torre', x, y, tipo, lv }` — e la passa a `tela.disegna()`.
  Aggiungere una figura è aggiungere una riga a `PITTORI`, non un `ctx.arc`
  dentro il gioco. Al contrario, in `grafica/` non entrano energia e prezzi:
  solo fatti già decisi (`potenziabile: true`).
- **I giochi non toccano i contatori a mano**: usano `segna()` e
  `segnaBest()` di `store/profile.js`.
- **Un errore non resta muto.** Vue scrive in console e lascia la
  schermata com'era: a un bambino col telefono in mano quello si
  presenta come un tasto che non fa niente, e chi deve capirlo il giorno
  dopo non ha in mano niente. `src/incidenti.js` lo scrive e lo dice.
- **La pagina la serve prima la rete, il resto prima la cache**
  (il service worker in `vite.config.js`). Cache-first anche sul
  documento vuol dire che una versione con un guasto si ripresenta
  identica a ogni avvio, e dal telefono non c'è ricarica che la smuova.
- **La pronuncia non usa `speechSynthesis`**: le clip sono incise a monte e
  concatenate in sprite (`src/data/voci.js`, `voci-es.js`). `src/voce.js` è
  l'unico punto che le riproduce.
- **Le lingue non si mescolano mai**: chiavi separate (`en:dog` contro
  `es:perro`), campagne separate, contatori separati, traguardi separati.
- **Lo spagnolo è quello di casa** (boliviano): `papa` e non `patata`,
  `palta`, `durazno`, `auto`, `celular`. Nelle frasi si scrive `¿…?`.
- **Nel castello il numero di calcoli è l'input, non il risultato.** Una
  tappa dichiara quante operazioni costa (`calcoli`) e fin dove arriva la
  scaletta (`cap`); il resto lo deriva `data/castello.js`. Chi ritocca
  l'equilibrio cambia prezzi o entrate e rilancia `npm run tara`.
- **Nel castello si compra toccando il campo.** Non c'è un banco di
  bottoni: una piazzola vuota chiede che torre costruirci, una torre già
  in piedi apre la sua scheda, e il conto sale dal basso nello stesso
  foglio. Il campo **non si ferma** mentre si calcola — la telecamera si
  stringe di quanto il foglio copre, e la battaglia resta visibile.
- **I due rami di una torre valgono lo stesso.** A metà scaletta una
  torre sceglie un mestiere (`RAMI` in `data/castello.js`): cambia la
  *forma* del danno, mai la quantità. È la condizione perché il modello
  che tara le tappe possa ignorarli, e `unita/rami-castello` la conta
  ramo per ramo.
- **I nomi dei bambini non stanno nel codice.** Il roster è un dato
  (`state.giocatori`), la migrazione enumera le chiavi `profilo:*` invece di
  cercare un nome. Se una modifica sembra chiedere una stringa col nome di un
  bambino, la soluzione è enumerare.
- **Gli id dei contenuti non si rinominano** (`en:dog`, `math:7x8`,
  `frase:…`): sono le chiavi dello stato SRS, e cambiarli fa tornare una
  parola «mai vista».
- **Nell'archivio non si salva `true` da solo.** `load()` scarta quel
  valore quando lo rilegge (`fromIdb !== true`: è il segnale di
  «scrittura riuscita» di `idbRun`), quindi un `save(chiave, true)`
  torna sempre `null` senza che niente sembri rotto — un interruttore
  che si spegne a ogni riavvio. Si mette dentro un oggetto
  (`{ acceso: true }`), come fa `store/giudizi.js`.
- **`VERSION` in `store/storage.js` non si abbassa mai.** `indexedDB.open`
  fallirebbe e il ripiego su localStorage diventerebbe permanente e silenzioso.
- **Il timeout di 2,5 s in `openDb()` è l'unico modo noto di perdere
  progressi.** Su un telefono lento IndexedDB non risponde in tempo,
  `dbPromise` resta memoizzata su `null` per tutta la vita della pagina e
  l'app gioca su localStorage; al riavvio `load()` legge IndexedDB per prima
  e ignora quella copia, quindi la sessione appena giocata *sembra* sparita.
  I dati veri non vengono sovrascritti e non c'è nessun avviso a schermo. Non
  si riproduce su desktop, dove IndexedDB risponde in millisecondi.

### Cosa possono spegnere i genitori

Tre interruttori diversi, e la differenza conta:

1. **Un gioco** (`settings.giochi`) — sparisce la carta in home, i progressi
   restano. Per bambino, come elenco di **eccezioni** (`{ torri: false }`),
   così un gioco nuovo nasce acceso anche per chi ha il profilo di ieri.
2. **Un pezzo di scuola** (`settings.sa`, `data/saperi.js`) — spariscono le
   *domande* che lo danno per scontato, in tutti i giochi. Chi dichiara di
   averne bisogno è **chi fa la domanda** (un modulo di quiz lo dichiara nei
   suoi `tipi`), non un elenco da tenere allineato a mano. I giochi degradano
   invece di sbarrare.
3. **I giochi in prova** (`settings.sperimentali`) — un flag solo per tutti
   quelli taggati `sperimentale: true`, che senza non esistono affatto.

Nei test i bersagli sono `.carta.gioco[data-gioco="…"]`,
`.carta[data-flag="…"]`, `.carta[data-azione="…"]`.

### Il codice dei genitori

`store/pin.js`: quattro cifre, di partenza `0000`. Sta nell'archivio accanto
a `ultimo-giocatore` e **non dentro i profili** — è di casa, non di un
bambino. Si rimette dall'indirizzo con `#pin=1234`, dove sta già il cheat
delle monete (`#monete=500`).
