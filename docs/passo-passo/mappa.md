# Passo passo — la mappa delle isole

La schermata da cui si sceglie la tappa. In cima si sceglie **chi gioca**,
il coniglio o il cane: ognuno ha la sua strada e vede solo le sue caselle
(«Due protagonisti», sotto). Ha due mondi, tutti e due un fondale dipinto:
**la valle dei piccoli** (prato, salto, ghiaccio, buche, massi e il pascolo
del cane) e **il mondo dello zaino** (ripeti, fino a, se, tutto il mondo, e
accanto a ognuno un'isoletta del cane). Si passa dall'uno all'altro da una
tana. Il modello è la terra di sopra del sotterraneo
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
| `viste/Stendardo.vue`, `viste/InsegnaTana.vue`, `scena/stendardo.js`, `scena/tondo.js` | lo stendardo col nome di un'isola, lo stemma e l'insegna delle tane per l'altro mondo, disegnati in pixel (puro: la stoffa, l'asta, lo scudo, la punta); le misure del tondo che servono ai test |
| `Gioco.vue` | lo stato di ogni casella (`voci`), cosa dice una chiusa, dove sta il segnalino |

## Il fondale

- **`isole_1.png`, 1536×1024, tenuto com'è**: sei isole nel mare unite da
  ponti di legno in un giro chiuso, e il pascolo in mezzo (il prompt 1 di
  `strumenti/sprite/sorgenti/passo-passo/PROMPT-mappa.md`).
