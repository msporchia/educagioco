# La tappa lasciata a metà

Si esce con ← anche in mezzo a un cliente, e rientrando la mappa offre in
cima «torno da dove ero». La regola comune è in
[../core/ripresa.md](../core/ripresa.md); qui quello che è delle pozioni.

- **Si scrive la domanda aperta com'è** (`src/giochi/pozioni/motore/sosta.js`):
  il cliente in corso con la sua pozione e le sue dosi, lo scaffale, quali
  ingredienti sono già nel calderone, cosa c'è sul banco (l'ingrediente in
  mano, l'attrezzo scelto, i pezzi posati), i clienti serviti, le perfette,
  gli sbagli della tappa, della ricetta e della dose, e le dosi già dette al
  motore di apprendimento. Rifare la ricetta avrebbe lasciato scegliere una
  pozione più facile: uscire sarebbe diventata una mossa.
- **Si ritrova per ingrediente e dose, non per posizione**: ingredienti e
  pozione per nome, la dose per base e unità fra quelle della tappa, la
  tappa per chiave. Se uno non c'è più il salvataggio non torna, si butta e
  la tappa ricomincia.
- **Le stelle non tornano indietro**: gli sbagli già fatti restano, e dopo
  uno sbaglio sulla dose il cartello resta quello svolto. Le monete a dose
  sono già pagate e `answer()` ha già scritto, quindi la ripresa non
  ripaga né riscrive; `borsa('pozioni', dato.monete)` riparte da quanto era
  stato incassato e il cartello di fine dice il totale.
- **Un esito aperto non si perde**: dopo una dose giusta la sosta tiene
  l'esito, e rientrando il calderone mostra gli ingredienti e si va avanti
  (contatori `pozioni` e `pozioniPerfette`, cliente nuovo, tappa che
  finisce) come se non si fosse mai usciti. Uno sbaglio è già annotato:
  rientrando si è già al «riprova», senza ripetere l'attesa.
- **Si salva a ogni gesto** (un tocco sul banco costa poco; le dosi e gli
  sbagli scrivono subito), col ← (che dal banco porta alla mappa), a pagina
  nascosta, su `pagehide` e prima di smontare. Non c'è un orologio, quindi
  nessuna pausa: la tappa riprende com'era.
- **A tappa finita** la sosta si toglie; cominciare un'altra tappa la butta,
  dopo aver chiesto. Una tappa che a quell'età non è più aperta non offre la
  ripresa.

Nei test: `unita/pozioni-sosta` (la stessa partita dopo JSON in ogni punto
della dose, dopo gli sbagli, con l'esito giusto aperto, e quello che non si
legge), `integrazione/pozioni-sosta` (←, rientro, ricarica della pagina,
l'avviso della tappa nuova). I bersagli sono quelli comuni di
[../core/ripresa.md](../core/ripresa.md).
