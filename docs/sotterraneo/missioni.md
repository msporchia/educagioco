# Le missioni dei personaggi

Sulla terra di sopra, in posti che hanno un senso, stanno persone che
chiedono un favore legato a una discesa precisa: *«la collana della nonna è
al primo piano della scalinata»*. Danno un motivo per scendere che non sia
«giù senza fine». Decise dall'utente il 7 ottobre 2026 con la grande storia
([la-grande-storia.md](la-grande-storia.md)); l'8 ottobre l'utente ha chiesto
di poterne prendere più d'una, di non proporle se sono troppe o se non si è
pronti, e di averle sempre davanti: *«una specie di albero di missioni»*,
*«un riassunto»*, *«le monete come regalo, volendo»*. Il codice:
`dati/missioni.js` (chi, cosa, dove, i requisiti, il premio, `TETTO`),
`motore/missioni.js` (l'albero, il segno, prendere e consegnare, il diario e il
promemoria, dove sta la cosa nel piano), `viste/Missione.vue` (il pezzo di
fumetto), `viste/Diario.vue` (col dettaglio) e `viste/Ritratto.vue`, `viste/Terra.vue` (chi sta fermo),
`motore/corsa.js` (`posaLeMissioni`).

## Chi le dà, e dove sta

Dove sta lo dice il foglietto (`personaggi`, con `piede` e `accanto` come i
mercanti: [terra-strumento.md](terra-strumento.md)). Non si attraversano e
non chiudono la strada a nessuno (`unita/sotterraneo-terra`).

| chi | dove | piede · accanto |
|---|---|---|
| la ragazza del pozzo | al pozzo del villaggio, dove si beve | [49, 36] · [51, 36] |
| il mugnaio | sotto il mulino, sul sentiero dei campi | [54, 22] · [56, 22] |
| l'eremita | davanti all'altare fra le colonne | [58, 9] · [60, 9] |
| la guardia | sul prato davanti alla torre | [45, 9] · [47, 9] |
| il pescatore | sulla riva dello stagno | [10, 23] · [12, 23] |
| il boscaiolo | dove il sentiero entra nel bosco, accanto al carretto | [21, 26] · [19, 26] |
| il vecchio minatore | nel villaggio, dove parte la strada per il bosco | [40, 36] · [42, 36] |

- **Figure disegnate in codice** (`RAGAZZA`, `MUGNAIO`, `EREMITA`,
  `GUARDIA`, `PESCATORE`, `BOSCAIOLO` in `viste/pixel.js`) finché non
  arrivano gli sprite: `<sprite>-fermo-0` nell'atlante (`ragazza-fermo-0`…)
  si usa da solo, come per il minatore. I prompt sono nella scheda
  `PROMPT-terra-di-sopra.md`.
- **Il minatore** indica sempre la strada; la sua missione sta sotto la
  frase, nello stesso fumetto, e dice chi altro ti cerca (sotto).

## L'albero

