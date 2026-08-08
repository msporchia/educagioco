# Educagioco

Giochi educativi per bambini (inglese, spagnolo, matematica in colonna, tower
defense) in Vue 3 + Vite. Il prodotto finale è **un unico file HTML** apribile con doppio
click, offline, senza server.

`LEGGIMI.md` descrive architettura, motore di apprendimento e regole di gioco:
**leggilo prima di toccare `src/store/srs.js` o `src/data/ops.js`**. Qui sotto
c'è solo ciò che serve per lavorare sul repo.

## Comandi

```bash
npm ci            # installazione pulita (usare questo, non npm install)
npm run dev       # server di sviluppo
npm run build     # produce dist/index.html, il file unico
npm run pubblica  # build + pubblicazione sul NAS (vedi sotto)
npm run voci      # incide la pronuncia inglese (solo se aggiungi parole)
npm run voci -- --lingua es   # la stessa cosa per lo spagnolo
npm run simula    # gioca il tower defense senza browser: quanto è duro davvero
npm run tara      # ritrova la vita dei nemici ondata per ondata e riscrive i dati
npm run mappe     # controlla i livelli del Generale: griglia, ordini, zone, par
npm run quiz      # apre nel browser le palestre dei moduli di quiz
npm run quiz:banco  # li prova tutti senza browser: forma, varietà, doppioni
```

`npm run simula` e `npm run tara` sono il banco di prova del castello: fanno
girare il motore vero (`src/motore/battaglia.js`) senza schermo, con un
giocatore finto. `simula` risponde a «quanto poco basta spendere per
superare la tappa», `tara` ricalcola `src/data/taratura-castello.js` —
**file generato, non si scrive a mano**. Va rilanciato quando cambiano i
prezzi in `CFG`, la potenza delle torri o le tappe: il test unitario
confronta una firma e dice quando la taratura è stantia. `-- --prova` fa
tutto senza scrivere niente; ci mette un paio di minuti (la partita libera
è la parte lenta).

`npm run voci` serve **solo dopo aver aggiunto o cambiato parole** in
`src/data/words.js` o `src/data/verbi.js`: incide quelle nuove e riscrive
`src/data/voci.js`. Il lavoro è incrementale — le clip già fatte stanno in
`.voci-cache/` — ma vuole rete la prima volta (scarica edge-tts in
`.venv-voci/`) e ffmpeg con libopus. `-- --elenca` mostra le voci disponibili,
`-- --voce <nome>` rifà tutto con un'altra, `-- --bitrate 12k` alleggerisce il
file a scapito della qualità.

Con `-- --lingua es` fa lo stesso per `parole-es.js` e `verbi-es.js`, con una
voce boliviana (`es-BO-SofiaNeural`), cache sua (`.voci-cache-es/`) e uscita in
`src/data/voci-es.js`. Il servizio ogni tanto rifiuta le ultime richieste di una
serie lunga: se in coda scrive «non incise: …», **rilancia lo stesso comando** e
riprende solo quelle che mancano.

## Verifiche

```bash
npm test                 # tutto: prima ricompila, poi unità e browser
npm run test:unita       # solo quelli che non aprono il browser (secondi)
npm run test:browser     # solo quelli nel browser
node test/esegui.mjs animali   # solo i file che contengono "animali"
node test/esegui.mjs --niente-build   # non ricompilare prima
node test/esegui.mjs torri --scatti   # e lascia anche le foto
```

I test stanno tutti in `test/`, un file per argomento, e il lanciatore li
raccoglie da solo: basta che il nome finisca in `.test.mjs`.

**Le foto non si fanno da sole.** Nessun test guarda i pixel: gli scatti
servono a un occhio umano, quindi sono spenti e si chiedono con `--scatti`
(o `SCATTI=1` se lanci il file a mano). Un test non chiama mai
`page.screenshot`: passa da `scatto(page, nome)` di `test/aiuto/browser.mjs`,
che a foto spente non fa niente e a foto accese scrive **solo** in
`test/scatti/`, che git non guarda. Prima `torri.test.mjs` lasciava otto PNG
in radice a ogni build, versionati e sempre diversi perché il gioco è pieno
di caso: un `git status` sporco senza che nessuno ci avesse messo mano.

