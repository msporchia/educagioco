# Il castello: da fare

Le voci aperte, con quanto basta per riprenderle.

- **Dare più faccia al Bosco.** Il carattere è netto fra una campagna e
  l'altra, meno dentro il Bosco: *il sentiero* e *il folto* sono quasi la
  stessa mappa (anse orizzontali una sotto l'altra, stesso verso), e *il
  guado* e *la radice* ne sono parenti stretti; l'unica forma davvero sua è
  *la radura*, con l'anello. Sotto terra, sulle mura e nella palude nessuna
  si ripete. I due da rifare sono il sentiero e il folto
  (`BOSCO_SENTIERO`, `BOSCO_FOLTO` in `src/data/campagne-castello.js`, o una
  carta a mano in `A_MANO` di `src/motore/castello/carta.js`), sapendo che
  una strada nuova vuole `node strumenti/valida-percorsi.mjs` e
  `npm run tara`, perché la vita dei nemici è stata trovata su queste carte.
- **Il primo bivio non si spiega.** Dal 29 settembre il bivio dei rami c'è
  anche nel Bosco, dal guado in poi (è la seconda tappa di tutto il gioco):
  il foglio della torre al quarto gradino mostra le due carte con una riga
  ciascuna, e la guida del `?` ne parla in una riga. Se serva qualcosa la
  prima volta che compare — e cosa — è da decidere.
- **La gola perdona il pigro** (`PERDONANO` in `unita/castello`): il
  taratore guarda fin dove arrivano i nemici e non dove muoiono, e il capo
  in fondo toglie quattro cuori al metro e al pigro allo stesso modo.
- **Il castello a sprite: quello che manca.** I quattro vestiti per
  campagna (grotte e mura prendono in prestito lava e neve, vedi
  `VESTITO_DI` in `scena/vestito.js`); i mostri che respirano sul posto ma
  non camminano ancora, tranne il drago (i passi di lato e di fronte
  arrivano coi video di `cammino.py`).
