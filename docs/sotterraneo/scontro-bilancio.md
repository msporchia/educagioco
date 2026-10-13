# La taratura: il banco che usa le abilità

Il resoconto del 12 ottobre 2026. In un giorno erano arrivati insieme cinque cambi che toccano l'equilibrio: lo scontro a gruppi
([scontro.md](scontro.md)), la luce a cono con gli agguati ([luce.md](luce.md)), i piani nuovi ([piani.md](piani.md)), l'albero più
largo con gli elementi ([abilita.md](abilita.md)) e la forza vera ([forza.md](forza.md)). Ognuno era verde da solo, insieme no. E
l'utente voleva il gioco **più duro**: «il bambino passa come un nastro, è sempre a piena vita, ormai ha attacchi che oneshottano
tutti: dovrebbe essere così solo per i grigi». Resta un gioco per bambini dai sette ai dodici anni: chi risponde bene arriva in fondo.

Lo strumento: `npm run sotterraneo` ([../core/comandi.md](../core/comandi.md)), con le opzioni in testa a
`strumenti/sotterraneo-banco.mjs`. Quello che segue si rifà con `-- --semi 20 --scarti 0,-1,2 --livelli -2,3` (la storia),
`--verifica` (i bersagli di `misure/sotterraneo`, discesa per discesa), `--zone 12,16,20,30`, `--vere`, `--risparmio 100,250`,
`--abisso`, `--diag`, e `--contro <commit>` per il prima e il dopo.

## Il banco gioca come un bambino che sa cosa fa

La regola dell'utente: *il banco deve usare le abilità dell'albero e quelle dei pezzi, o la taratura sbaglia*. Prima il giocatore
finto attaccava e basta (`motore/banco.js`): i mostri erano tarati per uno che non esiste più. Adesso:

- **Una strada per classe** (`STRADA`, `motore/abilita.js`): i punti dell'albero in fila, come li darebbe uno che guarda cosa serve.
  Un'abilità che colpisce al livello 2, la difesa o la cura entro il 4, poi il ramo che picchia, un'area. Solo rami senz'arma
  (Furia e Giuramento, Luna e Bosco, Fucina e Pietra) o col fuoco del mago che poi lascia il lavoro all'Arcano: la roba attesa
  cambia l'arma da una discesa all'altra (la Mazza di Grumo in mano a tutti, l'arco al posto della spada) e un ramo che per metà
  della storia non vale non è una strada. Provato con la Lama del cavaliere e l'Arco dell'elfa: metà delle discese le abilità
  restavano spente.
- **Le tre caselle**: la migliore su un mostro solo, un'area (o la seconda), una cura o uno scudo; si rifanno a ogni scontro.
- **A ogni turno**: sotto la metà della vita una cura o uno scudo (`riparoDi`); se no un'abilità forte (**due a scontro**,
  `FORTI_A_SCONTRO`) quando il colpo solito non basta a chiudere, e l'area appena i mostri sono tre o più. Mai se l'attacco solito
  chiude: l'energia si tiene.
- **Non si volta** (resta il caso peggiore per gli agguati) e **gioca a torcia spenta** come prima. **Non beve nello scontro**: provato
  a bere quando il giro dopo lo farebbe cadere, costa il turno e il banco peggiora (il mago nella scalinata da 12 a 10 su 20).
- **L'eroe atteso della forza** ha la stessa strada ([forza.md](forza.md)): senza, un eroe con le abilità valeva molto più del suo
  livello e la grigia gli dava un quarto dell'esperienza troppo presto (le zone rendevano 0,5 livelli invece di 1,1).
- `BANCO.abilita = false` rifà il banco di prima.

Quanto cambia, **sugli stessi numeri di prima** (`--contro fce443cf --banco-di-adesso`: la roba attesa, i mostri e le forze del
commit di ieri, giocati dal banco di adesso; discese vinte, in media fra i quattro eroi):

| a | prima: banco con le abilità, mostri di ieri | dopo: banco con le abilità, mostri tarati |
|---|---|---|
| 8/10 | 99% | 95% |
| 6/10 | 92% | 74% |
| 4/10 | 51% | 32% |

È il nastro dell'utente: con le abilità i mostri di ieri si passavano rispondendo sei volte su dieci nove volte su dieci, e
rispondendo male si vinceva una volta su due. Per discesa (cavaliere, elfa, mago e nano, venti semi, a 8/10):