- `test/unita/` — nessun browser: `srs`, `progressi`, `animali` (i quattro
  bisogni, i prezzi, la migrazione dei profili vecchi), `capsule` (niente
  doppioni, le serie che non si saltano), `inglese`, `spagnolo` (le stesse cose
  più i due segni della domanda e le chiavi che non si mescolano), `pozioni`
  (ogni dose è raggiungibile con un attrezzo dello scaffale, sceglierlo è una
  scelta vera, e le otto tappe salgono **a coppie** — quella che porta un
  gesto nuovo riparte apposta coi numeri facili), `bancarella` (ogni resto è
  componibile con le monete di
  quella giornata, il minimo è davvero il minimo, il cliente chiede solo roba
  che è sul banco, e la difficoltà cresce: più monete per il resto, più tempo
  stretto, più copie dello stesso prodotto), `calcolo` (il grafo dei
  prerequisiti sta in piedi, ogni generatore rispetta il proprio vincolo su
  200 istanze, la taglia fa crescere la difficoltà, i falsi non si scartano a
  occhio, e una stazione aperta è sempre superabile anche con le basi zoppe),
  `castello` (le quindici tappe **giocate davvero** dal simulatore, senza
  browser: ognuna costa i calcoli che promette, chi spende tutto finisce, chi
  ne tiene in tasca un quarto no, a chi spende non avanza più del 10%, il
  bambino che sbaglia un conto su quattro ce la fa lo stesso, c'è sempre
  qualcosa da comprare — più la migrazione dei salvataggi da sei tappe a
  quindici),
  `livelli` (**tutti** i livelli del Generale — gli scenari di
  `src/data/livelli/` e i quattordici di prova — giocati sullo stesso banco),
  `quiz` (**tutti** i moduli di `src/quiz/moduli/`, raccolti dalla cartella e
  passati al banco di `strumenti/quiz/`: la forma delle domande, le risposte
  doppie, le scene senza pittore, il caso ripetibile, la varietà, e che due
  moduli non usino la stessa chiave),
  `quiz-pesi` (**quanto spesso esce ogni classe di domande**: alle
  difficoltà che i giochi chiedono davvero si devono vedere tutti i
  moduli, nessuna classe si prende più di un quinto dei tiri, e i gradi
  in cima alla scaletta — area, perimetro — smettono di essere
  irraggiungibili. È l'unico test che conta i tiri invece di guardare le
  domande, ed è il solo posto dove quel difetto si vedeva),
  `saperi` (il catalogo dei macrogruppi e chi lo cita: una chiave citata
  da un modulo e non elencata è un refuso muto, un macrogruppo che non
  toglie niente a nessuno è un interruttore finto, e il **degrado** —
  spento un sapere, quattrocento domande giocate e nessuna che lo
  chiedesse),
  `codice-segreto` (i dati del gioco, il conteggio dei pallini coi doppioni —
  è lì che questo gioco si sbaglia sempre — e le **nove tappe giocate
  davvero** dal giocatore finto: chi ragiona le vince quasi sempre, chi
  ragiona a sprazzi ce la fa più di una volta su due)
- `test/integrazione/` — nel browser, su `dist/index.html`: `avvio`, `app`,
  `monete`, `animali` (la cameretta giocata davvero e la persistenza), `inglese`,
  `spagnolo`, `campagna-mate`, `calcolo`, `torri`, `torri-equilibrio`, `pozioni`,
  `bancarella`, `codice-segreto` (la tappa vinta **ragionando sui pallini
  letti a schermo**: se il gioco disegnasse indizi diversi da quelli che il
  motore calcola, il test non riuscirebbe mai a vincere)
- `test/aiuto/` — `verifica.mjs` (controlla / uguale / nota / riassunto),
  `browser.mjs` (apre Chrome, semina o rilegge un profilo, azzera, fa gli
  scatti) e `livello.mjs` (il banco di prova di un livello del Generale)

Un test nuovo non deve rifarsi né il browser né i controlli: si importa da
`../aiuto/`. La build la fa il lanciatore, quindi non si prova per sbaglio la
versione di ieri; Chrome viene trovato da solo e si può forzare con `CHROME=…`.

**Un livello del Generale non si porta dietro un test suo.** Ce n'è uno solo
per tutti (`test/unita/livelli.test.mjs`), che raccoglie i livelli dalla
cartella e li passa al banco di prova (`test/aiuto/livello.mjs`): le soluzioni
dichiarate vincono su tutte le scene, la fragile ne perde almeno una, il piano
vuoto non vince mai, togliendo un ordine non si vince più, il par è raggiungibile
e non largo di manica, nessun ordine viene rifiutato, le cose stanno su
pavimento. Quello che uno scenario ha **di suo** si dichiara nello scenario, nel
campo `verifiche` (`prove` è già preso: dice quante scene si giocano) — oggi
`nonInFila`, `serveOgnuno`, `ordineConta: [[a, b], …]`, `ordineLibero`,
`senza: [cosa]` — e il banco lo esegue da solo. Così la verifica e la scena
cambiano insieme, e si sa sempre cosa è stato provato. Il contratto per esteso,
con la forma di ogni prova, sta in testa a `test/aiuto/livello.mjs`; una chiave
che il banco non conosce è un guasto, non un commento. Una soluzione dichiarata
più lunga del par si marca `lunga: true`: è l'unica da cui un ordine si può
togliere senza perdere.

## Pubblicare ai bambini

I giochi girano sui loro telefoni come app installata (PWA). Ci sono **due
strade, e per ora restano tutte e due**:

