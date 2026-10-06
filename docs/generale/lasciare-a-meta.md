# Lasciare a metà

Un livello del Generale è un piano da scrivere in cinque-quindici minuti:
chi esce a metà (la cena, il telefono in tasca) ritrova il piano com'era.
La regola comune è in [../core/ripresa.md](../core/ripresa.md); qui il
Generale segue il modello del costruttore, non la sosta unica.

## Un piano per livello, in archivio

- **In archivio sotto `generale:<id del giocatore>`**, `{ piani: { <id del
  livello>: … } }`, come i programmi del costruttore
  ([../costruttore/campagna.md](../costruttore/campagna.md)). Sotto l'`id`,
  come le stelle: la fila si riordina.
- **Perché non la sosta unica con la carta in cima**: tutto quello che vale
  di una partita è il piano, e una scena a metà non vale niente (▶ riparte
  sempre dalla prima battaglia). Con un posto per livello aprirne un altro
  non butta niente, quindi non c'è niente da chiedere; l'elenco segna i
  livelli a metà («✎ lasciato a metà · 3 ordini scritti»).
- **Il formato** sta in `src/motore/generale/sosta.js` (`VERSIONE`,
  `scrivi`, `leggi`, `dice`). Si scrivono il piano, `svelato` (il gradino
  più grosso che ha scritto nel piano), chi si stava comandando, la
  battaglia che si guardava e i piani nemici letti coi gettoni. La scena,
  il registro e gli esiti si rifanno.
- **Uscire non è una mossa**: la soluzione vista resta vista (`svelato`
  non torna vuoto, quindi la seconda stella non si riprende uscendo), i
  gettoni spesi restano spesi, e gli aiuti pagati stavano già nel profilo
  (`genAiutiPresi`).
- **Quello che non torna si butta**: un'altra versione, un altro livello,
  un'unità che il livello non ha più, un verbo o un blocco sconosciuto, una
  cosa che in nessuna battaglia c'è. Il livello riparte dal piano vuoto. Un
  ordine ancora senza bersaglio invece è legittimo: si stava scrivendo.

## Quando si scrive e quando se ne va

- **Si scrive** poco dopo ogni ritocco al piano, col ←, su
  `visibilitychange` nascosta, su `pagehide` e prima di smontare. A scena in
  corso si salva il piano, non l'esecuzione: si rientra da fermi.
- **Prima che l'archivio abbia risposto non si scrive**: si cancellerebbero
  i piani degli altri livelli. Per questo l'elenco aspetta l'archivio prima
  di aprire un livello.
- **Vinto il livello, il piano a metà se ne va**, anche se dopo «Riprova»
  resta a schermo: finché non lo si cambia è il piano che ha vinto. Rigiocare
  un livello vinto riparte vuoto, com'era prima (la seconda stella dopo una
  soluzione svelata si prende riscrivendolo).
- **Un piano vuoto, senza aiuti scritti e senza gettoni spesi** non si
  tiene: non è successo niente.

Fuori dal profilo, quindi come `costruttore:<id>` non se ne va da solo
quando si elimina un bambino.

Nei test: `[data-a-meta]` sulla riga dell'elenco; `window.__gen.piani`,
`__gen.svelato`, `__gen.gettoni`. Unità: `test/unita/generale-sosta.test.mjs`;
browser: `test/integrazione/generale-sosta.test.mjs`.