- **Entra nel file unico in WebP senza perdita** (colori a passo 12,
  675 KB, 37 dB: nessun pixel si scosta di più di 6 su 255; era WebP
  qualità 80, 257 KB, 32 dB, con i bordi impastati). Lo fa
  `strumenti/sprite/codifica.py`: [../core/grafica.md](../core/grafica.md#fedeli-ai-sorgenti).
- **`isole_2.png` è lo zaino**, stessa scala e stessa codifica (892 KB, 38 dB;
  il file unico cresceva di ~475 KB già con la mappa disegnata in codice tolta): quattro isole del coniglio in fila su ponti, a sinistra in basso la
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
- **Il giro segue l'ordine dei capitoli**: i ponti vanno prato–salto,
  salto–ghiaccio, ghiaccio–buche, buche–massi, massi–prato, più prato–pascolo
  e salto–pascolo e la tana buche–pascolo; per questo le buche vengono prima
  dei massi, e «Tutto insieme» chiude i massi accanto al ponte del prato.
  Le caselle di un'isola si contano dal ponte da cui si arriva. Provato con i
  massi prima: dal 16 il ponte portava al 24, e il 17 stava dall'altra parte.

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
  nello zaino, e `"nuvola": true` dice che da quella parte (`da`, sull'isola
  del coniglio) sul fondale non c'è un buco: l'animale sparisce e ricompare in una nuvoletta.
  Quella per l'altro mondo (`isola`, `punto`, `freccia`, dove la punta
  dell'insegna tocca la bocca, da sopra, e `scosta`, di quanti px la stoffa
  sta a destra della punta dove sopra la bocca non c'è posto) è un nodo
  `passaggio`.
- **Le rive e gli id**: `"libere": ["riva"]` sono isole sempre aperte, senza
  caselle (la riva da cui si arriva dalla valle); `"prefisso": "z-"` si mette
  davanti agli id dei punti senza nome (`z-incrocio:3`), perché i due mondi non
  ne abbiano uno uguale (la mappa sa in che mondo sta un posto dal suo id).
  `"stemma": true` su un'isola le dà lo scudo e non lo stendardo (le isolette).
  `blocco: [a, b]` di un ponte sposta la sbarra dai suoi capi (px dal capo).
- **Il sentiero senza fine** ([sentiero.md](sentiero.md)) è una casella
  tonda e d'oro, col suo animale in un tondino sul bordo anche da chiusa e il
  record nel fumetto. Nel foglietto ce n'è una sola, `senza-fine`, in fondo
  alla spirale di «Tutto il mondo»: è la fine di tutte e due le strade, e
  `quadroValle` la dà a chi gioca (`senza-fine` al coniglio,
  `senza-fine-cane`, `SENTIERO_CANE`, al cane). `etichetta` è dove comincia
  il nome, col record o cosa manca. Provato in cima alle buche: stava a metà
  strada, e chi ci arrivava poteva andare avanti.
- **Il giro di correzione**: si corregge il foglietto,
  `python3 strumenti/sprite/isole-passo-passo.py --provino` scrive
  `tmp/isole/provino.png` (sentieri in giallo, l'erba a puntini, ponti in
  arancio coi blocchi in rosso, caselle col nome, tane, incroci, soste,
  cartelli), si guarda, si rilancia senza `--provino` per il modulo, e
  `npm test`. Lo strumento si ferma se una casella esce dal fondale, se due
  si toccano, se un blocco copre una casella, se un'isola non ha tante
  caselle quante dice, o se un pezzo di strada resta staccato.
- **Una tappa nuova in una valle** vuole una casella in più nel suo foglietto:
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

- **Il dito trascina la vista, nei due versi**, con lo slancio che si spegne
  morbido (`DECADE`) e i bordi della mappa per limite. Sotto i 16 px è un
  tocco (apre la casella, manda il segnalino: al `click`), sopra è un
  trascinamento e non apre niente; un tocco che ferma la vista che scivola
  serve solo a fermarla. Nel sotterraneo la vista segue per forza il
  protagonista, qui no: la valle è una mappa da guardare.
- **La vista segue il segnalino solo mentre viaggia.** Lui sta libero nel
  mezzo, e quando arriva a `BORDO` dal bordo (30% di lato, 36% in cima, 24% in
  fondo) la vista si sposta quel tanto che basta, morbida (`MORBIDA`). Fermo,
  la vista resta dove il bambino l'ha lasciata; se parte e la vista l'aveva
  lasciato fuori schermo, prima torna su di lui e poi lo segue (anche col
  fumetto aperto). All'apertura, e dopo una vittoria, è sul segnalino; su uno
  schermo più grande della mappa la mappa sta in mezzo. Provato: vista che
  segue sempre il segnalino, e il bambino non poteva guardare un pezzo lontano
  senza mandarci il coniglio: scomodo fuori dal sotterraneo.
- **Col fumetto aperto la vista sta sul fumetto**: scorre quanto basta per
  vederlo tutto, e il segnalino ci arriva da dov'è. Il fumetto sta nella
  mappa e si sposta con lei, sopra la sua casella: trascinare non lo chiude.
- **Toccando un punto che non è una casella il segnalino ci va**: al posto
  raggiungibile più vicino (una casella, un incrocio, una sosta), senza
  fumetto. È il modo di esplorare, come nella terra di sopra; col fumetto
  aperto un tocco fuori lo chiude e basta.
- **Scorre col `scrollLeft`/`scrollTop` di un riquadro `overflow: hidden`**
  mosso dal codice (`touch-action: none`: la pagina non scorre sotto): una
  prova che porta una casella sullo schermo la sposta, e la vista la prende
  com'è anche a metà corsa.

## Due protagonisti

- **Un selettore in cima sceglie chi gioca**, 🐇 coniglio o 🐕 cane, e la
  mappa cambia con lui (`Mappa.vue`). È in una fascia sua sopra la valle:
  provato a pillola sopra il fondo della mappa, copriva le caselle di sotto.
  Il cane chiuso ha il lucchetto, e toccato dice cosa manca.
- **Ognuno vede solo le sue caselle**, numerate da 1 sulla sua strada
  ([livelli.md](livelli.md#le-due-strade)). Per il coniglio le isole del
  cane sono paesaggio: niente caselle, niente stendardi, i ponti e le tane
  che ci portano non si camminano. Per il cane le isole del coniglio sono
  terra da attraversare, sempre aperte, senza caselle né stendardi: ci passa
  per arrivare alle tane delle sue isolette (`quadroValle` in `scena/valle.js`).
  Finché il cane non ha un fondale suo, cammina su quello del coniglio.
- **Il segnalino è sempre il protagonista**: nelle tane entra ed esce lo
  stesso animale (da una tana senza buco dipinto, in una nuvoletta). Provato
  prima: il coniglio che diventava cane nella tana del pascolo e sui suoi
  ponti; le due strade mescolate sulla stessa mappa confondevano i numeri.
- **Con chi si apre**: chi ha il sentiero lasciato a metà, se no l'animale
  dell'ultima tappa giocata; la sessione ricorda chi era scelto (`ultimo`).

## Il segnalino

- **Niente tane disegnate in codice**: la bocca c'è nel fondale, o c'è la
  nuvoletta. Provate due tane disegnate in capo ai ponti del pascolo:
  all'utente sembravano brutte.
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
- **All'apertura sta sulla tappa di adesso del suo protagonista**
  (`tappaDiAdesso` in `motore/strade.js`, con `strada`): l'ultima giocata se
  non è vinta, se no quella dopo come col ▶; non restando niente, il suo
  sentiero se è aperto, se no l'ultima giocata o la prima. La mappa si apre
  nel mondo dove sta.
- **Dove si era fermato lo ricorda la sessione**, per bambino e
  protagonista (`ultimo` in `Mappa.vue`, col mondo), non il profilo: tornando con una tappa di adesso
  nuova nello stesso mondo parte da dov'era e ci va, e la vista gli va
  dietro; da un mondo all'altro si ritrova sulla tappa.
- **A fotogrammi, fermo a schermo nascosto** (al massimo 50 ms per
  fotogramma).

## Il mondo dello zaino

È una seconda valle, con la stessa vista, le stesse caselle e lo stesso
segnalino: [mondo-zaino.md](mondo-zaino.md) dice com'è fatta (la riva e la
tana per la valle, le quattro isole sui ponti, le isolette del cane e come ci
si entra).

## Il fumetto

- **Toccando una casella compare un fumetto sopra di lei** (e sopra
  l'animale, se ci è seduto), con la coda che la indica: lo scalino (e «col
  cane»), il nome (con davanti l'emoji del livello), il racconto, le quattro stelle e «gioca» (o «continua» se
  c'è una fila a metà). Se la tappa usa una cosa che il bambino non ha
  ancora visto su nessuna delle due strade (una regola del mondo, le
  pecore, una carta: `concettiDi` in `dati/campagna.js`), sotto il racconto
  c'è 💡 con la `dritta` del suo scalino: così la spiega chi arriva prima. Mai un foglio dal basso. In cima alla mappa, dove
  sopra non c'è posto, va sotto.
- **Su una chiusa dice cosa manca, senza tasto** (`cosaManca`): «Prima tocca
  a «X», poi ad altre N tappe», e per il primo gregge «Il cane comincia quando
  il coniglio finisce «Tutto insieme»». Così anche la sbarra e la tana dello
  zaino.
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
coprono caselle, sentieri, ponti né tane; per ogni protagonista solo le sue
caselle, e a sedici punti della campagna ogni casella aperta si raggiunge, le
isole chiuse no, i blocchi stanno sui ponti giusti e ci si ferma prima;
l'animale e la durata dei viaggi; il sentiero uno solo, di chi gioca; nello
zaino la riva e le quattro isolette del cane con la loro tana dipinta o la
nuvoletta), `integrazione/passo-passo-mappa` (col dito vero, nei due mondi e
coi due protagonisti). Bersagli: la mappa `[data-mappa]` con
`[data-mondo="valle"|"zaino"]` e `[data-protagonista="coniglio"|"cane"]`, il
selettore `[data-scegli="coniglio"|"cane"]` (col cane chiuso
`[data-serve-cane]`), la vista `[data-isole]`
(con `[data-camera]`); i cartelli `[data-insegna]` (lo stendardo, col nome
come testo; lo stemma di un'isoletta ha solo l'icona) con `[data-scalino]`,
`[data-isola]`, `[data-animale]`, `[data-velata]`; le caselle `[data-tappa="<indice>"|"senza-fine"|"senza-fine-cane"]`
con `[data-stato]` e `[data-strada="coniglio"|"cane"]` (il numero sta in `.pp-tondo b`, le stelle di una fatta in `[data-stelle]` con `[data-piene]`), l'animale di un
sentiero `[data-sentiero-di="coniglio"|"cane"]`, la matita
`[data-a-meta]`; i blocchi `[data-blocco="<ponte>"]` con `[data-chiude]`;
le tane `[data-tana="<isola del cane>"|"zaino"|"valle"]` con `[data-aperta]` (di
un'isola del cane è la bocca dipinta, col masso se chiusa); i passaggi
`[data-passaggio="zaino"|"valle"]`, con l'insegna `[data-chiama]` (il nome in `[data-nome]`, i
numeri in `[data-sotto]`); il segnalino `[data-segnalino]` con
`[data-animale]`, `[data-al]` e `[data-in-viaggio]`, la nuvoletta `.pp-sbuffo`;
il fumetto `[data-fumetto]` con `[data-fumetto-per]` (un indice,
un sentiero, `blocco:<ponte>`, `zaino`), `[data-azione="parti"]`,
`[data-serve]` e, su un sentiero, `[data-record]`; nel fumetto l'emoji del livello `[data-livello-icona]` e le cose nuove `[data-nuovo]`.
`giocaSullIsola(page, indice)` in `test/aiuto/browser.mjs` sceglie il
protagonista della casella, passa di là dalla tana se sta nell'altro mondo, aspetta il
segnalino fermo e fa i due tocchi; `statoSullIsola` legge lo stato (di là
da una tana chiusa è `chiusa`).
