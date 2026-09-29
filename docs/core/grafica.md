# La grafica

Cosa c'è in `src/grafica/` e le regole per disegnare: la tela e la
telecamera, i pittori, gli scheletri dei personaggi, gli sprite e le
tessere.

## La regola di fondo

**Il tetto della resa grafica.** Dove un personaggio è disegnato a poligoni
e non a sprite (il robot del costruttore, per esempio), è una scelta di
stile e non un ripiego: altri giochi (il castello, il bestiario del
dungeon) sono passati agli sprite quando la scena lo chiedeva.

**Chi gioca non disegna.** Una view passa a `tela.disegna()` la lista delle
cose in scena (`{ che: 'torre', x, y, tipo, lv }`); una figura nuova è una
riga in `PITTORI`, mai un `ctx.arc` dentro il gioco. E in `grafica/` non
entrano energia e prezzi: solo fatti già decisi (`potenziabile: true`).

## I pezzi

- **`tela.js`** — canvas, sfondo in cache, ordinamento per profondità, e la
  **telecamera**: un mondo dichiara misure e scala, e la tela lo incornicia
  dove c'è posto. È così che il castello resta lo stesso su ogni schermo.
- **`geometria.js`** — i tracciati: l'unico posto dove gioco e disegno
  devono essere d'accordo su dove passa la strada.
- **`castello.js`** — i pittori, nella tabella `PITTORI`.
- **`spazio.js`** — il cielo degli asteroidi (nave, pianeta, sassi, raggi):
  riceve `danno: 0.5`, non sa che esistano le vite.
- **`corpo.js`** — **lo scheletro**: `persona()` per chi cammina su due
  gambe, `bestia()` per tutti gli altri. Chi lo usa scrive una *scheda di
  dati* e si ritrova ombra, respiro, lampo bianco della botta e
  ribaltamento da ko senza chiederli. Le schede stanno in tre cassetti:
  - `personaggi/` — il Generale;
  - `castello/corpi-mostri.js` — il tower defense;
  - `bestiario/` — il dungeon: venti creature viste **grandi e di fronte**,
    dove la paura la fa la forma e mai il macabro, con l'`ingombro` che le
    tiene dentro il riquadro.
- **`coriandoli.js`** — la festa. Dentro Vue si usa da `giochi/Festa.vue`,
  non si monta a mano.

**Un mostro del dungeon non è un'emoji.** Le emoji le disegna il telefono:
hanno lo stile di Apple in mezzo a uno schermo disegnato a mano, non si
tingono dell'ambiente e non tremano quando le colpisci.

**Un'icona si mette solo se aderisce perfettamente, se no si mette il
testo**: il vocabolario delle emoji è chiuso, e la domanda diventa «quale
somiglia di più» invece di «come si dice». Due icone della stessa famiglia
visiva non compaiono mai nella stessa domanda.

## Gli sprite e le tessere

Per disegnare con fogli di figure invece che coi poligoni:

