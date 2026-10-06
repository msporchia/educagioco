# La battaglia lasciata a metà

Si esce con ← anche in mezzo a un'ondata, e rientrando la mappa offre in cima
«torno da dove ero». La regola comune è in
[../core/ripresa.md](../core/ripresa.md); qui quello che è del castello.

- **Si scrive tutto il campo**, non solo fra un'ondata e l'altra
  (`src/motore/castello/sosta.js`): tabellone, torri, i mostri in strada con
  gelo, veleno e chi è a terra, quanti ne deve ancora sputare la bocca, le
  ondate aperte e i regali in sospeso. Ripartire dall'inizio dell'ondata
  avrebbe tolto le torri comprate nel frattempo, cioè i conti fatti.
- **Le torri si scrivono per piazzola**, non per posizione: una piazzola che
  non c'è più (carta cambiata) rende il salvataggio illeggibile, e la tappa
  ricomincia.
- **I colpi in volo e gli schizzi si perdono**: le torri che hanno appena
  sparato tengono la ricarica, quindi uscire e rientrare non regala un colpo.
- **Il conto aperto si perde**: l'energia di una torre si paga a conto finito,
  quindi a metà conto non si è speso niente.
- **Si salva anche la velocità** (1×, 2×, 3×), e le monete già prese restano
  nel conto della partita.
- **A partita finita** (vinta o persa) la sosta si toglie; una tappa o una
  libera nuova la butta, dopo aver chiesto.
- Il velo della pausa copre anche il ←: per uscire si riprende e si preme ←.

Nei test: `unita/castello-sosta` (la stessa battaglia dopo JSON, la libera
col regalo in sospeso, quello che non si legge), `integrazione/castello-sosta`
(←, rientro, ricarica della pagina, l'avviso della tappa nuova). I bersagli
sono quelli comuni di [../core/ripresa.md](../core/ripresa.md).
