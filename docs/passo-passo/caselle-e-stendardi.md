# Passo passo — le caselle e gli stendardi

I due pezzi di grafica che la mappa delle isole posa sul fondale
([mappa.md](mappa.md)): il tondo col numero del livello e lo stendardo col
nome dell'isola. Il codice è in `viste/Casella.vue` (stato e stelle),
`viste/Stendardo.vue` e `scena/stendardo.js` (il disegno, puro),
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
  (`lato` nel foglietto, 50–56 nello zaino).
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
  Un'isoletta del cane con una casella sola ha solo lo scudo (`solo-stemma`).
- **Non copre niente.** Nella valle il centro è `cartello` del foglietto
  (due sono stati spostati perché lo stendardo è alto 54 px: ghiaccio e
  pascolo); nello zaino sta in cima all'isola **dalla parte dove la prima
  riga finisce**, perché dall'altra entra il ponte (prima era dall'altra
  parte, sopra la strada). Dove l'isola è stretta (la sua tana è lì
  accanto) la stoffa ha un tetto (`cartello.max`) e il nome si stringe
  (`textLength`). I test controllano caselle, animale seduto sopra, sentieri,
  ponti e tane, nella valle e a ogni larghezza dello zaino.

Nei test: `unita/passo-passo-valle` e `unita/passo-passo-isole` (gli stendardi non coprono caselle, sentieri, ponti né tane, a ogni larghezza), `integrazione/passo-passo-mappa` (ogni tondo dice il suo numero e basta, le stelle solo sulle fatte, l'emoji nel fumetto, nessuno stendardo sopra una casella). Bersagli, in fondo a [mappa.md](mappa.md): `.pp-tondo b`, `[data-stelle]` con `[data-piene]`, `[data-livello-icona]`, `[data-insegna]`.
