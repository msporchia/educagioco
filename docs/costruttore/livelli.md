# Il costruttore — come si scrive un livello

Un livello è **un ordine da evadere**: qualcuno chiede una cosa (il
capomastro, il re, la principessa) e il bambino scrive il programma con cui
il robot la costruisce. Le mappe sono ASCII (legenda in `dati/legenda.js`),
i programmi si scrivono con `dati/scrivi.js`. Sta in `dati/livelli.js`.

## I campi

| campo | cosa vuol dire |
|:--|:--|
| `chiave`, `nome`, `icona` | chi è: la chiave non si rinomina, è il posto dove si salvano le stelle e il programma |
| `capitolo` | in quale capitolo sta (`CAPITOLI`) |
| `impara` | la cosa nuova, in tre parole: la dice la mappa |
| `portata` | quanto è difficile, sulla scala 0–100 del repo |
| `premio` | le monete della prima vittoria |
| `chi`, `racconto` | chi ordina e cosa dice — l'unica consegna |
| `prova` | `disegno` \| `passaggio` (vedi [linguaggio.md](linguaggio.md)) |
| `ordini` | `[{ nome, lavagnette, mappa, robot? }]`: le situazioni su cui il programma deve reggere |
| `cassetta` | i blocchi che il livello offre |
| `colori` | i colori della pulsantiera (il primo è il colore di partenza di «metti») |
| `posti` | dove si può posare un mattone: di solito solo ↓ sotto i piedi; i lati (↘ ↙) nei livelli che li chiedono — il bosco, il ponte |
| `misure` | se i progetti possono avere misure |
| `attrezzi` | progetti già scritti e chiusi (`dati/attrezzi.js`): si chiamano, si leggono, non si cambiano, e lo zaino non li conta |
| `zaino` | quante righe può scrivere il bambino (vedi [progetti.md](progetti.md)) |
| `ragiona` | due frasi gratis che fanno pensare invece di suggerire: cosa chiede il livello e cosa lo rende difficile, poi la domanda giusta da farsi. Non nominano il blocco che risolve e non contengono la soluzione |
| `indizi` | da una a tre frasi concrete, 🪙10 l'una, dalla più larga alla più stretta; l'ultima può nominare blocchi, lavagnette e misure. I gradini che scrivono nel programma (🪙50 · 100 · 200) li aggiunge il gioco da sé, ricavati dalla `soluzione` |
| `soluzione` | un programma che vince tutti gli ordini: lo gioca il banco a ogni giro, e da lì escono i gradini degli aiuti |
| `fragili` | le mosse ingenue e plausibili, ognuna col suo nome: il banco pretende che ognuna perda almeno un ordine — se una vince, il livello non insegna quello che dichiara |

## Le regole per scriverne uno

1. **Un livello muove una cosa sola.** Il ripeti, poi il ripeti con la
   misura dell'ordine, poi il ripeti dentro il ripeti. Due cose nuove
   insieme vogliono dire due livelli.
2. **La fatica a mano prima.** Un blocco arriva quando farne a meno
   stanca: il muro da dieci mattoni scritto a mano è venti righe.
3. **Gli ordini sono la sfida.** Un livello con un ordine solo si vince a
   mano; con due, chi ha scritto il numero dell'ordine al posto della
   lavagnetta perde il secondo — e lo vede.
4. **Un posto diverso ogni volta**: altri colori, altra forma, un altro
   che ordina. È quello che fa di ventidue livelli ventidue posti e non
   la stessa schermata ventidue volte.
5. **I colori lavorano.** Un livello a un colore solo va bene per
   imparare un blocco; poi il colore diventa la ragione di una decisione
   (sopra i rossi, le strisce, la scacchiera) o una misura (le bandiere).

## Il porto aggiunge

I livelli del porto (`dati/porto/livelli.js` e `giornate.js`) hanno gli
stessi campi, più:

| campo | cosa vuol dire |
|:--|:--|
| `mondo: 'porto'` | sceglie il mondo (`motore/porto/mondo.js`) invece del cantiere |
| `tema` | il pavimento da disegnare: `molo` \| `magazzino` \| `bottega` |
| `prova: 'giornata'` | si vince se a sera gli obiettivi tornano (vedi [porto.md](porto.md)) |
| `ordini` | ognuno è **una giornata**: la mappa a coppie di caratteri, i `cassoni`, la `gru`, il `nastro`, i `clienti`, l'`obiettivo` (`motore/porto/esito.js`) e le lavagnette dell'ordine |
| `cose` | le cose che le domande del livello offrono («↑ sopra c'è [una cassa]»): solo quelle che servono |
| `leggere` | se le caselle dei valori offrono 📖, la lettura |

E una regola in più: **una giornata diversa deve cambiare il lavoro, non
solo i numeri**. Un'altra nave con più casse, i cesti in un altro ordine,
clienti che chiedono altro: il programma che ha ricordato la prima
giornata invece di guardarla la perde, e la mossa ingenua lo dimostra.

## L'ordine dei capitoli

Il «se» viene subito dopo il cantiere: una decisione è più semplice di un
progetto, e coi colori ha qualcosa da decidere fin da subito.
