# Il mercante, chi viene a bere e i suoni

Il banco non è un foglio di conti: c'è qualcuno che vende e qualcuno che
aspetta la pozione. Le regole del gioco stanno in [regole.md](regole.md); qui
come sono fatte le figure e cosa si sente.

## Le figure

- **Modelli nella creta, fotografati** (`scena3d/personaggi3d.js`, `npm run
  anteprime pozioni`): 320×320 in `dati/anteprime.js`, tutti nella stessa
  inquadratura, così i piedi cadono allo stesso punto (`PIEDI` in `figura.js`).
  Sul banco sono sprite: si piegano sui piedi, si schiacciano, saltano, hanno
  l'ombra. A camera ferma si vedono come il modello e non costano niente.
- **Il mercante** sta a sinistra del calderone e respira (`mercante.js`). A un
  ordine alza il braccio (una seconda foto, `mercante-porge`) e parla, se
  trabocca scuote la testa, a pozione pronta salta. In testa al rotolo c'è la
  sua faccia.
- **I clienti** sono sei (`CLIENTI`): la maga, la rana, il gufo, il gatto, il
  robot, il folletto. Il gatto è un tuxedo come Sherlock, il gatto di casa.
- Nella fila di una tappa non torna lo stesso cliente.

## Il cliente beve

A pozione finita il calderone sbuffa, poi (`cliente.js`) il cliente entra a
saltelli da destra, saluta col suo verso, il fiasco vola dal calderone alle sue
mani, beve d'un fiato, e **la pozione fa quello che dice il nome** (`effetto` in
`POZIONI`, la mossa in `EFFETTI`):

| effetto | pozione | cosa si vede |
|---|---|---|
| `ruggisce` | del Coraggio | si gonfia e trema, raggi arancioni |
| `sparisce` | dell'Invisibilità | svanisce e torna |
| `vola` | di Volo | sale fuori dallo schermo tra le piume |
| `ride` | della Risata | si scuote a saltelli |
| `forza` | della Forza | si accuccia, salta, atterra nella polvere e si gonfia |
| `dorme` | dei Sogni | si piega di lato, lettere di sonno che salgono |
| `corre` | di Velocità | fa avanti e indietro, poi scappa |
| `parla` | Parlante | chiacchiera a saltelli |
| `profuma` | Antipuzza | un giro di luci rosa |
| `gigante` | del Gigante | cresce a scatti, poi torna |

- **È il premio, e non decide niente**: tutto è già scritto quando comincia
  (monete, sosta, fine tappa), quindi uscire mentre beve non perde niente.
- **Beve sempre**: la pozione finita è giusta, anche dopo un trabocco. Quanto è
  costata lo dicono le stelle.
- Se l'ultimo ordine non ha traboccato il cartello si toglie: la scena è sua.
- Dura sei secondi e mezzo. Una mossa nuova vuole la riga in `EFFETTI` e in
  `suoni.js`: un test confronta le tre liste.

## I suoni

Sintetizzati in `suoni.js`, sopra `nota` e `rumore` di `src/audio.js`, e suonati
dalla scena. **Non dicono niente che non si veda**: a volume spento il gioco è
intero.

- **Le cose**: le ampolle posate, il liquido che gorgoglia salendo, la polvere,
  la radice che batte, il trabocco, il tuffo nel calderone, la spugna, e una
  bolla ogni tanto se nel calderone c'è qualcosa.
- **Le voci**: sillabe a caso per il mercante, un verso per cliente (`VERSI`).
- **Gli effetti**: uno per pozione (`EFFETTI` di `suoni.js`).

Nei test: `unita/pozioni` (pozioni, mosse, suoni e clienti si corrispondono),
`unita/pozioni-anteprime`. Dei suoni un test dice che esistono, non come sono.