| | vite a fine scontro | svenimenti a discesa | domande (il minimo) |
|---|---|---|---|
| cripta | 53 → 54% | 0,3 → 0,5 | 15 → 9 |
| scalinata | 63 → 61% | 0,4 → 0,7 | 12 → 11 |
| torre | 57 → 54% | 1,2 → 1,6 | 31 → 26 |
| grotta | 44 → 42% | 2,2 → 3,4 | 47 → 38 |
| scala sommersa | 57 → 52% | 1,4 → 2 | 44 → 37 |
| botola | 53 → 46% | 0,9 → 1,9 | 54 → 34 |
| miniera | 55 → 48% | 0,9 → 2,5 | 64 → 57 |

## Le leve, prima → dopo

In ordine di preferenza, ognuna misurata dal banco (`--tara` prova un valore senza toccare i sorgenti, `--verifica` dice quali
bersagli rompe).

- **`COLPO_DEL_MOSTRO` 0,8 → 1,1.** Era già 0,8 contro un banco che non usava le abilità. A 1,0 la torre era ancora comoda, a 1,3 a
  otto su dieci si arrivava in fondo due volte su tre: 1,1 lascia a ogni discesa la sua forza e la sua spinta. Il resto lo fanno
  `forza` e `spinta` (qui sotto).
- **Le specie** ([mostri.md](mostri.md)): tutte con 8 ossa; velocità, colpo e difesa per «forma» (colpo per velocità circa uguale
  dentro la coppia). Ratto 11 → 10, lupo 9 → 10, golem 5, melma 7; l'orco da 12 a 8 ossa (Grumo e Zannaverde da 1,25 e 1,3 a 1,9 e 1,95
  per restare quelli di prima); le gemme di scheletro e fantasma a 6, perché dalla cripta si esca con le 9 che costa la prima arma.
- **Le velocità dell'eroe e dei mostri**: non toccate, se non quelle delle specie qui sopra.
- **Il colpo d'agguato**: provato a metà colpo (0,5). A parità di tutto il resto le discese vinte non si muovono (gli agguati sono
  pochi), e tolto: il colpo d'agguato resta intero, come in [scontro.md](scontro.md).
- **`CAPORALE` 1,25 / +1**: non toccato. Il guardiano della chiave è un caporale della specie più dura, e per questo le domande «solo
  il guardiano» calano meno delle altre.
- **Il numero di mostri in un branco** (`tettoBranco` della discesa, `dati/campagna.js`): la scalinata al più tre, la miniera due, la
  grotta quattro, la cripta cinque. Con i goblin in cinque il mago in giro per tutto il piano moriva nove volte su dieci
  (`--come tutto`, 1/20 contro 18/20 con quattro: un giro di quattro colpi da 7 contro 21 di vita).
