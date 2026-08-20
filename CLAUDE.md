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

**La cadenza, detta in due righe.** Le unità girano a ogni commit — costano
secondi, e non c'è nessun motivo di risparmiarle. **Il browser gira prima
del push, non prima di ogni commit**: cinque minuti e mezzo moltiplicati per
i commit di un pomeriggio sono un'ora buttata, e non comprano niente, perché
quello che finisce sui telefoni è la **punta** e non i passaggi intermedi. È
la stessa regola dei commit a blocchi applicata alle prove: un commit
raggruppa un concetto e può anche non stare in piedi da solo, la coerenza si
verifica dove si pubblica.

Strumenti che si usano di rado:

```bash
npm run voci           # incide la pronuncia (solo dopo aver aggiunto parole)
npm run voci -- --lingua es
npm run simula         # gioca il tower defense senza browser
npm run tara           # rimisura la vita dei nemici e riscrive i dati
npm run mappe          # valida i livelli del Generale
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
  canvas, gira in Node e si prova in `unita/tessere`). Li usa
  `giochi/sotterraneo/scena/tela.js`, che è il calco da guardare: la
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
  **La schermata dei grandi ha due schede**, e si tara in una sola:
  «Bambini» (chi gioca, progressi, codice, guasti — con una riga sola
  che dice «Leonardo ha 10 anni · modifica ›» e rimanda) e **«Giochi e
  domande»**, la manopola dell'età col **quadro** sotto (vedi la sezione
  della manopola).
  **«Come va» è sospeso**, non cancellato: `quiz/ComeVa.vue` e le soglie
  di `quiz/consiglio.js` sono al loro posto, il suo test è
  `test/integrazione/come-va.spento.mjs` (si riaccende rinominandolo
  `.test.mjs`), ma non è montato da nessuna parte — il modo di
  presentarlo è da rivedere, e mostrato a metà sarebbe peggio. Ce n'erano due che dicevano
  la stessa cosa in altri modi — un elenco di classi con quattro tondi
  per riga e una fila di interruttori per gioco — e la prima aveva
  pure **una seconda tacca dell'età**, cioè il difetto che la manopola
  era nata per togliere. Adesso il posto è uno: `quiz/Catalogo.vue` non
  esiste più.
  Il conto che servirebbe c'è già: `quiz/consiglio.js` legge
  `store/srs.js` e sa dire quando una chiave ha almeno otto tiri con
  meno di metà giuste (un muro) o più di nove su dieci (un pedaggio).
  Consiglia e non ritocca da sé — un pomeriggio storto insegnerebbe la
  cosa sbagliata — ma **per ora non lo mostra nessuno**: vedi «Come va»
  qui sopra.
- **`strumenti/mappe/`** — il banco da lavoro dei livelli del Generale, che
  sono dato puro (ASCII art + metadati). `FORMATO.md` è la specifica,
  `nucleo.js` l'unica copia delle regole, `editor.html` si apre col doppio
  click. `campagne.js` è **generato** da `estrai-campagne.mjs`.
- **`strumenti/banco/`** — il banco degli sprite (`npm run mondo`), una
  pagina sola con due metà: **il mondo** guarda l'atlante generato — si
  posa, si stende il fondo col pennello, si traccia una strada che compone
  **il risolutore vero**, si manda a spasso chi cammina — e **i ritagli**
  guarda il foglio sorgente, coi rettangoli del foglietto addosso da
  trascinare. Il PNG non si tocca mai: le correzioni sono dato nel
  foglietto (`strumenti/sprite/FORMATO.md`), e chi salva è un plugin di
  Vite `apply: 'serve'` che nel build non esiste.
- **`src/guide/`** — quello che nessuno legge nel README, messo dentro
  l'applicazione. `contenuti.js` è dato puro e ha due registri: `GUIDE`
  (per i grandi: installare l'app, l'età, la difficoltà, i progressi) e
  `AIUTI` (uno per gioco, dietro il `?` della barra). **«Come funziona»
  sta fuori dal codice dei genitori**, ed è la regola da non rompere: la
  prima guida spiega come si installa, e la legge chi ha appena ricevuto
  il link da un'altra famiglia — dietro il tastierino la leggerebbe solo
  chi non ne ha bisogno. Un gioco mette il suo `?` scrivendo
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
  qui si sorveglia (`reg.update()` ogni mezz'ora) e si accende un ref.
  Due cose che non fa, ed è deliberato: **non ricarica da solo** (un
  reload in mezzo a un'ondata butta via la partita) e **non si mostra
  dentro un gioco** — il nastro vive solo in home, dove non c'è niente
  da perdere. Il cartello sta in `guide/Nastri.vue` insieme a quello
  dell'installazione: parlano tutti e due al grande e vivono nello
  stesso posto. La regola dei tre `serveIlNastro` (non installata ·
  telefono · non già rifiutato) è una funzione pura in `guide/aiuto.js`
  perché altrimenti non si potrebbe provare senza un telefono in mano —
  `apriGioco(browser, { userAgent })` è nato per questo.
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

Quattro interruttori diversi, e la differenza conta:

1. **Un gioco** (`settings.giochi`) — sparisce la carta in home, i progressi
   restano. Per bambino, come elenco di **eccezioni** (`{ torri: false }`),
   così un gioco nuovo nasce acceso anche per chi ha il profilo di ieri.
   Da qui si dice anche il contrario: `{ dungeon: true }` lo **tiene in
   casa contro l'età** (`fissaGioco`), e la home lo rispetta
   (`giocoForzato` vince su `giocoDaVedere`). Si sceglie dalla ✎ della
   sua riga nel quadro, non più da una fila di interruttori.
2. **Un pezzo di scuola** (`settings.sa`, `data/saperi.js`) — spariscono le
   *domande* che lo danno per scontato, in tutti i giochi. Chi dichiara di
   averne bisogno è **chi fa la domanda** (un modulo di quiz lo dichiara nei
   suoi `tipi`), non un elenco da tenere allineato a mano. I giochi degradano
   invece di sbarrare.
3. **I giochi in prova** (`settings.sperimentali`) — un flag solo per tutti
   quelli taggati `sperimentale: true`, che senza non esistono affatto.
4. **Un modo di giocare, dentro un gioco** (`settings.varianti`,
   `varianteAccesa`/`accendiVariante`) — non è un gioco e non è un pezzo di
   scuola: è metà di un gioco che si può togliere senza togliere il gioco. Il
   primo è `asteroidi:mente`, che leva le tappe di calcolo a mente dalla fila
   degli asteroidi e lascia solo le tabelline; i pianeti si rinumerano senza
   buchi, i progressi restano dove sono e la carta in home non si muove.
   Stessa forma degli altri due: **eccezioni per bambino**, così una variante
   nuova nasce accesa per chi ha il profilo di ieri.

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
sono tre — Conta gli animali, Prima e dopo, la fattoria — e nessuno
pesca dai moduli di quiz: i quattro blocchi elencavano lo stesso undici
classi col tastino per provarle, e un grande le leggeva come «ecco cosa
gli chiederemo». Al loro posto una riga sola, che dice anche da quando
cambia («arrivano a 6 anni, con Survivors, il Dungeon e il
sotterraneo»). Chi le chiede lo dichiara nel manifesto con `quiz: true`
— non «fa domande», che le fa anche Conta gli animali, ma **passa da
`src/quiz/`**.

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
tutto» lascerebbero due profili diversi.

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
`[data-perde-tutto]`.

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

Quali giochi tenere lo dicono i manifesti, e sono **tre** dichiarazioni:
`piccoli: true` e `grandi: true` sono le due estremità della scala,
`posto: true` è chi sulla scala non ci sta affatto (la fattoria: un
prato dove si spende, non una fila da macinare) e non si spegne mai per
età, in nessuna delle due direzioni. Nessun elenco da mantenere a mano.

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
accendono alla creazione, la portata filtra in continuo, e non si
contraddicono.

Fuori dal giudizio restano i giochi **senza campagna** — la fattoria, la
cameretta: sono posti, non scalette, e l'assenza vuol dire «non si
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
arriverebbe dopo tremila monete spese).

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
