# Passo passo — la mappa delle isole

La schermata da cui si sceglie la tappa. Ha due mondi: **la valle dei
piccoli**, un fondale dipinto (prato, salto, ghiaccio, massi, buche e il
pascolo del cane), e **il mondo dello zaino** (ripeti, fino a, se, tutto il
mondo e le isolette del cane), ancora disegnato in codice finché non arriva
il suo fondale. Si passa dall'uno all'altro da una tana. Il modello è la
terra di sopra del sotterraneo ([../sotterraneo/terra-di-sopra.md](../sotterraneo/terra-di-sopra.md)):
il disegno si tiene com'è, il codice ci posa sopra caselle, segnalino,
blocchi e fumetto. Chi apre cosa sta in [livelli.md](livelli.md#le-due-strade).

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `strumenti/sprite/sorgenti/passo-passo/isole.json` | il foglietto: sentieri, ponti, tane, caselle speciali, cartelli, in pixel del fondale `isole_1.png` |
| `strumenti/sprite/isole-passo-passo.py` | lo strumento: distribuisce le caselle, cuce il grafo, scrive `dati/isole-mappa.js` (generato, non si tocca) |
| `scena/valle.js` | la valle: le tappe sui nodi, cosa è chiuso, la strada più corta, i salti (puro) |
| `scena/isole.js` | lo zaino: dove cade ogni isola, casella, tana, bivio e ponte, e i salti (puro) |
| `viste/Mappa.vue` | in che mondo si apre, da dove parte il segnalino, il passaggio da un mondo all'altro |
| `viste/Valle.vue`, `viste/MondoZaino.vue` | i due mondi: il disegno, la vista, il dito, il fumetto |
| `viste/segnalino.js` | l'animale che salta, per tutti e due i mondi |
| `viste/Casella.vue`, `viste/Fumetto.vue` | la casella e il fumetto, uguali nei due mondi |
| `Gioco.vue` | lo stato di ogni casella (`voci`), cosa dice una chiusa, dove sta il segnalino |

## Il fondale

- **`isole_1.png`, 1536×1024, tenuto com'è**: sei isole nel mare unite da
  ponti di legno in un giro chiuso, e il pascolo in mezzo (il prompt 1 di
  `strumenti/sprite/sorgenti/passo-passo/PROMPT-mappa.md`).
- **Entra nel file unico in WebP** (qualità 80, 257 KB; il file unico cresce
  di ~390 KB col base64 e il codice nuovo).
- **La scala è 1**: un pixel del fondale è un pixel dello schermo, a pixel
  netti (`image-rendering: pixelated`). A 390 px la valle è quattro schermi
  per uno e mezzo; le caselle sono di 52 px (`lato` nel foglietto), che si
  toccano bene e stanno su un sentiero dipinto largo ~40.
- **Dove sta ogni scalino**: in basso a sinistra il prato (la tana di casa,
  l'orto), in basso a destra il salto (il ruscello, i tronchi), a destra in
  alto il ghiaccio (il lago), in alto a sinistra i massi (il ponte di
  sasso), in alto in mezzo le buche (le buche colorate, il cartello a due
  frecce, la tana dello zaino in cima e quella del pascolo sotto), in mezzo
  il pascolo (il fienile, il recinto). Ogni isola ha un cartello con lo
  scalino (`cartello` nel foglietto).
- **Il giro non segue l'ordine dei capitoli**: i ponti vanno prato–salto,
  salto–ghiaccio, ghiaccio–buche, buche–massi, massi–prato, più prato–pascolo
  e salto–pascolo e la tana buche–pascolo. Dal ghiaccio ai massi si torna
  giù dal salto e dal prato, perché il ponte delle buche ha il blocco finché
  le buche sono chiuse. Si tiene così: basta il blocco sulla strada.

## Il foglietto e lo strumento

- **I sentieri sono spezzate in pixel del fondale**, una o più per isola.
  Uno con `"caselle": N` ne porta N, distribuite dallo strumento fra i due
  `margini`; le caselle di un'isola si contano nell'ordine del foglietto, e
  la k-esima è la k-esima tappa dell'isola in `motore/strade.js`. Uno senza
  caselle è un raccordo; `"erba": true` è un passaggio che sul fondale non è
  dipinto (sul prato, dalla strada di sotto a quella di sopra).
- **Le caselle stanno a stacco uguale**, non a passo uguale lungo la
  strada: lo stacco è la più larga fra la distanza in x e quella in y, e fra
  due caselle restano almeno 8 px (`SPAZIO`). Provato a passo uguale: dove
  il sentiero gira in diagonale due caselle si toccano.
- **Il grafo si cuce da solo**: un capo di sentiero a meno di 30 px da un
  altro sentiero della stessa isola ci si attacca (un incrocio), e così i
  due capi di ogni ponte, sul sentiero più vicino della loro isola. Un arco
  più lungo di 150 px si spezza in soste: toccando a metà di un ponte il
  segnalino si ferma lì.
- **Le tane**: quella del pascolo (`da`, `a`, `punto`) è un passaggio sotto
  terra fra le buche e il pascolo, quella dello zaino (`isola`, `punto`,
  `cartello`, il centro del suo nome) porta all'altro mondo. Le altre due
  (`ponte`: il nome del ponte, e il ponte porta `tana`) stanno al capo dei ponti
  prato–pascolo e salto–pascolo, dalla parte del pascolo: il ponte finisce nel
  loro `:da` (del coniglio, ma della stessa isola chiusa del pascolo), il
  tunnel porta al loro `:a` (del cane), e da lì un pezzo di terra (o nulla,
  se il sentiero finisce lì) al pascolo. Il disegno è `TANA_PONTE` in
  `scena/pixel.js`: un'altra tana delle dipinte non c'era vicino.
- **I due sentieri senza fine** ([sentiero.md](sentiero.md)) sono due caselle
  tonde e d'oro, col loro animale in un tondino sul bordo anche da chiuse e il
  record nel fumetto: `senza-fine`, il sentiero del coniglio, in cima alle
  buche; `senza-fine-cane` (`SENTIERO_CANE`), quello del cane, in fondo al
  pascolo dopo il gregge. `etichetta` è dove comincia il nome, col record o
  cosa manca.
- **Il giro di correzione**: si corregge il foglietto,
  `python3 strumenti/sprite/isole-passo-passo.py --provino` scrive
  `tmp/isole/provino.png` (sentieri in giallo, l'erba a puntini, ponti in
  arancio coi blocchi in rosso, caselle col nome, tane, incroci, soste,
  cartelli), si guarda, si rilancia senza `--provino` per il modulo, e
  `npm test`. Lo strumento si ferma se una casella esce dal fondale, se due
  si toccano, se un blocco copre una casella, se un'isola non ha tante
  caselle quante dice, o se un pezzo di strada resta staccato.
- **Una tappa nuova nella valle** vuole una casella in più nel foglietto:
  `unita/passo-passo-valle` lo pretende ([livelli.md](livelli.md#le-tappe-in-coda)).

## I blocchi

- **Un'isola è aperta se ha almeno una casella aperta**; un pezzo di strada
  si passa solo se le isole dei suoi capi sono aperte (`chiusure` in
  `scena/valle.js`). Le soste di un ponte non sono di un'isola: sul ponte si
  va fino alla sbarra.
- **Un ponte fra un'isola aperta e una chiusa ha la sbarra** dalla parte
  della chiusa: due paletti e un'asse a strisce, disegnata in codice
  (`SBARRA` in `scena/pixel.js`, scala 3), a 24 px dal capo (o quanto dice
  `blocco` del ponte, se lì sotto c'è una casella). Fra due isole chiuse non
  serve: non ci si arriva.
- **Toccata, la sbarra ha il suo fumetto**: «Il ponte è chiuso», lo scalino
  di là, e cosa manca alla sua prima tappa (`cosaManca`). Il segnalino non
  si muove.
- **La tana del pascolo chiusa ha il masso davanti** (`MASSO`), e non si
  passa; così la tana dello zaino. Sui ponti che finiscono in una tana il
  blocco verso il pascolo non è la sbarra ma il masso sulla tana: stesso
  `[data-blocco]`, stesso fumetto «Il ponte è chiuso».

## La vista

- **Non si trascina**: segue il segnalino. Lui sta libero nel mezzo, e
  quando arriva a `BORDO` dal bordo (30% di lato, 36% in cima, 24% in fondo)
  la vista si sposta quel tanto che basta, morbida (`MORBIDA`). All'apertura
  è sul segnalino; su uno schermo più grande della mappa la mappa sta in
  mezzo.
- **Col fumetto aperto la vista sta sul fumetto**: scorre quanto basta per
  vederlo tutto, e il segnalino ci arriva da dov'è.
- **Toccando un punto che non è una casella il segnalino ci va**: al posto
  raggiungibile più vicino (una casella, un incrocio, una sosta), senza
  fumetto. È il modo di esplorare, come nella terra di sopra; col fumetto
  aperto un tocco fuori lo chiude e basta.
- **Scorre col `scrollLeft`/`scrollTop` di un riquadro che non si
  trascina** (`overflow: hidden`, `touch-action: none`): una prova che porta
  una casella sullo schermo la sposta, e la vista la prende com'è anche a
  metà corsa.

## Il segnalino

- **Sulle isole del coniglio salta il coniglio, sul pascolo il cane.
  L'animale cambia solo entrando in una tana**: il coniglio entra e il cane
  esce (o il contrario), nella tana fra le buche e il pascolo e in quelle al
  capo dei ponti dal prato e dal salto; i ponti sono del coniglio, e a metà
  ponte l'animale non cambia mai.
- **Toccando una casella aperta ci va**, sulla strada più corta dei pezzi
  che si passano (`percorso`), a saltelli lungo la strada (`SALTO`, 72 px):
  atterra sulle caselle e nelle tane, passa sopra incroci e soste. Un
  viaggio lungo non dura più di 3,6 s (`TEMPO_MAX`): i saltelli si allungano
  e si fanno svelti. Il fumetto non aspetta l'arrivo.
- **Un altro tocco durante il viaggio** porta il fumetto sulla nuova tappa e
  cambia la meta, da dove il segnalino è atterrato (anche a metà ponte: si
  torna indietro se la meta è dietro). Un tocco fuori chiude il fumetto e il
  viaggio finisce.
- **Su una chiusa non va**: il fumetto subito, e dice cosa manca. Senza
  strada (il segnalino rimasto su un'isola che si è chiusa) un balzo
  solo.
- **All'apertura sta sulla tappa di adesso** (`tappaDiAdesso` in
  `motore/strade.js`): l'ultima giocata se non è vinta, se no quella dopo
  come col ▶; non restando niente, il sentiero lasciato a metà, se no
  quello del coniglio, se no quello del cane. La mappa si apre nel mondo
  dove sta.
- **Dove si era fermato lo ricorda la sessione**, per bambino (`ultimo` in
  `Mappa.vue`, col mondo), non il profilo: tornando con una tappa di adesso
  nuova nello stesso mondo parte da dov'era e ci va, e la vista gli va
  dietro; da un mondo all'altro si ritrova sulla tappa.
- **A fotogrammi, fermo a schermo nascosto** (al massimo 50 ms per
  fotogramma).

## Il mondo dello zaino

- **La tana in cima alle buche porta lì** (il nome «🎒 Lo zaino» sopra):
  toccandola il coniglio ci va, entra, e sbuca dalla tana in cima allo
  zaino, su un'isoletta col nome «La valle»; quella lo riporta indietro.
  Chiusa (nessuna tappa dello zaino aperta, per esempio a sei anni) ha il
  masso, e il suo fumetto dice cosa manca alla prima tappa dello zaino.
- **Il resto è la mappa di prima**: isole una sotto l'altra, una per
  scalino, che scorrono in verticale; le caselle a serpente, quattro per riga
  (tre sotto i 340 px); fra un'isola del coniglio e la dopo un ponte di
  assi; le isolette del cane nello spazio dopo l'isola della loro tana, il
  ponte del coniglio gira largo (`ponteX`). Ogni isola ha il suo vestito
  (`VESTITI`), colori piatti, il mare color pesca della copertina, le cose
  sparse dove non c'è niente, col caso fisso sulla posizione.
- **Le tane e i bivi**: fra un'isola del coniglio e la sua isoletta del cane
  una tana per parte, il tunnel a puntini; il ramo parte dalla casella più
  vicina dell'ultima riga; il bivio è un paletto con due assi, 🐇 verso il
  ponte e 🐕 verso la tana; una tana chiusa ha il sasso. Il segnalino ci
  salta di casella in casella, oltre cinque un balzo solo.
- **Diventerà dipinto** col secondo fondale (il prompt 2 della scheda):
  allora sarà una seconda valle, col suo foglietto.

## Il fumetto

- **Toccando una casella compare un fumetto sopra di lei** (e sopra
  l'animale, se ci è seduto), con la coda che la indica: lo scalino (e «col
  cane»), il nome, il racconto, le quattro stelle e «gioca» (o «continua» se
  c'è una fila a metà). Mai un foglio dal basso. In cima alla mappa, dove
  sopra non c'è posto, va sotto.
- **Su una chiusa dice cosa manca, senza tasto** (`cosaManca`): «Prima tocca
  a «X», poi ad altre N tappe», e per il cane «si apre quando il coniglio
  impara 🔁 («Il viale»)» o «finisce «Le buche»»; chiusa dall'età, «Questa
  tappa per ora è chiusa». Così anche la sbarra e la tana dello zaino.
- **Resta fermo e sopra il segnalino** (`z-index` più alto) mentre quello
  viaggia; sta sopra la meta come se l'animale ci fosse già seduto.
- **Si apre al `click`, non al `pointerup`**, e una strisciata oltre 16 px
  non apre niente ([../core/il-dito.md](../core/il-dito.md)). Toccando fuori
  si chiude.

## Lo stato a colpo d'occhio

| stato | come si vede |
|---|---|
| `fatta` | la casella bianca con la sua icona e le stelle prese |
| `ora` | un anello d'oro che respira, e il segnalino sopra |
| `aperta` | la casella bianca, stelle spente |
| `chiusa` | color pesca, col lucchetto |

Una casella con una fila a metà ha la ✏️ ([sosta.md](sosta.md)). Un'isola
con tutte le caselle chiuse non è ancora raggiunta: le sue caselle e il suo
cartello sono velati. La partita a metà del sentiero (`Ripresa.vue`) sta
ferma in cima, sopra i due mondi.

Nei test: `unita/passo-passo-valle` (il modulo è quello del foglietto, una
casella per tappa, ogni casella su un sentiero e staccata dalle altre e dai
cartelli; a sedici punti della campagna ogni casella aperta si raggiunge,
le isole chiuse no, i blocchi stanno sui ponti giusti e ci si ferma prima;
gli animali, i cambi solo nelle tane dei ponti e la durata dei viaggi), `unita/passo-passo-isole` (lo zaino a
cinque larghezze: caselle nello schermo e nella loro isola, isole che non
si toccano, il ponte che non passa sopra il cane, il bivio che non copre
niente, la tana in cima da cui si arriva a tutto), `integrazione/passo-passo-mappa`
(col dito vero). Bersagli: la mappa `[data-mappa]` con `[data-mondo="valle"|"zaino"]`,
la vista `[data-isole]` (nella valle con `[data-camera]`); i cartelli
`[data-insegna]` con `[data-scalino]` (nella valle anche `[data-isola]`,
`[data-animale]`, `[data-velata]`; nello zaino questi stanno sulle isole
`[data-isola="<chiave>"]`); le caselle `[data-tappa="<indice>"|"senza-fine"|"senza-fine-cane"]`
con `[data-stato]` e `[data-strada="coniglio"|"cane"]`, l'animale di un
sentiero `[data-sentiero-di="coniglio"|"cane"]`, la matita
`[data-a-meta]`; i blocchi `[data-blocco="<ponte>"]` con `[data-chiude]`;
le tane `[data-tana="pecore-cane"|"prato-pascolo"|"salto-pascolo"]` (la prima con `[data-aperta]`); i passaggi `[data-passaggio="zaino"|"valle"]`;
i bivi dello zaino `[data-bivio]` con `[data-ramo]` e le assi
`[data-verso="coniglio"|"cane"]`; il segnalino `[data-segnalino]` con
`[data-animale]`, `[data-al]` e `[data-in-viaggio]`;
il fumetto `[data-fumetto]` con `[data-fumetto-per]` (un indice,
un sentiero, `blocco:<ponte>`, `zaino`), `[data-azione="parti"]`,
`[data-serve]` e, su un sentiero, `[data-record]`. `giocaSullIsola(page, indice)` in `test/aiuto/browser.mjs`
passa di là dalla tana se la casella sta nell'altro mondo, aspetta il
segnalino fermo e fa i due tocchi; `statoSullIsola` legge lo stato (di là
da una tana chiusa è `chiusa`).
