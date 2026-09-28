# I guasti

La rete di sicurezza degli errori (`src/incidenti.js`), come si ripara una
copia rotta, e cosa guardare quando qualcosa va storto su un telefono.

## Un errore non resta muto

Vue scrive in console e lascia la schermata com'era: a un bambino quello
si presenta come un tasto che non fa niente, e a chi deve capirlo il
giorno dopo non resta niente in mano. `incidenti.js` (agganciato da
`installa()` a `errorHandler` di Vue, agli errori fuori da Vue e alle
promesse rifiutate) fa tre cose:

1. **Lo scrive** in archivio sotto `incidenti`, fuori dai profili: un
   guasto è del telefono, non di un bambino. Se ne tengono gli ultimi 8,
   un guasto ripetuto è una riga sola col conto, e se ne registrano al
   massimo 3 per accensione (un errore nel giro di disegno si ripete
   sessanta volte al secondo).
2. **Lo dice** con un cartello in **DOM puro** — se a rompersi è Vue, un
   componente Vue non comparirebbe. Tasti: «↻ Riprova» (ricarica),
   «⤓ Riscarica il gioco» (`ripara()`), «chiudi e continua».
3. **Offre di riparare.**

I guasti si rileggono dalla pagina dei grandi: è così che si diagnostica
un telefono che non è il proprio. Quello che `incidenti.js` non può fare:
se è rotta la copia dell'app, questo codice non gira — lì la difesa è il
service worker che per la pagina prova la rete prima della cache (vedi
[aggiornamento.md](aggiornamento.md)).

## `ripara()` e `#ripara`

Buttano la cache e la registrazione del service worker e ricaricano. **Non
toccano IndexedDB né localStorage**: i progressi restano, ed è tutta la
differenza con «cancella i dati del sito». L'indirizzo si pulisce prima di
ricaricare, se no la pagina riaprirebbe riparando all'infinito. Il tasto
nella pagina dei grandi compare quando il gioco si è annotato un guasto.

Per una copia **vecchia** e non rotta la strada giusta è «↻ cerca
aggiornamenti»: `ripara()` butta tutto prima di avere il nuovo, e senza
rete lascia il telefono senza gioco finché la rete non torna.

## Quando qualcosa va storto

- **Un telefono dice che non va**: pagina dei grandi → guasti. Se la copia
  è monca, «Riscarica il gioco» o `#ripara`; se è solo vecchia, «cerca
  aggiornamenti».
- **«La partita di ieri è sparita»**: quasi sempre il timeout di 2,5 s di
  `openDb()` — i dati veri ci sono, vedi [archivio.md](archivio.md).
- **Il codice dei grandi dimenticato**: `#pin=1234`, o «Non ricordi il
  codice?» sul tastierino (vedi [`../genitori/`](../genitori/README.md)).
- **Un profilo cancellato per sbaglio**: il cestino, in fondo a
  *Progressi* (vedi [`../genitori/`](../genitori/README.md)).
- **Riprodurre uno stato difficile da raggiungere**: i cheat e la pagina
  `#admin`, in [comandi.md](comandi.md#i-cheat-dellindirizzo).
- **Un guasto che si vede solo dal telefono** (un tocco non è un click):
  si pubblica sul server di casa, vedi [pubblicare.md](pubblicare.md), e
  per il dito [il-dito.md](il-dito.md).
