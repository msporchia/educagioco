# La barra in basso

La barra è quella di Diablo III, **la stessa sopra e sotto**: il globo rosso
della vita a sinistra, il globo blu dell'energia delle abilità a destra, in
mezzo l'esperienza in una riga col livello e sotto le caselle, tutto in una
cornice di pietra. Dal 9 ottobre (l'albero delle abilità, [abilita.md](abilita.md))
l'esperienza non è più un globo: il posto a destra è dell'energia. L'utente, 8
ottobre: «è tutt'altra cosa e penso si possa migliorare molto»; poi, lo
stesso giorno, il globo di destra all'esperienza, la barra anche sulla terra
di sopra, via attacco e difesa dalla barra in cima, via la casella delle
torce («ha una forma diversa dalle altre e non è così utile»). Il codice:
`viste/BarraDiSotto.vue`, `viste/Globo.vue`, le regole `.sot-plancia`,
`.sot-cella` e `.sot-globo` in `stile.css`; i numeri li prepara `barra` in
`Gioco.vue`.

**Prima in codice, poi dipinta.** La cornice, le coppe e il vetro sono CSS e
SVG finché l'utente non la approva; allora la si fa dipingere a ChatGPT con
la scheda `strumenti/sprite/sorgenti/sotterraneo/generati/PROMPT-barra.md`,
che dice le misure che il codice si aspetta. Il liquido, l'onda e i numeri
restano in codice anche dopo: si muovono.

## Com'è fatta

- **Sta sotto il campo, non sopra**: la tela finisce dove comincia la barra,
  e solo i globi sporgono in su di una decina di pixel. Alta al più 70 px
  (più l'area sicura in fondo): la riga dell'esperienza (14 px) l'ha
  alzata, e le caselle sono scese da 47 a 40 px per farcela stare. Un foglio che sale dal basso la copre; la
  telecamera conta solo la parte di foglio che sta sopra la tela
  (`misuraFoglio` in `Gioco.vue`). Sopra sta sotto la terra, che arriva fino
  alla barra: in fondo non c'è più nessuna carta, e l'eroe non ci finisce sotto.
- **I globi** (`--globo`: da 54 px a 74 px, il 18,5% della larghezza): un
  anello di pietra, il vetro scuro, il liquido che si svuota dall'alto con
  due onde a velocità diverse (un'onda sola sembra un nastro che scorre), il
  riflesso in alto a sinistra. Il numero è piccolo, al centro, sempre.
- **La vita** cala in mezzo secondo quando si è colpiti, e il globo
  sobbalza: il colpo si vede anche con gli occhi sul mostro. Sopra è piena
  (sopra non si combatte), col tetto della roba e del livello.
- **L'esperienza** ([livelli.md](livelli.md)) è una riga d'oro sopra le
  caselle, come in Diablo, con dentro «35/120» (l'esperienza fatta in questo
  livello su quella che serve). Oro e arancio, come nei giochi: viola
  (com'era) non si legge come esperienza (l'utente). A sinistra il **livello**, una placchetta
  d'oro col numero: è il tasto della pagina dell'eroe, che sopra ha anche
  «Cambia eroe» ([livelli.md](livelli.md#la-pagina-delleroe)). Quando ci
  sono punti da dare porta un «+» d'oro che pulsa (`[data-punti]`); salendo
  di livello la riga si accende d'oro.
- **L'energia** ([abilita.md](abilita.md)) è il globo blu di destra, col
  numero al centro. È un tasto: apre l'albero delle abilità, e porta il «+»
  d'oro quando ci sono punti da imparare. Sopra è piena, come la vita.
- **Le caselle**, da sinistra: 🧪 le pozioni col numero (un tocco beve), la
  bisaccia (lo zaino) con le tasche piene, 📖 il diario delle missioni col numero delle
  aperte (in oro se una è da consegnare), 🗺️ la mappa grande, 💎 le gemme (un
  tocco apre lo zaino, dove le gemme stanno con la roba). **Tutte della
  stessa forma e della stessa larghezza**: un contatore più stretto e senza
  bordo era una cosa in più da capire. Vuota, una casella si spegne in
  grigio.
- **Lo zaino è una bisaccia di cuoio, non un'emoji.** Il 🎒 di Twemoji è lo
  zainetto rosso da scuola, fuori posto in un gioco serio (l'utente, 9
  ottobre: «abbastanza terribile»). Nell'atlante non c'è una sacca, quindi
  `BISACCIA` in `viste/pixel.js`: dodici pixel disegnati in codice, contorno
  scuro, luce dall'alto a sinistra, fibbia d'oro, a scala 2 (26 px contro i
  19 dell'emoji: i margini negativi di `.sot-cella svg` la tengono nel posto
  delle altre). La usano anche la targa dello zaino e il «Togli». Quando
  arriverà una sacca dipinta nel foglio, si cambia solo lì.
- **Niente luce nella barra.** Il globo d'oro della torcia e la casella delle
  torce alla cintura non ci sono più: la luce si vede nella scena (il buio
  che si stringe), agli sgoccioli e senza scorta lo dice una riga in mezzo al
  campo («🔥 Torcia sta per finire: ancora due stanze», `bruciaLaTorcia`), e
  per esteso nello zaino ([roba.md](roba.md#la-torcia-si-accende-da-sé-e-finisce)).
- **L'esperienza sta in un posto solo**: la riga sopra le caselle. Quando era
  un globo, una scanalatura in più sarebbe stata un doppione.
- **Attacco e difesa non stanno più in cima**, accanto al titolo: si leggono
  sull'eroe, nella pagina dell'eroe e nello zaino.
- **Niente lucchetti**: in Diablo una casella chiusa è una cosa che
  arriverà. Le abilità non stanno nella barra: stanno nello scontro, sopra
  la domanda ([abilita.md](abilita.md)).
- **Le coppe che reggono i globi**: pietra, un filo d'oro, due riccioli e un
  rombo d'oro sotto. Niente teste né artigli: devono reggere, non far paura.
- **A 320 px ci sta**: i globi scendono a 59 px e le caselle a una trentina
  di pixel l'una. La pagina non scorre di lato (`overflow-x: clip`).

## Sopra e sotto

| | giù | sopra |
|---|---|---|
| ❤️ vita | quella della discesa | piena, col tetto della roba e del livello |
| esperienza | sale battendo i mostri | quella dell'avventura |
| 🔷 energia | quella della discesa | piena; apre l'albero |
| 🧪 | beve la pozione giusta | «❤️ sei già in piena forma» |
| bisaccia | lo zaino della discesa | lo zaino di sopra: ci si veste e ci si spoglia, ma non si beve e non si butta |
| 📖 | il diario, senza «vai da …» | il diario della terra di sopra, con «vai da …» |
| 🗺️ | la mappa grande | spenta: la terra è già la mappa |
| 💎 | le gemme, apre lo zaino | uguale |

La barra non cambia forma: quello che sopra non ha senso resta al suo posto,
spento o col suo significato di sopra.

## Le caselle che fanno qualcosa

- **🧪 beve senza aprire lo zaino**: ferito, la più piccola pozione che
  riempie la vita, o la più grande se nessuna basta (`pozioneGiusta` in
  `motore/corsa.js`); senza una cura da bere, l'elisir del toro, che vale
  uguale a ogni momento. In piena forma con sole cure non si beve e lo dice:
  un tocco per sbaglio non butta una boccetta. Come lo zaino, non si apre
  durante uno scontro: il velo copre la barra (quando si rischia di cadere,
  lo stop dello scontro offre lo stesso «bevi», [pericolo.md](pericolo.md)).
- **L'elisir conta fra le pozioni.** Era il guasto della casella che «non
  saliva»: l'utente raccoglieva una boccetta rossa (l'elisir, che i forzieri
  della storia danno spesso) e la 🧪 non la contava, perché contava solo le
  cure. La casella si aggiornava: contava un'altra cosa. Adesso conta tutto
  quello che si beve, e la prova col dito butta una pozione e la raccoglie.
- **📖 apre lo stesso diario di sopra.** Da qui si sceglie anche quale
  missione segue la freccina ([missioni-freccina.md](missioni-freccina.md)).
- **🗺️ apre la mappina grande** al centro del campo, sulla tela
  (`mappaGrande` in `scena/tela.js`); il gioco non si ferma. La chiude un
  tocco sul campo, un foglio che si apre, o la casella stessa.
- **Zaino, diario, mappa grande e pagina dell'eroe si chiudono toccando
  altrove**, e quel tocco porta l'eroe dove si è toccato
  ([../core/interfaccia.md](../core/interfaccia.md#un-tocco-altrove-chiude)).

Nei test: `[data-barra-giu]` con `data-barra="giu|sopra"`;
`[data-globo="vita|energia"]` con `data-quota` (0..1), il numero in
`.sot-globo-numero`; la riga dell'esperienza `[data-esperienza-barra]` con
`data-quota` e «fatta/serve» in `.sot-esp-numero`; il livello
`[data-azione="eroe-pagina"]` con `data-livello` e `data-punti`; il globo
dell'energia `[data-azione="abilita"]` con `data-punti-abilita`; `[data-casella-barra="pozione|zaino|diario|mappa|gemme"]` con
`data-n`; `[data-azione="bevi"]`, `[data-azione="zaino"]`,
`[data-azione="diario-giu"]` (giù) e `[data-azione="diario"]` con
`[data-diario-n]` (sopra), `[data-azione="mappina"]` (con `aria-pressed`),
`[data-gemme-barra]`. `integrazione/sotterraneo-barra` (col dito: la stessa
barra sopra e sotto, i globi, il mostro che colpisce, la pozione dalla
casella, una pozione buttata e raccolta che fa risalire la casella, il tocco
altrove, le misure a 390 e a 320 px con le caselle tutte uguali),
`unita/sotterraneo-roba` (quale pozione si beve, l'elisir),
`integrazione/sotterraneo` (niente globo della luce, la torcia nello zaino).
