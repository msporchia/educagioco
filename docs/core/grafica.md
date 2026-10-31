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
- **`spazio3d/`** — il cielo degli asteroidi (three.js, WebGL 2): riceve
  dalla view la scena in pixel e la traduce in mondo; riceve `danno: 0.5`,
  non sa che esistano le vite. `spazio.js` disegna la nave piccola della
  rotta e dell'hangar ([../asteroidi/grafica-3d.md](../asteroidi/grafica-3d.md)). Il sotterraneo ha il suo
  3D accanto al gioco, `giochi/sotterraneo/scena3d/`: la discesa del motore vero in WebGL, con le
  figure dell'atlante istanziate e la maschera del visto ([../sotterraneo/grafica-3d.md](../sotterraneo/grafica-3d.md)).
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
- **Un oggetto non è trasparente: è scuro.** `alfa` su un pezzo posato sopra
  qualcosa lascia vedere quel che sta sotto (il pavimento attraverso un
  leggio): lì si passa `scuro: true` a `pezzo`/`ritaglio`/`posa`, che disegna
  il pezzo opaco e sopra la sua sagoma nera a trasparenza `1 − alfa`, fatta
  una volta per nome (niente `ctx.filter`, che Safari per iPhone non ha). Il
  pavimento e i muri, sul nero, restano con `alfa` semplice. Un disegno in
  codice fa lo stesso: tinte mescolate col nero, o `neraDi(tela)`. Provato
  `alfa` su tutto il campo: i fantasmi di cui sopra.
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
- **La forma dei muri** viene da `giochi/sotterraneo/scena/muri.js`: a tre quarti la faccia di un muro
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
| valle di Passo passo 1536×1024 | `isole-passo-passo.py` | q80, 257 KB, 31,8 | 675 KB, 37,2 | scala 1, `pixelated` |
| regno del castello 1024×1536 | `regno-castello.py` | — | 1127 KB, 37,9 | almeno 760 px di larghezza, si naviga |
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
  `pixelated` ripete il pixel e basta. A 3/4 il vicino
  più prossimo fa gradini di larghezza diversa: è il sorgente, ingrandito.
  Il filtro morbido li toglie ma sfoca: contro la stessa immagine ridotta con
  Lanczos al pixel del telefono, sul pezzo del cartello `auto` dà 36,1 dB e
  `pixelated` 29,9, ma nel gioco a DPR 2 e 3 `auto` sembra fuori fuoco accanto
  all'eroe, che è netto. Si tiene `pixelated`: il guadagno è la codifica.
- **Provato: WebP qualità 75–80 a scala 3/4 con `pixelated`: bordi impastati
  (la codifica, ora a posto) e pixel irregolari (il sorgente).** Provato:
  `image-rendering: auto` a 3/4: sfocato nel gioco. Provato: tavolozza a 256 colori (libimagequant) più
  WebP senza perdita: 33 dB a 2,3 MB su una mappa da 2048×1536, peggio del passo 12; non
  basta, perché sono immagini con grana. Provato: predire il pixel dal vicino
  e appiattire il rumore: più pesante del passo 12 a pari dB. Provato: un
  passo diverso per luce e colore (alla JPEG): nessun guadagno. Provato:
  la mappa a 1536×1152 con Lanczos nello strumento: più molle di quella a
  2048 sui telefoni a 3×, e il browser deve comunque ingrandirla.
- **I canvas della fattoria contano al più due pixel per
  pixel CSS** (`Math.min(2, devicePixelRatio)`): su un telefono a 3× il
  browser li ingrandisce di 1,5 con la sfocatura, e un pixel netto sbava. Non
  è stato toccato.

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