Dodici missioni: le nove di prima e tre seguiti (il goblin della collana, il
libro dei nomi, il sacco di farina). Ognuna dichiara i suoi `richiede`, e **si
sblocca da sola** quando sono tutti veri e la sua discesa è aperta (anche per
l'età: `aperta`); solo allora il suo personaggio mostra il «!». I requisiti:
`{ fatta: <discesa> }` la discesa è finita, `{ consegnata: <id> }` quella
missione è consegnata. Se ne aggiunge uno nuovo in `soddisfatto`
(`motore/missioni.js`) e in `guastiDelleMissioni`: un requisito che non si
conosce non si sblocca mai, e il guasto lo dice.

| missione | chi | discesa · piano | tipo | requisiti | premio |
|---|---|---|---|---|---|
| La Dama Grigia (un fantasma; id `badessa`) | l'eremita | la cripta dell'altare · 2 | sconfiggi | — | 💎 12 · 🪙 1 |
| La collana della nonna | la ragazza | la scalinata antica · 1 | trova | cripta finita | 💎 15 |
| Rosicchione (un ratto) | il mugnaio | la torre · 2 | sconfiggi | scalinata finita | amuleto azzurro · 🪙 2 |
| Il mazzo di chiavi della torre | la guardia | la torre · 3 | trova | scalinata finita | 💎 20 |
| Grattanaso (un goblin) | la ragazza | la torre · 1 | sconfiggi | **collana consegnata** | 💎 10 · 🪙 2 |
| L'ascia di suo padre | il boscaiolo | la grotta · 4 | trova | torre finita | 💎 25 |
| Il libro dei nomi | l'eremita | la grotta · 3 | trova | **Dama Grigia consegnata** | 💎 20 |
| Chela, il granchio gigante | il pescatore | la scala sommersa · 2 | sconfiggi | grotta finita | anello d'ambra · 🪙 1 |
| La canna d'oro | il pescatore | la scala sommersa · 3 | trova | grotta finita | 💎 25 |
| Zannagrigia (un lupo) | la guardia | la botola · 2 | sconfiggi | scala sommersa finita | 💎 30 · 🪙 2 |
| Il sacco di farina buona | il mugnaio | la botola · 1 | trova | **Rosicchione consegnato** | 💎 20 |
| La lanterna del nonno | il minatore | la miniera · 3 | trova | botola finita | teschio del cercatore |

I rami sono tre: **Dama Grigia → libro dei nomi**, **collana → Grattanaso**,
**Rosicchione → sacco di farina**; le altre sei (chiavi, ascia, Chela, canna,
Zannagrigia, lanterna) sono radici senza seguito.

- **Le radici** (le missioni senza altra missione davanti) bastano a ogni
  discesa: chi non ne consegna mai una incontra comunque una missione a ogni
  passo (`guastiDelleMissioni`). I rami (goblin, libro, sacco) premiano chi
  le fa: **un seguito sta sempre in una discesa più avanti del suo padre**
  (guasto), così chi consegna al ritorno dalla discesa del padre lo trova
  davanti alla porta della successiva, senza dover rifare la discesa. Per lo
  stesso motivo **due missioni della stessa discesa non si aspettano fra
  loro** (chela e canna si prendono insieme e si fanno nella stessa discesa).
- **A ogni punto della storia, da una a tre insieme**, per chi le fa tutte e
  le consegna a ogni ritorno: cripta 1 · scalinata 1 · torre 3 · grotta 2 ·
  scala sommersa 2 · botola 2 · miniera 1 (`unita/sotterraneo-missioni`).
  Ognuna si sblocca prima di entrare nella sua discesa, quindi con la roba di
  `dati/storia.js`: i mostri col nome si battono rispondendo giusto, senza
  svenire, per tutti e quattro gli eroi.
- **Provato e scartato: «il piano N toccato in una discesa» come requisito.**
  Il personaggio si accorgerebbe della discesa solo al ritorno, cioè dopo
  averla finita: la missione comparirebbe quando serve rifarla. Idem per un
  pezzo di roba. Non sono nel motore; un caso vero li giustificherebbe.

## Più insieme, e il tetto

- **Si prendono tutte quelle sbloccate** (`prendi`), una dopo l'altra, anche
  dalla stessa persona (il pescatore ha due «ci penso io» nello stesso
  fumetto). Non c'è più «una presa ferma le altre».
- **Il tetto è tre** (`TETTO`): fra prese, fatte da consegnare e offerte col
  «!», mai più di tre. Con tre in mano non si propone altro (il «!» non
  compare e `prendi` rifiuta) finché non se ne consegna una: *«non
  proporgliele se sono troppe»*. Quando ce n'è più d'una da offrire e i posti
  sono pochi vanno prima quelle della discesa più avanti, e a pari discesa il
  piano più in alto (`sbloccate`). Il diario lo dice quando succede («Hai già
  3 missioni aperte: consegnane una e ne arrivano altre»). Chi non ne
  consegna mai una arriva a nove sbloccate insieme alla fine, e ne vede
  sempre al più tre.
- **Il segno sopra la testa** (`segnoDi`), come nei giochi di ruolo, tre
  stati: **«!» d'oro** (`nuova`) ha una missione per te; **«?» grigio e fermo**
  (`attesa`) l'hai presa e non è fatta; **«?» d'oro, più grande, che pulsa**
  (`consegna`) l'hai fatta e lui aspetta che gliela porti. Se un personaggio
  ne ha più d'una vince la consegna, poi la nuova, poi l'attesa. Un fumetto
  mostra tutte le sue missioni aperte, una sotto l'altra (`data-missione`,
  `data-fase`). Con `prefers-reduced-motion` il «?» d'oro resta fermo ma
  grande e col suo alone.
- **Chi aspetta ed è fuori schermo si trova**: sul bordo della vista, nella
  sua direzione, un «?» d'oro con una freccia (`viste/Terra.vue`, `fuori`,
  ricalcolato a ogni fotogramma insieme alla telecamera; il minatore
  compreso). Toccarlo (`click`, soglia 16 px) è come toccare lui: l'eroe ci
  va e il fumetto si apre all'arrivo. Quando lui è in vista il bordo cede alla
  freccina attorno all'eroe, che lo punta finché non gli si è accanto
  (`[data-consegna-vicina]`, vedi [missioni-freccina.md](missioni-freccina.md)).
