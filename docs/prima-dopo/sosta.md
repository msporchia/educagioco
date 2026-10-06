# La tappa lasciata a metà

Si esce con ← anche a metà tappa, e rientrando la mappa offre in cima
«torno da dove ero». La regola comune è in
[../core/ripresa.md](../core/ripresa.md); qui quello che è di Prima e dopo.

- **Si scrive** (`src/giochi/prima-dopo/motore/sosta.js`): la tappa per
  chiave, le storie fatte, gli errori, le ultime due storie proposte (quelle
  che non devono tornare subito), il verbo, la serie di storie giuste, le
  monete già prese e la **domanda aperta com'è**. Una domanda è lo stato
  della classe `Quesito*`: vignette sparse e posate, la fila col buco con le
  tre opzioni, l'intruso e dov'è. Le storie si ritrovano per chiave.
- **La domanda non si rifà**: uscire e rientrare per avere una domanda più
  facile sarebbe una mossa. Per lo stesso motivo la domanda *appena
  sbagliata* si salva sbagliata: rientrando si riapre la stessa spiegazione,
  lo sbaglio è già contato e non si conta due volte.
- **Rientrando**: una domanda appena giusta (il ✔️ di mezzo secondo) passa
  alla prossima come se il respiro fosse finito; la storia era già contata.
  Non c'è orologio, quindi la ripresa non nasce in pausa.
- **Si salva a ogni tocco**, a ogni storia e a ogni spiegazione chiusa,
  oltre che col ←, a pagina nascosta, a `pagehide` e in `onBeforeUnmount`.
- **L'ultima storia giusta non perde la tappa**: dentro il respiro prima del
  cartello i tocchi non scrivono (la sosta di prima resta), ma uscire chiude
  la tappa lì (`completa`, senza fanfara) e la sosta si toglie. Altrimenti
  un ← a mezzo secondo dalla fine butterebbe stelle e monete.
- **Una tappa finita non lascia sosta**: `scrivi` torna `null`; cominciarne
  una nuova la butta, dopo aver chiesto.
- **Si perde**: il respiro dell'ultima storia mentre si esce (si chiude da
  sé), la finestra cieca di mezzo secondo della domanda nuova, la spiegazione
  aperta da sette secondi (si riapre intera). Un salvataggio che non torna
  (storia o tappa tolte dal codice, forma sbagliata) si butta e la tappa
  ricomincia; `VERSIONE` sale quando un campo cambia significato.
- **Gli aiuti 💡 non ci sono** in questo gioco, quindi niente da non
  ripagare; le monete si pagano già a ogni storia (`borsellino.paga`) e la
  sosta riparte da `borsa(chiave, monete)`.

Nei test: `unita/prima-dopo-sosta` (ogni momento di ogni tappa torna com'era
dopo JSON, quello che non torna non si legge, la tappa si ritrova per
chiave), `integrazione/prima-dopo-sosta` (←, rientro, `pagehide` a
spiegazione aperta e ricarica, una sosta scritta a mano che si finisce, ←
nel respiro, l'avviso della tappa nuova, il salvataggio che non torna). I
bersagli sono quelli comuni di [../core/ripresa.md](../core/ripresa.md).
