# Educagioco

Giochi educativi per bambini dai quattro ai dodici anni, in Vue 3 + Vite. Il
prodotto finale è **un unico file HTML** (`dist/index.html`) apribile con
doppio click, offline, senza server; si installa anche come app dal sito
pubblicato su GitHub Pages. Le monete si guadagnano esercitandosi e si
spendono giocando; l'età del bambino decide cosa si vede e cosa gli si chiede.

Questo file dice **come si lavora sul repo e dove guardare**. Il perché delle
regole, i numeri e i bersagli dei test stanno in `docs/`, una cartella per
argomento: la mappa è qui sotto. Il `README.md` in radice è la vetrina per
chi arriva da fuori (in parte in inglese).

## La regola dei documenti

**Una spiegazione va nel file giusto di `docs/<argomento>/`**, non in un
commento lungo e non in questo file. Nel codice resta al massimo una riga
che segnala una trappola o rimanda al documento (`vedi docs/castello/mostri.md`).
Una cartella ha un `README.md` che elenca i suoi file; un file sta sotto le
~250 righe, e sopra si divide per tema. Si scrive la regola e il perché in
una o due frasi, non la storia di come ci si è arrivati: quella la tiene
`git log`. Se un tentativo fallito serve a non rifarlo, resta una riga
«provato X: non funziona perché Y».

## Comandi

```bash
npm ci                 # installazione pulita (non npm install)
npm run dev            # server di sviluppo
npm run build          # produce dist/index.html, il file unico
npm test               # le unità: senza browser, una quindicina di secondi
npm run test:svelto    # solo i test sotto il secondo, mentre si scrive
npm run test:browser   # solo dentro Chrome, un minuto e mezzo
npm run test:misure    # l'equilibrio dei giochi (partite finte, la mappa inglese)
npm run test:tutto     # tutto, misure e browser compresi: prima di pubblicare
npm run test:commenti  # fallisce se il codice è cambiato oltre ai commenti
node test/esegui.mjs animali            # solo i file che contengono "animali"
node test/esegui.mjs --niente-build     # non ricompilare prima
node test/esegui.mjs torri --scatti     # e lascia anche le foto
node test/esegui.mjs --alla-volta=1     # uno alla volta (di solito otto)
```