1. **GitHub Pages**, che si aggiorna da sé: ogni push su `main` fa partire
   `.github/workflows/pubblica.yml`, che costruisce, fa girare le prove senza
   browser, pubblica e poi **richiede al sito che versione sta servendo** per
   confermare che il deploy sia arrivato davvero.
2. **Il server di casa**, con `./pubblica.sh`, che copia via ssh.

```bash
./pubblica.sh              # build + copia sul server + verifica
./pubblica.sh --locale     # solo build e pubblico/, niente rete
```

**Quando lanciarlo**: quando una modifica è finita e provata, non a ogni
salvataggio. Non tocca `dist/`, che resta l'output di sviluppo.

**L'indirizzo di casa non sta nel repo**: `pubblica.sh` lo legge da `.nas`,
che git ignora (`host=`, `sito=`, `webroot=`). Senza quel file lo script
lavora lo stesso e salta solo il controllo finale. È il motivo per cui questo
repo può stare pubblico senza portarsi dietro dove abito.

Lo script rigenera anche `giochi.html` in root e `pubblico/`, che **vanno
committati**: sono la copia da doppio click e quella che il server serve.

### L'aggiornamento sui telefoni

Su Pages non si possono mandare header propri — niente `Cache-Control:
no-cache` come faceva nginx — quindi il controllo sta nel **service worker**,
che il build genera da sé (`vite.config.js`) con **la versione nel nome della
cache**: un build nuovo ha un nome nuovo, quindi la roba vecchia non viene
riusata, e all'attivazione le cache precedenti si cancellano tutte. In lettura
è cache-first, ed è ciò che rende l'app giocabile senza rete. Da `file://` non
si registra: il file unico ha già tutto dentro.

Il numero di versione lo genera il build, non si scrive a mano. Si legge in tre
posti, e devono coincidere:

1. in fondo alla schermata iniziale dell'app: `aggiornato il 2 agosto alle 19:29`
2. `curl <indirizzo>/versione.json`
3. l'ultima riga di `./pubblica.sh` — o l'ultimo passo della action — che
   confrontano da soli le due cose e falliscono se il sito serve una versione
   diversa da quella appena costruita

Se sul telefono la data è vecchia mentre `versione.json` è nuovo, il file è
stato pubblicato ma il telefono ha ancora la sua copia in cache.

Il `+` in coda al commit (`922257a+`) vuol dire che il build è stato fatto con
modifiche non committate: non è ricostruibile da git.

### Le icone

`public/icona.svg` è la sorgente, ed è un dado **disegnato con forme vere**:
prima era l'emoji 🎲 dentro un `<text>`, e sui telefoni non si vedeva, perché
chi rasterizza un SVG non ha i font di sistema. I PNG che vogliono Android e
iOS si generano da lì con `node strumenti/icone.mjs` (usa Playwright, già fra
le dipendenze). L'icona della scheda invece è **incorporata nella pagina** dal
build, perché l'HTML unico non ha file accanto a cui puntare.

## Struttura

- `src/` — sorgente modulare: `store/` (persistenza, SRS, profilo, progressi),
  `data/` (vocaboli, negozio, operazioni, traguardi), `components/`, `views/`
  (un file per gioco, più `CamerettaView` per la stanza e `AlboView` per i
  progressi), `grafica/` (il disegno su canvas, vedi sotto), `motore/`
