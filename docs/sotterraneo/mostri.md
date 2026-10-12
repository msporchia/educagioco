# Le difese dei mostri

Il bestiario ([regole.md](regole.md#chi-ci-abita-il-branco-a-fasce)) dice chi sono, quanto costano e dove stanno; qui cosa
**resistono**, cosa **temono** e a quali **stati** non sono sensibili. Il perché (le parole dell'utente, 12 ottobre 2026) e come
funziona il conto: [abilita-elementi.md](abilita-elementi.md). I dati: `dati/mostri.js` (`resiste`, `teme`, `immune` sulla
scheda), `dati/grossi.js` (`difese` del grosso e `difeseDi`), `dati/elementi.js` (il vocabolario).

- **Resiste**: l'abilità di quell'elemento fa metà. **Teme**: un danno e mezzo. **Non prende**: lo stato non parte (il colpo fa il
  suo danno). L'attacco solito non ha elemento, quindi non si dimezza mai e non si raddoppia mai.
- **Poche per mostro e sensate**, al più sei righe in tutto (`guastiDelleDifese`): quello che un bambino indovina guardando la
  figura (lo scheletro non si avvelena, la melma resiste al veleno, il lupo teme il fuoco). **I primi due, ratto e goblin,
  sono neutri**: al livello 2 non c'è niente da sapere. A ogni elemento qualcuno è sensibile e qualcuno resiste, e a ogni stato
  qualcuno è immune (lo controlla `unita/sotterraneo-elementi`).
- **Il grosso porta le sue**: `difese` al posto di quelle della specie. Fiammetta è un troll, ma di fuoco: lo resiste e non
  brucia. Senza `difese` (Re Ossuto, Grumo) ha quelle della specie.
- **Le difese non cambiano le ossa**, né le misure della storia (il banco attacca soltanto): cambiano cosa conviene scegliere.

| mostro | fascia | resiste | teme | non prende |
|---|---|---|---|---|
| ratto | 1 | — | — | — |
| pipistrello | 1 | — | fulmine | — |
| goblin | 2 | — | — | — |
| melma | 2 | veleno, fulmine | fuoco | non si avvelena, non sanguina |
| fantasma | 2 | fisico | luce sacra | non si avvelena, non sanguina, non gela |
| scheletro | 3 | veleno | luce sacra, fisico | non si avvelena, non sanguina |
| fungo che morde | 3 | veleno | fuoco | non si avvelena |
| vespone | 3 | — | gelo, veleno | — |
| orco | 4 | — | fulmine | — |
| lupo | 4 | gelo | fuoco | — |
| granchio | 4 | fisico | fulmine | — |
| serpente | 4 | veleno | gelo | non si avvelena |
| golem | 5 | fisico, luce sacra | gelo | non si stordisce, non si avvelena, non sanguina |
| gigante (capo) | — | gelo | fulmine | — |
| troll (capo) | — | veleno | fuoco | — |

| grosso | sulla specie | resiste | teme | non prende |
|---|---|---|---|---|
| Re Ossuto | scheletro | come la specie | | |
| Grumo | orco | come la specie | | |
| Fiammetta | troll | fuoco | gelo | non brucia |
| Zannaverde | orco | veleno | fuoco | non si avvelena |
| Gorgo | gigante | fuoco, gelo | fulmine | non brucia |
| Minotto | troll | veleno | fuoco | non si stordisce |
| Carbonchio | gigante | fuoco | gelo | non brucia |

## Cosa serve a chi

Una riga per elemento, per scegliere le abilità: il **fuoco** contro melma, fungo, lupo, troll; il **gelo** contro vespone,
serpente, golem; il **fulmine** contro pipistrello, orco, granchio, gigante; la **luce sacra** contro fantasma, scheletro (e
non contro il golem); il **veleno** contro il vespone; il **fisico** (le abilità, non l'attacco solito) contro lo scheletro, e non
contro fantasma, granchio, golem. Sul campo la scelta dice «teme il fuoco» o «resiste al gelo» prima di rispondere
([scontro.md](scontro.md#linterfaccia-per-la-vista)).

Nei test: `unita/sotterraneo-elementi`.