**La cadenza.** Le unità girano **a ogni commit**: costano secondi. Il
browser gira **prima del push**, non prima di ogni commit: sui telefoni
finisce la punta, non i passaggi. Chi ha toccato una schermata lancia il suo
file (`node test/esegui.mjs pozioni`). Un agente in un worktree lancia i test
con `--niente-build` e non fa la build: la build si fa su main. La CI lancia
solo le unità, quindi un guasto che vive in `test/integrazione/` o in
`test/misure/` (l'equilibrio dei giochi) lo scopre solo chi l'ha lanciato a
mano. Tutti i comandi, gli strumenti che riscrivono
file e i banchi di prova: `docs/core/comandi.md`.

## La mappa

Prima di toccare una parte, si legge la sua cartella: il `README.md` dice
quale file.

| Cartella | Cosa c'è — leggila prima di toccare… |
|---|---|
| `docs/core/` | architettura e file unico, archivio e salvataggi, progressi, sessioni, aggiornamento e service worker, guasti, test, comandi, pubblicare, la convenzione dei giochi nuovi, interfaccia (barra, ✕, pausa, v-if), la partita lasciata a metà, il dito, primati, aiuti a monete, la guida del primo giro, grafica, sprite, strumenti — prima di toccare `src/store/`, `src/grafica/`, `vite.config.js`, un componente comune o un gioco nuovo |
| `docs/apprendimento/` | il motore SRS, i moduli di quiz, livelli 0–100 e banda, ripasso, la domanda (fretta, perché e come si fa, il muro), saperi, età e portata delle tappe, **la calibrazione delle monete** — prima di toccare `src/store/srs.js`, `src/quiz/`, `data/partenze.js`, `data/portata*.js`, o di scrivere un prezzo o un premio |
| `docs/genitori/` | cosa si può spegnere, la manopola dell'età, il quadro, i ritocchi ✎, «Come va», codice dei genitori, cestino e posta, le novità per i bambini, le guide in app — prima di toccare `components/eta/`, `src/guide/`, `store/pin.js`, `store/cestino.js`, `store/posta.js` |
| `docs/asteroidi/` | Tabelline Asteroidi: la scaletta unica di pianeti e stazioni, il volo |
| `docs/castello/` | Difendi il Castello: taratura (`npm run tara`), torri, operazioni, mostri e immunità, partite libere e regali, campagne — prima di toccare `data/castello.js`, `data/mostri.js`, `data/campagne-castello.js` o un prezzo |
| `docs/lingue/` | English ed Español: vocaboli, campagne, la pronuncia incisa (`npm run voci`) |
| `docs/bancarella/` | La bancarella: regole e difficoltà |
| `docs/pozioni/` | Il laboratorio delle pozioni: regole e tappe |
| `docs/passo-passo/` | Passo passo: regole del mondo, cane pastore, zaino e carte, stelle, sentiero, come si scrive un livello |
| `docs/generale/` | Il Generale: didattica, mappe, livelli, cosa manca (come si scrive un livello: `src/data/livelli/GUIDA.md`) |
| `docs/costruttore/` | Il costruttore: linguaggio, progetti e attrezzi, il porto, gli algoritmi, la campagna |
| `docs/sotterraneo/` | Il sotterraneo: regole, roba, scenari e muri, l'abisso com'è e il suo progetto |
| `docs/survivors/` | Survivors, con le sue regole |
| `docs/codice-segreto/`, `docs/conta/`, `docs/prima-dopo/` | un gioco ciascuna; in `prima-dopo/disegni.md` la regola delle icone disegnate |
| `docs/fattoria/` | La fattoria: regole, campi e silos, catena, macchine, chi chiede, livelli, animali, come si tocca, la pagina dell'albero, stagioni, sprite, dove sta cosa |
| `docs/img/` | le immagini del README (le rifà `npm run scatti`) |

L'indice di tutto è `docs/README.md`. In ogni cartella di gioco `presentazione.md` è la pagina per chi arriva da
fuori (linkata dal README) e `da-fare.md`, dove c'è, tiene le voci aperte.
Altri documenti vivono accanto al codice che descrivono: `test/README.md`
(come sono fatti i test), `src/data/livelli/GUIDA.md` (i livelli del
Generale), `strumenti/sprite/*.md` (fogli e foglietti degli sprite),
`poc/*.md`.

## Convenzioni

- **Il codice è in italiano**: nomi, funzioni, commenti, documenti.
- **I fine riga sono LF** (`.gitattributes`). Uno script che riscrive un file
  (Python lo fa senza chiedere) non deve cambiarli, se no il diff annega.
- **Niente dipendenze a runtime oltre a Vue.** Suoni sintetizzati, icone
  emoji o disegnate, nessun file esterno: il build resta un HTML unico.
- **I giochi nuovi stanno in `src/giochi/`** col calco di `codice-segreto/`
  (`docs/core/convenzione-giochi.md`); `src/views/` sono i giochi vecchi e
  non sono un modello.
- **Un gioco non aggiunge campi al profilo**: l'avanzamento sta in
  `profile.campagne[<chiave>]` e lo muove `src/giochi/campagne.js`; i
  contatori si toccano con `segna()`/`segnaBest()`.
- **La barra in cima è una sola** (`components/Barra.vue`), indietro sempre
  primo a sinistra; **un foglio si chiude con la ✕ in alto a destra**;
  **la pausa è una sola** (`giochi/pausa.js`). → `docs/core/interfaccia.md`
- **Uscire non butta via la partita**: una sosta in `profile.campagne`, e la
  mappa la offre in cima (`giochi/Ripresa.vue`). → `docs/core/ripresa.md`
- **Chi gioca non disegna**: una view passa la lista delle cose in scena alla
  tela, e in `grafica/` non entrano prezzi ed energia. → `docs/core/grafica.md`
- **Il dito non è un mouse**: click fantasma, soglia di ~16 px, elenchi che
  scorrono, niente selezione. → `docs/core/il-dito.md`
- **Nessun gioco paga una risposta sbagliata**, e una moneta vale dieci
  secondi di esercizio. → `docs/apprendimento/calibrazione.md`
- **Dopo uno sbaglio si dice il perché e come si fa.** → `docs/apprendimento/la-domanda.md`
- **La pronuncia è incisa a monte**, mai `speechSynthesis`; le lingue non si
  mescolano mai; lo spagnolo è quello boliviano. → `docs/lingue/`
- **I bersagli dei test** (`[data-…]`) stanno nel documento dell'argomento,
  alla riga «Nei test».
- **Un test non chiama mai `page.screenshot`**: passa da `scatto()`, spento
  di difetto. → `docs/core/test.md`
- **Niente cose una tantum**: quello che si genera si rifà con un comando
  (`npm run tara`, `npm run quiz:livelli`, `npm run scatti`), mai a mano.
- **Nei giochi una scelta non nasce fatta**: niente valori di comodo sulla
  riga (il «?» da scegliere). → `docs/costruttore/linguaggio.md`

## Le trappole

Una riga ciascuna; il perché sta nel documento indicato.

- **`VERSION` in `store/storage.js` non si abbassa mai**: `indexedDB.open`
  fallirebbe e si resterebbe su localStorage in silenzio. → `docs/core/archivio.md`
- **`save(chiave, true)` torna `null` alla rilettura**: si salva un oggetto
  (`{ acceso: true }`). → `docs/core/archivio.md`
- **Il timeout di apertura di IndexedDB non è più definitivo**: se risponde
  dopo, le letture SUCCESSIVE lo trovano pronto; l'avvio aspetta più a
  lungo delle altre (6 s contro 2,5). → `docs/core/archivio.md`
- **Gli id dei contenuti non si rinominano** (`en:dog`, `math:7x8`): sono le
  chiavi dello SRS. → `docs/core/archivio.md`
- **I nomi dei bambini non stanno nel codice**: il roster è un dato, si
  enumera `profilo:*`. Nei test gli id sono `GIOCATORE` e `ALTRO`. → `docs/core/archivio.md`
- **Togliere un gioco non abbassa il livello**: la sua riga in `XP_AREA`
  resta. → `docs/core/progressi.md`
- **I file generati non si toccano a mano**: `src/data/taratura-castello.js`
  (`npm run tara`, un test confronta la firma), `docs/apprendimento/livelli-delle-domande.md`
  (`npm run quiz:livelli`), `src/data/voci*.js` (`npm run voci`, e se dice
  «non incise» si rilancia). → `docs/core/comandi.md`
- **Un `v-if` che non si spegne mai non rimonta**: un componente riusato si
  porta dietro lo stato; si azzera da sé con un `watch`. → `docs/core/interfaccia.md`
- **Un `setTimeout` scatta anche a schermo spento** e `performance.now()`
  conta il telefono posato. → `docs/core/interfaccia.md`
- **Il click fantasma dopo un `pointerup` lo vede solo un tocco vero** (CDP),
  mai `page.click()`. → `docs/core/il-dito.md`
- **La scala della tela sta nella trasformazione del contesto**, una volta
  per fotogramma: moltiplicarla riga per riga la raddoppia. → `docs/core/grafica.md`
- **Una `fetch` della pagina passa dal service worker**, che risponde dalla
  cache: «cerca aggiornamenti» chiede `no-store` con `?aggiorna=<id>`. → `docs/core/aggiornamento.md`
- **Un nome nuovo si cerca anche nei motori**: un campo omonimo non dà
  errori, cambia il gioco (così è nata `portata`). → `docs/apprendimento/eta-e-portata.md`
- **Un prefisso nuovo per le chiavi dei quiz si sceglie guardando
  `store/progressi.js`**: finiscono nello stesso cassetto. → `docs/apprendimento/quiz-ripasso.md`
- **Le partenze scrivono eccezioni**: una riga si confronta con quello che
  l'età scriverebbe, non con «nessuna eccezione». → `docs/genitori/ritocchi.md`
- **Le stelle di Passo passo e del costruttore stanno sotto l'indice**:
  riordinare la fila vuole una voce in `FILE` di `dati/campagna.js`. Quelle
  del Generale stanno sotto l'`id`. → `docs/passo-passo/livelli.md`, `docs/costruttore/campagna.md`
- **Un livello del Generale non ha un test suo**: dichiara `verifiche`, e
  una chiave sconosciuta è un guasto. → `docs/generale/livelli.md`
- **Gli addobbi sospesi della fattoria non si cancellano**: gli id sono
  chiavi di salvataggio. → `docs/fattoria/animali.md`
- **`#fattoria-tipo=` butta la fattoria del bambino attivo** (nel cestino):
  si usa con un bambino di prova. → `docs/core/comandi.md`
- **La copia di casa (`pubblica.sh`) è una sola e ha lo stesso origin del
  sito vero**: una prova che tocca l'archivio tocca i salvataggi veri. → `docs/core/pubblicare.md`
- **Il `+` in coda alla versione** (`922257a+`) vuol dire build con modifiche
  non committate. → `docs/core/pubblicare.md`
- **`index.html` in radice è il template di Vite**, non un file giocabile.

## Come si lavora

- **Commit a blocchi per concetto**, messaggi in italiano come quelli di
  `git log`. Un commit può non stare in piedi da solo: la coerenza si
  verifica al push.
- **Le novità per i bambini si propongono, non si scrivono**: alla fine di un
  lavoro che un bambino vedrebbe, nel resoconto va la riga già scritta, e la
  si aggiunge solo dopo il sì — mai prima del lavoro che racconta.
  **Le note per i grandi** non si scrivono mai di propria iniziativa.
  → `docs/genitori/novita-bambini.md`, `docs/genitori/cestino-e-posta.md`
- **Dove si prova col dito**: `./pubblica.sh` mette il file sul server di
  casa in dieci secondi (non versionato, legge `.nas`); ogni push su `main`
  pubblica su GitHub Pages. → `docs/core/pubblicare.md`
- **In un ambiente pulito**: `test/aiuto/browser.mjs` cerca Chrome da sé,
  `CHROME=…` lo forza, altrimenti `npx playwright install chromium`.