- `src/giochi/` — **la casa dei giochi nuovi, e la convenzione da seguire
  d'ora in poi**. I giochi in `views/` sono fatti in quattro modi diversi —
  un file solo da duemila righe, i dati sparsi in `data/`, un campo dedicato
  nel profilo per ognuno: non sono un modello, sono il motivo per cui questa
  cartella esiste. Il calco è `codice-segreto/`, e `CONVENZIONE.md` lo spiega
  per esteso. In due righe: **ogni pezzo sa una cosa e non sa le altre** —
  `dati/` (tabelle e basta), `motore/` (le regole a classi, che girano anche
  in Node), `scena/` (canvas e coreografie, che di regole non sanno niente),
  `viste/` (un componente per schermata), `Gioco.vue` (il coordinatore, il
  solo che sa che esistono le monete), `gioco.js` (il manifesto, dato puro).
  L'avanzamento **non aggiunge un campo al profilo**: sta in
  `profile.campagne[<chiave>]` e lo muove `src/giochi/campagne.js`, con una
  forma sola per tutti (`{ tappa, libera, stelle, cfg }`) che si crea da sé —
  un profilo di ieri gioca a un gioco di oggi senza migrazioni. Allo stesso
  modo **i traguardi non si scrivono in `data/traguardi.js`**: il manifesto
  dichiara un blocco `albo` (famiglia, formula dell'esperienza, traguardi) e
  `src/giochi/albo.js` lo accoda a quelli dei giochi vecchi; le misure che i
  traguardi leggono sono quelle di tutti più `m.tappeDi/stelleDi/finita`, che
  valgono per qualunque campagna. Un gioco nuovo si registra in `indice.js`
  (i manifesti, dato puro) e in `schermate.js` (i `.vue`, letto solo da
  `App.vue`): sono due file perché sono due catene di `import` diverse, e
  mescolarle chiude un anello.
- `src/motore/battaglia.js` — le regole del tower defense, senza schermo:
  i nemici che camminano, le torri che prendono di mira, i colpi, il gelo,
  l'energia, i cuori. Non tocca un contesto 2D, non importa Vue, non sa cosa
  sia un'operazione in colonna: chi compra dice quanto paga. Gira uguale nel
  gioco e in Node — ed è **l'unico motivo per cui il bilanciamento si può
  misurare invece di provarlo a occhio** (`npm run tara`). Chi cambia le
  regole della battaglia le cambia qui: `TowerDefense.vue` è rimasta a
  mostrare, far toccare e chiedere il calcolo prima di pagare.
- `src/grafica/` — quello che si disegna, separato da quello che si gioca:
  - `tela.js` — il pezzetto di motore fatto in casa: canvas alla risoluzione
    dello schermo, sfondo fermo tenuto in cache, ordinamento per profondità,
    e un «pennello» con le scorciatoie ricorrenti. Niente librerie: Pixi o
    Konva pesano da 100 a 450 KB e il build deve restare un HTML unico.
  - `geometria.js` — tracciati: smussatura degli angoli, lunghezza, punto a
    distanza *d*, normale. È l'unico posto dove gioco e disegno devono
    essere d'accordo su dove passa la strada.
  - `castello.js` — i pittori del tower defense (prato, torri, mostri,
    colpi), raccolti nella tabella `PITTORI`.
- Il calcolo a mente ha due file suoi: `data/calcolo.js` è il catalogo (i
  concetti con dritta, generatore ed errori tipici, e le stazioni della
  campagna), `store/calcolo.js` è il gestore (chi è aperto, cosa si chiede,
  quanto grandi i numeri). Il gestore è di funzioni pure che ricevono `items`,
  come `store/progressi.js`: gira anche fuori dal browser.
- La gamification comune sta in `store/progressi.js` (livelli, padronanza,
  traguardi) e `data/traguardi.js` (l'elenco). I giochi non toccano i
  contatori a mano: usano `segna()` e `segnaBest()` di `store/profile.js`, e
  chiedono la difficoltà del momento con `difficoltaOra('mate')`.
- `src/quiz/` — i **moduli di quiz**: mazzi di domande che non finiscono mai,
  staccati da qualunque gioco. Servono a far *pagare* un potenziamento con un
  esercizio — quello che il castello fa già coi calcoli in colonna — in modo
  che la stessa domanda valga per Survivors, il dungeon e chiunque altro. Il
  patto è che **un modulo consegna una domanda e non sa chi gliel'ha
  chiesta**: `genera(grado, sorte)` e basta, niente stato, niente DOM. Le
  risposte sono testo, emoji o una scena disegnata, e la scena la dipinge un
  pittore in `grafica/pittori/`, che è l'unico posto che tocca il canvas — la
  stessa divisione di `src/grafica/`. Un modulo nuovo è **un file in
  `moduli/`** e niente altro: il registro e il banco lo raccolgono dalla
  cartella. Il contratto per esteso sta in `src/quiz/LEGGIMI.md`; la qualità
  la misura `strumenti/quiz/banco.mjs` (`npm run quiz:banco`, e il test
  `unita/quiz`), che oltre alla forma controlla la **varietà** — un grado che
  produce venti domande diverse si impara a memoria e vale zero — e che la
  chiave sia il **concetto** (`orto:gn`), non l'istanza, perché è quella che
  un domani andrà a `store/srs.js`.
  **Si pesca una classe di domande, non un modulo.** Una classe è la
  coppia (modulo, grado) — «il perimetro», «i contrari» — e `scelta.js`
  le mette tutte insieme dando a ognuna un peso a campana centrato sulla
  difficoltà chiesta (`nucleo/classi.js`, che gira anche in Node). Prima
  si tirava a sorte il modulo e il grado si *calcolava* dalla
  difficoltà: con le tre fasce di Survivors (0.15 · 0.50 · 0.85) il
  primo e l'ultimo grado di ogni modulo non uscivano mai — area e
  perimetro si vedevano solo comprando le carte più care — e una classe
  valeva quanto il modulo che se la portava dietro. La difficoltà resta
  una manopola sola, ma adesso è un **centro** e non un binario; quante
  domande diverse sappia fare un modulo non ha mai pesato e non deve
  pesare, quella è ripetitività, non frequenza. Chi tocca la banda
  guarda `unita/quiz-pesi`, che conta i tiri invece di guardare le
  domande.
- `strumenti/mappe/` — il banco da lavoro dei livelli del **Generale**, che
  sono dato puro: ASCII art più metadati. `FORMATO.md` è la specifica (la
  legenda, gli ordini, le zone, le varianti) ed è pensata per chi non ha
  scritto il codice; `nucleo.js` è l'unica copia delle regole; `valida.mjs`
  le fa girare da riga di comando (`npm run mappe`) e dal test
  `unita/mappe`; `editor.html` si apre col doppio click e la mappa si
  disegna col mouse, con il testo del livello che esce già scritto — e si
  può incollare un livello che esiste per ritrovarlo disegnato. Il nucleo
  non ha né `import` né `export` apposta: da `file://` i moduli non si
  caricano, e le regole devono restare una copia sola.
  **Gli ordini non si scrivono a mano**: si compongono a menu, e ogni
  tendina è ricavata da quello che è disegnato — le unità della mappa, le
  zone del calco, i segnali dichiarati, i verbi della cassetta — e
  **filtrata per verbo** con la stessa tabella che usa il validatore
  (`prendi` offre le cose, `apri` i congegni, `pattuglia` le zone). Un
  ordine impossibile non compare fra le scelte, e il livello non può
  comandare le unità del bambino perché non gliele offre. Le soluzioni si
  fanno allo stesso modo, e quella che deve *cadere* su una variante si
  segna `fragile`. Anche le **varianti si disegnano**: una linguetta per
  scena, si disegna sopra la base e l'editor ricava la differenza (uno
  `sposta` se basta, la mappa intera se no). Restano differenze esplicite
  e non semi — con un seme il livello che il bambino gioca davvero non
  sta scritto da nessuna parte e non si può correggere.
  **L'editor sa quale delle 24 tappe stai disegnando**: si sceglie
  campagna e tappa da una tendina e nome, racconto, dritta, cassetta e
  par arrivano da `src/data/campagne-generale.js`, le due varianti
  prendono il nome dalle scene descritte lì, e sopra la mappa resta
  scritto il **concetto che quella tappa deve insegnare**. Il dato ce lo
  porta `strumenti/mappe/campagne.js`, **file generato** da `node
  strumenti/mappe/estrai-campagne.mjs` (da `file://` un modulo di `src/`
  non si carica): ha una firma, e `unita/mappe` diventa rosso quando è
  stantio. Le campagne parlano un vocabolario più fine del formato —
  `passo`, `attacca`, `se` — e la tabella che traduce sta in `nucleo.js`:
  due tappe su 24 (le due che si giocano contando i passi) oggi non si
  possono esprimere, e l'editor lo dice invece di far finta.
  Ogni unità dichiara in legenda **cosa sa fare** (`sa`), perché il
  forziere lo apre l'eroe e il cane corre e abbaia: se il cane sapesse
  aprire i portoni «mandaci il cane» sarebbe sempre la risposta. Il
  filtro degli ordini ha quindi tre lati — verbo × genere del bersaglio ×
  chi lo esegue — sia nel validatore che nelle tendine.
- `giochi.html` — artefatto distribuibile in root, copia dell'output di
  `npm run build`. È il file che i bambini aprono: va rigenerato quando si
  rilascia una modifica, non modificato a mano.
- `dist/` — output del build, ignorato da git

## Convenzioni

- **La barra in cima è una sola** (`components/Barra.vue`): il tasto per
  tornare indietro è sempre il primo a sinistra, è sempre `←` ed è l'unico
  tasto pieno e colorato della barra, poi il nome
  di dove sei, poi lo slot dove ogni gioco appende i suoi indicatori, e a
  destra monete e audio. Una schermata non si fa più la sua fascia: prima
  c'erano ‹, ← e ✕ in posti diversi, e nel castello i gettoni erano tanti al
  punto che il tasto per uscire finiva fuori dallo schermo. La variante
  `scura` serve ai fondi notturni (le tabelline). Nei test il tasto si trova
  con `button[aria-label="indietro"]`, non col carattere.
- **I giochi sono verticali**: il manifest (`public/manifest.webmanifest`) dice
  `orientation: portrait` all'app installata; dal browser l'orientamento non si
  può imporre, quindi sui telefoni girati esce il cartello «gira il telefono»
  (`.gira` in `style.css`), che su tablet e computer non compare mai.
- **Il codice è in italiano**: nomi di variabili, funzioni e commenti
  (`colonnaAdd`, `guasti`, `forza`, `ripassoFraGiorni`). Mantenere questa scelta.
- **Chi gioca non disegna**: una view di gioco non tocca mai un contesto 2D.
  Costruisce la lista delle cose in scena — `{ che: 'torre', x, y, tipo, lv }` —
  e la passa a `tela.disegna()`; chi la dipinge sta in `grafica/`. Aggiungere
  una figura nuova vuol dire aggiungere una riga a `PITTORI`, non un `ctx.arc`
  dentro il gioco. Al contrario, in `grafica/` non entrano energia, prezzi,
  ondate: solo fatti già decisi (`potenziabile: true`).
- **Nel castello il numero di calcoli è l'input, non il risultato.** Una
  tappa dichiara in `data/campagne-castello.js` quante operazioni in colonna
  costa finirla (`calcoli`, da 6 a 30) e fin dove arriva la scaletta (`cap`);
  tutto il resto lo deriva `data/castello.js` — il piano degli acquisti, le
  ondate che lo pagano, l'energia di partenza, le postazioni. Prima era il
  contrario, e uscivano da 21 a 52 operazioni per tappa: una partita
  diventava un compito. Chi ritocca l'equilibrio non scrive `ondate` né
  `partenza` da nessuna parte: cambia i prezzi o le entrate e riguarda la
  tabella che stampa `unita/castello`.
- **L'equilibrio del castello si misura, non si deduce.** La vita dei nemici
  non è una formula per tappa ma un numero per ondata, trovato da
  `npm run tara` giocando la tappa migliaia di volte (una ventina di secondi
  per tutte e quindici, più la partita libera). Chi tocca prezzi, torri o
  tappe rilancia la taratura: il test `unita/castello` confronta una firma e
  fallisce se i dati sono di ieri. E non si aggiustano a mano i numeri di
  `data/taratura-castello.js` — si cambia il criterio nel taratore e si
  rigenera. Se una tappa risulta troppo dura, la domanda giusta non è «quanta
  vita tolgo» ma «cosa non torna nel modello»: le leve sono le entrate di
  un'ondata, il listino dei prezzi e quanto vicino al limite si gioca (la
  rampa `--da 0.6 --bersaglio 0.85` del taratore).
