# Educagioco

Giochi educativi per bambini in Vue 3 + Vite. Il prodotto finale è **un unico
file HTML** apribile con doppio click, offline, senza server.

**Dove sta cosa.** Questo file dice come si lavora sul repo. Il *perché* delle
regole di gioco e i numeri esatti stanno in [`LEGGIMI.md`](LEGGIMI.md) —
leggilo prima di toccare `src/store/srs.js` o il bilanciamento. Il taglio per
chi arriva da fuori è nel [`README.md`](README.md), con una pagina per gioco
in `docs/`. Il banco di lavoro — ogni comando, cosa riscrive, i banchi di
prova, come si pubblica e cosa si guarda quando qualcosa va storto — sta in
[`ADMIN.md`](ADMIN.md). **Quanto deve costare una cosa e quanto deve rendere
un gioco** sta in [`CALIBRAZIONE.md`](CALIBRAZIONE.md): una moneta vale dieci
secondi di esercizio, e da lì si ricavano prezzi, premi e curve di rincaro —
si legge prima di scrivere un prezzo nuovo, un premio di tappa o un
potenziamento che rincara.

## Comandi

```bash
npm ci                 # installazione pulita (non npm install)
npm run dev            # server di sviluppo
npm run build          # produce dist/index.html, il file unico
npm test               # il giro di sempre: senza browser, una ventina di secondi
npm run test:svelto    # solo i test sotto il secondo, mentre si scrive
npm run test:browser   # solo dentro Chrome, un minuto e mezzo — vedi sotto
npm run test:tutto     # tutto, browser compreso: prima di pubblicare
node test/esegui.mjs animali            # solo i file che contengono "animali"
node test/esegui.mjs --niente-build     # non ricompilare prima
node test/esegui.mjs torri --scatti     # e lascia anche le foto
node test/esegui.mjs --alla-volta=1     # uno alla volta: di solito sono otto insieme
```

`npm test` (= `npm run test:unita`) è il comando di ogni giorno: nessun
browser, nessuna build, un risultato in secondi. La cartella
`test/integrazione/` apre Chrome e in fila varrebbe più del novanta per
cento dell'intera suite (misurato in
[`docs/tempi-dei-test.md`](docs/tempi-dei-test.md)): otto alla volta
costa un minuto e mezzo, che è poco ma non è niente — non va lanciata a
ogni riga scritta. Si chiede quando serve davvero: tutta con
`npm run test:tutto` o `npm run test:browser`, o **un file solo** con
`node test/esegui.mjs <nome>` — il modo giusto quando si è appena toccata
una schermata (`node test/esegui.mjs pozioni`, per dire, prova solo il
gioco delle pozioni). La CI lancia solo `npm run test:unita` prima di
costruire e pubblicare — Chrome non lo scarica, non l'ha mai fatto — quindi
un guasto che vive solo dentro `test/integrazione/` lo scopre chi l'ha
lanciato a mano, non la pipeline: un motivo in più per chiederlo quando si
tocca lo schermo, non solo quando si scrive la logica sotto.

**La cadenza, detta in due righe.** Le unità girano a ogni commit — costano
secondi, e non c'è nessun motivo di risparmiarle. **Il browser gira prima
del push, non prima di ogni commit**: un minuto e mezzo moltiplicato per
i commit di un pomeriggio è comunque un quarto d'ora, e non compra niente,
perché quello che finisce sui telefoni è la **punta** e non i passaggi
intermedi. È la stessa regola dei commit a blocchi applicata alle prove:
un commit raggruppa un concetto e può anche non stare in piedi da solo,
la coerenza si verifica dove si pubblica.

Strumenti che si usano di rado:

```bash
npm run voci           # incide la pronuncia (solo dopo aver aggiunto parole)
npm run voci -- --lingua es
npm run simula         # gioca il tower defense senza browser
npm run tara           # rimisura la vita dei nemici e riscrive i dati
npm run quiz:banco     # prova tutti i moduli di quiz senza browser
npm run quiz:eta       # chi vede cosa: la calibrazione per età, e i buchi
npm run mondo          # il banco degli sprite: guardarli, e correggere i ritagli
npm run scatti         # rifà le immagini di docs/img/
node strumenti/icone.mjs   # i PNG delle icone e l'anteprima del link, da public/icona.svg
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
suite unità intera costa una ventina di secondi, e gran parte li spende un
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

**I test girano otto alla volta** (la metà dei processori, se sono meno
di sedici, e non più di uno per giga di memoria libera: due sessioni che
chiudono insieme non si mandano in swap a vicenda). Ognuno era già un
processo a sé col suo Chrome e il suo archivio, quindi un test non deve
sapere niente: un test di integrazione passa quasi tutto il suo tempo ad
aspettare un'animazione, e in fila quelle attese si sommano — più di
dieci minuti contro uno e mezzo. L'uscita di ogni test si stampa
intera quando finisce, i lunghi partono per primi (il lanciatore si
ricorda i tempi in `node_modules/.cache/`), e **il giro non finisce
prima del suo test più lungo**: è lì che si guarda quando il totale
cresce. `--alla-volta=1` è il lanciatore di prima, con l'uscita dal vivo
— serve quando un test si comporta male solo in compagnia. I dettagli
sono in [`test/README.md`](test/README.md).

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

**È anche il modo di provare col dito.** Certe cose si vedono solo da un
telefono vero — un tocco non è un click, e nessun test di integrazione lo
sostituisce — e `./pubblica.sh` mette il file sul server di casa in una
decina di secondi, raggiungibile dal telefono senza passare da GitHub
Pages: si chiede quando c'è da guardare una schermata, non solo quando si
rilascia. Due avvertenze. La prima è che **la copia di casa è una sola**:
non c'è un canale di anteprima separato, quindi quello che si pubblica è
quello che trovano i bambini — va bene per una prova, non per lasciarci
una versione a metà. La seconda è che **è tutto lo stesso origin** (il
nome `.lan` è un redirect a quello del tailnet, non un secondo indirizzo):
profili, cache e service worker sono gli stessi del sito che si usa in
casa, quindi una prova che tocca l'archivio tocca i salvataggi veri.

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
  Poi i due file che servono a disegnare **con degli sprite invece che
  coi poligoni**: `atlante.js` (un foglio di figure e come si posano: il
  piede, lo specchio, la scala intera) e `tessere.js` (*quale* tessera va
  in una cella, ricavata dai vicini — strade, pozze, recinti; niente
  canvas, gira in Node e si prova in `unita/tessere`). Il calco da
  guardare è `giochi/sotterraneo/scena/tela.js` — che però la forma dei
  muri la prende da `scena/muri.js`, perché a tre quarti la faccia di un
  muro non è il bordo di una zona: è una cella intera che si vede da una
  parte sola (la regola, e gli scenari generati da un prompt, stanno in
  `docs/sotterraneo.md`). La
  scala sta **nella trasformazione del contesto** (`dpr × scala`, una
  volta per fotogramma) e da lì in poi tutto è in pixel dello sprite —
  chi la moltiplica riga per riga prima o poi la moltiplica due volte, ed
  è invisibile a figura piccola. Un mondo a tessere vuole ingrandimenti
  interi, se no gli sprite si sfrangiano — e quando il campo è più largo
  dello schermo e la scala intera taglierebbe la mappa, quello che si
  tiene intero è **la cella in pixel dello schermo**, non la scala
  (`giochi/castello/scena/tela.js`).
  Un sì/no per lato non basta a una strada: la seconda metà di
  `tessere.js` tratta il bordo come un'**etichetta** — dove passa, non se
  passa (`·`, `c`, `sx`, `dx`) — che è quello che il mestiere chiama
  *Wang tiles*, e `componiPercorso` sceglie le tessere come si risolve un
  sudoku. Gli attacchi non si dichiarano: li **misura** dal foglio
  `strumenti/sprite/terreni.py`, che è il fratello di `atlante.py` per i
  mondi a griglia (quello ritaglia figure, questo tessere) e misura anche
  la griglia, dall'alfa, a ogni giro. I fogli li ritaglia
  `strumenti/sprite/atlante.py`, un bersaglio per gioco.
  Qui sta anche `coriandoli.js`, la festa: stava dentro il Codice
  Segreto ed è venuta fuori il giorno in cui è servita anche a un record
  battuto. Chi la usa dentro Vue passa da `giochi/Festa.vue` e non se la
  monta a mano.
- **`src/quiz/`** — i moduli di quiz, staccati da qualunque gioco: servono a
  far *pagare* un potenziamento con un esercizio. Il patto è che **un modulo
  consegna una domanda e non sa chi gliel'ha chiesta**: `genera(grado, sorte)`
  e basta. Un modulo nuovo è **un file in `moduli/`** e niente altro — il
  registro lo raccoglie dalla cartella. Contratto in `src/quiz/LEGGIMI.md`.
  Le risposte si segnano in `store/srs.js` sotto la chiave del **concetto**
  (`memoria.js`), e la pesca ne tiene conto con una **banda stretta**: 1.5
  quello che va male, 0.5 quello che è saputo, e basta — qui la domanda è il
  pedaggio di un gioco d'avventura, non la lezione, e concentrare come fanno
  gli asteroidi sarebbe una punizione (`nucleo/bisogno.js`). Il conto è a due
  livelli e la classe usa la *media* dei suoi tipi: col fattore pieno due
  volte il rapporto diventa il quadrato. Le chiavi finiscono nello stesso
  cassetto di tabelline e parole inglesi, quindi **un prefisso nuovo si
  sceglie guardando `store/progressi.js`**.
  **La difficoltà è un numero da 0 a 100, uno solo, dichiarato.** Ogni
  grado di ogni modulo dice `livelli: [12, 25, …]` — quanto è
  complicato, sulla stessa scala di tutte le materie (0 = materna,
  100 = fine primaria, 12,5 punti per anno di scuola). **L'età non sta
  sulla domanda, sta sul bambino**: `settings.eta` (la scrive la
  partenza) e da lì **due larghezze diverse**, che è la cosa che si
  sbaglia più facilmente — l'**ammissione** è larga (tre anni e mezzo
  sotto, due sopra: si toglie solo la presa in giro e il muro), la
  **mira** è più stretta (un anno indietro, e in avanti fino al tetto
  dell'ammissione) ed è dove pesca la manopola. Con una larghezza sola
  a nove anni le ore intere dell'orologio non erano rare: sparivano.
  Taglio netto in tutte e due le direzioni: niente
  domande di quarta a chi fa la prima, e niente «con che lettera
  comincia 🐝» come premio di una carta tosta a un bambino di dieci
  anni. La manopola 0..1 dei giochi diventa un punto dentro quella
  finestra: fondo = carta debole, cima = carta tosta. **Quanto è
  sfocato il tiro lo dice `BANDA`**, ed era la metà del difetto: a 19
  la campana era larga quasi quanto tutta la corsa della manopola, e
  la stessa porta della terza tappa del sotterraneo consegnava sia una
  domanda da sei anni sia una da nove — la difficoltà chiesta è
  deterministica, quella consegnata era quasi un sorteggio. A 11 la
  manopola si sente; e dove il catalogo si dirada la banda **si allarga
  a tentativi** finché non c'è varietà, che è l'unico modo di non
  ritrovarsi una classe sola al 54% dei tiri. Derivare la
  difficoltà dalla posizione in scaletta è **il modello vecchio**:
  metteva i grado-1 di sedici moduli nello stesso punto. L'elenco delle
  classi sta in `docs/livelli-delle-domande.md`, che è **generato**
  (`npm run quiz:livelli`) e non si scrive a mano.
  **La schermata dei grandi ha tre schede**, e si tara in una sola:
  «Bambini» (chi gioca, progressi, codice, guasti — con una riga sola
  che dice «Leonardo ha 10 anni · modifica ›» e rimanda) e **«Giochi e
  domande»**, la manopola dell'età col **quadro** sotto (vedi la sezione
  della manopola).
  E **«Come va»** (`quiz/ComeVa.vue`), che era sospesa ed è tornata
  rifatta: **tutte** le tipologie di domande, ordinate dalla peggiore
  alla migliore, cuori sulla percentuale di giuste — sbiaditi sotto le
  otto risposte, dove il verdetto non c'è — e il **punteggio è il
  tasto**: apre `quiz/SchedaDomanda.vue`, che porta i numeri (quante
  volte, quante giuste, quanto ci mette, l'ultima volta) e le tre cose
  da fare: ▶ provala, ✎ spostala (la stessa `Taratura.vue` del quadro),
  ↻ ricomincia a contare. L'ordine è il contenuto, e il conto per riga
  lo compone `quiz/andamento.js`, che è puro (`test/unita/andamento`).
  Era stata sospesa perché mostrava **solo i segnali** — le tre righe
  fuori soglia — e tre righe senza il resto non dicono se sono tre su
  dieci o tre su centoventi.
  **`azzeraConto` butta il conto e non il ripasso** (`s` e `last`
  restano): un ripasso azzerato rifarebbe uscire domani una cosa saputa
  ieri, mentre il conto va buttato perché dopo un ritocco parla delle
  domande di prima. Ce n'erano due che dicevano
  la stessa cosa in altri modi — un elenco di classi con quattro tondi
  per riga e una fila di interruttori per gioco — e la prima aveva
  pure **una seconda tacca dell'età**, cioè il difetto che la manopola
  era nata per togliere. Adesso il posto è uno: `quiz/Catalogo.vue` non
  esiste più.
  **Il muro adesso lo dice, e passa dalla posta.** `quiz/consiglio.js`
  legge `store/srs.js` e sa quando una chiave ha almeno otto tiri con
  meno di metà giuste (un muro) o più di nove su dieci (un pedaggio);
  `quiz/allarme.js` è il pezzo che mancava — **il momento in cui si
  dice**. `Domanda.vue` lo chiama a ogni risposta annotata, e al muro
  scrive un avviso nella posta dei grandi (`avvisaUnaVolta`, una volta
  per bambino e per chiave: la memoria di cosa si è già detto
  sopravvive al «Ho letto», se no la stessa riga tornerebbe domani).
  Solo il muro, mai il pedaggio: «le indovina quasi tutte» è vero e non
  è un problema, e metterlo nella stessa posta insegnerebbe a scorrere
  gli avvisi invece di leggerli. **Non ritocca da sé** e non cambia:
  consiglia, e il tasto è la ✎ di sempre. Nel quadro dell'età la stessa
  soglia colora la riga (`em.va-male`, l'unico rosso del quadro:
  gli altri quattro stati dicono *dove* sta una cosa, questo dice che
  qualcosa non funziona), e l'avviso porta dritto a «Come va», dove
  quella riga sta in cima perché l'elenco è ordinato dalla peggiore.
  **E quel rosso risale fino alla testata del blocco** (`vannoMale` in
  `data/quadro.js`, `allarme` di `eta/Blocco.vue`): stava sotto due
  aperture — il blocco, e dentro il blocco il pezzo di scuola — mentre
  l'avviso nomina **la tipologia**, che nel quadro compare solo al
  terzo livello. Un grande che aveva appena letto «Le analogie sulle
  cose del mondo» scorreva un quadro senza niente di rosso da nessuna
  parte, e cercava fra i pezzi di scuola un nome che i pezzi di scuola
  non hanno. Adesso il blocco chiuso dice «1 va male» e scrive la
  strada («Le analogie › «Le analogie sulle cose del mondo» · ne ha
  sbagliate 8 su 10»), il pezzo di scuola si colora anche quando a
  andare male è **una sola** delle sue domande — la somma delle altre
  quattro la coprirebbe — e la domanda porta il numero. Quello che nel
  quadro non ha nessuna riga (una tipologia oltre il tetto dell'età)
  non si segnala lì: le tiene tutte «Come va», che è dove porta il
  tasto dell'avviso. Nei test il bersaglio è `[data-va-male]` sulla
  testata e `[data-male-frase]` sotto.
- **`src/data/livelli/`** — i livelli del Generale, dato puro: una mappa a
  token e la sua legenda, scritte con le fabbriche di `scrivi.js`
  (`cose`, `chi`, `fai`, `se`, `aiuto`). **Come si scrive un livello — il metodo,
  le regole del mondo, il linguaggio, il materiale, le misure e le prove
  — sta in [`src/data/livelli/GUIDA.md`](src/data/livelli/GUIDA.md)**: si
  legge quella e non il motore, e quello che manca si verifica e si
  aggiunge lì. Il simulatore per provare i piani è
  `strumenti/generale/piani.mjs`. La fila che si gioca sta in
  `data/generale.js`, e **i progressi stanno sotto l'`id` del livello**,
  non sotto la posizione: la fila si riordina senza toccare le stelle di
  nessuno. Il banco è uno per tutti (`unita/livelli`). C'era anche un
  editor di mappe in `strumenti/mappe/`, fermo a un formato che nessun
  livello usava più: è stato tolto insieme ai livelli non pubblicati.
  **I token di serie sono tre**: `..` pavimento, `##` muro, due spazi
  **il fuori** (come il muro per il gioco, nero per chi dipinge). Il
  muro vero si mette solo dove serve — fra due stanze, attorno a una
  porta — e la forma del posto la dà il fuori: una cornice di mattoni
  intorno a tutto fa sembrare ogni mappa un edificio solo (`docs/mappe.md`).
  Dopo il tutorial vengono **storie a puntate** (`livelli/torta/`): pagine
  nello stesso posto, ognuna comincia da come l'ha lasciata quella prima,
  e ognuna si vince in più modi.
  **Chi è ostile e ti vede, ti viene addosso**, qualunque cosa stia
  facendo: è l'istinto che il motore mette in testa alle reazioni di ogni
  nemico (`conIstinto` in `motore/generale/allestimento.js`), e vedere
  scavalca sentire (`VISTA` in `motore/generale/filo.js`).
