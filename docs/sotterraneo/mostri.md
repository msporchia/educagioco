# I mostri: gli abitanti e le difese

Il bestiario è fatto **per ambientazione**: ogni discesa (e ogni tratto dell'abisso) ha i suoi abitanti, il suo caporale e il suo mostro
grosso, e per strada, nei branchi, appostati e come caporali ci sono solo quelli. Poi cosa **resistono** i mostri, cosa **temono** e a quali
**stati** non sono sensibili. I dati: `dati/mostri.js` (la scheda: ossa, attacco, difesa, velocità, `resiste`, `teme`, `immune`, e le fasce di
bottino `FASCE`; `CAPORALE`), `dati/campagna.js` (`mostri` e `caporale` di ogni discesa e di ogni tratto dell'abisso, `brancoDi`, `caporaleDi`,
`guardianoDi`, `postiDelleCreature`), `dati/grossi.js` (le difese e la figura del grosso, `difeseDi`), `dati/elementi.js` (il vocabolario),
`dati/varianti.js` (gli scheletri armati e i gradi: [varianti.md](varianti.md)). Il perché delle difese, con le parole dell'utente, e come funziona
il conto: [abilita-elementi.md](abilita-elementi.md). Le creature sono quelle del catalogo comune ([../core/creature.md](../core/creature.md)).

## Gli abitanti (12 ottobre 2026)

L'utente: «in un dungeon ce ne sono più o meno sempre solo di 1 tipo, massimo 2; c'è troppa varianza all'interno dello stesso livello», poi
«farei più una questione di ambientazione, come in Diablo: in una zona trovi quel tipo di mostro, in un'altra un altro, così sai bene o male cosa
aspettarsi», e infine: **«una creatura sta in un posto solo, e l'abbinamento è fisso»**; da due a quattro abitanti, un caporale e il suo mostro
grosso. La proposta di partenza era [ambientazioni.md](ambientazioni.md): i doppioni sono stati tolti così.

| posto | scenario | abitanti | caporale | il suo grosso (la figura) |
|---|---|---|---|---|
| la cripta dell'altare | cripta | scheletro · zombie · fantasma | scheletro cavaliere (lo scheletro con scudo e spada) | Re Ossuto (il negromante) |
| la scalinata antica | cantine | ratto · goblin · melma | orco | Grumo (l'orco) |
| la torre in rovina | fornace | pipistrello · diavoletto · vespone · spirito di fuoco | golem di magma | Fiammetta (lo spirito di fuoco) |
| la grotta della scaletta | cantine | ragno · fungo · pianta · melma rosa | mostro di muschio | Zannaverde (il ragno) |
| la scala sommersa | cripta | granchio · piranha · polpo · fantasma azzurro | tartaruga | Gorgo (il polpo) |
| la botola segreta | cantine | lupo · cinghiale · serpente · ent | golem di muschio | Minotto (la bestia cornuta) |
| la miniera abbandonata | fornace | scorpione · golem · spirito elettrico | golem di lava | Carbonchio (il drago di lava) |
| l'abisso, le cantine | | melma viola · mostro viola · pipistrello occhio · ombra | golem di ghiaccio | (il giro dei sette) |
| l'abisso, la cripta | | ghoul · teschio azzurro · mummia | mietitore | |
| l'abisso, la fornace | | draghetto · occhio · golem di pietra · grifone | drago | |
| l'abisso, l'inferno | | bestia cornuta · negromante · troll | drago di lava | |

**L'inferno** (15 ottobre 2026) è il posto dove entrano le creature del bestiario che nessuna discesa usava: la bestia cornuta, il negromante e il troll (con `troll-clava` in `MOSTRI`: la chiave `troll` è la base dei grossi Fiammetta e Minotto, uno sprite che non si disegna), e il drago di lava che prima faceva solo Carbonchio. Non hanno una discesa della storia: stanno solo nell'abisso. Il negromante ha meno ossa degli altri per strada: nel test dell'abisso il caporale trovato per primo può essere lui, e il piano 60 deve pesare almeno quattro volte il piano 1.

- **I doppioni tolti** rispetto alla proposta: il ragno solo nella grotta (non nella scalinata); il vespone **fuori dalla botola**, e va nella
  torre; il pipistrello solo nella torre (non nella cripta e nell'abisso); la pianta solo nella grotta (non nella botola); l'ombra, il ghoul e
  il golem di magma ciascuno in un posto solo. Dove una creatura non aveva un posto nuovo ne è entrata una non usata: il cinghiale e l'ent
  (con il lupo e il serpente) per la botola, il golem di ghiaccio per le cantine dell'abisso, il mietitore per la cripta dell'abisso, il drago
  e il grifone per la fornace. Scelte mie, da guardare: il serpente sta nella botola (un prato) e non nella miniera, lo scorpione e il golem
  restano alla miniera; il mietitore è un caporale e non un grosso; il drago è un caporale dell'abisso, non il grosso.
- **I sette grossi sono nomi, non abitanti**: tornano nell'abisso (`GIRO_DELL_ABISSO`), più forti, con lo stesso pezzo col nome. Per questo
  la loro creatura (il polpo di Gorgo) può comparire in un'altra ambientazione solo come grosso. Il ragno e il polpo stanno anche fra gli abitanti
  del loro posto: Zannaverde è il ragno della grotta, grande.
- **Le missioni col mostro col nome** hanno una creatura del loro posto: la Dama Grigia (il fantasma della cripta), Chela (il granchio della
  scala sommersa), Zannagrigia (il lupo della botola), **Rosicchione è ora un pipistrello** e **Grattanaso un diavoletto ladro** (la torre ha i suoi
  abitanti; il goblin sta alla scalinata e la collana la rubava lui).
- **Il caporale** (`caporale` della discesa o del tratto) è la creatura che sta davanti al grosso, nell'anticamera ([piani.md](piani.md)), e porta
  la chiave dei piani senza grosso (`guardianoDi`): fatta caporale (`CAPORALE`: ossa ×1,25 e un colpo in più, i galloni) e **mai di grado comune**
  ([varianti.md](varianti.md)). Prima era la specie più dura della coppia; adesso lo dice il dato. Ha il bottino di chi guardava la chiave prima
  (la melma alla scalinata, il fungo alla grotta, il granchio coi suoi scudi alla scala sommersa…) e non di una fascia a parte, o la roba che resta
  e il denaro del villaggio sarebbero saliti.
- **La forza viene dal livello, non dalla specie.** Tutte le creature di strada hanno le stesse ossa (8) e cambiano **forma**: velocità (da 5 a 13),
  colpo (da 2 a 6), difesa (0 o 1) e le difese qui sotto. Quanto sono forti lo dicono `forza` (le ossa di tutti) e `spinta` (il loro attacco) della
  discesa e, dopo la storia, la curva delle zone ([zone.md](zone.md#le-misure)); nell'abisso quelle dell'abisso. Una specie sta in un posto solo: non c'è
  più il ratto che fa da sciame ai golem.
- **Dentro un posto si costa uguale**: gli abitanti costano in risposte (ossa diviso quello che passa della difesa) entro il 15% uno
  dall'altro, con la roba attesa di ogni eroe (`unita/sotterraneo-coppie`, `guastiDegliAbitanti`). Nella cripta, che si scende a mani nude, hanno tutti
  la stessa difesa (1). Dentro un posto si distinguono per come picchiano (colpo per velocità) e per cosa resistono, non per quanto resistono. Una
  variante e un grado non toccano ossa né difesa: [varianti.md](varianti.md).
- **I picchi sono pochi**: il caporale che porta la chiave, i caporali dell'anticamera ([piani.md](piani.md)) e il mostro grosso. I capi (gigante,
  troll) non stanno per strada: sono le basi delle statistiche dei grossi ([grossi.md](grossi.md)), non si disegnano.
- **I caporali sono più duri in colpo per velocità** (fino a 48, contro i 20–36 degli altri) e sono stati **misurati col banco**: mettere un
  caporale a caso al posto di chi guardava la chiave spostava una discesa di venti punti (la torre a sei su dieci passava da 64 a 86 col golem di
  magma lento, e la scalinata scendeva da 89 a 78 con l'orco). Il golem di magma sta a colpo 5 e velocità 9, l'orco a colpo 3 e velocità 7 (e Grumo e
  Zannaverde, che si reggono su di lui, a colpo +3), il mostro di muschio a 6 e 6, la tartaruga a 5 e 7, il golem di muschio a 6 e 8, lo scheletro cavaliere a 4 e 8. I numeri sono quelli del banco,
  non di un'idea: `npm run sotterraneo` ([scontro-bilancio.md](scontro-bilancio.md#gli-abitanti-per-ambientazione-12-ottobre-sera)).
- **Il vantaggio per chi gioca**: ogni posto ha un'identità («la grotta dei ragni e dei funghi»), e con gli elementi si prepara l'albero per quel posto:
  il fuoco alla grotta (il ragno, il fungo e la pianta lo temono), il gelo alla torre (il diavoletto, lo spirito di fuoco e il golem di magma), la luce
  sacra nella cripta.
- Provato: sette coppie a cicli di quattordici livelli, scelte dal livello come le zone (scartato dall'utente: la scalinata non sarebbe più sempre la
  scalinata dei ratti). Provato: il caporale come «la più dura della coppia» (non dice cosa sta davanti al grosso, e in una lista di quattro non è più una
  coppia).

## Le difese

- **Resiste**: l'abilità di quell'elemento fa metà. **Teme**: un danno e mezzo. **Non prende**: lo stato non parte (il colpo fa il
  suo danno). L'attacco solito non ha elemento, quindi non si dimezza mai e non si raddoppia mai.
- **Poche per mostro e sensate**, al più sei righe in tutto (`guastiDelleDifese`): quello che un bambino indovina guardando la
  figura (lo scheletro non si avvelena, la melma resiste al veleno, il lupo teme il fuoco). **I primi due, ratto e goblin,
  sono neutri** (e una variante armata li cambia: [varianti.md](varianti.md)): al livello 2 non c'è niente da sapere. A ogni elemento qualcuno è sensibile e
  qualcuno resiste, e a ogni stato qualcuno è immune (lo controlla `unita/sotterraneo-elementi`).
- **Il grosso porta le sue**: `difese` al posto di quelle della specie. Fiammetta conta come un troll, ma è di fuoco: lo resiste e non
  brucia. Senza `difese` (Re Ossuto, Grumo) ha quelle della specie.
- **Le difese non cambiano le ossa**: cambiano cosa conviene scegliere. Il banco di prova sceglie, fra le abilità delle sue caselle,
  quella che contro questi mostri toglie di più, difese comprese.

| mostro | posto | resiste | teme | non prende |
|---|---|---|---|---|
| goblin | scalinata | — | — | — |
| scheletro | cripta | veleno | luce sacra, fisico | non si avvelena, non sanguina |
| orco | scalinata | — | fulmine | — |
| gigante (capo) | — (base di un grosso) | gelo | fulmine | — |
| ratto | scalinata | — | — | — |
| pipistrello | torre | — | fulmine | — |
| melma | scalinata | veleno, fulmine | fuoco | non si avvelena, non sanguina |
| fantasma | cripta | fisico | luce sacra | non si avvelena, non sanguina, non gela |
| vespone | torre | — | gelo, veleno | — |
| fungo che morde | grotta | veleno | fuoco | non si avvelena |
| lupo | botola | gelo | fuoco | — |
| granchio | scala sommersa | fisico | fulmine | — |
| serpente | botola | veleno | gelo | non si avvelena |
| golem | miniera | fisico, luce sacra | gelo | non si stordisce, non si avvelena, non sanguina |
| troll (capo) | — (base di un grosso) | veleno | fuoco | — |
| zombie | cripta | veleno | fuoco, luce sacra | non si avvelena, non sanguina |
| scheletro cavaliere | cripta | veleno | luce sacra, fisico | non si avvelena, non sanguina |
| diavoletto | torre | fuoco | gelo | non brucia |
| spirito di fuoco | torre | fuoco | gelo | non brucia |
| golem di magma | torre | fuoco, fisico | gelo | non si stordisce, non brucia, non sanguina |
| ragno | grotta | veleno | fuoco | non si avvelena |
| pianta carnivora | grotta | veleno | fuoco | non si avvelena |
| melma rosa | grotta | veleno | fuoco | non si avvelena, non sanguina |
| mostro di muschio | grotta | veleno | fuoco | non si avvelena |
| piranha | scala sommersa | — | fulmine | — |
| polpo | scala sommersa | veleno | fulmine | — |
| fantasma azzurro | scala sommersa | fisico, gelo | luce sacra, fuoco | non si avvelena, non gela |
| tartaruga corazzata | scala sommersa | fisico | fulmine | — |
| cinghiale | botola | — | fulmine | — |
| ent | botola | veleno, gelo | fuoco | — |
| golem di muschio | botola | veleno, fisico | fuoco | non si stordisce, non si avvelena, non sanguina |
| scorpione | miniera | veleno | gelo | non si avvelena |
| spirito elettrico | miniera | fulmine | fisico | — |
| golem di lava | miniera | fuoco | gelo | non si stordisce, non brucia, non sanguina, non si avvelena |
| melma viola | abisso (cantine) | veleno | fuoco, luce sacra | non si avvelena, non sanguina |
| mostro viola | abisso (cantine) | — | fuoco, luce sacra | — |
| pipistrello occhio | abisso (cantine) | — | fulmine | — |
| ombra | abisso (cantine) | — | luce sacra | non sanguina |
| golem di ghiaccio | abisso (cantine) | gelo | fuoco | non si stordisce, non gela, non si avvelena, non sanguina |
| ghoul | abisso (cripta) | veleno | fuoco, luce sacra | non si avvelena |
| teschio azzurro | abisso (cripta) | gelo | fuoco, luce sacra | non si avvelena, non sanguina, non gela |
| mummia | abisso (cripta) | veleno | fuoco, luce sacra | non si avvelena, non sanguina |
| mietitore | abisso (cripta) | — | luce sacra | non si avvelena, non sanguina |
| draghetto | abisso (fornace) | fuoco | gelo | — |
| occhio | abisso (fornace) | — | fisico | — |
| golem di pietra | abisso (fornace) | fisico | gelo | non si stordisce, non si avvelena, non sanguina |
| grifone | abisso (fornace) | — | fulmine | — |
| drago | abisso (fornace) | fuoco | gelo | non brucia |
| bestia cornuta | abisso (inferno) | fuoco | gelo | — |
| negromante | abisso (inferno) | — | luce sacra, fisico | non si avvelena, non sanguina |
| troll | abisso (inferno) | veleno | fuoco | — |
| drago di lava | abisso (inferno, caporale) | fuoco | gelo | non brucia |

| grosso | statistiche della specie | figura | resiste | teme | non prende |
|---|---|---|---|---|---|
| Re Ossuto | scheletro | negromante | come la specie | | |
| Grumo | orco | orco | come la specie | | |
| Fiammetta | troll | spirito di fuoco | fuoco | gelo | non brucia |
| Zannaverde | orco | ragno | veleno | fuoco | non si avvelena |
| Gorgo | gigante | polpo | fuoco, gelo | fulmine | non brucia |
| Minotto | troll | bestia cornuta | veleno | fuoco | non si stordisce |
| Carbonchio | gigante | drago di lava | fuoco | gelo | non brucia |

## Cosa serve a chi

Una riga per posto, per scegliere le abilità: la **cripta** chiede la **luce sacra** (scheletro, zombie, fantasma la temono) e il fisico
delle abilità (lo scheletro lo teme, il guerriero no); la **scalinata** il fulmine (l'orco) e il fuoco (la melma); la **torre** il **gelo**
(diavoletto, vespone, spirito di fuoco, golem di magma); la **grotta** il **fuoco** (ragno, fungo, pianta, mostro di muschio); la **scala
sommersa** il **fulmine** (granchio, piranha, polpo, tartaruga); la **botola** il fuoco (lupo, ent, golem di muschio) e il gelo
(serpente); la **miniera** il gelo (scorpione, golem, golem di lava) e il fisico (lo spirito elettrico). Sul campo la scelta dice «teme il fuoco» o
«resiste al gelo» prima di rispondere ([scontro.md](scontro.md#linterfaccia-per-la-vista)).

Nei test: `unita/sotterraneo-coppie` (gli abitanti: da due a quattro per posto, il caporale, una creatura in un posto solo, la zona che li tiene,
per strada solo loro, il costo entro il 15%, il guardiano è il caporale), `unita/sotterraneo-elementi`, `unita/creature` (ogni creatura col
sotterraneo è disegnata da una specie o da un grosso; i fotogrammi ci sono).
