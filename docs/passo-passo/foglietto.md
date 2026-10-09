# Passo passo — il foglietto e lo strumento

Il foglietto di una valle (`strumenti/sprite/sorgenti/passo-passo/isole.json`
per la valle, `zaino.json` per lo zaino) dice dove stanno sul fondale
sentieri, caselle, ponti e tane; lo strumento
`strumenti/sprite/isole-passo-passo.py` ne fa il modulo del gioco. Il resto
della mappa sta in [mappa.md](mappa.md).

- **I sentieri sono spezzate in pixel del fondale**, una o più per isola.
  Uno con `"caselle": N` ne porta N del coniglio, distribuite dallo strumento
  fra i due `margini`; con `"cane": N` (e `margini-cane`, e `rovescio-cane`
  se si contano dall'altro capo) quelle del cane, a parte: ognuno vede solo
  le sue, e si controlla che non si tocchino solo fra le sue. Le caselle di
  un'isola si contano nell'ordine del foglietto, e la k-esima è la k-esima
  tappa della sua isola in `motore/strade.js`: per il coniglio quella con la
  chiave dell'isola dipinta, per il cane quella del `cane` dell'isola
  (`{ "isola": "ripeti-cane", "caselle": 6 }`). Uno senza
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
- **Le tane**: una con `da`, `a` e `punto` è un passaggio sotto terra fra
  due isole; con due punti (`punti: [[x, y], [x, y]]`, quello di `da` e
  quello di `a`) le due bocche stanno in posti diversi, come quella della
  casetta nello zaino, e `"nuvola": true` dice che dalla parte di `da` sul
  fondale non c'è un buco: l'animale sparisce e ricompare in una nuvoletta.
  Il masso, da chiusa, sta sulla bocca di `a`.
  Quella per l'altro mondo (`isola`, `punto`, `freccia`, dove la punta
  dell'insegna tocca la bocca, da sopra, e `scosta`, di quanti px la stoffa
  sta a destra della punta dove sopra la bocca non c'è posto) è un nodo
  `passaggio`.
- **Le rive e gli id**: `"libere": ["riva", "casetta"]` sono isole sempre
  aperte, senza caselle (la riva da cui si arriva dalla valle); `"prefisso": "z-"` si mette
  davanti agli id dei punti senza nome (`z-incrocio:3`), perché i due mondi non
  ne abbiano uno uguale (la mappa sa in che mondo sta un posto dal suo id).
  `"stemma": true` su un'isola le dà lo scudo e non lo stendardo (per
  un'isola piccola, dove il nome non ci sta).
  `blocco: [a, b]` di un ponte sposta la sbarra dai suoi capi (px dal capo).
- **Il sentiero senza fine** ([sentiero.md](sentiero.md)) è una casella
  tonda e d'oro, col suo animale in un tondino sul bordo anche da chiusa e il
  record nel fumetto. Ce n'è uno per animale, in fondo alla sua strada:
  `senza-fine` del coniglio in fondo alla spirale di «Tutto il mondo» (zaino),
  `senza-fine-cane` (`SENTIERO_CANE`, con `"cane": true`) alla tana di casa
  sul prato (valle); per l'altro animale è un punto della strada.
  `etichetta` è dove comincia il nome, col record o cosa manca. Provato in
  cima alle buche: stava a metà strada, e chi ci arrivava poteva andare
  avanti.
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