- **`atlante.js`** — un foglio di figure e come si posano: il piede (`posa`,
  che appoggia la figura sul punto di contatto e non sull'angolo — figure
  di altezze diverse crescerebbero nel terreno), lo specchio, la scala
  intera. Gli atlanti li genera `strumenti/sprite/atlante.py` (vedi
  [sprite.md](sprite.md)). **`alone`** dice «questo si tocca» senza
  scriverlo: posa la sagoma tinta dello sprite otto volte attorno al
  posto dove andrà la figura, e ne resta visibile un bordo di un pixel —
  va chiamato prima della figura vera, o le mangia i bordi. È l'unica
  cosa che si tiene in cache (un `source-in` su un canvas a parte è caro,
  ma i pezzi che si illuminano sono poche decine, non l'atlante intero).
- **`tessere.js`** — *quale* tessera va in una cella, ricavata dai vicini
  (strade, pozze, recinti). Niente canvas: gira in Node e si prova in
  `unita/tessere`.
- **Una strada vuole etichette, non un sì/no per lato.** La seconda metà di
  `tessere.js` tratta il bordo come un'etichetta — *dove* passa, non *se*
  passa (`·`, `c`, `sx`, `dx`): sono le *Wang tiles*. `componiPercorso`
  sceglie le tessere come si risolve un sudoku (backtracking: sempre la
  casella con meno scelte possibili, così un ramo sbagliato fallisce
  presto). Il caso è deterministico sulla posizione (`caso(x,y)`), mai su
  un contatore: una strada che si ridisegna diversa a ogni giro si legge
  come un guasto anche quando è bella. Gli attacchi non si dichiarano: li
  **misura** dal foglio `strumenti/sprite/terreni.py`, che misura anche la
  griglia dall'alfa a ogni giro.
- **Le chiavi a quattro vicini sono lettere N/S/O/E**, sempre in
  quell'ordine (rende le chiavi confrontabili). Un pezzo mancante si
  cerca allo specchio (`riflessa`, che scambia O/E) prima di tornare
  `null` — un foglio quasi mai disegna tutti e quattro gli angoli.
- **`bordoOtto` guarda anche le diagonali**, dove `fettaDi` si ferma ai
  quattro vicini in croce: serve al dungeon, per l'angolo concavo dove
  due corridoi si saldano da dentro. Non tutte le 256 combinazioni di
  otto vicini contano — una diagonale cambia la forma solo se i due lati
  che la affiancano sono entrambi dentro (`angoliInterni`) — ed è la
  stessa riduzione dietro le 47 forme canoniche dell'autotiling "blob".
  Un set senza pezzi diagonali non resta scoperto: `fettaEquivalente`
  ripiega sulla forma a quattro vicini che `fettaDi` avrebbe scelto.
- **Le pose di una tessera sono al più otto** (4 giri × specchio):
  `giraSocket` fa un quarto di giro (i giri sono quattro perché la pixel
  art regge i 90°, non i 45°), pose identiche su ogni lato (un incrocio
  girato) restano una sola.
- **Il calco da guardare** è `giochi/sotterraneo/scena/tela.js`. La forma
  dei muri però viene da `scena/muri.js`: a tre quarti la faccia di un muro
  non è il bordo di una zona, è una cella intera che si vede da una parte
  sola (la regola sta in [`../sotterraneo/`](../sotterraneo/README.md)).

## I muri (`grafica/muri.js`)

Il pezzo di fondale più lungo, condiviso da tutti gli ambienti a stanze:
**il bordo è disegnato, la massa no**. Una cella di muro circondata da altri
muri non è una parete che qualcuno guarda, è la roccia dietro: disegnarci
sopra i conci riempie mezza mappa di tessuto che non dice niente. Solo le
celle che toccano il pavimento (`bordo`) portano conci, giunti, spessore,
ombra e muschio; le sepolte (`massa`) restano piatte e quasi nere — il
salto netto fra le due fa leggere la forma della stanza, e costa molto
meno da dipingere.

- **La muratura è continua su tutta la mappa**, poi ritagliata sulla
  sagoma dei muri: se le pietre si generassero cella per cella, ogni cella
  avrebbe i suoi giunti e si vedrebbe la griglia.
- **Il fuori (le celle piene per il motore ma non muratura) è nero e
  basta**: niente conci, niente spessore. Toglie la cornice di mattoni
  intorno a tutta la mappa, che altrimenti sembrava un edificio solo.
- **Il paramento può mancare** (`sotto: { muro: 'roccia' }`): il bordo si
  dipinge due volte, prima il nucleo poi il rivestimento che salta i
  blocchi caduti — il confine passa lungo i giunti, non fra due materiali
  incollati.
- **Sei passate**: ombra portata sul pavimento, la sagoma/massa, la
  muratura vera (una passata per voce di `mura`, ciascuna disegna solo
  dove tocca a lei — il confine corre sui giunti), il fianco in ombra,
  l'ombra del muro per terra (`multiply`, perché la luce viene sempre
  dall'alto), il filo di luce in cima, muschio e ragnatele negli angoli.
- **Il ritaglio per risparmio** (`soloSu`) salta la costruzione del
  tracciato quando non serve: su una mappa dove i muri sono un terzo delle
  celle, il costo scende di un terzo. Nessuna muratura è obbligata a
  usarlo.

## Il tessuto (`grafica/tessuto.js`) e i pittori comuni (`grafica/comune.js`)

- **Un ambiente dichiara due liste**, `mura` e `suolo`: la prima voce è il
  fondo, le altre si prendono una fetta di superficie dove dice il loro
  `campo` (chiazze di rumore correlato, `dove:` fa cadere due voci negli
  stessi posti). La fetta è un **quantile** dei valori veri e non una
  soglia fissa, se no la media di due rumori la superava una cella su
  cento e la stanza tornava a tinta unita senza dirlo. Il confine si
  decide **per blocco**, non per cella (passa dai giunti), e un cantonale
  (spigolo con vuoto su due lati non opposti) non si sfalda mai. Un suolo
  o un muro dichiarato nella mappa (`suoli.lastre` in legenda) vince per
  dichiarazione, non per rumore, e vale solo sulla sua cella. Due
  tentativi scartati: materiali mescolati a chiazze con tinte scelte a
  mano (famiglie cromatiche che non si conoscono) e un'anomalia sola
  cablata nel motore (per averne due bisognava riaprire il file).
- **`comune.js`** tiene ciò che chi disegna gli omini e chi disegna i muri
  devono avere in comune: colore (`mescola`, `tinge` — la tavolozza intera
  spostata verso una tinta, per il lampeggio di danno) e volume
  (`capsula`/`poligono`/`tondo` sul pennello di `tela.js`, `rett`/`ell`/
  `poly` sul contesto nudo). **`fillStyle` prende sempre un gradiente**,
  mai una tinta piatta: un colmo chiaro stretto in cima, un ginocchio, poi
  il fondo che si scurisce nel blu di notte (mai nel nero, che spegne)
  invece di sbiadire uniformemente — è quello che fa sembrare una forma
  tonda invece che carta stampata male. **`dado(a,b,c)`** è il caso
  deterministico di tutto il gioco: stessa stanza, stesso disegno, comunque
  e quante volte la si ridipinga.

## Il buio e le pozze di luce (`grafica/luce.js`)

Una pozza di luce non si aggiunge al buio: **glielo toglie**. Il velo del
buio si dipinge a parte su una tela di scorta, si buca con
`destination-out` dove una torcia è vicina, e solo dopo si posa sulla
stanza — dentro al buco si vede il pavimento vero, fuori la stessa stanza
al buio: una cosa sola illuminata a tratti, non due tinte piatte. Sopra,
`soft-light` con la tinta della fiamma satura il pavimento sotto la
torcia (non lo copre), e `screen` accende il cuore della pozza. Il buio è
sempre un velo piatto, mai una vignettatura (che seguirebbe la mappa
invece dello schermo). La luce del bosco (`chiazzeDiLuce`) usa `lighter`
(si somma) e non `soft-light`, perché sul verde una luce calda in
soft-light sposta la tinta verso l'oliva.

**`creaLuce`** risponde «che luce arriva qui» per i personaggi, con la
stessa curva (`caduta`) con cui le pozze dipinte sul fondale smettono,
così un personaggio si accende esattamente dove il pavimento è già dorato
e non prima.

## Le materie (`grafica/materia.js`)

Una tinta piatta non è stoffa: è carta ritagliata. La materia si dichiara
**per pezzo** e si posa dentro la forma dopo il colore, ritagliata sul
contorno — nel sistema di coordinate di chi disegna, già traslato sulla
figura, quindi la trama **è attaccata alla cosa** e ci si muove insieme
senza calcoli. Un tentativo scartato: un velo di grana su tutto il
fotogramma, alla fine — restava incollato allo schermo (non si muoveva
con la mappa) ed era uguale per tutti (uno scettro liscio e un tessuto
non sono la stessa cosa). Quattro trame (stoffa, cuoio, ferro, pelo), in
bianco/nero trasparente sopra il colore, disegnate una volta sola su un
quadretto che si ripete (`ctx.createPattern`).

## Gli ambienti (`grafica/ambienti/`)

Un ambiente è una voce di dati, un file per stanza: `mura` e `suolo`
(liste di tessiture con le loro tinte — la prima voce è il fondo, le
altre si applicano in ordine e l'ultima che cade è quella che si vede),
`campi` (mappe invisibili: una macchia larga con un nome, `umido: 5`
vuol dire che la stanza cambia umore ogni cinque celle), le tinte
(ognuna chiesta da qualcuno — `fondo` è quello che si vede nei giunti,
non «il colore del pavimento», e dev'essere più scuro delle lastre o i
giunti spariscono), `varianti` (il sacchetto pesato di `materiali/
varianti.js`, con `liscio` ripetuto due o tre volte) e `dettagli`
(`[nome, passo in celle, dove]`, dove `dove` può essere un campo o un
contesto geometrico come `angolo` o `controMuro`).

Due trucchi tornano in ogni file. **Ripetere la stessa tessitura due o
tre volte con tinte e semi diversi** è la varietà che costa meno di
tutte — tre righe, nessun pittore nuovo — ed è quello che toglie di
mezzo «il muro fatto di un colore solo ripetuto trecento volte». **Un
campo mette d'accordo effetti con la stessa causa**: il muro marcio, il
muschio e le pozze nominano tutti `umido`, e per questo finiscono nello
stesso angolo invece che in tre angoli a caso. La regola sopra tutte è
che **il fondo deve stare indietro** — le tinte di una stanza stanno in
un fazzoletto stretto, il contrasto forte è riservato ai personaggi, e
`muro` deve stare lontano da `lastra` (più scuro in una stanza chiara,
più caldo in una scura) o la stanza perde l'architettura.

**`muratura`, `posa`, `muro` e `lastra` non si scrivono più a mano**:
`ambienti/indice.js` li deriva dalla prima voce di `mura`/`suolo`, così
la stessa cosa non sta scritta in due posti che possono discordare — li
chiede ancora chi non passa dalle liste (l'anteprima di una cella sola,
la vetrina, i dettagli che pescano `A.lastra` per intonarsi).

## I terreni del castello (`grafica/terreni/`)

Stessa divisione di `ambienti/`+`materiali/`, spostata su un campo libero
invece che su una griglia di stanze: un **terreno** (`terreni/bosco.js`,
`mura.js`, `sotterraneo.js`) è *come* si dipinge il campo — le chiavi
della sua tavolozza sono apposta quelle degli ambienti del Generale,
così `POSE`, `DETTAGLI` e `variazioni` funzionano senza un adattatore —
e una **tavolozza** è *con che colori* (venti in tutto, una per tappa).
`terreni/indice.js` le compone scrivendo solo la differenza dalla base
(`tavolozze()`): una tappa nuova costa cinque righe, non cinquanta. Se
una tappa nomina un terreno che non esiste si dipinge il bosco di
mezzogiorno invece di un campo bianco.

Un terreno espone sei funzioni con la stessa firma (`p, A, scena`):
`fondo`, `strada`, `minuti` (ciuffi e crepe, mai sulla strada), `sparso`
(alberi, casse — mai sulla strada né sulle piazzole, ordinati per `y`
così chi sta più in basso copre chi sta dietro), `piazzola`, `velo`
(buio e luce, per ultimo — prima lo mangerebbe). Quello che una stanza
a caselle non può fare — oggetti sparsi liberamente, una strada che
attraversa il campo — sta qui e non in `ambienti/`.

**Le vie (`vie.js`) sono tre tecniche, non tre posti**: `battuto` (terra
pestata, il bosco), `acciottolato` (ciottoli lungo la curva — mai a
griglia, che in una curva si vede finta — con un filo di riflesso: sotto
terra l'acqua c'è sempre), `lastricato` (lastre sfalsate **due o tre per
fila**, mai una fila con la lastra intera — file allineate leggono come
una scala a pioli). `MEZZA` (17 unità) non è una scelta di gusto: le
piazzole stanno a 34 unità dal centro e sono larghe 15, quindi una via
più larga se le mangia.

Due dettagli misurati che vale la pena non ritoccare a occhio: in
`terreni/mura.js` il selciato è ruotato di un sesto di giro (0.52 rad)
perché i corsi orizzontali leggevano come un muro tirato su davanti
alla telecamera, non un cortile guardato dall'alto; in
`terreni/sotterraneo.js` le torce stanno ogni 260 unità (la pozza di una
torcia è larga ~150 — un passo minore le fonde in una fascia arancione
continua, che spegne il contrasto buio/luce) ma non meno di tre per
tracciato, altrimenti i percorsi corti restano bui per due terzi.

## Le tessiture (`grafica/materiali/`)

- **Una tessitura è una chiamata, non un nome**: `mattoni('#8f6146',
  '#5c3a29', { modo: 'rotto', quanto: 0.12 })`. Si porta dietro i colori
  (due voci vicine sono due muri diversi, e due voci si mescolano — è
  la varietà a buon mercato), `seme` (sposta tutto il caso: due voci
  uguali con due semi diversi sono parenti, non gemelli), `dove` (il
  campo della stanza che decide dove cade), `quanto` (la fetta di
  superficie) e `sporco` (quanto si interdigita il confine coi vicini).
  Prima un ambiente diceva solo `muratura: 'mattoni'` e i colori
  venivano da un dizionario a parte: una stanza aveva una tinta sola per
  famiglia, e il legame tessitura/colore era implicito e scritto in due
  punti lontani.
- **I modi stanno dentro il pittore**, non sono un velo sopra: un muro di
  mattoni sa venire nuovo, vecchio o mezzo caduto, e conosce lui cosa
  vuol dire — chi lo chiama dice solo `modo: 'rotto'`. Quando i modi non
  bastano la risposta è un pittore nuovo, mai un velo: così ogni
  tessitura resta provabile da sola nel catalogo
  (`strumenti/banco/catalogo.html`).
- **Il pavimento cambia a macchie, non a celle** (`varianti.js`): un
  disegno fatto solo di granelli con la stessa densità dappertutto si
  legge come una stampa, perché ogni cella somiglia alla vicina e
  l'occhio ritrova la griglia. Un reticolo di macchie ogni `MODULO`
  celle (5, cioè mezzo schermo di telefono — sotto le 3 le macchie
  diventano loro il motivo ripetuto, sopra le 8 non si vede più che
  cambia) pesca una posatura dal sacchetto pesato dell'ambiente
  (`A.varianti`, dove `liscio` sta quasi sempre due volte: è il vuoto
  che fa vedere il pieno) e la stende sfumando. Le due metà si toccano
  in un punto solo, la tabella `POSATURE` di `posature.js`.
- **Pavimento e muratura restano due tessuti diversi apposta** (i pezzi
  del pavimento sono sempre più grandi o più piccoli di quelli del muro,
  mai uguali): fatti della stessa misura, la stanza perde l'architettura.
- **I massi non hanno una misura sola** (`roccia.js`, `metallo.js`): la
  taglia esce da una curva (`r³`, non `r` dritto), che dà pochi pezzi
  grandi e tanti piccoli — la roccia vera. Con un numero pescato dritto i
  massi tornano tutti della stessa taglia in una maglia regolare, cioè un
  motivo che si legge come un tappeto di sassi uguali.

- **I dettagli** (`materiali/dettagli.js`, `dettagli-vivi.js`) hanno tutti
  la stessa firma (`c, x, y, s, A, r`: contesto, posizione, scala,
  ambiente, dado) e la stessa scala `s` (lato/20): tanti e piccoli, mai
  uno che si vede da solo — un dettaglio che si nota è un dettaglio
  sbagliato, il fondo deve restare indietro. Quelli vivi (erba, muschio,
  funghi) prendono i colori dall'ambiente (`A.erbaC`, `A.muschio`…) e non
  da una tavolozza propria, per poter stare in un cortile assolato e in
  una cripta.

## Le misure

- **La scala sta nella trasformazione del contesto** (`dpr × scala`, una
  volta per fotogramma), e da lì in poi tutto è in pixel dello sprite. Chi
  la moltiplica riga per riga prima o poi la moltiplica due volte, ed è
  invisibile a figura piccola.
- **Un mondo a tessere vuole ingrandimenti interi**, se no gli sprite si
  sfrangiano. Quando il campo è più largo dello schermo e la scala intera
  taglierebbe la mappa, si tiene intera **la cella in pixel dello
  schermo**, non la scala (`giochi/castello/scena/tela.js`).
