# Passo passo — le caselle e gli stendardi

I pezzi di grafica che la mappa delle isole posa sul fondale
([mappa.md](mappa.md)): il tondo col numero del livello, lo stendardo col
nome dell'isola e l'insegna delle tane per l'altro mondo. Il codice è in
`viste/Casella.vue` (stato e stelle), `viste/Stendardo.vue`,
`viste/InsegnaTana.vue` e `scena/stendardo.js` (il disegno, puro),
`scena/tondo.js` (le misure che servono ai test), gli stili in `stile.css`.

## Le caselle: un tondo col numero

- **Una casella è un tondo col numero del livello**, come i led della scheda
  del robot ([../costruttore/scheda.md](../costruttore/scheda.md)): un
  disegno per ogni livello era solo clutter, non diceva niente che il
  fumetto non dica meglio. L'emoji del livello (`icona`) e il racconto
  stanno solo nel fumetto, davanti al nome (`[data-livello-icona]`); sulla
  mappa c'è il numero, e basta.
- **Lo stato lo dice il tondo**, non un disegno:

| stato | come si vede |
|---|---|
| `fatta` | d'oro, con le sue stelle a cavallo del bordo di sotto (le quattro, piene le prese, vuote le altre) |
| `ora` | il più grande e chiaro, col numero grosso, un anello d'oro che respira, e il segnalino sopra |
| `aperta` | chiaro, senza stelle |
| `chiusa` | spento, con il lucchetto piccolo sul bordo |

- **Le stelle stanno solo sulle fatte** (una aperta non vinta non ne ha di
  prese) e a cavallo del bordo, non accanto: le caselle stanno a otto pixel
  l'una dall'altra, e una riga larga quanto il tondo (quattro stelle da 12)
  che sporge di 2 non tocca mai la vicina. Hanno un contorno scuro per
  vedersi su ogni terra, dal prato alla neve. Il tondo è dentro il bottone
  con un filo d'aria (4 px): il posto da toccare resta il lato intero
  (`lato` nel foglietto: 52 nella valle, 48 nello zaino).
- **Una fila a metà ha la ✏️** sul bordo ([sosta.md](sosta.md)). Un'isola
  con tutte le caselle chiuse non è ancora raggiunta: le sue caselle e il suo
  stendardo sono velati.
- **I due sentieri senza fine** restano due tondi grossi e d'oro con ∞ e
  il loro animale sul bordo, per non confonderli con un livello.

## Gli stendardi

- **Il nome di un'isola è uno stendardo**, non un'etichetta: una stoffa
  appesa a un'asta con due pomelli d'oro, coda a V, filo d'oro e uno scudo a
  sinistra con l'icona del capitolo come stemma. È disegnato in codice in
  pixel come la sbarra e il masso (`scena/stendardo.js`, scala 3, rettangoli
  in un `<svg>`), così sta nello stile del fondale; il nome è testo vero
  sopra la stoffa (carattere con grazie, chiaro con contorno scuro) e la
  stoffa si allarga quanto il nome (`Stendardo.vue` lo misura con un canvas;
  `stimaNome` lo stima per i test, per eccesso).
- **Rosso per le isole del coniglio, viola per quelle del cane**; velato
  (isola non ancora raggiunta) è slavato, non trasparente, per leggersi.
  Un'isoletta del cane dello zaino ha solo lo scudo (`solo-stemma`, `stemma`
  nel foglietto): è piccola, e con tre caselle un nome non ci sta.
- **Non copre niente.** Il centro è `cartello` del foglietto, in pixel del
  fondale (lo stendardo è alto 54 px e largo fino a 200: alcuni stanno sul
  mare accanto all'isola, dove sulla terra non c'è posto senza coprire una
  casella). I test controllano caselle, animale seduto
  sopra, sentieri, ponti e tane, in tutti e due i mondi.

## L'insegna delle tane

- **La tana per l'altro mondo ha un'insegna**, non un'etichetta: «Lo zaino»
  come pillola chiara accanto alla tana si perdeva fra i fumetti, e il nome
  non diceva niente a un bambino. L'insegna dice che di là **si va avanti**:
  «I prossimi livelli · dal 36 in poi» nella valle, «I primi livelli · dall'1
  al 35» sulla riva dello zaino (i numeri li calcola `Mappa.vue` dalla
  campagna). È la stoffa dello stendardo appesa all'asta, **blu** (né un'isola
  del coniglio né del cane). Al posto della V ha una **punta d'oro** che scende sulla bocca
  dipinta (`freccia` nel foglietto è dove la tocca).
- **Ondeggia** (`pp-chiama`, 4 px in giù e su) se di là c'è una tappa aperta
  e non fatta; ferma se di là è tutto fatto. Chiusa (lo zaino a sei anni) è
  velata come uno stendardo, col masso sulla bocca.
- **Sta sopra la tana**, tutta nel fondale: nella valle fra l'asta e la bocca
  ci sono 70 px, e l'insegna è alta 69.

Nei test: `unita/passo-passo-valle` (l'insegna sta nel fondale, punta sulla bocca da sopra e non copre caselle né sentieri; gli stendardi e gli stemmi non coprono caselle, sentieri, ponti né tane, nei due mondi), `integrazione/passo-passo-mappa` (ogni tondo dice il suo numero e basta, le stelle solo sulle fatte, l'emoji nel fumetto, nessuno stendardo sopra una casella; l'insegna dello zaino coi numeri, ferma da chiusa e che ondeggia col viale da fare). Bersagli, in fondo a [mappa.md](mappa.md): `.pp-tondo b`, `[data-stelle]` con `[data-piene]`, `[data-livello-icona]`, `[data-insegna]`.
