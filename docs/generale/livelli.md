# I livelli del Generale: dove stanno e come si provano

Cosa è un livello nel codice, dove si mette in fila, come lo prova il banco
e le regole del motore che un livello deve sapere. **Come si scrive un
livello** — il metodo, le regole del mondo, il linguaggio, le misure — sta
in `src/data/livelli/GUIDA.md`: si legge quella e non il motore, e quello
che manca si verifica e si aggiunge lì.

## Un livello è dato puro

- Sta in `src/data/livelli/<cartella>/`: una **mappa a token e la sua
  legenda** (una cosa sola, `campo(...)`), scritte con le fabbriche di
  `src/data/livelli/scrivi.js` — `cose`, `chi`, `fai`, `se`, `quando`,
  `aiuto`, più `suoli`, `muri`, `arredo` per le mappe ([mappe.md](mappe.md)).
- **Le chiavi sconosciute esplodono all'import.** `livello()`
  (`src/data/livelli/livello.js`) rifiuta i campi del livello che non
  esistono, col suggerimento («forse intendevi `vince`?»); `scrivi.js`
  rifiuta le opzioni di una cosa o di un'unità che il motore non legge
  (`OPZIONI`, `controllaOpzioni`). Il perché: una chiave morta passa liscia
  e non fa niente in silenzio — `accorre` (sostituita da `reagisce`) ha
  lasciato rotto per settimane proprio il livello del rumore, e `vede: 4`
  invece di `vista: 4` fa un nemico cieco.
- **`OPZIONI` va tenuto allineato al motore.** È il prezzo giusto: una
  chiave tolta da tutte e due le parti fa esplodere i livelli che la usano
  ancora, cioè dice subito chi va aggiornato. Controllando a mano, attenti:
  cercare `d.chiave` nel motore dà falsi negativi (`fa`, `parte`, `schiera`
  sono destrutturate in una riga di `src/motore/generale/campo.js`).
- Il simulatore per provare i piani a mano è `strumenti/generale/piani.mjs`.

## La fila e i progressi

- La fila si dichiara in `src/data/generale.js`: `TRATTI`, ognuno col suo
  titolo, e `LIVELLI` ne esce. **L'ordine delle prove è la lezione**, e dove
  finisce un tratto ne fa parte.
- **I progressi stanno sotto l'`id` del livello** (`gen.stelle[id]`, vedi
  `src/views/generale/fila.js`), non sotto la posizione: la fila si riordina
  senza toccare le stelle di nessuno.
- **Un livello nuovo nasce nascosto**: arriva ai bambini solo se è in
  `APPROVATI` (per riferimento, non per id: un nome sbagliato è un errore di
  build). Fino ad allora sta dietro `settings.sperimentali`, col suo 🧪.
- Dopo il tutorial vengono le **storie a puntate** (`src/data/livelli/torta/`):
  pagine nello stesso posto, ognuna comincia da come l'ha lasciata quella
  prima, e ognuna si vince in più modi.

## Il banco: uno per tutti

Un livello **non si porta dietro un test suo**. `test/unita/livelli.test.mjs`
raccoglie i livelli dalla cartella e li passa al banco,
`test/aiuto/livello.mjs`, che li gioca col motore vero. Il contratto sta in
testa a quel file; in breve, i controlli standard:

- griglia rettangolare e bordo chiuso; unità, oggetti, posti e porte su
  pavimento **in ogni scena**; ogni fazione dice chi la governa;
- ogni soluzione non `fragile` vince su tutte le scene; una `fragile` ne
  vince almeno una e ne perde almeno una; una `lunga` vince ovunque ma
  costa più della stretta più corta; il piano vuoto non vince mai;
- togliendo un ordine qualsiasi a una soluzione stretta, perde;
- nessun ordine rifiutato da `guaiDi`, e ogni verbo delle soluzioni sta
  nella cassetta che il motore mette a schermo (`verbiPer`, non
  `liv.verbi`: così prende anche il verbo che quell'unità non sa fare);
- la scenografia è solo disegno: pittore esistente, su pavimento, mai sopra
  qualcosa in gioco; giocare non sporca i dati del livello.

**Quello che un livello ha di suo si dichiara nel campo `verifiche`**, e il
banco lo esegue (non `prove`, che vuol dire quante scene si giocano). **Una
chiave sconosciuta è un guasto.**

| chiave | cosa pretende |
|---|---|
| `nonInFila: true` | srotolate le strutture (rami in fila, corpo del ciclo una volta, chiamata = corpo dell'azione, «quando senti» subito, attese tolte) si perde una scena |
| `serveOgnuno: true` | con una sola delle unità del giocatore non si vince |
| `ordineConta: [[a, b]]` | scambiati quei due ordini (`'apri cancelletto'`) si perde; una coppia che non c'è nelle soluzioni è un guasto |
| `ordineLibero: true` | scambiati a due a due tutti gli ordini, si vince lo stesso |
| `senza: ['x']` | senza quella cosa (ordini che la nominano tolti) o quell'unità (fila azzerata) si perde |

Perché servono: [didattica.md](didattica.md) §8 e §11.

**Un test che elenca il vocabolario invecchia ogni volta che il vocabolario
cresce** (`BASI` in `test/unita/generale.test.mjs`): a ogni verbo nuovo si
riallinea il test, non lo si aggira. `aspetta` non dichiara i tipi che
accetta perché punta a una domanda (`vuoleCond`), non a una cosa.

## Regole del motore che un livello deve sapere

- **Chi è ostile e ti vede, ti viene addosso**, qualunque cosa stia facendo:
  il motore mette l'istinto in testa alle reazioni di ogni nemico
  (`conIstinto` in `src/motore/generale/allestimento.js`). Chi deve fare
  altro quando vede (la sentinella che dà l'allarme) dichiara una sua
  reazione `vedi`, e l'istinto non si aggiunge; chi sta in una schiera non
  ostile non fa niente.
- **Vedere scavalca sentire**: prima quello che vedi, poi quello che senti,
  poi il tuo giro (`VISTA` in `src/motore/generale/filo.js`). Provato alla
  pari: il carceriere che correva al rumore passava attraverso la ladra.
- **Un rifiuto parla**: una porta che non si apre (senza chiave, o `aMano:
  false`) torna `riuscito: false`, la riga del registro è rossa e porta il
  `motivo` (`src/motore/generale/elementi/porta.js`,
  `src/motore/generale/registro.js`).

L'editor di mappe di `strumenti/mappe/` è stato tolto: era fermo a un
formato che nessun livello usava più.