- **Il minatore dice chi ti cerca**: indicando la strada aggiunge una riga
  per chi (`chiTiCerca`): «La ragazza del pozzo ti aspetta: quello che ti ha
  chiesto l'hai fatto», «… ha un favore / due favori da chiederti», «…
  aspetta ancora: la collana della nonna». Prima chi aspetta la consegna.
  Non nomina mai se stesso.

## Il diario e il promemoria

- **Il diario** (`viste/Diario.vue`, `diario` in `motore/missioni.js`): un
  tasto 📖 sempre sulla terra di sopra, accanto alla carta di chi scende, col
  numero delle aperte (bordo d'oro se una è da consegnare). Si apre al centro,
  si chiude con la ✕ o toccando fuori (e il tocco passa alla mappa). Quattro elenchi: **da consegnare** (le fatte, in cima e
  in oro: «Torna dal mugnaio: hai il sacco di farina buona», «… hai battuto
  Rosicchione»), **da fare** (le prese: la cosa, la discesa col suo ritaglio
  dalla mappa e il piano, chi la vuole, «da fare», il premio), **ti
  aspettano** (le offerte: chi ha un favore da chiederti, e dove), **consegnate**
  (solo i nomi). Vuoto, dice che qualcuno al villaggio ti chiederà un favore
  a discesa finita. **Giù** lo stesso diario si apre dalla casella 📖 della
  barra in basso ([barra.md](barra.md)), senza «vai da …» (chi aspetta sta
  sopra): da lì si sceglie anche quale missione segue la freccina.
- **Il dettaglio**: toccando una voce (di qualunque elenco) il diario cambia
  pagina nella stessa finestra, con «‹ indietro» verso l'elenco; la ✕ e il tocco
  fuori chiudono tutto. Dice chi te l'ha data (il suo ritratto, `viste/Ritratto.vue`,
  e il nome), la sua battuta (la richiesta; alla consegna anche il grazie), **dove**
  (ritaglio, discesa, piano), **cosa** (la faccia della cosa, o del mostro col nome) e
  il **premio** pezzo per pezzo (gemme, roba col suo nome, monete), e lo stato: «Da
  fare», «Fatta: torna dal mugnaio», «Consegnata». Due tasti: **«segui questa»**
  (le prese: sceglie quale indicano le freccine,
  [missioni-freccina.md](missioni-freccina.md)) e **«vai da …»** (le fatte e quelle
  che ti aspettano: chiude il diario e l'eroe va dal personaggio, `vaDa` di
  `Terra.vue`). Richiesta dell'utente, 8 ottobre: *«quando rivedo le missioni
  dovrei poter premere su una missione e farmi dare i dettagli»*.
- **Il promemoria in discesa** (`promemoria`): in cima al campo una riga per
  ogni missione presa o fatta che riguarda quella discesa, ricalcolata a ogni
  piano. «Missione: la collana della nonna è al terzo piano: scendi»; sul piano
  giusto, in oro, «… è su questo piano: cerca il forziere d'oro» (o «il mostro
  con la corona»); superato il piano, in grigio, «era al primo piano: risali con
  la scala che sale» ([scala-che-sale.md](scala-che-sale.md): non è più sfuggita,
  ma la freccina non la indica); fatta, in verde, «Missione compiuta: …, torna dal
  mugnaio». Il fumetto di una discesa sulla mappa ricorda le missioni prese
  per lei (`data-missioni-qui`).
- **La cosa si nota** già prima del promemoria: [missioni-bersaglio.md](missioni-bersaglio.md).

## La freccina

Una freccina giù (verso la cosa o la scala) e una sopra (azzurra, verso la discesa)
ricordano la missione presa a chi gioca poco spesso: [missioni-freccina.md](missioni-freccina.md).

## Dove sta, e come si vede

Lontano dall'arrivo, più grande dei suoi simili, con un'aura rosa che pulsa e
il nome sopra la testa: [missioni-bersaglio.md](missioni-bersaglio.md).

## Le regole di fare e consegnare

- **Sono facoltative e non bloccano la storia**: la discesa si vince anche
  senza, e una missione presa resta presa finché non la si fa.
- **Trova**: nel piano giusto c'è un forziere d'oro con sopra, che
  galleggia, la faccia della cosa. Toccandolo il foglio ne dice il nome e
  chiede una domanda; **sbagliando resta chiuso e si riprova**, come una
  porta (un forziere normale si perde per sempre: questo no, la missione
  non si brucia). La cosa non entra nello zaino: è fatta.
- **Sconfiggi**: nel piano giusto c'è un mostro del bestiario col nome e
  la corona, più duro di quelli del suo piano (le ossa del guardiano
  del piano o un quarto in più delle sue, e un colpo in più: `PIU_DURO`). Battuto
  è fatta.
