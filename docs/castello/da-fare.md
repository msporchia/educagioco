# Il castello: da fare

Le voci aperte, con quanto basta per riprenderle.

- **Dare più faccia al Bosco.** Il carattere è netto fra una campagna e
  l'altra, meno dentro il Bosco: *il sentiero* e *il folto* sono quasi la
  stessa mappa (anse orizzontali una sotto l'altra, stesso verso), e *il
  guado* e *la radice* ne sono parenti stretti; l'unica forma davvero sua è
  *la radura*, con l'anello. Sotto terra, sulle mura e nella palude nessuna
  si ripete. I due da rifare sono il sentiero e il folto
  (`BOSCO_SENTIERO`, `BOSCO_FOLTO` in `src/data/campagne-castello.js`),
  sapendo che un tracciato nuovo vuole `node strumenti/valida-percorsi.mjs`
  (fasce del Bosco: presidio 2,15–2,70) e `npm run tara`, perché la vita dei
  nemici è stata trovata su queste forme.
- **Il castello a sprite prende il posto di quello di oggi.** Il gioco con
  chiave `castello` (`src/giochi/castello/`, in prova) è lo stesso tower
  defense con un'altra pelle e le stesse tappe di `torri`. L'elenco di cosa
  manca — vestiti per campagna, camminate, il foglio delle torri da rifare —
  sta in testa a `src/giochi/castello/Gioco.vue` e in
  [`../core/grafica.md`](../core/grafica.md). Una voce riguarda la taratura:
  le tappe sono tarate sulla strada smussata, e quella a squadra della pelle
  è più lunga (`scena/pelle.js`) — il giorno dello scambio va rimisurata.
