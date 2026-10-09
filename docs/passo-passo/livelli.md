# Passo passo — come si scrive un livello

La mappa, i campi di una tappa, le misure di oggi e cosa controlla il banco.
La campagna sta in `src/giochi/passo-passo/dati/campagna.js`, che in testa
spiega i campi; il banco è `test/unita/passo-passo`.

## La mappa

Un elenco di righe, un carattere per cella (legenda in `dati/mondo.js`):

    .  prato      ~  acqua      *  ghiaccio      @  tana      P  partenza
    c  carota     C  carota sul ghiaccio
    m  masso      M  masso sul ghiaccio
    A  albero     B  cespuglio   S  sasso   O  sasso nel ghiaccio   (alti)
    t  tronco     -  staccionata                                    (bassi)
    1 2 3  le buche, a coppie
    r u g  le lastre (rossa, blu, gialla)
    p  una pecora   #  il recinto   (un livello con le pecore non ha la tana)

- **La carota e il masso hanno due lettere, un albero una sola**: sotto
  la carota o il masso il terreno conta per le regole (si scivola o no),
  sotto un albero no — un albero non lo attraversa nessuno.
- **Un livello è un posto, non una stanza.** Ognuno ha la sua forma (un
  prato, un bivio nel bosco, un fiume con le isole, un lago ghiacciato col
  buco), il fuori non è sempre un rettangolo pieno, e il `racconto` dice il
  piccolo «aha» che il livello esiste per far scoprire.
- **Misure**: al massimo sette per nove per i piccoli (stanno intere su un
  telefono), fino a nove per undici con lo zaino.

## I campi di una tappa

- **`scalino`** — il gradino. La regola del gradino **deve servire**: un
  livello del ghiaccio che si vince col ghiaccio trattato da prato insegna
  un'altra cosa.
- **`portata`** — la scala di tutto il repo (vedi
  [../apprendimento/eta-e-portata.md](../apprendimento/eta-e-portata.md)):
  dal 4 del prato al 44 di «Tutto insieme» e del cane, dal 46 al 74 con lo
  zaino. **44 e non 45 apposta**: la mira di un bambino di sei anni arriva a
  44, e un punto in più chiudeva l'ultima tappa (e il sentiero dietro) proprio
  a chi ha l'età giusta. Nessuna tappa dichiara `scuola`: dietro non c'è un
  pezzo di programma, e la testa della fila non si taglia mai.
- **`premio`** — monete della prima vittoria, una volta sola; sale col
  gradino perché sale il tempo che il livello chiede (vedi
  [stelle-e-aiuti.md](stelle-e-aiuti.md)).
- **`salti: true`** — accende la seconda fila di frecce. Solo dove serve:
  una fila di tasti inutili è una fila di tasti da provare a caso.
- **`trappole`** — solo nei livelli del cane: le mosse ingenue, che non devono
  vincere e devono fare un pezzo di strada prima di fermarsi.
- **stagione** — solo il vestito.
- **Con lo zaino**: `carte` (i tasti oltre alle frecce, es. `['ripeti']`),
  `zaino` (quante carte tiene la fila), `soluzioni` scritte con
  `programma()`, `ripeti()`, `se()`, e `fragili` (vedi [zaino.md](zaino.md)).

Quanto è lunga la strada più corta e se la regola serve **non si scrive nel
livello**: lo misura il risolutore.

## Cosa controlla il banco

Il **risolutore** (`motore/risolutore.js`) è una ricerca in ampiezza: lo
stato è piccolo, e basta. Lo stesso motore dà gli aiuti (la prossima freccia
giusta) e fa i sentieri senza fine. `test/unita/passo-passo` pretende:

- che ogni livello si vinca con la carota, e che la strada giocata dal
  motore vinca davvero con quattro stelle;
- che la regola del gradino serva (`serveLaRegola`), e con lo zaino che serva
  la carta (`serveLaCarta`) e che nessuna `fragili` prenda la carota;
- che chi segue soltanto gli aiuti arrivi a casa;
- che le `trappole` del cane falliscano dopo un pezzo di strada, che le mosse
  ingenue dello zaino facciano almeno due passi prima di fermarsi, e che il
  cane torni nei gradini dello zaino.

Le soluzioni scritte più corte le verifica `strumenti/passo-passo/minimi.mjs`,
che nei gradini del «fino a» e del «se» cerca anche un programma che stia
nello zaino **senza la carta del gradino**: se c'è, il livello insegna a
contare, non la carta (le nicchie di prima si vincevano con 🔁8(→ ← →),
perché passando avanti e indietro il cane spingeva la pecora fino in
fondo dal corridoio; oggi la stalla è fuori dalla sua vista). Il banco non
lo lancia: una ricerca così vuole minuti.

## Quando la fila cambia

- **Le stelle stanno sotto l'indice della tappa** (la forma di tutte le
  campagne, `src/giochi/campagne.js`): inserire una tappa in mezzo senza
  travaso sposta le stelle sul livello sbagliato.
- **Ogni fila giocata resta scritta in `FILE`** (`dati/campagna.js`), l'ultima
  è `FILA_ATTUALE`, e il profilo dice quale conosce (`cfg.fila`). `riordina`
  rimette le stelle per chiave.
- **La tappa raggiunta resta la stessa tappa**: chi era allo zaino resta allo
  zaino, e un gradino nuovo gli si apre alle spalle. È il contrario del
  costruttore (vedi [../costruttore/campagna.md](../costruttore/campagna.md)): un livello che ieri c'era
  e oggi è chiuso è la cosa che non deve succedere.
