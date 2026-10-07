# Passo passo — lasciare a metà

Si esce con ← anche a fila mezza scritta o a sentiero in corso, e rientrando
si ritrova tutto com'era. La regola comune è in
[../core/ripresa.md](../core/ripresa.md); qui quello che è di Passo passo.
Codice in `src/giochi/passo-passo/motore/sosta.js` (puro) e `Gioco.vue`.

## Un livello: la fila resta lì

- **Ogni livello tiene la sua fila**, come il costruttore tiene il suo
  programma ([../costruttore/campagna.md](../costruttore/campagna.md)):
  rientrando c'è, senza una carta in cima alla mappa e senza chiedere niente
  toccando un altro livello, perché un altro livello non butta niente. Sulla
  mappa una ✏️ segna i livelli con una fila a metà.
- **Si scrive la fila, il cursore e i gradini del 💡 scesi** (più la carta
  comprata e non ancora messa, che si riaccende gratis). Pagato e svelato
  non si scrivono: li dicono i gradini (`pagatoDa`, `svelatoDa`), così la
  stella 🧠 resta spenta per chi aveva comprato la strada intera.
- **Un gradino pagato si scrive subito**, insieme alle monete spese: uscire e
  rientrare non lo fa ripagare. Il resto si scrive mezzo secondo dopo ogni
  tocco, col ←, a pagina nascosta e prima di smontare.
- **Un livello vinto non tiene più la fila**: rigiocarlo è una partita nuova,
  con la scala del 💡 da capo e la stella 🧠 di nuovo da prendere.
- **Sta nella sosta comune** (`profile.campagne.passo.sosta`, con
  `salvaSosta`), non in un archivio a parte come il costruttore: una fila è
  una manciata di parole, e così va col profilo nel backup e nel cestino.
  Dentro, le file stanno **sotto la chiave del livello**, mai l'indice:
  riordinare la fila dei livelli ([livelli.md](livelli.md)) non le sposta.
- **Una fila che non torna si butta** e il livello ricomincia: una carta che
  quel posto non offre (un salto dove i salti non ci sono, una scatola senza
  zaino), una scatola non chiusa, più carte di quante lo zaino ne tenga, più
  gradini di quanti la scala ne abbia, un livello che non c'è più. `VERSIONE`
  sale se un campo cambia significato.

## Il sentiero senza fine: la sosta con la carta

- **Uscire non chiude la serie.** La mappa offre in cima «torno da dove ero»
  (`Ripresa.vue`), con l'animale del sentiero, il numero e quanti di fila.
- **I sentieri sono due, la sosta una** (`strada`, «coniglio» o «cane»; una
  sosta di prima, senza, era del coniglio). Toccare l'altro sentiero con
  una sosta aperta chiede prima, come un sentiero nuovo: «lascio perdere»
  scrive il record della serie nel suo sentiero. Il ▶ in fondo a una tappa
  del cane porta al sentiero del cane, e se c'è una sosta del coniglio
  torna alla mappa e chiede.
- **Si scrive il posto in gioco così com'è**, con la sua fila: è fatto a caso
  con quello che il bambino sapeva allora, e rifarlo dal seme dopo un gradino
  finito darebbe un posto diverso, cioè un'offerta rimescolata. Se il posto
  è vinto e il prossimo non è nato, si scrive solo il seme: il prossimo
  rinasce uguale.
- **Il record si scrive quando la serie finisce davvero**: con un aiuto
  pagato, con «lascio perdere», con un sentiero nuovo. Mai uscendo. La sosta
  perde la serie nello stesso salvataggio che scrive il record, così non si
  scrive due volte.
- **Un sentiero nuovo chiede prima** (il tasto del sentiero con una sosta
  aperta). Il ▶ dopo l'ultima tappa invece riprende quello lasciato.
- **Uscire mentre il coniglio entra in tana** paga la vittoria una volta sola
  (`vintaAMeta`): la sosta scritta subito dopo è già quella del sentiero
  vinto, senza posto, e rientrando si va al prossimo.
- Giocare un livello non tocca il sentiero lasciato a metà.

## Cosa si perde

Il giro in corsa (si riparte da ▶), la frase del 💡 sopra la mappa (i gradini
che la dicono sono gratis), la parte veloce del giro di prima.

Nei test: `unita/passo-passo-sosta` (la fila e il sentiero dopo JSON, cosa non
si legge, cosa non si scrive), `integrazione/passo-passo-sosta` (←, rientro,
la carta già pagata, ricarica, vinto si svuota; il sentiero ripreso, la
serie che resta, «lascio perdere» che scrive il record una volta).
Bersagli: `[data-a-meta]` sulla tappa, e quelli comuni di
[../core/ripresa.md](../core/ripresa.md).
