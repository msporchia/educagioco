# La taratura: gli abitanti per ambientazione

Una parte di [scontro-bilancio.md](scontro-bilancio.md) (il banco, le leve, le tabelle del 12 ottobre), staccata per tema.

## Gli abitanti per ambientazione (12 ottobre, sera)

Il bestiario è passato da due specie per discesa a da due a quattro più un caporale ([mostri.md](mostri.md#gli-abitanti-12-ottobre-2026), [varianti.md](varianti.md)).
Misurato col banco (venti semi, quattro eroi, discese vinte): **prima → dopo**, nell'ordine cripta, scalinata, torre, grotta, sommersa, botola, miniera.

| | prima | dopo |
|---|---|---|
| attesa, 8/10 | 100 · 98 · 96 · 95 · 95 · 90 · 94 (media 95) | 99 · 96 · 95 · 99 · 95 · 96 · 84 (95) |
| attesa, 6/10 | 96 · 89 · 64 · 76 · 73 · 54 · 69 (74) | 91 · 84 · 74 · 76 · 68 · 54 · 74 (74) |
| attesa, 4/10 | 76 · 38 · 20 · 25 · 26 · 13 · 23 (32) | 73 · 36 · 23 · 18 · 29 · 11 · 19 (30) |

Cosa ha mosso i numeri, in ordine di peso:

- **Il caporale, non gli abitanti.** Sostituire le specie di strada con altre di otto ossa e colpo per velocità simile non muoveva niente (provato togliendo le
  paure e il goblin dalla scalinata: stesse cifre); mettere un caporale nuovo al posto di chi guardava la chiave sì, di venti punti: il golem di magma
  (colpo 5, velocità 6) portava la torre a sei su dieci da 64 a 86, l'orco da caporale (colpo 4, velocità 8) la scalinata da 89 a 78. Ogni caporale è stato
  tarato col banco (colpo per velocità fino a 48): golem di magma 5 · 9, orco 3 · 7 (e Grumo e Zannaverde, che si reggono su di lui, +3 di colpo invece di +1: il
  grosso è rimasto com'era), mostro di muschio 6 · 6, tartaruga 5 · 7, golem di muschio 6 · 8, scheletro cavaliere 4 · 8.
- **Il bottino dei caporali.** Sono tanti per anticamera e lasciano roba: con quella di una fascia a parte (lo scudo di ferro del golem) la roba giocata davvero e le
  gemme del villaggio salivano e «premendo a caso no» diventava una passeggiata. Ogni caporale ha il bottino di chi guardava la chiave prima.
- **Gradi e varianti**: non toccano ossa e difesa; alzano un punto di velocità a raro e leggendario e il premio in gemme ed esperienza (×1,3 · 1,7 · 2,5). Con i
  gradi che escono più spesso (le zone alte) un punto di velocità sui rari è una frazione del banco: non misurato a parte.

**Il banco con `--verifica`**: da 11 bersagli mancati prima a 8 dopo. Restano quelli che già non tornavano (la scalinata a mani nude, i livelli +3 a quattro su dieci
alla scalinata, torre e grotta); due nuovi: la sommersa a quattro su dieci in media 38% (bersaglio ≤ 30%: sei punti, dentro il rumore di venti semi) e la miniera
dell'elfa a otto su dieci con la roba attesa (7/20); la miniera a 8/10 passa da 94 a 84 in media. Da riguardare con altri semi, non rincorsi uno per uno.

**I test a un seme solo** (`unita/sotterraneo`, `unita/sotterraneo-roba`, `unita/sotterraneo-abisso`) misurano un campione: il minimo di domande della scalinata ora ammette 5, «premendo a
caso no» usa la roba attesa e non quella giocata (che a un seme su tre è un'arma rara e già prima, al seme 2, faceva vincere 4 su 8), e il costo dei piani dell'abisso
si guarda su tre semi (ogni piano sotto le 40 domande, la media dei semi sotto le 30): cambiando una specie un piano da 33 o 37 domande lo fa un seme su cinque, e già
prima alcuni semi sforavano i 30.

**Le zone** (le forme in `FORMA_DELLA_ZONA`: cripta 1,7 → 2,2, scalinata 0,8 → 0,75, torre 0,8 → 0,9, miniera 1,3 → 1,35) e la **spinta di due discese della storia** (la torre 5,5 → 4,75, la sommersa 9,5 → 9,25) sono state rimisurate: `misure/sotterraneo` (265 controlli) è verde come lo era, dopo due
giri in cui le zone della torre e della miniera, a quattro su dieci, si vincevano il doppio delle volte (i caporali nuovi, lenti, rendono le zone comode).

**L'esperienza dei gradi non c'è**: provato ×1,3 · 1,7 · 2,5 anche sull'esperienza (oltre che sulle gemme), e le zone rendevano mezzo livello in più a discesa (la torre al 12:
1,9 livelli invece di 1,2) e le discese a quattro su dieci si vincevano la metà delle volte: solo le gemme. E il caporale giusto di una zona non è quello della storia: nelle
zone, dove i mostri hanno una spinta enorme, conta la velocità e non il colpo (un caporale lento e pesante le rende più comode di prima, uno svelto più dure), perciò il golem
di magma sta a colpo 5 e velocità 9 e la torre, nella storia, a spinta 4,75 (era 5,5).
