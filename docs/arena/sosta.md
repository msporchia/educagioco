# La partita lasciata a metà

Uscire non butta via la battaglia: si scrive dov'era in `profile.campagne.arena.sosta`
(`motore/sosta.js`) e la mappa la offre in cima. Regola comune:
[`../core/ripresa.md`](../core/ripresa.md).

- **Si salva quello che è successo**: tempo, monete, miniera, castelli (vita e
  livello), porte, caserme (truppa, livello, vita, prossima squadra), il livello
  raggiunto da ogni edificio (si rifà da lì) e le truppe in campo.
  Le regole si rifanno dalla tappa.
- **Non si salva il caso**: dopo la ripresa i dadi del nemico sono altri. Per
  un gioco in cui il nemico decide a caso quando costruire non cambia niente
  che un bambino possa accorgersi.
- **La battaglia infinita** si salva con chiave `infinita` e il `terreno`, senza il tempo che resta (non c'è:
  conta `t`, quanto si resiste); `leggi()` la rifà con le truppe di quel terreno e una truppa di un altro
  terreno la butta. La carta della mappa dice il terreno e da quanto si resiste.
- **Quando non si salva**: partita finita o durata meno di cinque secondi.
- `leggi()` convalida ogni campo (numeri nei limiti, truppe della tappa, posti
  non doppi): un salvataggio storto si butta e la mappa resta com'è.
- Si scrive ogni cinque secondi, uscendo, e su `visibilitychange`/`pagehide`.
- `VERSIONE` sale quando un campo cambia significato (la 3 è quella degli edifici a
  due truppe: una partita a metà di prima si butta).
