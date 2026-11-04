# La tappa lasciata a metà

Si esce con ← anche a pozione a metà, e rientrando la mappa offre in cima
«torno da dove ero». La regola comune è in
[../core/ripresa.md](../core/ripresa.md); qui quello che è delle pozioni.

- **Si scrive la domanda aperta com'è** (`src/giochi/pozioni/motore/sosta.js`):
  la pozione, il listino di ogni ingrediente, quanto c'è in ogni strumento e
  i pezzi comprati, i gettoni spesi, le macchie, le traboccate, e il procedimento:
  la ricetta, a che passo si è, cosa c'è nel mortaio e nel calderone. Rifare il listino avrebbe lasciato scegliere una
  pozione più facile: uscire sarebbe diventata una mossa.
- **Si ritrova per nome, non per posizione**: gli ingredienti e la pozione per
  nome, la tappa per chiave. Se uno non c'è più il salvataggio non torna, si
  butta e la tappa ricomincia. Una sosta di prima del procedimento (`v` sotto il 4) non si
  legge: la tappa ricomincia, e progressi e stelle restano.
- **L'ordine si scrive quando si ordina, non quando finisce di versarsi**: il
  motore ha già deciso tutto, e monete, `answer()` e fine della tappa partono
  subito. Uscire mentre il mercante versa non perde niente e non ripaga niente;
  rientrando gli strumenti sono già al loro livello.
- **Una macchia resta**: rientrando c'è ancora, e prima di ordinare si pulisce.
- **`borsa('pozioni', dato.monete)`** riparte da quanto era stato incassato, e
  il cartello di fine dice il totale.
- **Si salva a ogni ordine**, col ← (che dal banco porta alla mappa), a pagina
  nascosta, su `pagehide` e prima di smontare. L'ordine in preparazione non si
  scrive: non è ancora successo niente. Non c'è un orologio, quindi nessuna
  pausa: la tappa riprende com'era.
- **A tappa finita** la sosta si toglie; cominciare un'altra tappa la butta,
  dopo aver chiesto. Una tappa che a quell'età non è più aperta non offre la
  ripresa.

Nei test: `unita/pozioni-sosta` (la stessa pozione dopo JSON, con la macchia, e
quello che non si legge), `integrazione/pozioni-sosta` (←, rientro, ricarica
della pagina, l'uscita mentre versa, l'avviso della tappa nuova). I bersagli
sono quelli comuni di [../core/ripresa.md](../core/ripresa.md).
