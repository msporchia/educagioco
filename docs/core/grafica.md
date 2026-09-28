# La grafica

Cosa c'è in `src/grafica/` e le regole per disegnare: la tela e la
telecamera, i pittori, gli scheletri dei personaggi, gli sprite e le
tessere.

## La regola di fondo

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

## Le misure

- **La scala sta nella trasformazione del contesto** (`dpr × scala`, una
  volta per fotogramma), e da lì in poi tutto è in pixel dello sprite. Chi
  la moltiplica riga per riga prima o poi la moltiplica due volte, ed è
  invisibile a figura piccola.
- **Un mondo a tessere vuole ingrandimenti interi**, se no gli sprite si
  sfrangiano. Quando il campo è più largo dello schermo e la scala intera
  taglierebbe la mappa, si tiene intera **la cella in pixel dello
  schermo**, non la scala (`giochi/castello/scena/tela.js`).
