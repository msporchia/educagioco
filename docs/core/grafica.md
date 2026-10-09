# La grafica

Cosa c'è in `src/grafica/` e le regole per disegnare: la tela e la
telecamera, i pittori, gli scheletri dei personaggi, gli sprite e le
tessere.

## La regola di fondo

**Il tetto della resa grafica.** Dove un personaggio è disegnato a poligoni
e non a sprite (il Robot, per esempio), è una scelta di
stile e non un ripiego: altri giochi (il castello, il sotterraneo) sono
passati agli sprite quando la scena lo chiedeva.

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
- **`castello/`** — i pittori del campo del castello che non sono figure
  (`PITTORI` in `castello/indice.js`: colpi, scoppi, piazzole, raggio,
  bocca, e in `segni.js` il livello, «immune» e la corona). Le torri, i
  mostri e il fondale li dipingono gli sprite: la pelle e i pittori di
  `giochi/castello/scena/`, sulla carta a scacchiera del motore
  (`motore/castello/carta.js`). Il castello a poligoni che c'era prima è
  stato tolto il 29 settembre 2026.
- **`spazio.js`** — il cielo degli asteroidi (nave, pianeta, sassi, raggi):
  riceve `danno: 0.5`, non sa che esistano le vite.
- **`corpo.js`** — **lo scheletro**: `persona()` per chi cammina su due
  gambe, `bestia()` per tutti gli altri. Chi lo usa scrive una *scheda di
  dati* e si ritrova ombra, respiro, lampo bianco della botta e
  ribaltamento da ko senza chiederli. Le schede stanno in `personaggi/`
  (il Generale); il cassetto `bestiario/` se n'è andato col Dungeon.