- **`strumenti/banco/`** — il banco degli sprite (`npm run mondo`), una
  pagina sola con due metà: **il mondo** guarda l'atlante generato — si
  posa, si stende il fondo col pennello, si traccia una strada che compone
  **il risolutore vero**, si manda a spasso chi cammina — e **i ritagli**
  guarda il foglio sorgente, coi rettangoli del foglietto addosso da
  trascinare. Il PNG non si tocca mai: le correzioni sono dato nel
  foglietto (`strumenti/sprite/FORMATO.md`), e chi salva è un plugin di
  Vite `apply: 'serve'` che nel build non esiste.
  **Dove sta la testa di una bestia lo dice il suo foglietto**
  (`agganci`, verso per verso, frazioni del riquadro), non una tabella
  per tutte le specie: `atlante.py` lo copia in `AGGANCI` dell'atlante
  della fattoria e `puntiDi` in `fattoria/dati/animali.js` legge
  foglietto → scheda → ripiego. Si calibra a occhio nel banco («i
  ritagli» → modo **agganci**, trascinando i cerchietti con l'anteprima
  vestita accanto) e si controlla in `poc/scatti/agganci-fattoria.png`.
- **`src/guide/`** — quello che nessuno legge nel README, messo dentro
  l'applicazione. `contenuti.js` è dato puro e ha due registri: `GUIDE`
  (per i grandi: cos'è, che giochi ci sono, installare l'app, l'età, le
  domande, i progressi, chi l'ha fatto) e `AIUTI` (uno per gioco, dietro
  il `?` della barra). **«Come funziona»
  sta fuori dal codice dei genitori**, ed è la regola da non rompere: le
  prime guide dicono cos'è e come si installa, e le legge chi ha appena
  ricevuto il link da un'altra famiglia — dietro il tastierino le
  leggerebbe solo chi non ne ha bisogno.
  **L'elenco cominciava dalle manopole**, ed era il difetto: otto guide
  che spiegavano *dove si cambia la difficoltà* a chi non sapeva ancora
  cosa fosse l'applicazione sotto. Chi riceve il link vede per prima
  cosa «Ciao! Come ti chiami?», e le domande che si fa lì sono *cos'è*,
  *chi me l'ha dato*, *cosa ci guadagna*, *dove finisce quello che
  scrivo*. Adesso ci sono quattro guide che rispondono a quelle
  (`cose`, `giochi-elenco`, `domande`, `chi`) e le manopole vengono
  dopo, tutte dov'erano.
  **Le FAQ sono un registro solo**, e i posti da cui si leggono sono
  due: la schermata «Come funziona» e il velo del primo avvio. Nessuno
  dei due ha testi suoi — il velo mostra le voci `subito: true` dello
  stesso `GUIDE` — e la riga dell'elenco la disegna un componente solo
  (`guide/Elenco.vue`), perché era l'unica cosa davvero copiata in due.
  **Due livelli, e il secondo sta chiuso.** Un blocco con `chiuso: true`
  nasce ripiegato e si apre toccando il titolo: sopra la risposta di tre
  righe, sotto il ragionamento lungo che stava solo nei `.md`. La regola
  per decidere dove va un paragrafo è **se serve a fare qualcosa sta
  fuori, se spiega perché è fatto così sta dentro**. Un blocco può anche
  avere `testo` (paragrafi) e `collegamenti` (`[{url, testo, sotto}]`,
  solo `http(s)`, si vede che portano fuori).
  **`se` nasconde, `dove` ripiega.** I passi per installare l'app erano
  dichiarati con `se: 'android'|'ios'|'computer'`, che li fa sparire
  altrove: chi leggeva la guida **dal computer** vedeva solo i passi del
  computer, cioè gli unici che non gli servivano — al computer ci si
  siede per installarla sul telefono di un figlio. Con `dove:` il blocco
  c'è sempre, aperto sulla piattaforma che si ha in mano e ripiegato
  sulle altre, e i blocchi `dove` si riordinano da sé mettendo davanti il
  proprio (`guide/Blocchi.vue`). `se` resta per i casi in cui altrove
  sarebbe **una frase falsa** e non solo inutile («✅ è già installato»).
  **Il codice di casa è scritto nelle guide**: dicevano cosa c'è dietro
  senza dire mai qual è, e chi riceve il gioco da un'altra famiglia non
  ha nessuno a cui chiederlo — `0000`, l'invito a cambiarlo, e il
  recupero. Un test lo controlla, ed è marcato `subito` perché serve
  prima di avere un profilo.
  **L'elenco dei giochi non si scrive a mano**: la guida
  `giochi-elenco` lo compone da `data/giochi.js` e `data/aree.js`, se no
  il giorno dopo direbbe il falso.
  **Dal primo avvio le guide si aprono in un velo**
  (`guide/VeloGuide.vue`, tasto `[data-azione="cos-e"]` in
  `components/Benvenuto.vue`): lì non si può navigare da nessuna parte —
  senza un profilo `App.vue` monta il benvenuto al posto di tutto — e il
  nome mezzo scritto deve restare dov'è. Il velo offre solo le guide
  marcate **`subito: true`**, che sono quelle che parlano di cose che
  esistono prima che esista un bambino: le altre spiegano manopole che
  da lì non si aprono.
  **Chi l'ha fatto sta scritto in due posti**, e nessuno dei due è una
  carta in mezzo ai giochi: la guida `chi` (senza codice, col rimando al
  codice sorgente e alla licenza) e il piede della schermata dei grandi
  (`[data-firma]`, in fondo perché chi entra lì viene per altro). Gli
  indirizzi stanno una volta sola in `guide/aiuto.js` — `CHI`, `CODICE`,
  `AUTORE`, `SEGNALA`. Un gioco mette il suo `?` scrivendo
  `guida="<chiave della schermata>"` sulla `Barra`; se in `AIUTI` non c'è
  quella chiave il tasto non compare, perché un `?` che apre un foglio
  vuoto è peggio di nessun `?`. Chi ha un orologio che gira ascolta
  `@aiuto` e si ferma (il tower defense e la corsa lo fanno). Il grassetto
  si scrive `**così**`: dentro un dato non ci va HTML.
  **Il `?` non si apre mai da solo**, ed è stato provato il contrario: il
  foglio che si presenta al primo ingresso di un gioco. Un velo che
  compare all'apertura i bambini lo chiudono per riflesso senza leggerlo,
  e in cambio si insegna proprio quello — che i cartelli si mandano via.
  O si fa un tutorial dentro la partita, o si lascia il tasto e basta.
  Il posto dove insegnare giocando è **la riga dei primi passi**
  del tower defense (`.primi-passi`, `views/castello/td.css`): sta in
  fondo al campo durante la prima partita in assoluto, non blocca niente,
  non si può chiudere per sbaglio e dice il pezzo che dal campo non si
  vede — che le torri si pagano coi conti. Sparisce quando la prima torre
  è in piedi, e non torna (`settings.guideViste`, per bambino).
  **Il banco di prova le salta** (`saltaLeSpiegazioni`, acceso da
  `apriGioco`): un test rigioca la stessa «prima volta» a ogni giro — chi
  vuole provarla chiede `apriGioco(browser, { spiegazioni: true })`.
  **L'indirizzo pubblico non si legge da `location`** (`guide/aiuto.js`,
  `__INDIRIZZO__` scritto dal build): in casa il gioco arriva dal server
  di casa, e condividere quell'indirizzo manda a un'altra famiglia una
  pagina che non esiste.