- **`TAPPE_PRIME`** è la fine dei massi (l'indice della prima tappa del
  cane): lì si fermano i traguardi di prima — una soglia che si allunga con la campagna farebbe tornare
  d'argento l'oro di chi le aveva finite tutte.
- **`cfg.eredita` è un cursore come `tappa`**: se la fila cambia si travasa
  con lei (in `Gioco.vue`, accanto a `riordina`).

### Le tappe in coda

Le tappe nuove del cane si aggiungono **in fondo a `CAMPAGNA`**, dopo
l'ultima del coniglio: gli indici di prima non cambiano, quindi non serve
una fila nuova in `FILE` né un travaso (l'ultima fila, `CAMPAGNA` stessa, si allunga e basta; quelle prima sono scritte per esteso).
Messe in mezzo, finivano sotto `cfg.eredita` di chi era già più avanti, e
si sarebbero aperte già fatte.

- **Sulla mappa vanno nella loro isola** (`motore/strade.js` le riconosce
  dalle pecore e dallo scalino), dopo quelle che c'erano; la strada del
  cane va di isola in isola, non per indice. L'isola vuole la sua casella in
  più nel foglietto (`"caselle"` del coniglio, `"cane"` del cane, sul
  sentiero e nell'isola), e si rilancia lo strumento
  ([foglietto.md](foglietto.md)).
- **`FINE_STRADA`** è la fine della strada del coniglio: lì la campagna è
  finita («tutte le tane», `libera`), e lì si ferma il cursore. Le tappe in
  coda non lo muovono (`postoNelCursore`, il `posto` di `completa`), se no
  il cane portava la riga della home, i traguardi e l'esperienza in fondo
  alla fila. I gradini del sentiero si contano finiti fino a lì.
- **Una tappa fatta resta aperta**: le stalle a gradini vinte prima che nel
  ripeti arrivassero il cortile e il pettine non si chiudono.
- Gli scalini in fila, la portata e il premio si controllano fino a
  `FINE_STRADA` e lungo la strada del cane.

## Le due strade

La campagna resta una fila sola (le stelle sotto l'indice), ma le strade
sono due, una per protagonista, e sulla mappa si sceglie chi gioca
([mappa.md](mappa.md#due-protagonisti)). Le ricava `motore/strade.js` dai
dati, senza elenchi scritti a mano:

- **una tappa con le pecore nella mappa è del cane**, le altre del
  coniglio. Ogni strada è in fila: il coniglio per indice, il cane di isola
  in isola (il pascolo, poi le sue tappe di ogni scalino delle carte, quelle
  aggiunte in coda dopo le altre della stessa isola).
- **Il numero sulla casella è il posto sulla sua strada** (`numero`): il
  coniglio da 1 a 42, il cane da 1 a 35. Provato col numero dell'indice: le
  tappe del cane infilate in mezzo facevano saltare i numeri (dopo il 36 il
  38, il 37 su un'altra isola).
- **Dove sta un'isola delle strade sul fondale non lo dicono le strade, lo
  dice il foglietto**: il cane ha il pascolo e poi, nell'ordine degli
  scalini, il ghiaccio, le buche, i massi e il prato della valle
  ([mappa.md](mappa.md#il-fondale)).

Chi apre cosa:

- **su ogni strada, fatta la tappa prima.** Le due strade non si
  aspettano: il coniglio non chiede mai il cane, e il cane, una volta
  cominciato, non chiede mai il coniglio. Le cose del mondo e le carte le
  insegna chi arriva prima: il fumetto spiega quello che il bambino non ha
  ancora visto su nessuna delle due ([mappa.md](mappa.md#il-fumetto)), e la
  manina del 🔁 indica la carta nella prima tappa che la mette in mano.
- **Il cane comincia quando il coniglio finisce «Tutto insieme»**
  (`apreIlCane`, la fine dei piccoli): l'unico punto dove le strade si
  toccano. Il primo gregge è tarato come «Tutto insieme» (portata 44).
- **L'età non chiude niente** (`perMerito` nel manifesto): chi finisce una
  tappa apre la dopo, a qualunque età; deciso dall'utente, «se ha finito
  tutti i livelli è giusto che sblocchi i livelli dopo». L'età decide solo
  da dove parte un bambino nuovo (una tappa passata nasce aperta) e se il
  gioco si offre in home.
- **fatta** vuol dire con almeno una stella, o sotto il cursore di prima.
- **Quello che il cursore di prima apriva resta aperto**: alla prima
  apertura il gioco scrive `cfg.eredita` (la `tappa` di quel momento), e
  tutto fino a lì resta aperto e conta come fatto. Il cursore `tappa`
  continua a salire con `completa()` (al massimo), e lo leggono i traguardi,
  l'esperienza e la riga della home; le aperture no.
- **Il ▶ a fine partita resta sulla strada che si sta facendo**
  (`prossima`): la tappa dopo sulla stessa strada; in fondo, il sentiero
  del suo animale, se è aperto.
- **La campagna è finita quando è finita la strada del coniglio**
  (`FINE_STRADA`, vedi sopra): la riga della home dice «tutte le tane». Il
  cane conta per le stelle.
- **Ogni sentiero senza fine si apre in fondo alla strada del suo animale**,
  e chi l'aveva già giocato lo tiene ([sentiero.md](sentiero.md)).

## Le tappe di oggi

L'elenco, con la strada più corta di ognuna: [tappe.md](tappe.md).