- Niente dipendenze runtime oltre a Vue: gli effetti sonori sono sintetizzati,
  le icone sono emoji, nessun file esterno. Il build deve restare un singolo
  HTML autonomo.
- **La pronuncia non usa `speechSynthesis`**: la voce del dispositivo è
  una lotteria (su Linux esce espeak, incomprensibile) e a un bambino una
  pronuncia sbagliata fa più danno del silenzio. Le clip sono incise a monte da
  `npm run voci` e vivono in `src/data/voci.js` (inglese, ~1,1 MB) e
  `src/data/voci-es.js` (spagnolo, ~1,1 MB), non una per file ma
  concatenate in sprite per categoria più un indice `parola → [sprite, inizio,
  durata]`: l'intestazione di un file audio pesa quanto mezzo secondo di
  parlato, e con 550 parole sarebbe stata metà del peso. `src/voce.js` è
  l'unico punto che le riproduce — `pronuncia(parola, lingua)` — e tiene
  decodificati al massimo tre sprite. Le due lingue hanno indici separati:
  parole come `no` o `piano` esistono in tutte e due e vanno dette con la
  bocca giusta. Le due incisioni sono i due terzi del peso del file unico
  (2,6 MB): è il prezzo di una pronuncia che non dipende dal telefono.
- **La bancarella è un mercato a tappe** (`views/BancarellaGame.vue`): una
  giornata è una campagna (`CAMPAGNE` in `data/bancarella.js`), una tappa è un
  banco solo con la merce **tutta in vista** nelle ceste, tre clienti per
  banco. Niente reparti da aprire e niente cassa da aprire: presa la spesa, il
  banco diventa il registratore. La difficoltà di una giornata non sta nelle
  cifre ma in `pezzi` — **quante monete deve chiedere il resto** — e nel tempo,
  che si stringe di tappa in tappa e di giornata in giornata; il cliente
  sceglie con cosa pagare apposta perché il resto venga di quella misura.
  L'ultima giornata (`mente: true`) toglie l'aiuto: **il resto lo calcola il
  bambino**, il display fa `? ? ?`, le monete si posano tutte e la risposta si
  dà col tasto ✓ — la cassa dice solo giusto o sbagliato, mai la cifra. Nei
  test i bersagli sono `.giornata`, `.cesta[data-em]`, `.scomparto[data-v]` e
  `.eccolo`.
