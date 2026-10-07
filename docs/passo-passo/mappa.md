# Passo passo — la mappa delle isole

La schermata da cui si sceglie la tappa. Ha due mondi, tutti e due un
fondale dipinto: **la valle dei piccoli** (prato, salto, ghiaccio, massi,
buche e il pascolo del cane) e **il mondo dello zaino** (ripeti, fino a, se,
tutto il mondo, e a ognuno la sua isoletta del cane). Si passa dall'uno
all'altro da una tana. Il modello è la terra di sopra del sotterraneo
([../sotterraneo/terra-di-sopra.md](../sotterraneo/terra-di-sopra.md)): il
disegno si tiene com'è, il codice ci posa sopra caselle, segnalino, blocchi e
fumetto, con la stessa vista per tutti e due. Chi apre cosa sta in
[livelli.md](livelli.md#le-due-strade).

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `strumenti/sprite/sorgenti/passo-passo/isole.json`, `zaino.json` | i due foglietti: sentieri, ponti, tane, caselle speciali, cartelli, in pixel del fondale (`isole_1.png` la valle, `isole_2.png` lo zaino) |
| `strumenti/sprite/isole-passo-passo.py` | lo strumento: distribuisce le caselle, cuce il grafo, scrive `dati/isole-mappa.js` e `dati/zaino-mappa.js` (generati, non si toccano) |
| `scena/valle.js` | i due mondi: le tappe sui nodi, cosa è chiuso, la strada più corta, i salti (puro) |
| `scena/animale.js` | le misure dell'animale che salta e il suo saltello (puro) |
| `viste/Mappa.vue` | in che mondo si apre, da dove parte il segnalino, il passaggio da un mondo all'altro |
| `viste/Valle.vue` | la vista di un mondo (`mondo="valle"` o `"zaino"`): il disegno, la vista, il dito, il fumetto |
| `viste/segnalino.js` | l'animale che salta, per tutti e due i mondi |
| `viste/Casella.vue`, `viste/Fumetto.vue` | la casella (un tondo col numero) e il fumetto, uguali nei due mondi |
| `viste/Stendardo.vue`, `scena/stendardo.js`, `scena/tondo.js` | lo stendardo col nome di un'isola e lo stemma, disegnati in pixel (puro: la stoffa, l'asta, lo scudo); le misure del tondo che servono ai test |
| `Gioco.vue` | lo stato di ogni casella (`voci`), cosa dice una chiusa, dove sta il segnalino |

## Il fondale

- **`isole_1.png`, 1536×1024, tenuto com'è**: sei isole nel mare unite da
  ponti di legno in un giro chiuso, e il pascolo in mezzo (il prompt 1 di
  `strumenti/sprite/sorgenti/passo-passo/PROMPT-mappa.md`).
- **Entra nel file unico in WebP** (qualità 80, 257 KB; il file unico cresce
  di ~390 KB col base64 e il codice nuovo).
