# Le pozioni sullo schermo largo

Su uno schermo largo e orizzontale (da 900 pixel e rapporto da 5/4: un PC a scuola, un tablet girato a casa) il banco
**si stende**: le cose si allontanano in x dal calderone e non stanno ammassate. Il telefono in piedi resta identico.
La soglia è la stessa di Passo passo, del Robot e del sotterraneo ([../passo-passo/scuola.md](../passo-passo/scuola.md#lo-schermo-largo)).

## La carta in colonna

- **Pergamena, cartello, rotolo del listino e borsa stanno in una colonna a sinistra** (`stile.css`, 320 pixel, 380 da
  1200), la tela prende tutto il resto e tutta l'altezza. In alto al centro, come sul telefono, la pergamena copriva il
  calderone: in orizzontale l'altezza è poca e il banco non può scendere.
- **La griglia non tocca il template**: `.pz-scena` diventa `display: contents`, così tela, carta e piede sono celle della
  stessa griglia. Sul telefono la struttura è quella di sempre.
- **La colonna la legge anche la scena**: `--pz-colonna` (in pixel, mai un `clamp()`: una proprietà personalizzata si legge
  com'è scritta) dice a `scena3d/indice.js` quanto spazio a sinistra è coperto. Senza, la scena non si stende: il cancello
  è uno solo, la media query.

## Il banco che si stende

- **La telecamera centra il banco nel resto** (`setViewOffset` di mezza colonna): il dito, i bersagli e le frecce passano
  dalla stessa telecamera e restano giusti.
- **Si stende quanto ci sta alla profondità di sempre** (`PROFONDO × largo / LARGO`, dove `largo` è il rapporto della tela
  senza la colonna), **fra 1,4 e 1,6** (`STESA`). Sotto il minimo (a 1024 × 768 ci starebbe 1,05) la telecamera arretra un
  po': le cose restano più grandi che sul telefono, e distanziate.
- **Cambia solo la x dei posti, non le misure**: gli attrezzi (anche quelli spostati col dito, e il mestolo col suo
  gancio), gli strumenti di misura, la roba e le ampolle sul bancone, che si allunga. Ognuno ha il suo `stendi(f)`; le
  macchie seguono. Il tavolo e gli scaffali sono già larghi abbastanza.
- Le foto degli ingredienti (`npm run anteprime`) non c'entrano: sono i modelli da soli, non il banco.

Nei test: `integrazione/pozioni` gira sul telefono; a 1280 × 800 (`SCRIVANIA`) passa uguale, trascinamenti compresi.
La foto: `node strumenti/scatta-app.mjs 'pozioni=maestro&banco=1' --dist --aspetta 3000 --larghezza 1280 --alto 800 --pixel 1`.