- **Quali giochi si vedono in home lo decidono i genitori**
  (`views/GenitoriView.vue`, dietro il PIN): un interruttore per gioco,
  l'elenco sta in `data/giochi.js` e la scelta in `settings.giochi` del
  profilo — **per bambino**, e come elenco di eccezioni (`{ torri: false }`),
  così un gioco nuovo nasce acceso anche per chi ha il profilo di ieri.
  Spegnere nasconde la carta e basta: i progressi restano dove sono, e
  l'indirizzo (`#torri`) continua a portare dentro perché è la strada dei
  grandi e dei test. Cameretta e albo non si spengono. Nei test i bersagli
  sono `.carta.gioco[data-gioco="…"]` e `.carta[data-flag="…"]`.
- **Cosa il bambino ha fatto a scuola lo dicono i genitori**, nella
  seconda scheda della loro schermata. `data/saperi.js` elenca i
  **macrogruppi** — una trentina, per materia: i numeri, le decine, la
  stima, metri litri e chili, le conversioni, le divisioni, le figure,
  la simmetria, la griglia, area e perimetro, i solidi, il calendario,
  l'orologio, contare i giorni, i suoni difficili, le sillabe, il
  lessico, l'analisi grammaticale, i verbi, gli accenti, più quelli di
  ragionamento — e spegnerne uno toglie le domande che lo davano per
  scontato. Non è una questione di
  difficoltà: una conversione a chi non sa cosa è un litro non è
  difficile, è **muta**, si può solo tirare a indovinare. La scelta sta
  in `settings.sa` come elenco di eccezioni (`{ misure: false }`), per
  bambino, e un macrogruppo nuovo nasce acceso per tutti. Le divisioni
  del castello erano il primo caso e adesso sono un macrogruppo come gli
  altri: `divisioniAccese()` è un alias, e il vecchio `settings.divisioni`
  si migra al primo avvio. **Chi dichiara di aver bisogno di un sapere è
  chi fa le domande**: un modulo di quiz tipologia per tipologia (`sa:`
  dentro `tipi`), un gioco intero con `serve:` in
  `data/giochi.js` — oggi solo le pozioni, che sono conversioni e basta e
  quindi spariscono dalla home invece di restare ingiocabili. Tutti gli
  altri **degradano**: il quiz scende di grado, il castello chiede
  moltiplicazioni. Un sapere che non toglie niente a nessuno è un
  interruttore finto e `unita/saperi` lo dice. Nei test i bersagli sono
  `.schede button[data-scheda="sa"]` e `.carta[data-sapere="…"]`.