- **`soldi.js`** — **i soldi disegnati**, monete e banconote della bancarella:
  non un canvas ma HTML coi colori in CSS (`components/Soldo.vue`,
  `MazzoSoldi.vue`), e lo stile sta qui, in una stringa iniettata una volta
  sola. Li usano la bancarella e le domande dei soldi
  ([quiz-moduli.md](../apprendimento/quiz-moduli.md#i-soldi-in-mano-i-pezzi-della-bancarella)):
  un disegno nuovo di moneta si cambia qui, mai in una copia.
- **`coriandoli.js`** — la festa. Dentro Vue si usa da `giochi/Festa.vue`,
  non si monta a mano.

**Un mostro non è un'emoji.** Le emoji sono Twemoji, uguali su ogni telefono
([emoji.md](emoji.md)), ma restano un altro stile in mezzo a uno schermo
disegnato a mano, non si
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
  misurava dal foglio `strumenti/sprite/terreni.py`, per il castello a
  tessere — tolto col suo visore il 29 settembre 2026, quando il castello
  è passato alla carta a scacchiera. Oggi `componiPercorso` lo usano solo
  il banco (`npm run mondo`, che la accende quando un atlante porta gli
  attacchi) e `unita/tessere`.
- **Le chiavi a quattro vicini sono lettere N/S/O/E**, sempre in
  quell'ordine (rende le chiavi confrontabili). Un pezzo mancante si
  cerca allo specchio (`riflessa`, che scambia O/E) prima di tornare
  `null` — un foglio quasi mai disegna tutti e quattro gli angoli.
- **`bordoOtto` guarda anche le diagonali**, dove `fettaDi` si ferma ai
  quattro vicini in croce: serve ai corridoi, per l'angolo concavo dove
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

## Fedeli ai sorgenti

**Un'immagine dipinta entra nel file unico com'è, non più brutta.** Il WebP
con perdita (qualità 75–85) dava 28–32 dB contro il sorgente: bordi
impastati, colori che sbavano sul vicino. Ora ogni mappa, fondale e atlante
dipinto passa da `strumenti/sprite/codifica.py`: **WebP senza perdita su
colori a passo 12** (`PASSO`, uno solo per tutti; un foglietto lo cambia con
`passo`). Ogni canale cade sul multiplo di 12 più vicino e poi si codifica
senza perdita, alfa intatta: nessun pixel si scosta di più di 6 su 255, 37
dB, e i comandi stampano `KB, dB` a ogni giro.

| immagine | strumento | prima: formato, peso, dB | ora | come si mostra |
|---|---|---|---|---|
| terra di sopra 2048×1536 | `terra-di-sopra.py` | q75, 856 KB, 29,8 | 2241 KB, 37,3 | 3/4, `pixelated` (invariato) |
| icone delle discese, 8 × 96² | idem (`icone.passo` 16) | q80, 34 KB, 28,9 | 66 KB, 34,8 | piccole; ognuna sotto i 10 KB (un test) |
| valle di Passo passo 1536×1024 | `isole-passo-passo.py` | q80, 257 KB, 31,8 | 675 KB, 37,2 | scala 1, `pixelated` |
| regno del castello 1024×1536 | `regno-castello.py` | — | 1127 KB, 37,9 | almeno 640 px di larghezza, si naviga |
| zaino di Passo passo | idem | q80, 363 KB, 30,2 | 892 KB, 37,9 | idem |
| castello: 4 vestiti, ~1024×880 | `vesti.py --atlante` | q85, 238–284 KB, 28,8–32,5 | 366–429 KB, 37,2–37,9 | tela, `smoothing high` |
| castello: torri e mostri 1024×2004 | idem | q80, 759 KB, 28,3 | 1190 KB, 37,4 | idem |
| atlanti fattoria e sotterraneo | `atlante.py` | PNG, 1961 e 237 KB | invariati | scala intera, a pixel netti |

Gli atlanti della fattoria e del sotterraneo erano già PNG senza perdita
(il foglio ridotto alla sua griglia vera: `docs/core/sprite.md`): niente da
rifare. Il file unico passa da 14,4 a 19,0 MB, quasi tutto qui.

- **Perché senza perdita e non «WebP a qualità alta».** Sotto qualunque
  qualità il WebP con perdita sottocampiona il colore (4:2:0): a q98 si ferma
  a 33–34 dB, a q80 sporca il verde accanto a un contorno nero. `Pillow` non
  espone `sharp_yuv` né `near_lossless`, quindi si toglie la precisione al
  colore a monte e si lascia la codifica senza perdita: a parità di peso è
  quanto un JPEG 4:4:4 a q90 (674 contro 676 KB sul fondale della valle, 37,2
  dB), ma i bordi restano esatti e non c'è né macchia né blocco. Il passo 8
  (40,8 dB) pesa un quinto in più; il 16 (34,9 dB) un ottavo in meno e fa
  bande sui verdi scuri; il 24 si vede a bande dappertutto.
- **Il disegno non sta su una griglia, e a 3/4 si vede.** Ridotto a blocchi
  di p×p (p da 3 a 10, ogni fase) e rigonfiato dà 20–23 dB: i «pixel» hanno i
  bordi sfumati dal generatore. A scala intera (valle, zaino, atlanti)
  `pixelated` ripete il pixel e basta. A 3/4 (la terra di sopra) il vicino
  più prossimo fa gradini di larghezza diversa: è il sorgente, ingrandito.
  Il filtro morbido li toglie ma sfoca: contro la stessa immagine ridotta con
  Lanczos al pixel del telefono, sul pezzo del cartello `auto` dà 36,1 dB e
  `pixelated` 29,9, ma nel gioco a DPR 2 e 3 `auto` sembra fuori fuoco accanto
  all'eroe, che è netto. Si tiene `pixelated`: il guadagno è la codifica.
- **Provato: WebP qualità 75–80 a scala 3/4 con `pixelated`: bordi impastati
  (la codifica, ora a posto) e pixel irregolari (il sorgente).** Provato:
  `image-rendering: auto` a 3/4: sfocato nel gioco. Provato: tavolozza a 256 colori (libimagequant) più
  WebP senza perdita: 33 dB a 2,3 MB sulla terra, peggio del passo 12; non
  basta, perché sono immagini con grana. Provato: predire il pixel dal vicino
  e appiattire il rumore: più pesante del passo 12 a pari dB. Provato: un
  passo diverso per luce e colore (alla JPEG): nessun guadagno. Provato:
  la terra a 1536×1152 con Lanczos nello strumento: più molle di quella a
  2048 sui telefoni a 3×, e il browser deve comunque ingrandirla.
- **Scala 1 con l'eroe a scala 4 per la terra di sopra** (`SCALA_TERRA` e
  `SCALA_EROE` in `dati/terra.js`, due costanti) dà pixel regolari e netti
  come nella valle: è la resa migliore che si è vista. Il campo però si
  restringe di un quarto (sei celle in larghezza su 390 px) e tre prove del
  dito, scritte sulla vista di adesso, falliscono (`sotterraneo-terra`:
  `camminaVerso` si ferma a metà strada; `-missioni` e `-avventure`: tocchi
  e indicatori contati sullo schermo). È una scelta di gioco, non di codifica.
- **I canvas del sotterraneo e della fattoria contano al più due pixel per
  pixel CSS** (`Math.min(2, devicePixelRatio)`): su un telefono a 3× il
  browser li ingrandisce di 1,5 con la sfocatura, e un pixel netto sbava. Non
  è stato toccato.

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
  schermo**, non la scala (lo faceva il visore a tessere del castello,
  tolto; il castello di oggi compone la carta in un'immagine sola e la
  stira sul campo, che è dipinto e non a pixel).
