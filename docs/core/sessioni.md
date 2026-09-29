# Le sessioni di gioco

Quanto ha giocato un bambino, e a cosa (`src/store/sessioni.js`, il
disegno in `components/TempoDiGioco.vue`).

- **Ogni sessione** (quale gioco, quando, quanti secondi) va in archivio
  sotto `sessioni:<id del giocatore>`, **fuori dal profilo**: il profilo si
  riscrive intero a ogni `persist()`, e un elenco che cresce ogni giorno
  finirebbe in ogni scrittura per sempre. Si tengono gli ultimi 100 giorni
  (`GIORNI_TENUTI`, `potate`).
- **Apre e chiude `App.vue`** (`entra`, `esci`), l'unico posto che sa quale
  schermata è aperta. Un gioco non se ne occupa: se dovesse ricordarsene
  lui, il prossimo gioco che nasce se ne dimenticherebbe.
- **Il telefono posato** col gioco aperto: la sessione si chiude su
  `visibilitychange`/`pagehide`, e c'è comunque un tetto di due ore
  (`MAX_SESSIONE`).
- **I tocchi di passaggio**: sotto cinque secondi (`MINIMA`) non si scrive
  niente.
- **Il giorno è quello locale** (`chiaveGiorno`): una partita delle 23:40 è
  di oggi anche se in UTC è già domani.
- **I conti sono puri** (`perGioco`, `perGiorno`, `oggiDi`) e provati in
  `test/unita/sessioni`; il grafico è fatto di barre di `div`, nessuna
  libreria.
- **Eliminare un bambino porta via il suo registro** (`scordaSessioni`).
- **Il tetto giornaliero per gioco non c'è, e non ci sarà come tempo**:
  il registro serve alle monete che calano sullo stesso gioco
  ([../genitori/varieta.md](../genitori/varieta.md)). Per quello tiene
  anche **una copia in memoria** (`vociInMemoria`), aggiornata subito da
  `esci`: chi conta le monete non può aspettare il disco, e la home che si
  apre uscendo da un gioco nemmeno. `secondiInCorso` è la partita aperta.