- **La vita e le pozioni attese** (`dati/storia.js`): non toccate.
- **`forza` e `spinta` di ogni discesa** (`dati/campagna.js`, fuori dall'elenco ma è dove sta la taratura di ogni discesa):

| | forza prima → dopo | spinta prima → dopo |
|---|---|---|
| cripta | — → 0,4 | — |
| scalinata | — → 0,8 | 5 → 4,5 |
| torre | 1,35 → 0,9 | 7 → 5,5 |
| grotta | 1,65 → 1,5 | 9 → 8 |
| scala sommersa | 2,9 → 2,25 | 9 → 9,5 |
| botola | 5,1 → 3 | 9 → 10 |
| miniera | 4,85 → 4 | 10 → 11 |

  (13 ottobre, coi piani nuovi: scalinata 0,55 e 6,5, torre 0,9 e 6,8, grotta 1,4 e 9,6, scala sommersa 2,25 e 9,8, più la `densita` di alcune discese: [piani-caverne.md](piani-caverne.md#le-domande-per-discesa).)

  Le ossa delle specie sono tutte 8, quindi la forza si legge come «ossa del mostro di strada / 8» (prima la faceva la fascia). La
  forza non scende mai (la cripta 0,4 e la scalinata 0,8 sono i mostri piccoli del primo avvio) e la spinta nemmeno.
- **La curva delle zone** (`CURVA_DELLE_ZONE` e `FORMA_DELLA_ZONA`, [zone.md](zone.md)): forza 4 + 0,6 per livello (prima 0,5), spinta
  13 + 1,0 per livello (prima 15 + 0,65), forme cripta ×1,7, scalinata ×0,8, torre ×0,8, grotta ×1,4, botola ×0,85, sommersa ×0,95,
  miniera ×1,3. Una forza che cresce piano e una spinta che cresce in fretta tengono la zona sotto le 85 domande dove si può
  (a forza 0,9 a livello la miniera al 30 chiedeva 162 risposte).
- **L'abisso** ([abisso.md](abisso.md)): forza 5, spinta 12, ossa +0,12 a piano (prima 0,22), tetto dei branchi 2 nelle cantine; il
  guardiano non è più una scaletta fissa. Chi esce dalla storia scende per una dozzina di piani (prima 8–11, nudi non più).

## Le tabelle misurate

Discese vinte, venti semi, in media fra i quattro eroi, dritti alla scala; **prima → dopo** (prima: il commit di ieri col suo
banco, dopo: questo). Le colonne sono la cripta, la scalinata, la torre, la grotta, la sommersa, la botola, la miniera.

| | cripta | scalinata | torre | grotta | sommersa | botola | miniera | media |
|---|---|---|---|---|---|---|---|---|
| attesa, 8/10 | 100→100 | 98→98 | 88→96 | 84→95 | 86→95 | 83→90 | 90→94 | 90→95 |
| attesa, 6/10 | 99→96 | 81→89 | 53→64 | 71→76 | 59→73 | 48→54 | 65→69 | 68→74 |
| attesa, 4/10 | 75→76 | 41→38 | 14→20 | 23→25 | 29→26 | 15→13 | 15→23 | 30→32 |
| una prima, 8/10 | 100→100 | 51→57 | 44→56 | 66→73 | 71→81 | 56→76 | 78→89 | 67→76 |
| una prima, 6/10 | 99→96 | 10→20 | 6→29 | 40→48 | 46→55 | 31→44 | 59→69 | 42→52 |
| due avanti, 4/10 | 100→100 | 100→98 | 56→68 | 54→69 | 49→51 | 45→46 | 60→60 | 66→70 |
| due livelli sotto, 8/10 | 100→100 | 89→79 | 61→59 | 48→53 | 53→55 | 59→65 | 59→61 | 67→67 |
| tre livelli sopra, 4/10 | 100→98 | 90→88 | 69→84 | 78→86 | 68→55 | 39→39 | 79→78 | 75→75 |

(«prima» è il commit di ieri col banco di allora: le cifre della misura del mattino, che già non rispettavano diversi bersagli: la
torre, la grotta e la botola a otto su dieci per il cavaliere, il primo avvio a 51%.) I numeri per eroe sono nel resoconto di
`misure/sotterraneo`. **La storia giocata davvero** (rifacendo la discesa persa, con la spesa), vinte a 8 · 6 · 4 su 10, discesa per
discesa (cripta, scalinata, torre, grotta, sommersa, botola, miniera):

| chi | 8/10 | 6/10 | 4/10 |
|---|---|---|---|
| va dritto | 100 · 96 · 90 · 93 · 93 · 80 · 100 | 95 · 84 · 81 · 78 · 94 · 74 · 85 | 88 · 66 · 57 · 34 · 49 · 24 · 46 (prima 76 · 63 · 33 · 26 · 53 · 33 · 40) |
| gira tutto e spende | 100 · 91 · 100 · 100 · 99 · 98 · 100 | 95 · 90 · 94 · 99 · 96 · 95 · 100 | 88 · 73 · 80 · 83 · 73 · 64 · 95 |
| con 100 gemme da parte (botola · miniera) | 93 · 94 | 57 · 71 | 14 · 23 |
| con 250 gemme da parte (botola · miniera) | 94 · 94 | 60 · 74 | 15 · 28 |

La scalinata a mani nude a otto su dieci: cavaliere 10/20, elfa 17/20, mago 7/20, nano 12/20 (prima 7 · 12 · 8 · 14). Chi gira
tutto con la roba attesa, cavaliere e mago a otto su dieci, in fondo 18–20/20 (il mago 13/20 alla botola).

Le zone, l'abisso e le domande per discesa: [zone.md](zone.md), [abisso.md](abisso.md), [regole.md](regole.md).

## I bersagli cambiati, e perché

Il patto resta: a otto su dieci in fondo quasi sempre, a quattro su dieci quasi mai, **85 risposte obbligate** a seduta, la
forbice fra il minimo e tutto. Non si è abbassato un bersaglio per farlo passare: dove il gioco è cambiato per un motivo preciso,
si è cambiato il bersaglio e si è scritto perché (`misure/sotterraneo` e le unità).

- **A quattro su dieci, a testa: ≤ 30% → ≤ 60%, e in media ≤ 30%** (la scalinata ≤ 70% a testa, 45% in media). Il cavaliere, il mago
  e il nano a otto su dieci stanno sopra l'80% (il mago sopra il 70%) quando l'elfa, la più veloce (14 di iniziativa), a quattro
  su dieci vince 10–12 volte su 20: a testa le classi non sono uguali, e l'elfa era la più comoda anche prima (a quattro su dieci
  vinceva più delle altre già nelle misure del mattino).
- **Tre livelli sopra, a quattro su dieci: ≤ 70% → ≤ 90%.** Con le abilità tre livelli pesano molto (punti, righe nuove dell'albero,
  gradi): sopra il 70% erano la scalinata, la torre, la grotta e la miniera già prima.
- **La scalinata a mani nude a otto su dieci: ≥ 70% → ≥ 50% in media, ≥ 50% → ≥ 30% a testa**. A mani nude il mago non ha la
  bacchetta e non lancia niente: 7 su 20, e il primo avvio deve restare più facile della scalinata del bambino col suo pezzo.
  La leva c'è: con `spinta` 3,5 si arriva al 66% nudi, ma il 4/10 con la roba attesa sale al 60%.
- **La storia giocata**: a quattro su dieci chi va dritto ≤ 45% → ≤ 70%, chi gira tutto ≤ 80% → ≤ 95%; a sei su dieci ≤ 90% → ≤ 97%.
  La roba vera è più della tabella (il bottino, le tasche piene, le pozioni) e a quattro su dieci vince il 25–35% in più di chi ha la
  roba attesa; chi gira tutto arriva tre livelli sopra: è il premio di aver girato, come in Diablo. **Da guardare col dito.**
- **L'arancio più duro, a otto su dieci: ≥ 45% → ≥ 20%.** Quattro livelli sotto la zona, con le abilità, valgono molto: si può
  tentare, di rado.
- **Il costo di un piano dell'abisso: 5..30 → 3..30 domande, e la grotta chiede tutto > minimo × 1,2 e non 1,3**: la grotta ha
  cinque piani da quattro stanze, quasi tutto sta sulla strada della scala; i primi piani dell'abisso (ratti) costano poco. Il
  minimo di una discesa resta 6..85.
- **L'abisso si entra come si esce dalla storia, non nudi**: i mostri hanno la forza di una zona ([abisso.md](abisso.md)).
- **Le unità sul cavaliere con sei semi**: a quattro su dieci non più di tre vinte su sei (la scalinata quattro), prima una
  (due alla scalinata): con le abilità il cavaliere è la classe più comoda a quattro su dieci nelle discese medie; la cifra vera,
  a venti semi e per i quattro eroi, la dà `misure/sotterraneo`.
- **I fatti che le unità davano per scontati e non lo erano più**: i test della luce e dei piani scelgono una stanza rettangolare
  senza colonne (le stanze sono L, croci, caverne e sale); la prova del veleno usa un goblin (la melma non si avvelena); le monete
  delle missioni sono le domande in più, rifatte con le coppie (rosicchione e zannagrigia 1, il goblin 0).

## Cosa resta da guardare col dito

- **L'elfa e il cavaliere** a quattro su dieci: sono i più comodi. Se un bambino con l'elfa passa rispondendo male, i mostri della
  discesa sono troppo molli per lei, non per gli altri.
- **Il mago** è il più fragile (12 punti di vita di partenza, 21 al livello 2): nella scalinata a mani nude non lancia niente e
  in giro per tutto il piano con cinque goblin addosso cade. È come deve essere? Il tetto dei branchi a tre lo tiene vivo.
- **Chi gira tutto** vince a quattro su dieci molto più di chi va dritto: l'esperienza di un mostro sale con la profondità e la
  grotta e la botola regalano livelli.
- **Le gemme in fondo**: si esce dalla botola e dalla miniera con 57 e 83 💎 (prima 37 e 56): più mostri uccisi e più forti. I prezzi
  del villaggio non sono stati toccati; se il banco di sopra diventa troppo comodo è lì.
- **Il veleno dell'elfa e i rami con un'arma** (Lama, Arco, Ascia, Balestra, Gelo) non sono nella strada del banco: non misurati.
- **Nessun bambino ha giocato i numeri nuovi**: i colori delle zone, quanti svenimenti sono troppi, la scalinata a mani nude.
