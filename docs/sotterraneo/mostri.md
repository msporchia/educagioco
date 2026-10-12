# I mostri: le coppie e le difese

Il bestiario è fatto di **coppie**: ogni discesa ha la sua, scelta per ambientazione, e per strada, nei branchi, appostati e come
caporali ci sono solo quei due. Poi cosa **resistono** i mostri, cosa **temono** e a quali **stati** non sono sensibili. I dati:
`dati/mostri.js` (la scheda: ossa, attacco, difesa, velocità, `resiste`, `teme`, `immune`; `duraDellaCoppia`, `CAPORALE`),
`dati/campagna.js` (`mostri` di ogni discesa e di ogni tratto dell'abisso, `brancoDi`, `guardianoDi`), `dati/grossi.js` (le difese
del grosso e `difeseDi`), `dati/elementi.js` (il vocabolario). Il perché delle difese, con le parole dell'utente, e come funziona
il conto: [abilita-elementi.md](abilita-elementi.md).

## Le coppie (12 ottobre 2026)

L'utente: «in un dungeon ce ne sono più o meno sempre solo di 1 tipo, massimo 2; c'è troppa varianza all'interno dello stesso
livello» (un piano pescava da cinque fasce: ratti, fantasmi e scheletri insieme), e poi: «farei più una questione di
ambientazione, come in Diablo: in una zona trovi quel tipo di mostro, in un'altra un altro, così sai bene o male cosa aspettarsi;
ci sono zone dove due mostri convivono, ma sono due mostri della stessa zona».

| discesa | scenario | coppia | la più dura (il guardiano) |
|---|---|---|---|
| la cripta dell'altare | cripta | scheletro · fantasma | fantasma |
| la scalinata antica | cantine | ratto · melma | melma |
| la torre in rovina | fornace | pipistrello · vespone | pipistrello |
| la grotta della scaletta | cantine | lupo · fungo | fungo |
| la scala sommersa | cripta | granchio · serpente | granchio |
| la botola segreta | cantine | orco · goblin | orco |
| la miniera abbandonata | fornace | golem · ratto | golem |
| l'abisso, tratto delle cantine · della cripta · della fornace | | ratto · melma · scheletro · fantasma · golem · pipistrello | |

- **La coppia è della discesa, non del livello.** Una zona (la discesa dopo la storia, con un volto nuovo) ha sempre la sua: la
  scalinata è ratti e melme, sempre più forti ([zone.md](zone.md)). Una specie può stare in due discese (il ratto sta nella
  scalinata e nella miniera, dove fa da sciame ai golem). Il dato sta accanto allo scenario e al grosso (`mostri` e `tettoBranco`,
  il branco più grande, in `dati/campagna.js`); l'abisso ha la coppia del suo tratto (`TRATTI_DELL_ABISSO`).
- **La forza viene dal livello, non dalla specie.** Tutte le specie di strada hanno le stesse ossa (8) e cambiano **forma**:
  velocità (da 5 a 13), colpo (da 2 a 6), difesa (0 o 1) e le difese qui sotto. Quanto sono forti lo dicono `forza` (le ossa di tutti)
  e `spinta` (il loro attacco) della discesa e, dopo la storia, la curva delle zone ([zone.md](zone.md#le-misure)); nell'abisso
  quelle dell'abisso. Il ratto della miniera è molto più forte del ratto della scalinata, e il golem sta sempre in cima.
- **Dentro una discesa si costa uguale**: le due specie costano in risposte (ossa diviso quello che passa della difesa) entro il
  15% una dall'altra, con la roba attesa di ogni eroe (`unita/sotterraneo-coppie`, `guastiDellaCoppia`). Le due si distinguono
  per come picchiano (colpo per velocità circa uguale: `minacciaDi`) e per cosa resistono, non per quanto resistono.
- **I picchi sono pochi**: il guardiano della chiave (la specie più dura della coppia, fatta **caporale**: ossa ×1,25 e un colpo
  in più, `CAPORALE`), i caporali dell'anticamera ([piani.md](piani.md)) e il mostro grosso. I capi (gigante, troll) non stanno per
  strada: sono le basi dei grossi ([grossi.md](grossi.md)).
- **Il vantaggio per chi gioca**: ogni discesa ha un'identità («la grotta dei lupi e dei funghi»), e con gli elementi si prepara
  l'albero per quella discesa: il fuoco alla scalinata (la melma lo teme), il gelo alla cisterna (il serpente lo teme), la luce
  sacra nella cripta.
- Provato: sette coppie a cicli di quattordici livelli, scelte dal livello come le zone. Scartato dall'utente: la scalinata non
  sarebbe più sempre la scalinata dei ratti.

## Le difese

- **Resiste**: l'abilità di quell'elemento fa metà. **Teme**: un danno e mezzo. **Non prende**: lo stato non parte (il colpo fa il
  suo danno). L'attacco solito non ha elemento, quindi non si dimezza mai e non si raddoppia mai.
- **Poche per mostro e sensate**, al più sei righe in tutto (`guastiDelleDifese`): quello che un bambino indovina guardando la
  figura (lo scheletro non si avvelena, la melma resiste al veleno, il lupo teme il fuoco). **I primi due, ratto e goblin,
  sono neutri**: al livello 2 non c'è niente da sapere. A ogni elemento qualcuno è sensibile e
  qualcuno resiste, e a ogni stato qualcuno è immune (lo controlla `unita/sotterraneo-elementi`).
- **Il grosso porta le sue**: `difese` al posto di quelle della specie. Fiammetta è un troll, ma di fuoco: lo resiste e non
  brucia. Senza `difese` (Re Ossuto, Grumo) ha quelle della specie.
- **Le difese non cambiano le ossa**: cambiano cosa conviene scegliere. Il banco di prova sceglie, fra le abilità delle sue caselle,
  quella che contro questi mostri toglie di più, difese comprese.

| mostro | coppia | resiste | teme | non prende |
|---|---|---|---|---|
| ratto | scalinata, miniera | — | — | — |
| pipistrello | torre | — | fulmine | — |
| goblin | botola | — | — | — |
| melma | scalinata | veleno, fulmine | fuoco | non si avvelena, non sanguina |
| fantasma | cripta | fisico | luce sacra | non si avvelena, non sanguina, non gela |
| scheletro | cripta | veleno | luce sacra, fisico | non si avvelena, non sanguina |
| fungo che morde | grotta | veleno | fuoco | non si avvelena |
| vespone | torre | — | gelo, veleno | — |
| orco | botola | — | fulmine | — |
| lupo | grotta | gelo | fuoco | — |
| granchio | cisterna | fisico | fulmine | — |
| serpente | cisterna | veleno | gelo | non si avvelena |
| golem | miniera | fisico, luce sacra | gelo | non si stordisce, non si avvelena, non sanguina |
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