- **`src/aggiornamento.js`** — «c'è una versione nuova». Il service
  worker si aggiorna da sé, ma **la pagina già aperta resta quella di
  prima**, e su un telefono installato può restare aperta per giorni:
  qui si sorveglia (all'apertura, al ritorno in primo piano, al ritorno
  in home, ogni mezz'ora) e si accende un ref. Due cose che non fa, ed è
  deliberato: **non ricarica da solo** (un reload in mezzo a un'ondata
  butta via la partita) e **non si mostra dentro un gioco** — il nastro
  vive solo in home, dove non c'è niente da perdere. Il cartello sta in
  `guide/Nastri.vue` insieme a quello dell'installazione: parlano tutti
  e due al grande e vivono nello stesso posto. La regola dei tre
  `serveIlNastro` (non installata · telefono · non già rifiutato) è una
  funzione pura in `guide/aiuto.js` perché altrimenti non si potrebbe
  provare senza un telefono in mano — `apriGioco(browser, { userAgent })`
  è nato per questo.
  **Il nastro lo decide il sito, non il service worker**:
  `versione.json` (letto `no-store`) contro `__VERSIONE__`. Si accendeva
  quando se ne installava uno nuovo, cioè quando cambiava chi tiene la
  copia, e sbagliava nei due versi: lo diceva a chi aveva la pagina già
  fresca dalla rete, e taceva per sempre con chi aveva un service worker
  nuovo con dentro la pagina vecchia.
  **E quando l'automatico non basta c'è il tasto**: «↻ cerca
  aggiornamenti» accanto alla versione in fondo alla home, e lo stesso
  giro dietro «Aggiorna» del nastro (`aggiornaOra`, il foglio è
  `guide/Aggiorna.vue`). Chiede al sito, scarica la pagina **a mano**
  contando i megabyte (il totale è `peso` in `versione.json`: la
  lunghezza che dichiara il sito è quella compressa), controlla che dentro
  ci sia l'id promesso, la mette **al posto della vecchia** nelle cache del
  service worker e in quella della versione nuova, e solo allora riparte.
  Tre cose che si sbagliano: la pagina si chiede a `./?aggiorna=<id>` e
  `no-store`, perché anche questa `fetch` passa dal service worker, che
  fuori dalle navigazioni risponde prima dalla cache — cioè con la copia
  vecchia; la cache della versione nuova si chiama come la chiama lui
  (`CASSETTO` + id, e `unita/aggiornamento` guarda che i due nomi
  combacino), ed è così che sette megabyte e mezzo si scaricano una volta
  sola; e **niente si butta prima di avere in mano il nuovo** — è la
  differenza con «Riscarica il gioco» (`ripara()`), che butta tutto e poi
  ricarica, giusto per una copia rotta e sbagliato per una vecchia.
  **L'installazione del service worker** (`vite.config.js`) chiede la
  pagina `no-cache`, una volta sola e obbligatoria: GitHub Pages fa tenere
  la pagina dieci minuti, e il service worker nuovo si metteva in casa
  quella vecchia che il browser si teneva da parte. Si prova con un sito
  vero: `integrazione/aggiornamento` apre `aiuto/sito.mjs` (`dist/` servito
  come Pages, con `pubblica()` e i giorni storti a comando) in un
  `apriTelefono()` — un profilo su disco, perché quello in incognito la
  pagina da otto megabyte non se la tiene, e senza la pagina tenuta il
  guasto non si vede. Nei test i bersagli sono
  `[data-azione="cerca-versione"]`, `[data-aggiorna][data-fase=…]`,
  `[data-scaricati]`, `[data-azione="aggiorna"]` sul nastro e
  `[data-azione="riprova"]`.
- **`src/incidenti.js`** — la rete di sicurezza: un errore, ovunque
  scatti, finisce in archivio sotto `incidenti` (fuori dai profili, come
  il codice dei genitori) e mette a schermo un cartello in DOM puro —
  puro perché quando è Vue quello rotto un componente Vue non
  comparirebbe. I guasti si rileggono dalla pagina dei grandi, che è
  come si diagnostica un telefono che non è il proprio. `ripara()` e
  `#ripara` buttano cache e service worker e ricaricano: **non toccano
  IndexedDB né localStorage**, e questa è tutta la differenza con
  «cancella i dati del sito».
- **`src/store/sessioni.js`** — **quanto ha giocato, e a cosa.** Ogni
  sessione di gioco (quale gioco, quando, quanti secondi) finisce in
  archivio sotto `sessioni:<id del giocatore>`, **fuori dal profilo**:
  quello si riscrive intero a ogni `persist()`, e un elenco che cresce
  di dieci righe al giorno finirebbe in ogni scrittura per sempre. A
  aprire e chiudere è `App.vue` — l'unico posto che sa quale schermata
  è aperta — e un gioco non se ne occupa: se dovesse ricordarsene lui,
  il quinto gioco che nasce se ne dimenticherebbe. Tre cose che si
  sbagliano: il **telefono posato** col gioco aperto (si chiude la
  sessione su `visibilitychange`/`pagehide`, e c'è comunque un tetto di
  due ore), i **tocchi di passaggio** (sotto cinque secondi non si
  scrive niente), e il **giorno**, che è quello locale — una partita
  delle 23:40 è di ieri anche se in UTC è già oggi. I conti che i
  grafici mostrano (`perGioco`, `perGiorno`, `oggiDi`) sono puri e
  provati in `test/unita/sessioni`; il disegno è
  `components/TempoDiGioco.vue`, barre di `div` e nessuna libreria.
  **Il tetto giornaliero per gioco non c'è**, ed è deliberato: `oggiDi`
  è la metà che gli servirebbe, e il resto si fa quando si decide.
  Eliminare un bambino porta via anche il suo registro
  (`scordaSessioni`): un dato fuori dai profili non se ne va da solo.
- **`src/store/giudizi.js`** — il quaderno dei giudizi sulle domande.
  Acceso l'interruttore nella pagina dei grandi, sopra ogni domanda dei
  quiz compaiono tre tastini (😴 troppo facile, 😰 troppo difficile, 🐛
  storta): il verdetto lo dà il grande, il contesto — modulo, grado,
  tipologia, tempo, esito — se lo annota il gioco. Sta **fuori dai
  profili** come il codice dei genitori, e esce da lì per l'unica strada
  che c'è: il modulo di segnalazione, precompilato. È il difetto che
  nessun controllo automatico trova, perché una domanda fuori misura è
  formalmente ineccepibile.
- **`src/giochi/fattoria/`** — **l'albero a più fasi** è in
  [`docs/fattoria-albero.md`](docs/fattoria-albero.md), con lo stato in
  testa. Tre regole da non rompere: la catena ha **un tetto solo**
  (`PROFONDITA` in `dati/coltivazioni.js`, letta dai quattro conti che
  la risalgono — un numero copiato in quattro file è il modo in cui il
  quinto dimentica di alzarlo); «a cosa serve» si chiede a `dati/usi.js`,
  che vede tutte e cinque le uscite (`bisogni.js` ne vede tre e non può
  importare le altre due senza un anello); una voce nata prima del suo
  sprite dichiara in `aspetta` il pezzo che il foglio porterà, e i
  guasti scattano il giorno che quel pezzo c'è. **Gli addobbi al collo e
  sulla schiena sono sospesi** (`sospeso: true` in `dati/addobbi.js`,
  `IN_VENDITA` è il negozio): le emoji non si agganciano a una bestia a
  quattro zampe e si rifanno come sprite — non si cancellano, perché gli
  id sono le chiavi del salvataggio e chi le ha comprate le tiene
  (`vestiarioDi` nel motore mostra i sospesi solo a chi li ha); il
  maglione della sartoria per lo stesso motivo è una merce e non un
  addobbo, e va alla sarta. La pagina dell'albero
  (`dati/albero.js` puro, `viste/Albero.vue`) si apre **sempre con una
  merce già scelta** e le sue righe eseguono le azioni del consiglio:
  bersagli `[data-albero]`, `[data-albero-riga="<merce>"]`,
  `[data-albero-macchina="<id>"]`, `[data-albero-apri="<merce>"]`.
- **`src/giochi/passo-passo/`** — per i piccoli (chiave `passo`).
  Un coniglio su una griglia vista dall'alto torna alla tana eseguendo **una
  fila di frecce**: il «segui le istruzioni» che viene prima del Generale.
  Pagina: [`docs/passo-passo.md`](docs/passo-passo.md). Le frecce sono
  **assolute** (← ↑ → ↓ come sullo schermo, mai «gira a destra»: le svolte
  relative chiedono di ruotare la figura a mente, che a cinque anni non c'è),
  ▶ **riparte sempre dalla partenza** e la fila resta — è un programma, non un
  telecomando — e mentre corre si accende la freccia che sta facendo. Le
  regole del mondo arrivano una per gradino e valgono sempre: il salto, il
  **ghiaccio** (si scivola fino a un ostacolo: il sasso diventa un freno, ed è
  il motore della difficoltà), i massi da spingere, le buche collegate. Lo
  stato è piccolo, quindi un **risolutore** a ricerca in ampiezza
  (`motore/risolutore.js`) dà gli aiuti (la prossima freccia giusta, mai la
  soluzione intera), controlla in `unita/passo-passo` che ogni livello abbia
  bisogno della regola del suo gradino, e con `motore/generatore.js` fa i
  sentieri della modalità senza fine. Stelle: arrivato, la carota, e la
  strada trovata da te (🧠: la spegne solo la strada intera comprata col 💡).
  **Dopo le buche cresce la lingua e non il mondo**: i gradini dei grandi
  (da sette anni e mezzo) portano una carta — 🔁 ripeti N volte, per ora —
  e con lei lo **zaino**, quante carte tiene la fila. Scritta freccia per
  freccia la strada nello zaino non ci sta, ed è la regola scelta apposta:
  il ciclo è l'unico modo di farla stare, non una comodità (`serveLaCarta`
  lo pretende da ogni livello). **Non è un par**: le stelle restano quelle,
  meno carte non vale di più. La fila resta un elenco piatto (`dati/carte.js`:
  un ciclo è `ripeti-4 … fine`, e il cursore resta un numero), le modifiche
  col dito sono pure (`motore/fila.js`: ⌫ dopo una scatola la toglie
  intera, in cima al suo corpo toglie il 🔁 e basta), la N nasce da
  scegliere e ▶ non parte finché ne resta una, e mentre gira la testa della
  scatola dice **a che giro è** («3/5»), che resta scritto dove sbatte. Lì
  la soluzione **si scrive** nel livello (`soluzioni`, e le `fragili` che
  non devono prendere la carota): il risolutore trova la strada più corta,
  non il programma più corto, e il 💡 parte da quella scritta. Il sentiero
  senza fine si apre alla fine delle tappe dei piccoli (`TAPPE_PICCOLE`),
  non della campagna: è il loro.
  **Le condizioni guardano per terra**: le lastre colorate (`r u g`, con
  la forma oltre al colore). La testa di una scatola 🔁 può essere un
  numero, un colore — «fino al rosso»: un giro, e alla fine di ogni giro
  si guarda sotto i piedi — o la casa; la scatola ❓ fa quello che ha
  dentro una volta sola, se il coniglio è sul colore giusto. Il «fino a»
  serve dove la stessa scatola fa strade lunghe diverse (una scatola
  dentro l'altra), il se dove la strada gira in tre versi: è quello che
  lo zaino pretende nei loro gradini. Un giro che non muove il coniglio
  ferma la fila (`STANCO`). Le mappe dei grandi arrivano a nove per
  undici.
  **Fra le buche e lo zaino c'è il cane pastore** (undici tappe, ancora dei
  piccoli, portata 44): il bobtail al posto del coniglio, le pecore (`p`)
  scappano di un passo quando il cane si ferma sulla loro riga o colonna
  a una o due caselle (`VISTA`: si scansano prima che arrivi, e non le
  tocca mai), e la meta è il recinto (`#`), non la tana. **Le pecore
  non sono sassi**: una che scappa spinge quella che ha davanti, e si
  muove tutta la fila (se in fondo c'è un ostacolo, nessuna); i prati
  partono con le pecore sparse, da riunire. **Il cane non
  è un'isola**, ed è la correzione che l'ha rifatto: il suo gradino rifà
  il ghiaccio, la buca, il fiume da saltare e il masso che fa il ponte, e
  lui torna in ogni gradino dello zaino con la carta di quel gradino (le
  stalle, le nicchie, il lago delle stalle); `unita/passo-passo` lo
  pretende. Siccome l'ultima pecora nel recinto chiude la fila, un 🔁 con
  un numero troppo alto non costa niente: dove il numero deve contare, i
  pezzi da ripetere sono lunghi diversi. Una pecora **incastrata** — su una cella da
  cui nessuna spinta la riporta al recinto, `celleIncastro` in
  `motore/livello.js`, calcolata una volta dal recinto all'indietro —
  ferma la fila come un albero (`PERSA`): senza, il bambino aggiungeva
  frecce a una partita già persa e nessuna gli diceva perché. Ogni tappa
  del cane dichiara le sue `trappole` (le mosse ingenue, che devono fare
  un pezzo di strada e poi fallire). Le stelle stanno sotto l'indice,
  quindi l'arrivo in mezzo alla fila ha il suo travaso (`FILE`/`riordina`
  in `dati/campagna.js`), che al contrario del costruttore **lascia la
  tappa raggiunta dov'era**: a chi era già allo zaino le pecore si aprono
  alle spalle, e niente si richiude. Il sentiero senza fine e i traguardi
  di prima restano legati alle buche (`TAPPE_PRIME`), non alla fine dei
  piccoli.
- **`src/giochi/costruttore/`** — un robot costruisce, visto di lato,
  quello che il bambino programma: **progetti** (funzioni) con le loro
  **misure** (parametri), **lavagnette** (variabili), ripeti, se, ripeti
  finché. Pagina per chi arriva da fuori: [`docs/costruttore.md`](docs/costruttore.md).
  Quattro cose da non rompere. **La sfida sono gli ordini**: un livello
  dichiara più situazioni (3 gradini e 5) e vince solo il programma che le
  regge tutte — è l'idea delle scene del Generale, ed è quella che rende
  necessari i parametri; ogni livello porta le sue `fragili` (il numero del
  primo ordine scritto a mano, la colonna a righe) e `unita/costruttore`
  pretende che ognuna perda almeno un ordine. **Una scelta non nasce fatta**:
  i numeri di una riga nuova sono `{ vuoto: true }`, scritti **N**, la scelta
  si apre da sola e ▶ non parte con una N dentro — «vai a destra 1» di
  partenza si leggeva come l'unico verso possibile (è la prima cosa vista
  giocandolo). **Il robot cammina e cade** (`motore/esecutore.js`, `passo`,
  `cadi`): sale mettendosi un mattone sotto i piedi e posa anche in basso a
  destra/sinistra, dove andrà il piede; era un drone che volava, e un robot
  per aria non dava nessun ordine alle cose. **I programmi stanno fuori dal
  profilo**, in archivio sotto `costruttore:<id>` con una `v` sua: quando la
  lingua cambia (come col passaggio alla gravità) si alza la `v` e i programmi
  vecchi si lasciano andare, l'avanzamento resta nel profilo. **Le stelle
  stanno sotto l'indice del livello** (è la forma di tutte le campagne), quindi
  riordinare la fila vuole una voce in `FILE` di `dati/campagna.js`: il profilo
  dice quale fila conosce (`cfg.fila`) e `riordina` rimette le stelle per
  chiave. **Numeri e colori sono due specie di valori**: una misura può essere
  un colore (`tipi: { tinta: 'colore' }`), un ordine può portare colori
  (`{ sinistra: 'verde' }`), e una casella offre solo la specie giusta. L'esecutore è
  un generatore che srotola il programma **un fatto per volta**
  (`riga`, `muovi`, `metti`, `entra`…), e `regia.js` li anima: è così che la
  scheda di un progetto si apre con le misure di *quella* chiamata.
  **I progetti devono servire, non solo esistere.** Misurato il 24 settembre
  2026: tutti e quattordici i livelli con un progetto si vincevano
  srotolando le chiamate, e in undici il programma srotolato era più corto.
  Due pezzi lo tengono fermo. Gli **attrezzi** (`dati/attrezzi.js`): progetti
  già scritti e chiusi, quasi sempre cose che il bambino ha costruito in un
  livello prima (la torre della torretta, l'albero del bosco), che si
  chiamano, si leggono e dicono dove lasciano il robot (`finisce`) — si
  impara a usare una funzione prima di scriverla; li rimette nel programma
  `motore/attrezzi.js` a ogni apertura, e non si salvano come roba del
  bambino. E lo **zaino** (`motore/zaino.js`, `zaino` nel livello): quante
  righe scrive il bambino, attrezzi esclusi — non è un par, è il vincolo che
  Passo passo ha già. Il banco pretende che in un livello dei progetti la
  soluzione **srotolata** non ci stia, e che ogni mossa ingenua perda un
  ordine o non ci stia. **L'editor ha dieci passi di «annulla»**, in memoria
  per livello: un 🗑 su un blocco porta via tutto quello che ha dentro.
  **La seconda parte è il porto** (`motore/porto/`, `dati/porto/`,
  `scena/porto.js`): un mondo **visto dall'alto che lavora da solo** — la
  gru cala, il nastro porta verso il mare, i clienti chiedono al bancone —
  e il bambino programma sempre un robot solo, che non sa cosa arriverà
  né quando. Il taglio che lo regge: **l'esecutore sa il controllo del
  flusso, il mondo sa i gesti** (`fai`, `guarda`, `leggi`, e se ha un
  orologio `attendi` e `finoASera`); il cantiere di lato è diventato un
  mondo come l'altro. Tre regole da non rompere: **agire costa un turno,
  pensare no** (un programma giusto con tanti «se» non deve essere lento
  senza motivo); **gli attori sono pochi comportamenti con tanti
  costumi** (una sorgente, un nastro, un cliente: una sfida nuova è una
  mappa, qualche attore e un `obiettivo` dichiarato, mai una meccanica
  scritta apposta — è la cosa che l'utente ha chiesto, un motore che
  regga tante sfide); e **niente eventi nel linguaggio**, solo `aspetta
  che` e `ripeti per sempre`: gli eventi e i personaggi che reagiscono
  sono del Generale. Le mappe sono a **coppie di caratteri**, posto +
  cosa (`=R` uno scaffale con una cassa rossa, `.@` il robot), legenda
  in `dati/porto/legenda.js`; un guaio del mondo (una cassa in mare, un
  cliente arrabbiato) ferma la giornata dove succede, e a sera
  `motore/porto/esito.js` dice cosa manca coi numeri. Banco in
  `unita/costruttore-porto`. **Quello che lavora intorno non deve poter
  far perdere** chi non l'ha ancora imparato: nelle giornate
  (`dati/porto/giornate.js`, in fondo alla fila) la gru scarica su un
  nastro che finisce in un cassone e lo riempie da sola; i camion
  (`camion`, sulla piazzola `&`) ripartono appena pieni e sono l'attore
  che il livello mette apposta. E una scena si scrive **piena, come un
  posto vero**, non una striscia con solo quello che serve a provare la
  lezione: è il difetto dei primi otto livelli, segnalato dall'utente
  guardando la scena di prova della tela.
  Dopo il porto, **i posti** (`dati/porto/posti.js`): un lavoro diverso
  per ogni colore di cassa, con le strade prima date come attrezzi e poi
  scritte dal bambino su una mappa più larga dello schermo — le strade di
  una mappa sono attrezzi di quella mappa (`attrezzo` di
  `dati/attrezzi.js`), non del catalogo. E in fondo **le lettere in
  ordine** (`dati/porto/ordine.js`): confrontare due numeri (il ⚖️ che il
  linguaggio aveva e nessun livello usava), scambiare passando dal banco,
  ripetere la passata — il bubble sort. Si vince con l'obiettivo
  `inOrdine` di `motore/porto/esito.js`, che guarda la fila e non la
  strada fatta per arrivarci (e che sa anche l'ordine dei colori,
  `colori`, e quello dentro un sacco, `cassone`).
  **Poi gli algoritmi** (`ordine.js`, `cercare.js`, `pile.js`, tre
  capitoli): **lo scaffale è la memoria** — la casella del robot è
  l'indice, la mano un registro, il banco la variabile d'appoggio — e
  siccome pensare non costa e muoversi sì, il bubble sort qui è lento per
  la ragione vera (misurato: 488 turni contro i 144 di una selezione, su
  nove lettere al contrario; il banco guarda il risultato, quindi non è
  vietato niente). Tre pezzi di mondo e nessuna meccanica su misura: il
  cliente che chiede **una qualità** (`massimo`/`minimo`: leggerla ferma
  il robot, si capisce guardando le lettere), quello che **fa
  indovinare** (`clienti.indovina`: rimette la lettera sul bancone e dice
  «di più!»/«di meno!», che si guardano come `di-piu`/`di-meno`, fino a
  `tentativi`), e la **pila** (`figura: 'pila'`, forme di formaggio: una
  grande sopra una più piccola la schiaccia). Più il `÷` nei conti, per la
  metà della ricerca binaria. In fondo **la torre del casaro** (Hanoi),
  una scala di quattro livelli fino alla **ricorsione**, che era stata
  rimandata finché non avesse dei guardrail: la fila delle carte la fa
  vedere mentre gira («torre alta 3 › torre alta 2 › …»), senza il fermo
  il robot si ferma a `TETTO_PILA` dicendolo, e il 💡 da 50 per un
  progetto che chiama sé stesso scrive tutto tranne le chiamate
  (`pezzoDi`). Un livello la cui soluzione chiama sé stessa dichiara
  `ricorsione: true`, e il banco non la srotola (`chiamaSeStesso` in
  `motore/zaino.js`: srotolarla non finirebbe mai).
- **`docs/`** — la documentazione per chi arriva da fuori, e le immagini.

## Convenzioni

- **Il codice è in italiano**: nomi, funzioni, commenti (`colonnaAdd`,
  `guasti`, `forza`, `ripassoFraGiorni`).
- **I fine riga sono LF**, e lo tiene fermo `.gitattributes` (`* text=auto
  eol=lf`). Il repo era misto — 1124 file LF e 14 CRLF, capitati così per
  l'editor con cui erano stati scritti — e non dava nessun fastidio finché
  non si toccavano: poi uno strumento riscriveva uno di quei quattordici,
  i fine riga cambiavano tutti, e il diff diceva «1231 righe cambiate» per
  sette righe vere. Una modifica vera annegata in un file intero non si
  rilegge, e il `git log -p` di quel file smette di raccontare qualcosa.
  **Chi scrive un file con uno script se ne accorge tardi**: Python legge
  con *universal newlines* e riscrive LF, quindi la conversione avviene
  senza che nessuno l'abbia chiesta; e un `git diff` letto con `text=True`
  perde i `\r`, quindi il patch che se ne ricava non si applica più e
  `git apply` lo rifiuta senza dire perché.
- **Niente dipendenze a runtime oltre a Vue.** Suoni sintetizzati, icone
  emoji, nessun file esterno: il build deve restare un HTML unico.
- **La barra in cima è una sola** (`components/Barra.vue`): indietro sempre
  primo a sinistra, sempre `←`, unico tasto pieno. Nei test si trova con
  `button[aria-label="indietro"]`, non col carattere.
- **Un foglio si chiude con la ✕ in alto a destra, sempre visibile**
  (`giochi/fattoria/viste/Chiudi.vue`, `[data-chiudi]` nei test). La
  fattoria ne aveva undici e ognuno usciva a modo suo — «Chiudi», «Va
  bene», «Lascia stare», o solo il velo da toccare fuori — e nessuno in
  alto a destra, che è il posto dove si guarda per primo. Il tasto in
  fondo resta **solo dove è una scelta** («Lascia stare / Compra»):
  dov'era l'unica cosa da fare, lo fa la ✕. Che è `sticky`, e quello è
  il punto: in un baule da duecento voci la via d'uscita stava due
  schermate più giù.
  **E lo scorrimento è uno solo**: il foglio è una colonna (`display:
  flex`), titolo e tasti stanno fermi, e l'elenco in mezzo si stringe e
  scorre lui (`flex: 0 1 auto; min-height: 0`). Nessuno dichiara
  un'altezza: c'erano 52vh, 46vh e due 44vh, e un'altezza in `vh` è una
  misura presa a occhio su un telefono solo — su uno schermo alto lascia
  il foglio mezzo vuoto, su uno basso lo fa uscire lo stesso, perché
  44vh è l'elenco ma sopra e sotto c'è dell'altro che in vh non si
  conta. Chi non scorreva affatto sbordava dal velo, e i tasti in fondo
  diventavano irraggiungibili: cioè il foglio non si poteva chiudere.
  Un test statico (`unita/fattoria`) legge i `.vue` e pretende la ✕ da
  ogni vista che dichiara `'chiudi'` fra i suoi `emits` — è l'unico modo
  di dirlo di un foglio che ancora non esiste.
- **La pausa è una sola** (`giochi/pausa.js`, `giochi/VeloPausa.vue`). Un
  gioco a orologio si congela già da sé a pagina nascosta — il browser non
  consegna fotogrammi a una scheda che non si vede — e il guasto non è
  quello: è **la ripresa**, istantanea e senza preavviso, con la partita in
  corsa in faccia a chi ha appena riacceso il telefono. Più il fatto che
  fermarsi *volendo* non si poteva: l'unica uscita era «indietro», che nella
  corsa butta via la gara. Si aggiunge a un gioco in tre righe:

  ```js
  const { inPausa, fermo, metti, togli, aiuto } = usaPausa()
  ```
  ```html
  <Barra … pausa @pausa="metti()" @aiuto="aiuto" />
  <VeloPausa v-if="inPausa" @riprendi="togli" />
  ```

  e nel battito `if (!fermo.value) p.avanza(dt)`, al posto della somma che
  ognuno si scriveva in casa. **Non si riprende mai da soli**: tornare a
  vedere lo schermo mette in pausa e basta, si riparte al tocco (è la stessa
  scelta che Survivors aveva già fatto a mano con `inAttesa`). `fermo` non è
  `inPausa`: il primo è tutto quello che tiene ferma la partita — la pausa,
  il cartello di un traguardo, il foglio del `?`, quello che il gioco
  aggiunge con `anche:` — il secondo è solo quello che merita il velo.
  `anche:` legge dentro un `computed`, quindi **vuole roba reattiva**: i
  campi di un motore in `shallowRef` (`p.finita`, `p.inPausa`) non lo sono e
  si guardano dentro il battito. Il ⏸ compare solo dove il gioco lo chiede,
  come il `?`. **Non si mette in pausa** quello che non ha un orologio (la
  fattoria: un ⏸ lì è un tasto che non fa niente), il
  Generale (ha il suo Via/Stop, e lì fermare il tempo *è* una mossa), **il
  Dungeon** (è a turni: la stanza aspetta, e quello che c'è da fermare lì è
  un `setTimeout` — vedi la voce dopo) e la
  domanda di quiz — che è già un velo sopra il gioco, e due veli uno
  sull'altro sono un gioco rotto: lì il ⏸ sparisce dalla barra e rispondere
  *è* il tocco che riprende. Chi la monta la toglie anche in `avvia()` e
  nell'uscita alla mappa, se no la partita nuova nasce dietro un velo che
  nessuno ha chiesto. In Survivors **ha preso il posto di `inAttesa`**: il
  «tocca per ripartire» di una partita ripresa era lo stesso velo scritto a
  mano, e tenerli tutti e due voleva dire due riprese diverse per lo stesso
  gesto. Nei test i bersagli sono
  `button[aria-label="pausa"]`, `[data-pausa]` sul velo e
  `[data-azione="riprendi"]`.
- **Un gioco che non finisce dice di quanto sei migliorato**
  (`giochi/primati.js`, puro; `giochi/Festa.vue` i coriandoli;
  `giochi/Primati.vue` la tabella dei record nell'albo). La corsa
  infinita e la Sopravvivenza non danno né stelle né tappe nuove:
  l'unica cosa che hanno da dare è il confronto con sé stessi, e
  `🥇 nuovo primato!` era **la notizia senza la misura** — né il numero
  di adesso né quello di prima, così chi correva 312 metri dopo averne
  fatti 280 non leggeva da nessuna parte di averne guadagnati 32. Un
  gioco lo dichiara nel manifesto (`senzaFine: { nome, icona, misura,
  che }`, con `misura` che è una chiave di `MISURE` e **non** un'unità
  scritta a mano: se fosse libera, «sec» e «secondi» farebbero due
  tabelle) e a fine partita chiama `segnaPrimato(chiave, valore)` di
  `giochi/campagne.js`, che torna **cosa dire**. Tre cose che si
  sbagliano: **la prima partita in assoluto non batte niente** («il tuo
  primo risultato», non «hai battuto il record» — quale?), **un
  pareggio non è un record** (i coriandoli a ogni partita uguale non
  sono più una notizia) e **il record vecchio non si butta**: la corsa e
  Survivors lo tenevano in `cfg.primato`, e a ripartire da zero sarebbero
  stati proprio i due bambini che avevano giocato di più — `apriQuaderno`
  legge ancora quel posto. **Il record si legge prima di entrare**, sul
  tasto della modalità infinita nella mappa, e porta con sé com'era
  fatta quella partita («2:05 · 580 mostri · livello 6»): il gioco passa
  a `segnaPrimato` un oggetto di `dettagli` e dichiara in `senzaFine`
  la funzione che li mette in parole — solo lui sa che i suoi numeri
  sono mostri e non ondate. I dettagli sono della partita del record, e
  una partita storta non li sovrascrive. **Un gioco vecchio** (il
  castello, con le partite libere) non ha manifesto: dichiara
  `senzaFine` nella sua riga di `data/giochi.js`, e `tabellaDeiPrimati`
  guarda `GIOCHI` e non solo i nuovi. Adesso sta in `campagne[chiave].primato`,
  accanto a `stelle` (che è già «il primato di ogni tappa»): non in
  `cfg`, che sono **le scelte** del bambino e un record non si sceglie, e
  non in un campo nuovo del profilo, che un gioco non aggiunge mai. Col
  record si tengono **le ultime cinque partite**: il record da solo dice
  «il te di ieri è più bravo di te», la fila delle ultime dice che stai
  salendo — ed è quello il premio di un gioco che non finisce.
  **Un gioco può avere più sfide senza fine** (il castello ne ha
  quattro, una per terreno; gli asteroidi ne hanno una, il volo
  infinito — che è **uno**, tabelline e calcolo a mente insieme, con
  la mira che sale col livello in `store/volo.js` e **continua oltre
  il catalogo** dal livello 9 al 12 (le tabelline grandi di `GRANDI`,
  che non sono fra le 55 caselle — `eCasella` — e la taglia dei
  concetti dal livello invece che dallo SRS), col record letto
  da `best.math` con `vecchio` finché un quaderno non c'è, e la
  partita che **riparte due livelli sotto il record** invece che da
  2×3: il
  manifesto le elenca in `senzaFine.sfide` — `{ chiave, nome, icona,
  eredita? }`, con misura, `che` e `dettagli` scritti una volta in cima
  come difetti — e ogni record sta in `campagne[chiave].primati[<sfida>]`.
  **Una sola** dice `eredita: true` e si prende il `primato` di quando
  la sfida era una (la libera del bosco): la migrazione è una lettura
  in `apriQuaderno`, non una riscrittura, e `segnaPrimato` lascia
  andare il posto vecchio alla prima scrittura. `primatoDi(chiave,
  sfida)` e `segnaPrimato(…, sfida)` prendono la chiave della sfida in
  coda, `sfideDi` torna sempre un elenco, `tabellaDeiPrimati` fa una
  riga per sfida (`id` = `gioco/sfida`, ed è il `data-primato`), e dove
  c'è posto per una riga sola — la home — `recordPiuRecente` racconta
  **il record fatto più di recente**, non il più alto: quattro terreni
  non si confrontano fra loro, e quello di ieri sera è quello che il
  bambino ha in testa. Chi ha una sfida sola non cambia una riga. Il
  contratto sta in testa a `giochi/primati.js`.
- **Gli orologi che non sono fotogrammi vanno fermati a mano.** Un
  `setTimeout` scatta lo stesso a schermo spento, e `performance.now()`
  misura il tempo di parete: `quiz/Domanda.vue` annotava in `store/srs.js`
  i quaranta minuti del telefono posato con la domanda a schermo — e `it.t`
  è una media pesata al 45%, quindi un campione solo bastava a far
  risultare «ci mette venti minuti» per sempre. Si conta il tempo in cui la
  domanda era **davanti agli occhi**, col tetto di `TEMPO_MAX`, e l'attesa
  dell'esito si congela e riparte da quello che restava: quell'attesa esiste
  per essere letta.
- **I giochi sono verticali**: il manifest chiede `portrait`, e dal browser
  esce il cartello «gira il telefono» (`.gira`).
- **Chi gioca non disegna.** Una view costruisce la lista delle cose in scena
  — `{ che: 'torre', x, y, tipo, lv }` — e la passa a `tela.disegna()`.
  Aggiungere una figura è aggiungere una riga a `PITTORI`, non un `ctx.arc`
  dentro il gioco. Al contrario, in `grafica/` non entrano energia e prezzi:
  solo fatti già decisi (`potenziabile: true`).
  **Vale anche per il calendario.** La fattoria si addobba da sola a
  Halloween e a Natale (`giochi/fattoria/dati/stagioni.js`, puro:
  `stagioneDi(data)` in ora locale, `addobbiStagionali` sceglie le celle
  col seme del giorno), ma la tela non sa che giorno è: riceve
  `quadro.stagione` e la lista `{ testo, x, y }`, e disegna neve e lucine
  senza tingere niente e senza sprite nuovi. Le voci `stagione:` del
  catalogo si comprano solo nella finestra e **restano** (non sono premi
  di livello); `#stagione=natale` le accende fuori stagione.
- **Il dito si lascia dietro un click, e quel click va ingoiato.** Chi apre
  un pannello dal `pointerup` di un canvas deve sapere che subito dopo
  arriva anche un `click`, mandato a chi sta sotto il dito **in quel
  momento**: cioè al velo appena comparso, che si chiude da sé
  (`@click.self`) — o peggio a un tasto del foglio, che si preme da solo.
  Col mouse non succede, perché lì il bersaglio si decide alla pressione:
  è il motivo per cui questi guasti si vedono solo dal telefono, e solo
  qualche volta. Il rimedio sta in `giochi/fattoria/Gioco.vue`
  (`zittisciIlFantasma`), e la prova che serve è un tocco vero —
  `Input.dispatchTouchEvent` via CDP, come in `integrazione/fattoria`: un
  `page.click()` non porta nessun fantasma e non vede niente.
- **Un `v-if` che non si spegne mai non rimonta niente.** È il guasto più
  costoso trovato finora, e da fuori non somigliava affatto a quello che
  era. Chi incatena schermate uguali — `quiz/Domanda.vue`, una sola per
  sotterraneo, Dungeon, Corsa e Survivors — passa dalla domanda A alla B
  **dentro lo stesso giro di aggiornamento**: Vue non vede nessun momento
  in cui la condizione è falsa, non smonta e **riusa l'istanza**, che si
  porta dietro lo stato di prima. A schermo: la domanda nuova nasce con un
  tasto già colorato (quello dove il dito ha appena premuto) e poi il
  gioco **non va più avanti**, perché una scelta risulta già fatta. Nessun
  errore, da nessuna parte. Il rimedio sta **dentro il componente** (un
  `watch` sulla prop che rimette tutto a zero), non in un `:key` a carico
  di chi lo monta: la key va ricordata ogni volta, e infatti se l'erano
  ricordata in uno su cinque. Test: `integrazione/domanda`, che incatena
  due domande vere **nel sotterraneo** — dove la catena non dipende
  dall'azzeccare: si risponda bene o male, lo scontro va avanti e la
  domanda dopo arriva nella stessa istanza.
- **Rispondere prima di aver letto costa tempo, non roba.**
  `nucleo/domanda.js` (`tempoDiLettura`, `troppoDiFretta`) misura quanto
  ci vuole a leggere *quella* domanda — consegna più risposte, ~1,7 s
  per una tabellina, 3,8 s per un problema — e `Domanda.vue` allunga di
  un secondo e mezzo l'attesa di chi sbaglia più in fretta di così,
  dicendolo («🐢 Troppo di fretta»). Una soglia fissa direbbe «hai
  tirato a caso» a chi le tabelline le sa. La penalità è il tempo e non
  vita o monete: quelle punirebbero anche chi è svelto e sa, e
  insegnerebbero che rispondere è pericoloso. **E dopo ogni sbaglio si sta
  fermi almeno quattro secondi** (`PONDERA`), fretta o no: è lì che
  compare la spiegazione, e il `respiro` che i giochi passano è tarato
  sul ritmo della partita — 900 ms nel sotterraneo, cioè la spiegazione
  spariva prima di poterla leggere. È un pavimento, non un'aggiunta:
  chi aspettava già di più continua ad aspettare quello.
  **E il pavimento cresce con quello che c'è da leggere**
  (`attesaDellEsito`): quattro secondi erano tarati su una riga sola, e
  le righe sono due — un quarto di secondo a parola, che è lo stesso
  numero detto due volte (quattro secondi diviso un quarto fanno sedici
  parole, cioè quella riga lì). Il tetto è `LEGGERE_MAX`, sette secondi,
  perché le spiegazioni lunghe esistono e una schermata ferma più di
  così non si guarda più. **Il totale con la fretta non passa mai i
  dieci secondi** (`TETTO`, la soglia che `quiz/fretta.js` dichiarava e
  che adesso è scritta una volta sola): a spiegazione lunga si accorcia
  la penalità, mai il tempo per leggere.
  **La penalità cresce con l'insistenza** (`quiz/fretta.js`): 5,5 · 7 ·
  9 · 10 secondi e poi 10 fisso, perché una penalità fissa sopra quel
  pavimento non si sentiva — 4,0 contro 5,5 non si distingue, ed è stato
  provato. Il primo scatto è piccolo (un tocco affrettato non è una
  colpa), gli ultimi grossi (a quel punto non è un caso). **Per uscirne
  servono quattro risposte giuste**, e qui sì che si chiede di
  azzeccare: non è una misura sul sapere, è l'uscita da una penalità, e
  dev'essere una cosa che tirando a caso non capita per sbaglio.
  Il contatore vive **in un modulo e non nel componente**, che si
  rimonta a ogni domanda e ripartirebbe da zero ogni volta. Vale per i quattro giochi
  che passano da `Domanda.vue`; nei giochi vecchi (`views/`) il tiro a
  caso costa già altro — negli asteroidi una vita, nelle lingue
  un'attesa e la serie azzerata.
- **Dopo uno sbaglio si dice il perché E come si fa**, non uno dei due.
  Sono due mestieri: il `perche` di una risposta diagnostica *quella
  scelta lì* («hai guardato solo l'ultima cifra»), l'`aiuto` della
  domanda insegna *il metodo* («47 sta fra 40 e 50: l'ultima cifra è 7,
  quindi si va su») ed è l'unica delle due che serve anche la volta
  dopo. Era un `||` — il primo dei due che ci fosse — e siccome i moduli
  scritti bene danno un `perche` a ogni risposta falsa, l'insegnamento
  non è mai arrivato a nessuno: a schermo compariva sempre qualcosa,
  nessun errore da nessuna parte, e il difetto è vissuto per mesi. Chi
  decide sta in `nucleo/domanda.js` (`spiegazioneDi`), puro, e a schermo
  vanno su **due righe che si distinguono a occhio** — «Si fa così» in un
  riquadro suo: in un paragrafo unico il metodo finisce in coda alla
  correzione. È il motivo per cui una domanda su un concetto che il
  bambino non ha ancora fatto **non si toglie**: se la si può spiegare
  in una riga, sbagliarla è il momento in cui si impara. Quelle che in
  una riga non si spiegano — girare una figura a mente, contare i
  cubetti nascosti, il significato di un modo di dire — sono un altro
  discorso, e per quelle la strada è spegnerle.
- **Nessun gioco paga una risposta sbagliata.** Survivors dava una
  monetina a chi sbagliava («ci hai provato»): sembrava innocua ed era
  il buco più grosso, perché **quello che un bambino vuole sono le
  monete** — una moneta per errore è il modo più veloce di farne, e
  nella partita libera era l'unica fonte. Le monete si prendono
  arrivando in fondo a una tappa. Vedi `CALIBRAZIONE.md`: una moneta
  vale dieci secondi di esercizio, e un tasto premuto a caso non è
  esercizio.
- **Gli aiuti che sbloccano si pagano in monete, e i primi fanno
  ragionare** (`giochi/aiuti.js`). Il 💡 del Generale, di Passo passo e
  del costruttore è **una scala sola** con un tasto solo: due gradini
  **gratis** che non dicono la risposta — cosa chiede il livello e cosa
  lo rende difficile, poi la domanda giusta da farsi («visto che il
  livello chiede…») — poi gli **indizi a 🪙10**, poi i gradini che
  **scrivono nel programma** a 🪙50 · 100 · 200 (il prezzo lo decide la
  posizione: l'ultimo, la soluzione intera, costa sempre 200). Costavano
  la stella «da solo», e una stella è un prezzo che un bambino non
  sente: il 💡 diventava il modo di finire un livello senza pensarci, e
  un livello svelato è bruciato. Tre cose che si sbagliano: **il prezzo
  si dice prima**, sul tasto, e senza monete non si dà niente (nessun
  credito, nessuno sconto: se no conviene spendere tutto altrove e poi
  farsi svelare); **dai 50 in su ci vuole un secondo tocco**; e **quello
  che si è pagato resta** — nel Generale e nel costruttore i gradini
  scesi stanno nel profilo (`gen.aiuti`, `campagne[k].aiuti`, via
  `segnaAiutiPresi`) e un pezzo di programma si rimette gratis; in
  Passo passo la scala riparte a ogni ingresso perché ogni gradino
  guarda la fila di adesso. La stella «da solo» la toglie **solo la
  soluzione intera**: non è più un prezzo, è un fatto. I gradini che
  scrivono **non si scrivono a mano**: escono dalla soluzione che il
  banco gioca (`scalaDi` di ogni gioco), e `unita/aiuti` pretende che
  la soluzione svelata vinca e che un gradino più caro non tolga niente
  di quello che uno più economico aveva dato.
- **Una schermata appena comparsa non si lascia toccare subito**, e
  **l'attesa si vede.** Le due metà del contorno dello stesso guasto: dopo
  uno sbaglio si resta fermi un paio di secondi per leggere il perché, e
  due secondi muti sono indistinguibili da un tasto rotto — quindi il dito
  torna a premere; quel tocco (o il click che si lascia dietro) atterra
  sulla schermata dopo, che compare nello stesso punto. Perciò 320 ms di
  finestra cieca al montaggio, e una riga che si riempie per dire quanto
  manca.
- **Un dito non sta fermo come un mouse.** La soglia oltre cui un tocco
  diventa uno scorrimento va misurata sul dito (~16 px), non sul
  puntatore: sotto quella misura Android e iOS considerano il dito ancora
  fermo, e un gioco più severo del telefono butta via i tocchi di chi
  preme forte — cioè dei bambini.
- **Un elenco che scorre non agisce alla pressione.** Il baule della
  fattoria prendeva una voce al `pointerdown`, e col dito lo scaffale
  non si scorreva più: la strisciata partiva da una carta e se la
  portava via — comprandola — e gli spazi fra le carte non servono,
  perché il telefono sposta il tocco sull'elemento toccabile più
  vicino. Dove si scorre decide il movimento (`fattoria/viste/Roba.vue`,
  soglie in `fattoria/scena/dito.js`): fermo è un tocco, in su e in giù
  è del browser (`touch-action: pan-y`, e il `pointercancel` vuol dire
  «non è successo niente»), di lato si trascina. Lo vede solo un test
  che scorre **col dito** (`integrazione/campi`): `scrollIntoViewIfNeeded`
  scorre da programma, e il guasto non lo incontra mai.
- **Il dito non seleziona, e la regola è in un posto solo**
  (`src/style.css`). Su iPhone tenere premuto dentro un gioco accendeva
  l'evidenziazione blu e il callout «Copia»: c'era `user-select:none` e
  basta, che Safari ha imparato solo dalla 17. Servono tutte e tre —
  `-webkit-user-select`, `user-select`, `-webkit-touch-callout` — e la
  terza non è un doppione: il menù del tener-premuto esce anche dove non
  c'è testo, sui link e sulle tele. Stanno su `html,body,#app` e **non su
  `*`**, perché si eredita: con `*` ogni figlio se la riprenderebbe
  addosso e le eccezioni non arriverebbero ai loro paragrafi. Dove si deve
  poter copiare a dito si scrive `class="copiabile"` (più `input`,
  `textarea`, `[contenteditable]`, già dentro la regola) — e non si
  appende l'eccezione a una classe che c'era già: `.avviso` sembrava
  giusta e se la riprende anche il nastro delle ondate del castello, in
  mezzo a una partita. `touch-action:manipulation` su `#app` toglie solo
  lo zoom del doppio tocco: chi trascina da sé dichiara
  `touch-action:none` per conto suo, ed è più stretto.
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
  **E nella cache non entra niente di quello che passa**: quella di una
  versione la scrivono l'installazione e «cerca aggiornamenti», che la
  pagina la controlla prima di mettercela. Il `fetch` ci provava anche
  lui, con un `put` dopo ogni risposta presa dalla rete, e non ci
  riusciva quasi mai: il `clone()` arrivava quando `respondWith` si era
  già preso il corpo. Si è tolto invece di ripararlo — riparato
  riscriverebbe sette megabyte e mezzo a ogni apertura, e metterebbe la
  pagina presa dalla rete, che nessuno controlla, sopra quella che il
  tasto aveva controllato — e `integrazione/aggiornamento` (passo 10)
  guarda che resti tolto.
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
- **I regali stanno nella partita libera, e solo lì** (`REGALI`,
  `OGNI_REGALO`, `doniDi` in `data/castello.js`; i gradi presi in
  `profile.campagne.torri.regali`, scritti da `regaloPreso` in
  `giochi/campagne.js`). Ogni cinque ondate della libera si sceglie un
  potenziamento fra tre carte e **resta per sempre**, riprendibile
  quante volte si vuole: senza, quella modalità cedeva sempre
  all'ondata venti — la difesa è già in cima alla scaletta e la vita
  sale del 45% a ondata — e un record che non si muove nessuno lo
  guarda. **Nella campagna non si applicano**: la tappa deve
  dichiararli (`regali: true`, ce l'hanno solo le quattro `LIBERE`) e
  il motore ignora quelli che gli arrivano per una tappa che non li
  prevede,
  perché la campagna è tarata ondata per ondata e un bonus che cresce
  col giocare renderebbe la promessa dei `calcoli` una cosa che dipende
  da quante partite libere si sono fatte. Zero regali è il gioco di
  ieri bit per bit (moltiplicatori a 1, somme a 0), e `npm run tara`
  tara le libere con `regali: false`: quello che si tara è il
  pavimento. **I gradi presi sono uno per il castello, non uno per
  terreno**: un regalo preso nel bosco vale anche sulle mura.
  **Le partite libere sono quattro, una per terreno** (`LIBERE` in
  `data/castello.js`, tracciati in `LIBERE_RACCONTO` di
  `campagne-castello.js`, chiavi stabili `libera-bosco`… che sono le
  chiavi di `VITE`, di `OLTRE` e dei record). Ognuna eredita mostri,
  torri e rami dalla sua campagna, ha due bocche che si fondono — tranne
  il bastione, che è **un anello vero**: una bocca sola e una strada che
  si attraversa da sé, dichiarato con `incroci: 1` (il motore non lo sa,
  un nemico ha un `d` scalare; lo sa `strumenti/valida-percorsi.mjs`,
  che conta gli incroci e li vuole netti, e `sbroglia()` in
  `percorso.js`, che scosta le piazzole anche a strada singola) — e si
  tara da sola: la tabella di venti ondate e il passo `oltre`, che
  esce da una retta sui logaritmi dei limiti della seconda metà con
  un **pavimento a 1,3** — la media dei rapporti della coda spianata
  diceva ×3,9, un muro alla ventunesima che nessun regalo avrebbe
  comprato, e il passo misurato nudo (×1,1–1,16) non chiude più la
  partita entro un'ora: il pavimento è il patto della modalità, non
  una misura. **Il gioco gioca la libera come la taratura**:
  `ONDATE_TARATE` (20) dice al motore da quando le ondate arrivano da
  tutte e due le bocche anche con `ondate: Infinity`, e i test la
  giocano con `Infinity` e `finoA`, mai come una campagna corta — il
  bivio giocato come campagna da dodici cedeva alla sesta. La vecchia
  nota «la libera è a strada singola perché con due bocche è
  intarabile» era una paura: adesso si misura, e `unita/castello`
  dice per ciascuna dove cede. Si aprono tutte insieme a campagna
  finita, e `LIBERA` è la prima delle quattro, per i banchi che ne
  vogliono una. Nei test i bersagli sono `[data-tappa="libera-bosco"]`
  ecc. sulla mappa. **È un bonus regalato, cioè una cosa che non passa da un
  esercizio**, e la riga per cui va bene è che le ondate che l'hanno
  fatto arrivare fin lì erano tutte pagate in operazioni in colonna, e
  che il regalo non si spende — non compra monete e non apre tappe
  (vedi `CALIBRAZIONE.md`). Dimensionare un regalo **si misura**, non si
  stima: il banco sta in `unita/regali-castello`, e due voci sono già
  state provate e tolte — «+1 cuore» non sposta niente (l'ondata che
  ferma la partita ne fa passare ventotto) e «+⚡ per nemico fermato»
  sposta tutto (al muro il metro è a corto di soldi, non di potenza:
  bastava +2,5% per saltare tre ondate).
- **I nomi dei bambini non stanno nel codice.** Il roster è un dato
  (`state.giocatori`), la migrazione enumera le chiavi `profilo:*` invece di
  cercare un nome. Se una modifica sembra chiedere una stringa col nome di un
  bambino, la soluzione è enumerare.
- **Gli id dei contenuti non si rinominano** (`en:dog`, `math:7x8`,
  `frase:…`): sono le chiavi dello stato SRS, e cambiarli fa tornare una
  parola «mai vista».
- **Togliere un gioco non abbassa il livello.** Il livello è la somma
  dell'esperienza di tutti i giochi ed è il moltiplicatore delle monete:
  un gioco che se ne va lascia la sua riga in `XP_AREA`, letta da
  contatori che nessuno fa più salire, e quello che «Tuttofare» contava
  resta nel conto. La cameretta se n'è andata così, salvataggi compresi
  (`sgomberaLaCameretta` in `store/profile.js`): prima di cancellare le
  collezioni se ne contano gli elementi in `totals`, e le sue medaglie
  sono uscite dall'albo senza portarsi via l'esperienza che avevano dato.
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
   e un gioco che l'elenco non nomina **vale quello che la partenza di
   quell'età scriverebbe oggi** (`spentoDallEta` in
   `data/portata-giochi.js`, e il quadro fa la stessa lettura): un gioco
   nuovo arriva come dice l'età anche a chi ha il profilo di ieri, e uno
   che il bambino ha già aperto non sparisce. Era il contrario — l'assenza
   voleva dire acceso — e due bambini della stessa età avevano due home
   diverse secondo il giorno in cui erano nati.
   Da qui si dice anche il contrario: `{ dungeon: true }` lo **tiene in
   casa contro l'età** (`fissaGioco`), e la home lo rispetta
   (`giocoForzato` vince su `giocoDaVedere`). Si sceglie dalla ✎ della
   sua riga nel quadro, non più da una fila di interruttori.
2. **Un pezzo di scuola** (`settings.sa`, `data/saperi.js`) — spariscono le
   *domande* che lo danno per scontato, in tutti i giochi. Chi dichiara di
   averne bisogno è **chi fa la domanda** (un modulo di quiz lo dichiara nei
   suoi `tipi`), non un elenco da tenere allineato a mano. I giochi degradano
   invece di sbarrare.
   **Anche un gioco può dichiarare**, con `chiede:` nel manifesto
   (`data/giochi.js`): il castello chiede moltiplicazioni e divisioni e non
   passa da `src/quiz/`, quindi senza quella riga la sua impostazione
   esisteva e non aveva **nessuna schermata da cui toccarla** — è il guasto
   che ha fatto nascere il campo, e un sapere che nessuno cita (né modulo né
   gioco) adesso è rosso in `unita/saperi`. `chiede` non è `serve`:
   `serve` spegne la carta in home, `chiede` toglie solo delle domande.
   **`settings.sa` accetta due specie di chiavi**: un gruppo di
   `saperi.js` (`solidi`) e la singola tipologia di un modulo
   (`geo:viste`) — e anche una fascia di `data/partenze.js` può spegnere
   a sottovoci, che è il modo di togliere le viste dall'alto senza
   portarsi via i nomi dei solidi.
   **Il criterio per decidere sta in testa a `data/partenze.js`, e non è
   la difficoltà**: si spegne quello che **non si può insegnare in una
   carta** — girare una figura a mente, i cubetti nascosti. Quello che si
   può insegnare resta acceso, e si insegna nella risposta (vedi la
   convenzione «perché *e* come si fa»). Ogni fascia deve dare un verdetto
   su ogni pezzo di scuola, acceso o spento, nel campo `tiene:`: il guasto
   di prima non era una riga sbagliata, era una riga **mai scritta** —
   `stima`, `solidi` e `spazio-mente` erano rimasti accesi per omissione,
   e nessuno dei cento test poteva vederlo.
3. **I giochi in prova** (`settings.sperimentali`) — un flag solo per tutti
   quelli taggati `sperimentale: true`, che senza non esistono affatto.
**Ce n'era un quarto, e non si rifà.** `settings.varianti`
(`varianteAccesa`/`accendiVariante`) spegneva *un modo di giocare dentro un
gioco*: non un gioco, non un pezzo di scuola, ma metà di un gioco. L'unica
voce che ha mai avuto era `asteroidi:mente` — via le tappe di calcolo a
mente, restano i pianeti — e sembrava innocua: la carta in home non si
muoveva, i progressi restavano dove erano. Era invece il modo di rimettere
in piedi le **due metà** che la fila unica degli asteroidi esiste per
togliere (vedi `src/data/asteroidi.js`), e un gioco che a seconda di un flag
ne è uno o due è due giochi. Si portava dietro una fila filtrata, una
seconda numerazione, un `menteAccesa` sparso in quattro file e un contatore
che scavalcava le stazioni saltate — un mese a interruttore spento e mezza
scaletta risultava passata senza essere stata giocata. Il meccanismo
generico non è rimasto senza voci: è stato tolto, perché un interruttore che
non accende niente è codice che qualcuno rimetterà in uso senza rifarsi la
domanda. Chi vuole meno moltiplicazioni lo dice dove si dicono queste cose —
l'età, o il pezzo di scuola nel quadro — che valgono per tutti i giochi
insieme e non per metà di uno.

Nei test i bersagli sono `.carta.gioco[data-gioco="…"]`,
`.carta[data-flag="…"]`, `.carta[data-azione="…"]`.

### Da dove parte un bambino, e la manopola dell'età

**Una manopola sola, in anni** (`components/eta/Manopola.vue`, con i
suoi pezzi nella stessa cartella: `Tacca.vue` è il `◀ 8 anni e mezzo ▶`,
`Conferma.vue` il cartello che applica, `bozza.js` il numero che si
muove senza toccare il profilo, `Blocco.vue` e `Riga.vue` il quadro).
**Un componente solo in tutti i posti dove si sceglie un'età**: il
primo avvio, la carta del bambino e la scheda delle domande — dove
c'era una terza tacca, disegnata `− +` invece che `◀ ▶`, e che scriveva
`settings.eta` e nient'altro: da lì si portava un bambino da quattro a
dieci anni lasciandogli in casa i giochi di quattro, e niente lo
diceva. Gli anni
sono l'unità vera di tutto il sistema — 12,5 punti per anno, la stessa
scala di `portata` e dei `livelli:` delle domande — e da lì dipendono
tre cose: quali giochi si vedono, cosa si dà per scontato, fin dove
pescano le domande. Le quattro fasce di `data/partenze.js` (non va a
scuola · prima o seconda · terza · quarta o quinta) restano, ma sono
**una conseguenza**: `partenzaPerEta` prende la più vicina.

Ce n'erano due, ed è il difetto da non rifare. Sulla stessa carta
stavano un `− 7,5 anni +` che spostava solo l'età e, dieci pixel sotto,
un «Rimetti giochi e domande» che apriva le quattro carte e riscriveva
tutto — giochi, saperi, ritocchi — senza che niente, a guardarle,
dicesse quale fosse quale. Il difetto vero però era un altro, e le
carte lo nascondevano: **la tacca non diceva cosa fa.** «Terza
elementare» dice a chi è rivolta la scelta, mai cosa cambia
facendola, e l'effetto si vedeva solo uscendo e guardando altrove.

Adesso sotto la manopola c'è **il quadro di quell'età**
(`data/quadro.js`, puro, `test/unita/quadro`): **blocchi tutti della
stessa forma** — titolo, quanti sono, cosa vuol dire, l'assaggio — che
si aprono toccandoli in qualunque punto. Un blocco vuoto non si mostra,
e sotto i sei anni i quattro delle domande diventano una riga sola.

  1. **In casa** — tutti i giochi, ognuno col suo stato: *c'è* ·
     *l'ha già passato* · *arriva più avanti* · *l'hai spento tu*.
  2–5. **Le domande**, nei quattro livelli di padronanza rispetto a
     *questo* bambino: *queste le sa fare* · *sta imparando queste* ·
     *difficili, ma ce la può fare* · *superfluo chiedergliele*. Il
     quinto — impossibili — non si mostra, perché non gli arrivano.

**Dentro un blocco ci sono i pezzi di scuola, e sotto ognuno le sue
domande di quella fascia.** Lo stesso pezzo può stare in due blocchi, ed
è il punto: le figure piane sono roba che sa già fare per due domande e
roba tosta per una terza. C'era un sesto blocco, «dà per scontato che
sappia», fatto di **gruppi** mentre gli altri erano fatti di **classi**:
due unità di misura per la stessa roba, e nessuna delle due diceva
l'altra — guardando «Le figure piane» fra le cose date per scontate non
si sapeva se volesse dire i nomi delle figure o gli angoli ottusi, e
guardando «Contare lati e vertici» fra quelle che sta imparando non si
sapeva che pezzo di scuola fosse. Adesso l'unità è una sola, e la scala
pure: **quella che esiste già** (`FASCE_ETA` in `quiz/nucleo/catalogo.js`),
non una seconda inventata per l'occasione.

**Tutto si apre a due livelli**, e serve: a otto anni «sta imparando»
sono cinquantasette domande in venti pezzi di scuola, e mostrarle tutte
insieme non è un elenco, è un muro. Aperto il blocco si vedono i pezzi;
aperto un pezzo, le sue domande, ognuna **con l'età a cui serve** — che
è la sola cosa che un grande può giudicare guardandola, mentre il nome
del modulo ripeteva quasi sempre quello del pezzo.

**Il ▶ c'è su tutte e due le righe e non pesca mai fuori.** Su una
domanda apre quella; su un pezzo di scuola **scorre le sue domande di
quella fascia** (`giro` di `quiz/Prova.vue`) e nient'altro — se pescasse
nel gruppo intero, il ▶ della riga «sta imparando» aprirebbe anche le
toste, e il riquadro direbbe una cosa mentre il tasto ne apre un'altra.
Succedeva: a quattro anni «i numeri e le quantità» apriva una domanda
dichiarata otto anni e mezzo.

**La forma sta in due componenti** (`components/eta/Blocco.vue` e
`Riga.vue`) e non più in cinque copie scritte a mano dentro la
manopola: era così che due blocchi erano finiti diversi dagli
altri senza che nessuno l'avesse deciso — uno con l'icona e l'altro no,
uno col sottotitolo e l'altro no.

**Il gruppo di una domanda è il più specifico che dichiara**, con la
stessa regola della scheda delle domande (`quiz/catalogo.js`): una
conversione di pesi sta sotto «Metri, litri e chili» e sotto «Le
conversioni», e quello che il grande ha in mente è quasi sempre il più
stretto, cioè quello che tiene meno domande.

**E se in casa non c'è nessun gioco che le chieda, le domande non si
elencano affatto.** Da quattro a cinque anni e mezzo i giochi accesi
sono quattro — Conta gli animali, Prima e dopo, Passo passo, la
fattoria — e nessuno pesca dai moduli di quiz: i quattro blocchi
elencavano lo stesso undici classi col tastino per provarle, e un
grande le leggeva come «ecco cosa gli chiederemo». Al loro posto una
riga sola, che dice anche da quando cambia («arrivano a 6 anni, con
Survivors, il Dungeon e il sotterraneo»). Chi le chiede lo dichiara
nel manifesto con `quiz: true` — non «fa domande», che le fa anche
Conta gli animali, ma **passa da `src/quiz/`**.

**Non c'è nessuna riga che dice cosa è cambiato**, ed era la prima cosa
che si era scritta. «＋ arriva La bancarella» raccontava il movimento a
chi stava già guardando la manopola muoversi, da fermo non diceva
niente, e metteva in fila due modi di dire la stessa cosa — «arriva la
bancarella» sopra un elenco in cui la bancarella era già lì con scritto
«c'è». I blocchi descrivono **come stanno le cose**, e il movimento si
vede perché si muovono loro.

Il quadro non decide niente: chiama le stesse funzioni che chiamano i
giochi (`giocoDaOffrire`, `doveCadeCon`), perché un riassunto che
diverge dal gioco è peggio di nessun riassunto.

**Il verso positivo non è gentilezza, è l'unico che funziona.** Il
blocco diceva «a scuola non l'ha ancora fatto», e per leggerlo un
grande doveva ricostruire per differenza le altre trenta cose, che non
erano scritte da nessuna parte. Girato in «dà per scontato che sappia»
si scorre e ci si ferma appena si legge dentro qualcosa che il bambino
non sa — ed è così che si è scoperto che la partenza dei quattro anni
dava per scontato *leggere le parole*, *la simmetria* e *le analogie*:
l'elenco era stato scritto pensando alla matematica di scuola, e tutto
il resto era rimasto acceso per omissione.

**Muovere non è applicare, ed è la stessa regola nei tre posti.** La
tacca muove una **bozza**: il quadro sotto diventa l'anteprima di
quell'età, e si scrive premendo «Applica» nel cartello che resta
**appiccicato in fondo allo schermo** finché la bozza è diversa. Prima
la carta del bambino scriveva a ogni tacca, e quando lo spostamento
cambiava fascia con delle scelte fatte a mano da difendere si fermava
ad aspettare una conferma che compariva **in coda alla colonna**, sotto
un quadro alto due schermate: da sopra si vedeva solo una freccia che
smetteva di rispondere — si premeva tre volte e non succedeva niente.
Un cartello che non si vede non è una conferma, è un tasto rotto. In
più adesso attraversare tre fasce è **una scrittura sola** invece di
sei.

I tre casi dello spostamento stanno in `spostandoLEta`, che è **la
stessa funzione** che poi scrive (`spostaLEta` in `store/profile.js`) e
la stessa che calcola l'anteprima — se il riassunto se lo rifacesse per
conto suo direbbe una cosa e il salvataggio ne farebbe un'altra:

- **stessa fascia** — si sposta l'età e basta. Il cartello lo dice («si
  sposta solo la mira delle domande»), perché senza quella riga
  «Applica» sembrerebbe pericoloso quanto l'altro caso: quello che un
  grande ha sistemato a mano resta dov'era.
- **fascia diversa, ma era sui difetti** — si riscrive, e non c'è
  niente di suo da perdere.
- **fascia diversa, e c'era roba a mano** — il cartello conta *cosa* si
  perde (`mossa.perde`: giochi, saperi, domande ritoccate), perché «2
  giochi messi a mano, 1 domanda ritoccata» è una domanda a cui si può
  rispondere e «sei sicuro?» no.

### Correggere una riga: la ✎, e il tasto che rimette tutto

L'età è la manopola grossa. Dentro il quadro **ogni riga ha la sua ✎**,
che è la correzione piccola — «le stagioni le davamo per sapute, e a
scuola sono indietro di mezzo anno». A riga chiusa i tasti sono due, ✎
e ▶, e **una riga messa a mano resta ambra** anche a tacca chiusa: il
contatore dice quante, il colore dice quali.

**Su un pezzo di scuola e su una domanda** (`components/eta/Taratura.vue`)
la tacca è in **mezzi anni**, non in blocchi, ed è misurato: per un
bambino di otto anni i blocchi sono larghi 2,5 · 1,5 · 1,5 anni, quindi
saltarne uno sono quattro gradini — due anni, mentre la correzione vera
è un semestre. I nomi dei blocchi restano come **etichetta** (dove va a
finire, `components/eta/gruppi.js`, gli stessi che il quadro scrive
sopra i blocchi), e sotto c'è lo scarto: «mezzo anno più difficile ·
vale otto anni». Sette scatti, tre per parte, col cerchietto vuoto sulla
taratura di casa; su un pezzo di scuola c'è **l'ottavo, oltre una
tacchetta**: «Non ancora spiegate», che non è un ritocco ma
`settings.sa` — ed è la frase che stava già scritta in `profile.js`
(«oltre un anno e mezzo non si sta più ritoccando una taratura, si sta
dicendo un'altra cosa»). Su una domanda quello scatto non c'è: una
domanda non ha un gruppo da spegnere, ed era il ✕ che, standosene sulla
sua riga, ne toglieva otto.

**Su un gioco** (`components/eta/InCasa.vue`) la tacca non sposta niente
di mezzo anno: sceglie **chi decide** — «Non ce l'ha» · «Come dice
l'età» · «Ce l'ha». La terza è nuova nel dato: `settings.giochi[k] ===
true` non si scriveva mai (acceso era l'assenza) e adesso vuol dire
*tienilo comunque*, scavalcando la portata — non i saperi spenti, che
non sono una questione di età ma di domande da indovinare. La posizione
di mezzo è il ripristino di una riga sola.

**Il paragone è l'atteso, non «nessuna eccezione»**, ed è il difetto da
non rifare: le partenze *scrivono* delle eccezioni (a nove anni «Prima e
dopo» nasce spento, è `nientePiccoli`), quindi confrontando con un
profilo vuoto quelle righe risultavano **messe a mano** da un grande che
non aveva toccato niente — ambra addosso, e il tasto «rimetti tutto» che
non riusciva a toglierla, perché rimettere scriveva esattamente quelle
eccezioni lì. `aMano` e la posizione della tacca si misurano su
`eccezioniPerEta(eta)`, e `fissaGioco(k, 'difetto')` scrive l'eccezione
attesa invece di cancellare: se no «rimetti questa riga» e «rimetti
tutto» lascerebbero due profili diversi. **Vale per le tre specie di
riga** — i giochi, i pezzi di scuola dei blocchi (`manoSu` in
`data/quadro.js`, e la «casa» di `eta/Taratura.vue` è l'ultimo scatto
quando l'età li spegne) e quelli appesi a un gioco — **e per il conto
del tasto** (`messeAMano` in `data/partenze.js`): il contatore dice
quante, il colore dice quali, e `unita/quadro` pretende che siano le
stesse. Con un'asimmetria voluta: per un gioco l'assenza vale quello
che l'età scriverebbe (un profilo nato prima di quel gioco non ha
detto niente), per un pezzo di scuola è la mano stessa, perché
riaccenderlo cancella la voce.

**E in fondo al quadro c'è il tasto che rimette tutto ai valori di
quell'età** (`rimettendoLEta` in `data/partenze.js`, `rimettiAiDifetti`
in `store/profile.js`): non tocca l'età e non tocca i progressi, e si
mostra solo se c'è qualcosa di suo da buttare — dicendo *cosa*, con la
stessa frase del cartello dell'età (`perdeInParole`). Senza, l'unico
modo di tornare indietro era spostare l'età avanti e indietro finché non
cambiava fascia.

**Il ritocco non si fa mentre l'età è in sospeso**: cambiando fascia
`spostandoLEta` porta via tutti i ritocchi, quindi la ✎ sparisce finché
la bozza è diversa. Prima si decide l'età, poi si correggono le
eccezioni.

Nei test i bersagli sono `[data-manopola]`, `[data-eta="su"|"giu"]`,
`[data-eta-ora]`, `[data-conferma="eta"]` col suo `[data-perde]`, i
due tasti `[data-azione="eta-applica"|"eta-annulla"]`, e per le
correzioni `[data-tara-apri="<chiave>"]`, `[data-taratura]` coi suoi
`[data-tara="giu"|"su"|"applica"|"lascia"|"rimetti"]`, `[data-in-casa]`
coi `[data-gioco-tara=…]`, e `[data-azione="rimetti-difetti"]` con
`[data-perde-tutto]`. Un pezzo di scuola appeso a un gioco — quello che
il gioco `chiede:` — ha la sua tacca a tre posizioni (`eta/Scuola.vue`,
la stessa `eta/Tre.vue` di `InCasa.vue` e non quella dei mezzi anni,
perché lì non c'è una taratura da spostare ma un sì/no):
`[data-sapere-tara="<chiave>"]`,
`[data-sapere-tara-verso="giu"|"su"|"applica"|"lascia"]`,
`[data-sapere-ora]`. **Un estremo è sempre chiuso**: un sapere ha due
stati veri nel profilo e il terzo è l'assenza, quindi l'estremo che
coincide col difetto dell'età scriverebbe lo stesso profilo della
posizione di mezzo e la riga tornerebbe indietro subito dopo.

Si chiede **al primo avvio e ogni volta che si aggiunge un bambino**:
`components/Benvenuto.vue` è un wizard solo per tutti e due i casi, e
finisce **entrando in partita col bambino nuovo**. La manopola nasce sui
**quattro anni**, in fondo alla scala: chi aggiunge un bambino aggiunge
quasi sempre il più piccolo di casa, e da lì si sale finché l'elenco di
quello che si dà per scontato non comincia a dire cose che non sa. La
cautela di prima — nessun valore, tasto spento finché non si muove —
non serve più, perché premere senza leggere adesso sbaglia **dalla
parte giusta**: si consegna la casa più piccola e la taratura più
prudente. Con un valore in mezzo no, e quello era il difetto di
partenza.

Quali giochi tenere lo dicono i manifesti, e sono **quattro** dichiarazioni:
`piccoli: true` e `grandi: true` sono le due estremità della scala,
`posto: true` è chi sulla scala non ci sta affatto (la fattoria: un
prato dove si spende, non una fila da macinare) e non si spegne mai per
età, in nessuna delle due direzioni, e `cresce: true` accanto a `piccoli`
è chi comincia dai piccoli e non finisce lì (Passo passo, che dopo le
buche ha i cicli): si accende coi piccoli e le partenze dei grandi non
lo spengono — fin dove arriva lo dice la portata. Nessun elenco da
mantenere a mano.

**La portata non sostituisce `piccoli`, ed è misurato.** Verrebbe da
pensare che un grado di difficoltà 0–100 basti a decidere chi vede
cosa; non basta, perché `restaQualcosa` chiede se esiste *una* tappa
nella mira (±1/1,5 anni) e una campagna lunga ne ha sempre una. Senza i
flag, a cinque anni comparirebbero English, Spagnolo, gli Asteroidi, il
Dungeon e Survivors. Il motivo è che sono **due assi**: la portata dice
quanto è difficile il contenuto, `piccoli` dice *non chiede di leggere
e non si può perdere* — e «dog» è contenuto facile che a cinque anni
non si sa leggere. Nell'altro verso invece la portata basta quasi
sempre: sopra i sette anni «Conta gli animali» sparisce da sé.

### Quanto è difficile una tappa, e a chi si offre

**Le domande di quiz avevano una scala, le campagne no.** Un modulo di
quiz dichiara `livelli:` (uno per grado) e da lì si sa a chi arriva; una
campagna era una fila sola per tutti, e chi arrivava grande si macinava
le prime tappe per delle sere. Il caso che ha fatto nascere questo:
**a nove anni «2×2» non ha senso, a sei «7×8» nemmeno, a otto vanno bene
tutti e due.**

Adesso ogni tappa di ogni campagna porta **`portata`**, un numero sulla
stessa scala 0–100 delle domande (0 = quattro anni, 100 = dodici, 12,5
punti per anno). Il conto sta in `src/data/portata.js` e il ponte con i
giochi in `src/data/portata-giochi.js`; `test/unita/portata` li tiene
fermi.

**Si chiama `portata` e non `livello` perché `livello` era già preso** —
una tappa del Dungeon ce l'ha da sempre e vuol dire la potenza a cui si
scende (`giochi/dungeon/motore/corsa.js`). Scriverci sopra un numero
0–100 non dava nessun errore: rendeva solo i mostri imbattibili. Un nome
nuovo si cerca **anche nei motori**, non solo nei dati.

**La larghezza è la mira, non l'ammissione**, e non è la stessa scelta
dei quiz. Di là il taglio netto è ammorbidito da `pesoDi` — una classe a
tre anni dal bersaglio pesa il 2%, esiste ma capita di rado — e per
questo l'ammissione può permettersi di essere larga. In una campagna
quella campana non c'è: c'è una fila che si macina tutta, e non esiste
un «2% delle volte». Con l'ammissione (a nove anni `[18,5–87,5]`) la
tabellina del 2, che sta a 40, resterebbe dentro: il difetto di partenza,
intatto.

**Nessuna tappa esce mai dalla fila.** Cambia solo il cancello:
`PASSATA` (sotto: nasce già aperta, «l'hai già passato» invece di «non
ce l'hai»), `IN_PORTATA`, `AVANTI` (sopra: chiusa, e il cartello dice che
arriva più avanti — non «campagna finita», che sarebbe una bugia). Non è
gentilezza: `profile.campagne[<chiave>]` è **un indice**, e una fila che
si accorcia in testa sposta l'avanzamento di tutti senza che scatti
niente.

**Un gioco può aprirsi per merito** (`perMerito: true` nel manifesto,
`data/portata-giochi.js`): lì `AVANTI` non ferma chi ci arriva vincendo la
tappa prima — ogni tappa è il passo dopo di quella che ha appena salito da
solo, e averla vinta è la prova che ci arriva. L'età resta quello che
decide se la carta si offre in home. Per ora lo dice solo il costruttore
(a nove anni si fermava alla piramide): se valga per tutti i giochi è una
domanda aperta, e nei giochi di scuola la risposta non è ovvia — una tappa
lì è anche un pezzo di programma che il bambino non ha ancora fatto.

**La testa si taglia solo a quello che la scuola ha già dato.** `2×2` a
nove anni è tempo perso; `dog` a dieci anni no — nessuna scuola gliel'ha
data e il gioco è l'unica fonte. Il confine è `scuola: '<chiave di
data/saperi.js>'` sulla tappa: chi non lo dichiara non si taglia mai in
testa. E siccome i saperi si spengono per bambino, **un sapere spento fa
tornare la testa**: se un grande ha tolto le moltiplicazioni, quelle
tappe servono di nuovo.

**Un gioco cominciato non sparisce mai.** La portata decide *cosa si
offre a chi arriva*, non cosa si toglie a chi c'è già: `giaProvato()` lo
legge da `albo.provato`, che era già nei manifesti per il traguardo
«Tuttofare». Un gioco che c'era e un giorno non c'è più è peggio di un
gioco che non serve.

**`piccoli`/`grandi` NON si derivano dalla portata**, ed è stato provato:
sono due assi diversi. La portata dice *quanto è difficile*; `piccoli`
dice *non chiede di leggere e non si può perdere*. Un bambino di cinque
anni sta dentro la portata di Survivors — schivare si sa fare — ma
Survivors si perde. I due meccanismi si affiancano: le partenze
scrivono alla creazione (e per un gioco che il profilo non nomina si
rileggono all'età di oggi), la portata filtra in continuo, e non si
contraddicono.

Fuori dal giudizio restano i giochi **senza campagna** — oggi la
fattoria: sono posti, non scalette, e l'assenza vuol dire «non si
giudica», non «si nasconde». La stessa cosa va detta **anche alle
partenze**, che ragionano per bandierine e non per portata: `posto:
true` nel manifesto (vedi sopra), se no il prato sparirebbe a un
bambino di quattro anni per il solo fatto di non essersi dichiarato
`piccoli` — e dichiararsi `piccoli` lo farebbe sparire a quello di
nove.

### Il codice dei genitori

`store/pin.js`: quattro cifre, di partenza `0000`. Sta nell'archivio accanto
a `ultimo-giocatore` e **non dentro i profili** — è di casa, non di un
bambino. Si rimette dall'indirizzo con `#pin=1234`, dove stanno già i cheat
delle monete (`#monete=500`) e del livello della fattoria (`#fattoria=9`, che
alza e non fa mai scendere: serve a guardare col telefono una cosa che
arriverebbe dopo tremila monete spese) e della stagione della fattoria
(`#stagione=natale|halloween`, per vedere la neve a settembre). E
`#fattoria-tipo=30`, che mette al posto della fattoria del bambino attivo
una **già giocata** di quel livello (`giochi/fattoria/motore/tipo.js`,
costruita col motore e non scritta a mano) dopo averne messo il profilo nel
cestino: si usa con un bambino di prova, perché sul server di casa quella
che si butta è vera. I cheat si sommano (`#fattoria-tipo=30&monete=2000`):
quello delle monete toglie dall'indirizzo solo il suo pezzo. **Stanno tutti
in `#admin`** (`views/AdminView.vue`), una pagina senza codice e senza
carta in home, un tasto per cheat: i tasti scrivono l'indirizzo e portano
dove il cheat si legge, quindi un cheat nuovo si aggiunge lì con una riga —
se no torna a essere una cosa da ricordare a memoria.

**La porta non si nasconde, si rende noiosa.** In home è un tasto piatto
nel piede — «⚙︎ Impostazioni · giochi visibili, chi gioca, salvataggio dei
progressi» — e non più una carta col lucchetto in mezzo ai giochi: un
lucchetto fra undici giochi non dice «chiuso», dice «qui c'è un tesoro»,
e «per i grandi» è una proibizione, cioè pubblicità. Nasconderla del tutto
era già stato provato e non funziona al contrario: chi non sa che c'è non
la trova. **E sbagliare il codice costa un'attesa** — tre secondi, poi
dieci, poi trenta, col tastierino spento e una barretta che si riempie
(`segnaSbaglio`/`attesa` in `store/pin.js`). Il conto sta nel modulo e non
in un `ref` della schermata, se no uscire e rientrare lo azzererebbe. Il
punto non era che i bambini entrassero — non è mai successo — ma che
provarci fosse gratis e desse una reazione a ogni tiro: era un minigioco
«indovina il codice», e la reazione era il premio. **Il tastierino dice
di chi è la schermata e dove si torna**: «le cambia un grande, col codice
di casa» sotto il titolo — detto a chi ha girato la maniglia sbagliata,
non come divieto — e sotto i tasti un «← Torna ai giochi» largo quanto il
tastierino, perché una freccia in cima non è una cosa da fare: se l'unica
uscita è quella, provare i numeri resta il gioco più vicino.

**Il codice si sceglie, e si può dimenticare.** Due aggiunte che stanno
in piedi solo insieme. La prima: al primo ingresso, se il codice è
ancora `0000`, un riquadro in cima invita a sceglierne uno — rimandabile,
e ricompare la volta dopo. `0000` è come non avere codice, e la riga
«cambialo» stava dentro la carta *Cambia il codice*, cioè la leggeva chi
era già venuto per cambiarlo. La seconda: sul tastierino un
**«Non ricordi il codice?»** che, rispondendo a una domanda di cultura
generale (`DOMANDA` in `store/pin.js`, quattro cifre — così è lo stesso
tastierino e la stessa attesa), rimette `0000` e fa scegliere subito
quello nuovo.

**Non è sicurezza, ed è una scelta fatta a occhi aperti.** La risposta
sta su internet e un bambino che ci arriva la trova. Tutte le
alternative sono peggio, e sono state pesate: `#pin=1234` vuole la barra
dell'indirizzo, che dentro l'app installata non esiste e che pochi
grandi userebbero; un codice lungo scritto altrove è il codice vero
scritto più in grande, e a leggerlo arriva prima il bambino; un canale
umano vuole qualcuno nel giro, e questo gioco arriva a famiglie che non
conosce nessuno; un'attesa di ventiquattro ore non ferma chi ci tiene
davvero. **Quello che regge il colpo non è la porta, è il cestino**: se
entrare non distrugge più niente, il recupero può permettersi di essere
facile. Chi entra senza titolo lascia comunque una traccia scritta — il
codice rimesso a `0000` diventa un avviso nella posta dei grandi — e da
lì è una faccenda di famiglia, non di software.

### Il cestino, e la posta dei grandi

Due cose nate insieme, per lo stesso motivo: **questo gioco lo si regala
a delle famiglie, e dopo non c'è più nessun canale** — niente server,
niente indirizzo di posta, e chi lo riceve da un'altra famiglia non lo
conosce nessuno.

**`store/cestino.js` — cancellare non è più per sempre.** Prima di
azzerare i progressi di un bambino, di eliminarlo o di ricominciare una
campagna, se ne mette da parte una copia (le ultime tre), e in fondo a
*Progressi* c'è il tasto per rimetterla. Sta **fuori dai profili** come
il codice: dentro morirebbe con quello che si sta cancellando. Chi
cancella per sbaglio non è il bambino entrato di nascosto, è il grande
stanco che tocca la carta rossa alle undici di sera — e `resetPlayer` era
l'unico danno irreversibile dell'applicazione. Rimettere **non consuma la
copia**: un ripristino sbagliato si annulla ripristinando quello giusto.
`ripristinaCestinato` rifà anche il roster, se no un profilo che nessuno
nomina è un salvataggio invisibile.

**`guide/novita.js` + `store/posta.js` — dire a un grande che è cambiato
qualcosa.** Il contenuto è dato puro; la regola che tiene corto l'elenco
è **una nota si scrive solo se il genitore potrebbe voler fare
qualcosa** — se non finisce con un tasto che porta da qualche parte, o
non riguarda i salvataggi, non è una nota. Uno sprite nuovo non lo è.

Tre cose non ovvie:

- **L'ack è un id, non una versione.** Si pubblica venti volte e
  diciannove non hanno niente da dire: legare il richiamo alla versione
  lo accenderebbe sempre, e un pallino sempre acceso non lo guarda più
  nessuno. Ricordando l'ultimo id letto, chi salta tre versioni trova le
  tre note che si è perso. Gli id non si riusano mai, nemmeno ritirando
  una nota. Al primo avvio, **se in casa non c'è nemmeno un profilo** è
  un'installazione nuova e si parte dall'ultima: nessuno riceve la storia
  del progetto in faccia.
- **Fuori dal codice va solo il segnale, mai il contenuto.** Fuori non si
  può distinguere un grande da un bambino, e un cartello con la ✕ lo
  chiude il bambino per riflesso — chiudere *è* l'ack, quindi
  l'informazione sparirebbe senza che nessuno lo sappia. Perciò un
  pallino sul tasto ⚙︎ (non si chiude, non dice niente, sopravvive al
  bambino che ci sbatte sopra) e un nastro in home **senza ✕**: l'unica
  uscita è «Ho letto» dentro, che vuole il codice.
- **Il nastro parla al bambino**, ed è l'unico dei tre che lo faccia: è
  lui che guarda la home tutti i giorni, un grande lì non entra mai da
  solo. «C'è un messaggio per la mamma o il papà — chiamali»: gli si
  chiede di fare il corriere.

`riguarda: { etaDa, etaA }` mostra una nota solo se in casa c'è un
bambino di quell'età — serve a poter dire «tuo figlio» invece di «gli
utenti». Senza nessuna età conosciuta la nota si mostra lo stesso: non
sapere non è un motivo per nascondere. La scelta è pura (`scegli`) e
provata a parte: le note cambiano, la regola no.

**Per i bambini c'è il contrario: un changelog vero**
(`guide/novita-bambini.js`, la pagina `guide/Novita.vue`). Le cose
fatte bene — il laboratorio rifatto, dieci mostri nuovi — non
arrivavano a nessuno: si entra nel gioco che si conosce, e gli altri
non si riaprono per vedere se sono cambiati. Lì la notizia è proprio
quella che la posta dei grandi scarta, e la regola è un'altra: **si
scrive se un bambino che ci va apposta se ne accorge**, in una riga,
dicendo cosa c'è adesso e non cosa si è cambiato. Tre cose la tengono
semplice:

- **l'elenco cresce e non si pota**: il tetto lo mette la pagina, che
  di ogni gioco mostra le ultime quattro (`PER_GIOCO`), quindi chi
  torna dopo un anno trova al massimo quattro righe per gioco;
- **il segno è uno per bambino** (`settings.novitaLette`, l'id più alto
  al momento di «Letto»), e un bambino nuovo nasce all'ultima — «è
  tutto nuovo», detto a chi il prima non l'ha visto, è falso. Si scrive
  in `creaGiocatore` e **non in `blank()`**, che `selectPlayer` usa per
  riempire i buchi: un bambino di ieri nascerebbe già in fondo, e le
  novità scritte per lui non le vedrebbe mai;
- **una riga su un gioco che non ha in home non gli arriva**: la
  domanda è `inCasa` di `data/portata-giochi.js`, la stessa delle carte.

Ci si arriva da un nastro in home che dice già la più fresca, e che
non ha la ✕: si spegne con «Letto», dentro. Nei test i bersagli sono
`[data-nastro="novita"]`, `[data-novita-pagina]`, `[data-novita-gioco]`,
`[data-novita]` e `[data-azione="novita-letto"]`.

**Quando si scrive una riga, e chi la scrive.** Le righe le decide il
proprietario, come le note dei grandi — ma qui chi lavora al codice
**la propone**, ed è la differenza che conta: nella posta il difetto
da evitare era parlare troppo, qui era che non scriveva nessuno, e le
cose fatte bene restavano senza che un bambino lo sapesse. Quindi alla
fine di ogni lavoro che un bambino vedrebbe — un gioco, un livello o
una modalità nuovi, un posto ridisegnato, una bestia, una cosa nuova da
comprare, una festa — nel resoconto va la riga già scritta («per i
bambini: «🐰 Alla fattoria è arrivato il coniglio» — la metto?»), e la
si aggiunge solo dopo il sì. Non si propone per un guasto riparato, una
taratura, un prezzo, le schermate dei grandi o i documenti. Due cose
da non sbagliare:

- **la riga va col lavoro che racconta, mai prima**: nello stesso
  commit o in uno dopo. Pubblicata prima, manda un bambino a cercare
  una cosa che sul telefono non c'è ancora;
- **un gioco in prova si annuncia il giorno che esce dal cancello**:
  prima la riga non la vede quasi nessuno (`inCasa` la scarta), e chi
  preme «Letto» nel frattempo la salta per sempre, perché il segno è
  uno solo.

`id` è quello dopo il più alto, `quando` il giorno in cui esce, e il
testo sta sotto i 70 caratteri con l'emoji della cosa in testa:
`unita/novita-bambini` controlla la lunghezza, il gioco e che non ci
sia HTML.