- **`isole_2.png` è lo zaino**, stessa scala e stesso WebP (363 KB; il file
  unico cresce di altri ~475 KB, tolta la mappa disegnata in codice che
  c'era): quattro isole del coniglio in fila su ponti, a sinistra in basso la
  riva da cui si arriva dalla valle. Vedi «Il mondo dello zaino».
- **La scala è 1**: un pixel del fondale è un pixel dello schermo, a pixel
  netti (`image-rendering: pixelated`). A 390 px la valle è quattro schermi
  per uno e mezzo; le caselle sono di 52 px (`lato` nel foglietto; 48 nello
  zaino, dove le isolette sono piccole), che si toccano bene e stanno su un
  sentiero dipinto largo ~40.
- **Dove sta ogni scalino**: in basso a sinistra il prato (la tana di casa,
  l'orto), in basso a destra il salto (il ruscello, i tronchi), a destra in
  alto il ghiaccio (il lago), in alto a sinistra i massi (il ponte di
  sasso), in alto in mezzo le buche (le buche colorate, il cartello a due
  frecce, la tana dello zaino in cima e quella del pascolo sotto), in mezzo
  il pascolo (il fienile, il recinto). Ogni isola ha uno stendardo con lo
  scalino (`cartello` nel foglietto: il suo centro; vedi «Gli stendardi»).
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
  terra fra le buche e il pascolo; con due punti (`punti: [[x, y], [x, y]]`,
  quello di `da` e quello di `a`) le due bocche stanno in posti diversi, come
  nello zaino, e `"nuvola": true` dice che da quella parte (`da`, il coniglio)
  sul fondale non c'è un buco: l'animale sparisce e ricompare in una nuvoletta.
  Quella per l'altro mondo (`isola`, `punto`, `cartello`, il centro del suo
  nome) è un nodo `passaggio`.
- **Le rive e gli id**: `"libere": ["riva"]` sono isole sempre aperte, senza
  caselle (la riva da cui si arriva dalla valle); `"prefisso": "z-"` si mette
  davanti agli id dei punti senza nome (`z-incrocio:3`), perché i due mondi non
  ne abbiano uno uguale (la mappa sa in che mondo sta un posto dal suo id).
  `"stemma": true` su un'isola le dà lo scudo e non lo stendardo (le isolette).
  `blocco: [a, b]` di un ponte sposta la sbarra dai suoi capi (px dal capo).
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
  serve: non ci si arriva. La riva dello zaino è aperta sempre (`libere`):
  non ha mai la sbarra dalla sua parte.
- **Toccata, la sbarra ha il suo fumetto**: «Il ponte è chiuso», lo scalino
  di là, e cosa manca alla sua prima tappa (`cosaManca`). Il segnalino non
  si muove.
- **La bocca dipinta di un'isola del cane chiusa ha il masso davanti**
  (`MASSO`: il pascolo, le isolette dello zaino), e non si passa; così la tana
  dello zaino, in cima alle buche, finché nessuna tappa di là è aperta.

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

- **Sulle isole del coniglio salta il coniglio, sul pascolo il cane.** Nella
  tana fra le buche e il pascolo il coniglio entra e il cane esce; sui ponti
  del pascolo (dal prato e dal salto) l'animale cambia in una nuvoletta sul
  capo del pascolo: il ponte è del coniglio. Provate due tane disegnate in
  capo a quei ponti: all'utente sembravano brutte, preferisce che l'animale
  cambi «magicamente». Anche nello zaino niente tane disegnate in codice: la
  bocca c'è nel fondale, o c'è la nuvoletta.
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

Una seconda valle, col suo foglietto (`zaino.json`) e lo stesso strumento, la
stessa vista (`Valle.vue`), le stesse caselle e lo stesso segnalino. Chi
prima era disegnato in codice (isole una sotto l'altra, bivi, tane a puntini)
non c'è più.

- **Il passaggio fra le due valli**: la tana «🎒 Lo zaino» in cima alle buche
  porta lì (il coniglio ci va, entra, e sbuca dalla tana d'arrivo); sulla
  riva in basso a sinistra la tana «🌱 La valle» lo riporta indietro. Chiusa
  (nessuna tappa dello zaino aperta, per esempio a sei anni) la prima ha il
  masso, e il suo fumetto dice cosa manca alla prima tappa dello zaino; quella
  della riva è sempre aperta. Il segnalino ricorda in che valle era
  (`ultimo` in `Mappa.vue`).
- **Le isole**: la riva con la tana d'arrivo, e il ponte che va al **ripeti**
  (in basso a sinistra, la più grande, 8 tappe); da lì un ponte in alto al
  **fino a** (rocce, neve, cascata: 4 tappe), un passaggio con una stalla
  (un'isoletta dove si cammina e basta, del «fino a»: ha la sua tana, ma è
  del fondale), poi il **se** (siepi, cartelli, lastre: 2 tappe). A destra del
  ripeti, un ponte porta a **tutto il mondo** (ghiaccio, massi, ruscello e una
  spirale attorno a un monte di cristallo: 4 tappe). Il giro è una catena,
  non un cerchio: da tutto il mondo ai massi si torna dal ripeti, e i ponti
  verso il fino a e verso tutto il mondo hanno la sbarra finché le due isole
  sono chiuse.
- **Le isolette del cane**: ogni scalino ha la sua, con tre tappe e il suo
  stemma (uno scudo, la carta dello scalino, viola), perché il nome intero non
  ci sta. Il ripeti ha quella a sinistra (le stalle in fila), il fino a quella
  in basso in mezzo (col fienile: è la più vicina che non è già di un altro,
  il fino a non ne ha una accanto), il se quella a destra in alto, tutto il
  mondo quella col lago gelato. Ne resta una (a destra in basso, di sotto a
  tutto il mondo): decoro, senza caselle.
- **Si entra dalla bocca dipinta dell'isoletta** (`tana:<isoletta>:a`): il
  coniglio entra in una tana (`:da`) sulla sua isola e il cane sbuca di là.
  Da dove entra il coniglio: il buco dipinto del fondale se c'è (il fino a: la
  tana dell'isolotto di passaggio; il se: quella in cima all'isola), se no
  `nuvola`, un punto del sentiero dove l'animale sparisce in una nuvoletta (il
  ripeti, al capo del ponte verso l'isoletta; tutto il mondo, sul lato dello
  spirale più vicino). Un ponte dipinto verso un'isoletta è solo disegno:
  non si cammina.
- **Le tre caselle di un'isoletta stanno a zigzag** sull'erba, dove ci stanno
  (le isolette sono larghe 180 px, tre caselle da 48 con otto di spazio
  vogliono 120): la più vicina alla bocca è la prima tappa, e nessuna copre la
  bocca (un test lo dice). Lo stemma sta dove non copre né caselle né animale
  seduto.
- **Da dove si parte**: dalla tappa di adesso, se è nello zaino; la vista
  segue il coniglio e il cane nei due versi come nella valle.

## Il fumetto

- **Toccando una casella compare un fumetto sopra di lei** (e sopra
  l'animale, se ci è seduto), con la coda che la indica: lo scalino (e «col
  cane»), il nome (con davanti l'emoji del livello), il racconto, le quattro stelle e «gioca» (o «continua» se
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

## Le caselle e gli stendardi

Una casella è un tondo col numero del livello, e il nome di un'isola è uno
stendardo: come sono fatti, lo stato a colpo d'occhio e perché stanno in
[caselle-e-stendardi.md](caselle-e-stendardi.md).

La partita a metà del sentiero (`Ripresa.vue`) sta ferma in cima, sopra i
due mondi.

Nei test: `unita/passo-passo-valle` (per tutti e due i mondi: il modulo è
quello del foglietto, una casella per tappa, ogni casella su un sentiero e
staccata dalle altre, dagli stendardi, dagli stemmi e dalle tane, che non
coprono caselle, sentieri, ponti né tane; a sedici punti della campagna ogni
casella aperta si raggiunge, le isole chiuse no, i blocchi stanno sui ponti
giusti e ci si ferma prima; gli animali e la durata dei viaggi; nello zaino la
riva, le quattro isolette del cane e la loro tana dipinta o la nuvoletta),
`integrazione/passo-passo-mappa` (col dito vero, nei due mondi). Bersagli: la
mappa `[data-mappa]` con `[data-mondo="valle"|"zaino"]`, la vista `[data-isole]`
(con `[data-camera]`); i cartelli `[data-insegna]` (lo stendardo, col nome
come testo; lo stemma di un'isoletta ha solo l'icona) con `[data-scalino]`,
`[data-isola]`, `[data-animale]`, `[data-velata]`; le caselle `[data-tappa="<indice>"|"senza-fine"|"senza-fine-cane"]`
con `[data-stato]` e `[data-strada="coniglio"|"cane"]` (il numero sta in `.pp-tondo b`, le stelle di una fatta in `[data-stelle]` con `[data-piene]`), l'animale di un
sentiero `[data-sentiero-di="coniglio"|"cane"]`, la matita
`[data-a-meta]`; i blocchi `[data-blocco="<ponte>"]` con `[data-chiude]`;
le tane `[data-tana="<isola del cane>"|"zaino"|"valle"]` con `[data-aperta]` (di
un'isola del cane è la bocca dipinta, col masso se chiusa); i passaggi
`[data-passaggio="zaino"|"valle"]`; il segnalino `[data-segnalino]` con
`[data-animale]`, `[data-al]` e `[data-in-viaggio]`, la nuvoletta `.pp-sbuffo`;
il fumetto `[data-fumetto]` con `[data-fumetto-per]` (un indice,
un sentiero, `blocco:<ponte>`, `zaino`), `[data-azione="parti"]`,
`[data-serve]` e, su un sentiero, `[data-record]`; nel fumetto l'emoji del livello `[data-livello-icona]`. `giocaSullIsola(page, indice)` in `test/aiuto/browser.mjs`
passa di là dalla tana se la casella sta nell'altro mondo, aspetta il
segnalino fermo e fa i due tocchi; `statoSullIsola` legge lo stato (di là
da una tana chiusa è `chiusa`).