- **Un macrogruppo si può aprire nel dettaglio.** «Accenti e apostrofi»
  sono sei domande diverse — l'accento, l'apostrofo, la lettera h,
  l'accento tonico, tronche e piane — e a volte il bambino ne ha fatta
  una parte: il tasto «nel dettaglio» sotto la carta le elenca una per
  una, ognuna col suo interruttore. Le sottovoci **non stanno in
  `data/saperi.js`**: sono i `tipi` che ogni modulo di quiz dichiara, e
  `src/quiz/saperi.js` le raccoglie dal registro, così un modulo nuovo
  porta le sue e compaiono da sole. Nel profilo finiscono nella stessa
  `settings.sa` dei gruppi (`{ analisi: false, 'orto:acca': false }`) e
  per chi fa le domande sono la stessa cosa: due chiavi da evitare.
  Il dettaglio non si apre se il gruppo è spento — sotto sono già spente
  tutte, e mostrare interruttori che non fanno niente inganna. Nei test
  i bersagli sono `button[data-dettaglio="…"]` e `.voce[data-sapere="…"]`.
- **Si spegne per due ragioni, non per una.** La prima è quella
  originale: il bambino quella cosa non l'ha fatta, e la domanda gli
  arriva muta. La seconda è **isolare** — i gruppi della materia
  *ragionamento* (deduzione, incertezza, insiemi, confronti, analogie,
  sequenze) non sono pezzi di scuola e nessuno li spegne per una
  lacuna: si spengono per guardare un tipo di domanda da solo, che
  serve a chi prova il gioco quanto a chi lo gioca. Da quando **ogni**
  tipologia sta in un gruppo, però, spegnere tutto svuoterebbe il
  mazzo: chi tiene su il gioco è il ripiego di `quiz/scelta.js`, che a
  mani vuote torna a pescare fra tutte le classi ignorando gli spenti.
  Un gioco senza domanda è rotto, una domanda difficile no.
- **Un gioco a metà si tagga `sperimentale` e sta dietro un cancello.**
  In `data/giochi.js` un gioco può dichiarare `sperimentale: true`: da quel
  momento **non esiste** per chi gioca — non è in home, non è fra le carte
  che i genitori accendono, non conta nel «non hai nessun gioco acceso» —
  finché nei settaggi non si accende il flag «giochi in prova»
  (`settings.sperimentali`, per bambino come tutto il resto). Non è
  l'interruttore di sempre messo giù: è **un flag solo per tutti** quelli
  in prova, e dietro il cancello ognuno mantiene il suo interruttore
  normale. Serve a non far arrivare ai bambini un gioco che sto ancora
  scrivendo. Quando è finito si toglie la riga e torna un gioco come gli
  altri: acceso per tutti. L'indirizzo (`#generale`) porta dentro
  comunque, com'è sempre stato. Oggi è in prova **il generale**.
- **Il codice dei genitori si cambia** (`store/pin.js`): quattro cifre, di
  partenza `0000`, chieste due volte quando si cambiano. Sta nell'archivio
  accanto a `ultimo-giocatore` e **non dentro i profili** — è di casa, non di
  un bambino, e «cancella i progressi di un bambino» non lo deve riportare a
  zero. Non è sicurezza, è un gradino contro il tocco distratto: chi se lo
  dimentica lo rimette dall'indirizzo con `giochi.html#pin=1234`, dove sta
  già il cheat delle monete. Nei test il bersaglio è
  `.carta[data-azione="cambia-codice"]`.