- **Dove sta**: [missioni-bersaglio.md](missioni-bersaglio.md). Non nasce dal seme del piano: la sosta la tiene fra
  le cose nuove, e una missione presa sopra mentre la discesa è a metà
  (passando dal portale) compare riprendendo. Due missioni della stessa discesa
  stanno ciascuna nel suo piano.
- **Il premio** è in gemme o in un gioiello, a volte con monete. Un premio da
  impugnare o da indossare salterebbe un passo della storia, e
  `guastiDelleMissioni` lo rifiuta, come più di 40 gemme. Il gioiello va
  al dito se è libero, se no in tasca; a tasche piene la consegna aspetta.
- **Lo stato è dell'avventura**: `cfg.avventure[eroe].missioni`,
  `{ [id]: 'presa' | 'fatta' | 'consegnata' }`; la forma non è cambiata né
  con la regola «una per volta» né con l'albero: **un'avventura di prima
  funziona com'è** (le nove missioni di allora hanno lo stesso id; un'avventura
  con più missioni prese insieme le tiene tutte in mano, anche oltre il tetto,
  e smette solo di proporne altre). Quello fatto giù sta nella Corsa
  (`missioniFatte`, anche nella sosta) e passa nell'avventura a ogni
  salvataggio. Ogni eroe ha le sue.

## Le monete come regalo

Il regalo vale le domande che la missione chiede in più, non di più: da 🪙1 a 🪙4 in 5 missioni su 12, il conto in
[missioni-monete.md](missioni-monete.md).

Nei test: `unita/sotterraneo-missioni` (i dati e i guasti che vede davvero, ogni
requisito e lo sblocco da sola, l'albero punto per punto, i tre segni e la consegna che vince sulla nuova, mai più di tre
aperte per chi non consegna mai, più missioni prese insieme, il tetto che si
libera consegnando, il goblin nel suo piano, lo stato di prima, il conto delle
monete, il diario, il promemoria, il minatore),
`unita/sotterraneo-storia` (il segno, prendere due volte, il forziere al piano
giusto, sbagliare e riprovare, la sosta, il mostro col nome più duro, la
missione presa a discesa a metà, la consegna in gemme e in un gioiello, le
tasche piene), `integrazione/sotterraneo-missioni` (col dito: due «!» e un «?»
d'oro sul villaggio, il mugnaio lontano e il suo indicatore sul bordo che
porta da lui, due missioni prese da due persone (i «?» diventano grigi), il
diario con le tre righe e il tetto, giù il promemoria, su la consegna con le
monete e il «!» che arriva sull'eremita). Sulla mappa `[data-personaggio="<chi>"]` con
`data-segno` (`nuova`, `attesa` o `consegna`; quello del minatore è
`[data-minatore] [data-segno-di]`), l'indicatore sul bordo
`[data-consegna-fuori="<chi>"]` (c'è solo se chi aspetta è fuori schermo), il
fumetto `[data-fumetto-di="<chi>"]` con una
`[data-missione="<id>"][data-fase]` per missione (`offre`, `aspetta`,
`consegna`; `[data-fase="saluto"]` senza niente), la frase del minatore
`[data-ti-cerca]` (una per riga), `[data-azione="prendi-missione"]`,
`[data-azione="consegna"]`, il segno del minatore `[data-minatore]
[data-segno]`, `[data-missioni-qui]` nel fumetto di una discesa. Il tasto
`[data-azione="diario"]` con `[data-diario-n]` (il numero), il foglio
`[data-diario]` con `[data-sezione="da-fare" | "ti-aspettano" | "consegnate"]`,
`[data-sezione="da-consegnare"]` per le fatte, le righe
`li[data-missione][data-stato]` (`presa`, `fatta`, `offerta`, `consegnata`) con `[data-esito]` e `[data-ritaglio]`, `[data-diario-tetto]`,
`[data-diario-vuoto]`. Il dettaglio `[data-dettaglio][data-missione][data-stato]` con `[data-dettaglio-chi][data-chi]`,
`[data-racconto]`, `[data-grazie]`, `[data-dettaglio-dove]`, `[data-dettaglio-cosa][data-tipo]`, `[data-dettaglio-premio]`,
`[data-azione="segui"][data-segui-attivo]`, `[data-azione="vai-da"]`, `[data-azione="indietro-diario"]`
(`integrazione/sotterraneo-dettaglio`). Giù `[data-promemoria] li[data-missione][data-dove]`
(`sopra`, `qui`, `oltre`, `fatta`; la seguita ha `data-segui`); il foglio del forziere
`[data-missione="<id>"]`; la freccina è in [missioni-freccina.md](missioni-freccina.md).