- **La cameretta è una stanza disegnata** (`views/CamerettaView.vue` e
  `components/Stanza.vue`): cameretta, negozio e animali erano tre posti con
  due negozi e un salvadanaio solo, adesso sono una camera sola e **la
  navigazione è il disegno** — la porta porta al negozio, la macchina alle
  sorprese, l'animale sul tappeto alla sua scheda, la cuccia vuota
  all'adozione. Nella stanza un animale dice **una cosa sola con un'icona**
  (l'osso, la palla) e nient'altro: barre, parole e vestiti stanno nella sua
  scheda, uno per volta e grande. La stanza non scorre: si adatta allo schermo,
  e le misure sono in `cqw`, non in pixel. Nei test i bersagli sono `.porta`,
  `.macchina`, `.posto` (`.libero` se la cuccia è vuota) e `.reparti button`.
- **Negli asteroidi ci sono due campagne** (`views/MathGame.vue`): i pianeti
  sono le tabelline, le stazioni sono il **calcolo a mente**, e stanno in due
  schede della stessa mappa. Non sono una il seguito dell'altra: 3+4 viene
  prima delle tabelline e 4×23 viene dopo, quindi la prima stazione è aperta
  dal primo giorno. Il gioco (canvas, vite, boss, monete) non sa quale delle
  due sta servendo: cambia solo da dove arriva la domanda, e `domanda.testo` +
  `domanda.chiave` + `domanda.peso` sono tutto quello che gli serve. Nei test
  i bersagli sono `.stazioni`, `.stazione`, `.trucco` e `.voce`.
- **Nel calcolo a mente il motore non segue sempre il calcolo**
  (`data/calcolo.js` + `store/calcolo.js`): dove i casi sono pochi l'elemento è
  il fatto (`calc:8+5`), dove sono infiniti è la **strategia**
  (`calc:somma-riporto`) e la domanda è un'istanza generata. Si distinguono
  dalla chiave: dopo `calc:` un fatto comincia con una cifra, un concetto con
  una lettera. La difficoltà ha tre assi — quale concetto è aperto (grafo di
  prerequisiti, tabelline comprese), quanto è consolidato, quanto sono grandi i
  numeri (la *taglia*, da 0 a 1) — e il grafo **dosa, non sbarra**: una
  stazione aperta è sempre superabile, i prerequisiti deboli entrano nel pool
  come ripasso accanto ai concetti nuovi, non al loro posto. Aggiungere un
  concetto vuol dire aggiungere una voce a `CONCETTI` con la sua dritta, il suo
  generatore e i suoi **errori tipici** — che sono i bersagli sbagliati, e
  senza quelli la scelta multipla si risolve per esclusione invece che
  calcolando.
- **English e Spagnolo sono lo stesso gioco** (`views/LinguaGame.vue`): parole,
  verbi e frasi nella stessa campagna a tappe. Quello che cambia da una lingua
  all'altra sta tutto in `data/lingue.js` — campagna, chiavi del profilo,
  contatori, nome — e il gioco non nomina mai una lingua in particolare. Il
  meccanismo è uno — bersaglio più opzioni — e i modi di chiedere stanno tutti
  in `data/domande.js`: aggiungerne uno vuol dire aggiungere una voce a quella
  tabella, non mettere le mani nel gioco. Quale tipo tocca a un elemento lo
  decide la sua **forza** nel motore, non la tappa.
- **Le lingue non si mescolano mai**: chiavi separate (`en:dog` contro
  `es:perro`, `verbo:` contro `verbo-es:`, `frase:` contro `frase-es:`),
  campagne separate nel profilo (`eng` e `esp`), contatori separati (`en`,
  `verbi`, `frasi` contro `es`, `verbiEs`, `frasiEs`) e traguardi separati.
  Sapere «gatto» in inglese non vuol dire saperlo in spagnolo, e i distrattori
  di una domanda escono sempre dalla stessa lingua. Aggiungere una terza lingua
  è: tre file di dati, una campagna, una voce in `data/lingue.js`, una riga in
  `App.vue` e una carta in `HomeView`.
- **Lo spagnolo è quello di casa**: la mamma è boliviana, quindi `papa` e non
  `patata`, `palta`, `durazno`, `auto`, `celular`, e la voce incisa è
  `es-BO-SofiaNeural`. Nelle frasi le domande si scrivono con `¿…?` (in inglese
  invece il `?` non c'è di proposito: là la domanda si riconosce dal verbo
  girato), e i falsi di una domanda devono essere domande anche loro.
- I dati di gioco stanno nel browser (IndexedDB → localStorage → memoria):
  nessun backend, nessuna rete.

## Da sapere prima di eseguire i test in un ambiente pulito

Niente più percorsi cablati: `test/aiuto/browser.mjs` ricava la radice dal
proprio file e cerca Chrome nei posti soliti, con `CHROME=…` per forzarlo.
Se sulla macchina non c'è nessun Chrome di sistema, `npx playwright install
chromium` ne mette uno dove Playwright se lo aspetta e i test lo trovano.
