# La barra in basso

La barra è quella di Diablo III, **la stessa sopra e sotto**: il globo rosso
della vita a sinistra, il globo blu dell'energia delle abilità a destra, in
mezzo l'esperienza in una riga col livello e sotto le caselle, tutto in una
cornice di pietra. Dal 9 ottobre (l'albero delle abilità, [abilita.md](abilita.md))
l'esperienza non è più un globo: il posto a destra è dell'energia. L'utente, 8
ottobre: «è tutt'altra cosa e penso si possa migliorare molto»; poi, lo
stesso giorno, il globo di destra all'esperienza, la barra anche sul mondo
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
  (`misuraFoglio` in `Gioco.vue`). Sopra sta sotto il mondo, che arriva fino
  alla barra: in fondo non c'è più nessuna carta, e l'eroe non ci finisce sotto.
- **I globi** (`--globo`: da 54 px a 74 px, il 18,5% della larghezza): un
  anello di pietra, il vetro scuro, il liquido che si svuota dall'alto con
  due onde a velocità diverse (un'onda sola sembra un nastro che scorre), il
  riflesso in alto a sinistra. Il numero è piccolo, al centro, sempre.
- **La vita** cala in mezzo secondo quando si è colpiti, e il globo
  sobbalza: il colpo si vede anche con gli occhi sul mostro. Sopra è piena
  (sopra non si combatte), col tetto della roba e del livello; salito dal portale a metà discesa è quella di giù, finché
  la guaritrice non la cura ([chi-cura.md](chi-cura.md)), e lo stesso l'energia.
- **L'esperienza** ([livelli.md](livelli.md)) è una riga d'oro sopra le
  caselle, come in Diablo, con dentro «35/120» (l'esperienza fatta in questo
  livello su quella che serve). Oro e arancio, come nei giochi: viola
  (com'era) non si legge come esperienza (l'utente). A sinistra il **livello**, una placchetta
  d'oro col numero: è il tasto della pagina dell'eroe, che sopra ha anche
  «Cambia eroe» ([livelli.md](livelli.md#la-pagina-delleroe)). Quando ci
  sono punti da dare porta un «+» d'oro che pulsa (`[data-punti]`); salendo
  di livello la riga si accende d'oro.
- **I globi sono tasti che aprono l'eroe** (l'utente, 13 ottobre: gli incanti e le
  missioni hanno la loro strada, i globi no). La vita apre la finestra
  dell'eroe sulla scheda Eroe, e porta in alto a sinistra una pastiglia d'oro col
  libro e il numero (`[data-missioni-pronte]`) quando ci sono missioni da
  consegnare: si vede senza aprire niente. L'energia
  ([abilita.md](abilita.md)) apre la scheda Abilità, col «+» d'oro dei punti da
  imparare. Sopra l'energia è piena, come la vita.
- **Le caselle**, da sinistra: 🧪 le pozioni col numero (un tocco beve), la
  bisaccia (lo zaino) con le tasche piene, ✦ gli incanti da preparare («1/3»: uno
  addosso su tre che l'eroe sa; in oro se ce n'è uno addosso), 🗺️ la mappa grande, 💎 le gemme (un
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
  torce alla cintura non ci sono più: la luce si vede nella scena (il cono
  che si accorcia), agli sgoccioli e senza scorta lo dice una riga in mezzo al
  campo («🔥 Torcia sta per finire: ancora due stanze», `bruciaLaTorcia`), e
  per esteso nella pagina dell'eroe e nello zaino ([luce.md](luce.md#la-torcia-si-accende-da-sé-e-finisce)).
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

## Sopra la barra

**Un pannello che poggia sulla barra finisce sopra la punta dei globi**, non sopra la barra: `--sot-sopra-barra` sulla
radice `.sot` è quanto si alza la barra dal fondo del gioco, punta dei globi compresa, più 6 px di respiro. **Si misura,
non si stima**: `BarraDiSotto.vue` legge la cima della barra e dei globi (la loro scatola, `offsetTop`: il battito del
cuore li scala e non deve far ballare i pannelli) e scrive il valore in px, a ogni cambio di misura (ResizeObserver) e di
finestra; `stile.css` tiene solo la stima per il primo istante (70 px o la punta dei globi). La usano il pannello dello
scontro (`stile-3d.css`) e il dialogo del mondo di sopra (`.sot-terra-sotto`). La
camera dello scontro misura il pannello da sé (`misuraFoglio`), quindi usa lo spazio che resta. Un foglio che sale dal
basso (porta, forziere) copre la barra apposta, e lì i globi stanno sotto.

Due guasti: il 16 ottobre il pannello del 3D finiva dietro i globi su un telefono (era fermo a 64 px); poi, con la stima in
CSS, su un monitor l'utente lo vedeva ancora sopra la calotta. In Chrome senza schermo, a 700–1861 px e a 1, 1,25 e 1,5
di pixel ratio, la stima reggeva: la differenza vera è una barra più alta del solito (le scritte più grandi di un
monitor, il minimo dei caratteri del browser), che la stima non vedeva e la misura sì. Nei test:
`integrazione/sotterraneo-sopra-barra` (lo scontro, la domanda, quale pozione, il dialogo, a sei misure, e con la
barra alzata apposta): il rettangolo del pannello non tocca quello dei globi né della barra, e sopra resta scena.

## Col tema legno

Col tema dei pannelli ([tema-pannelli.md](tema-pannelli.md), `tema/barra.css`) la barra ha le stesse misure e un altro
materiale: legno scuro con le venature e un binario d'ottone coi rivetti in cima; le caselle sono tasselli di legno a
sbalzo col filo d'ottone, che scendono di 2 px al tocco; il livello e la riga dell'esperienza sono targhe d'ottone; i globi
stanno in un anello d'ottone coi quattro rivetti, sulle coppe d'ottone (i colori della coppa sono variabili `--reggi-…`
col ripiego della pietra di sempre).

### I globi vivi

Col tema i globi sono `viste/GloboVivo.vue`: lo stesso contratto di `Globo.vue` (`data-globo`, `data-quota`, il numero in
HTML in `.sot-globo-numero`), ma il vetro è un canvas piccolo. Come si muove lo dice `viste/globo/stato.js`, uguale per
le due strade: un colpo fa il lampo rosso e la scossa del vetro, poi (0,22 s dopo) il livello scende morbido; una cura
lo fa salire con le bolle e la luce; l'energia spesa pulsa di luce (e il guscio pulsa, CSS); sotto il 30% la vita batte
come un cuore (CSS sul guscio, nessun ridisegno). Le onde si alzano a ogni cambio e si calmano: **fermo, il globo non
chiede fotogrammi**, e a schermo nascosto nemmeno.

- **A · canvas 2D** (`globo/pittore2d.js`, di difetto): il liquido col pelo a due onde, il pelo visto dall'alto come
  un'ellisse chiara, le bolle, l'ombra della sfera, la finestra di luce e il punto duro del vetro.
- **B · WebGL** (`globo/pittore3d.js`, `#globi=3d`): una sfera calcolata pixel per pixel (normale, fresnel, riflessi da
  un ambiente finto), il liquido come volume tagliato da un piano ondulato visto dall'alto, più scuro in fondo, le bolle
  dentro. **Un contesto WebGL solo, su una tela che non si vede**, per tutti e due i globi: si disegna lì e si copia nel
  canvas del globo. Riusare il contesto del sotterraneo con lo scissor costerebbe un contesto in meno ma legherebbe la
  barra alla scena (il suo post, i suoi stati, la perdita del contesto): provato a pensarci, scartato.
  Senza WebGL o col contesto perso, B ripiega su A.

Costo: A sono qualche gradiente per fotogramma e solo durante un movimento (meno di un millisecondo per globo); B uno
shader su 150×150 pixel veri a globo, uno shader da compilare all'avvio e un contesto in più (pochi MB). Tenere le due
strade vuol dire due pittori da tenere uguali (colori in `COLORI` di `pittore2d.js`, movimento in `stato.js`, comuni).
Le prove: `npm run pannelli`, righe «I globi da vicino» e «I globi: un colpo / una cura / energia usata / vita bassa».

## Sopra e sotto

| | giù | sopra |
|---|---|---|
| ❤️ vita | quella della discesa | piena, o quella di giù se si è saliti dal portale |
| esperienza | sale battendo i mostri | quella dell'avventura |
| 🔷 energia | quella della discesa | piena (o quella di giù dopo il portale); apre l'albero |
| 🧪 | beve la pozione giusta | «❤️ sei già in piena forma», o «la guaritrice ti cura, gratis» se si è ferito |
| bisaccia | lo zaino della discesa | lo zaino di sopra: ci si veste e ci si spoglia, ma non si beve e non si butta |
| ✦ incanti | la scelta di quelli da preparare | spenta, ma si tocca: dice che si preparano giù |
| 🗺️ | la mappa grande | la veduta d'insieme del mondo ([mondo-3d.md](mondo-3d.md#la-vista-e-la-veduta)) |
| 💎 | le gemme, apre lo zaino | uguale |

La barra non cambia forma: quello che sopra non ha senso resta al suo posto,
spento o col suo significato di sopra.

## La finestra dell'eroe

Lo zaino, le caratteristiche, l'albero delle abilità e il diario delle missioni sono
**quattro schede della stessa finestra** (`viste/SchedeEroe.vue`, l'utente: «aprendo
l'eroe dovrei poterli vedere tutti»): Zaino, Eroe, Abilità, Missioni, in cima alla
cornice, quella aperta d'oro, un «+N» d'oro dove ci sono punti da dare e il numero
d'oro sulle Missioni da consegnare. La bisaccia apre lo Zaino, il livello e il globo
rosso l'Eroe, il globo blu le Abilità; da lì si passa all'altra scheda senza chiudere
(`apriScheda` in `Gioco.vue`). Le cornici sono alte uguali, così cambiando scheda non
saltano; il nome lo dice la scheda, e dentro non si ripete (lo zaino tiene solo «al
villaggio» o «piano 2/3»). Sotto i 430 px solo la linguetta aperta dice il nome (le
altre restano icone), sotto i 340 nessuna. Durante uno scontro non si apre, come prima.
Tutto quello che apre il diario (il globo, la linguetta) apre la scheda Missioni.

## Le caselle che fanno qualcosa

- **🧪 beve senza aprire lo zaino**: ferito, con un solo stadio di cura si beve e basta; con più stadi apre la scelta di quale
  ([roba.md](roba.md#le-pozioni), `ScegliPozione.vue`: una riga per stadio con quanto cura e quante ne hai, ✕ in alto a destra). Senza una
  cura da bere, l'elisir del toro, che vale uguale a ogni momento. In piena forma con sole cure non si beve e lo dice:
  un tocco per sbaglio non butta una boccetta. Come lo zaino, non si apre
  durante uno scontro: il velo copre la barra (quando si rischia di cadere,
  lo stop dello scontro offre lo stesso «bevi», [pericolo.md](pericolo.md)).
- **L'elisir conta fra le pozioni.** Era il guasto della casella che «non
  saliva»: l'utente raccoglieva una boccetta rossa (l'elisir, che allora i forzieri
  della storia davano spesso: ora è rarissimo) e la 🧪 non la contava, perché contava solo le
  cure. La casella si aggiornava: contava un'altra cosa. Adesso conta tutto
  quello che si beve, e la prova col dito butta una pozione e la raccoglie.
- **Il diario è la scheda Missioni**, la stessa sopra (con «vai da …») e sotto
  (senza); la storia in cima, le missioni sotto. Da qui si sceglie anche quale
  missione segue la freccina ([missioni-freccina.md](missioni-freccina.md)).
- **✦ apre la scelta degli incanti** ([orologio.md](orologio.md)) anche se non ne sai
  nessuno (la casella non sparisce, la barra non balla): la finestra dice che non ne
  sai e porta all'albero; sopra dice che si preparano giù. La pastiglia di un
  incanto addosso, sopra il globo blu, apre la stessa scelta.
- **🗺️ apre la mappina grande** al centro del campo, sulla tela
  (`mappaGrande` nel disegno, `scena3d/`); il gioco non si ferma. La chiude un
  tocco sul campo, un foglio che si apre, o la casella stessa.
- **Zaino, mappa grande e finestra dell'eroe (diario compreso) si chiudono toccando
  altrove**, e quel tocco porta l'eroe dove si è toccato
  ([../core/interfaccia.md](../core/interfaccia.md#un-tocco-altrove-chiude)).

Nei test: `[data-barra-giu]` con `data-barra="giu|sopra"`;
`[data-globo="vita|energia"]` con `data-quota` (0..1), il numero in
`.sot-globo-numero`; il globo rosso `[data-azione="vita"]` con `data-missioni-pronte` (assente se nessuna); la riga dell'esperienza `[data-esperienza-barra]` con
`data-quota` e «fatta/serve» in `.sot-esp-numero`; il livello
`[data-azione="eroe-pagina"]` con `data-livello` e `data-punti`; il globo
dell'energia `[data-azione="abilita"]` con `data-punti-abilita`; `[data-casella-barra="pozione|zaino|incanti|mappa|gemme"]` (la scelta: `[data-scegli-pozione]`, `[data-azione="bevi-questa"]` con `data-cosa`, `data-cura`, `data-n`) con
`data-n` (per gli incanti quelli addosso, e `data-preparabili`); `[data-azione="bevi"]`, `[data-azione="zaino"]`,
`[data-azione="incanti"]`, `[data-azione="mappina"]` (con `aria-pressed`),
`[data-gemme-barra]`; sopra il globo blu `[data-incanti]` ([orologio.md](orologio.md)); le schede `[data-scheda="zaino|eroe|abilita|missioni"]` (sulle Missioni `[data-missioni-pronte]`) e il diario `[data-diario]`. `integrazione/sotterraneo-barra` (col dito: la stessa
barra sopra e sotto, i globi che aprono l'eroe e le quattro schede, la casella degli incanti spenta che spiega, il mostro che colpisce, la pozione dalla
casella, una pozione buttata e raccolta che fa risalire la casella, il tocco
altrove, le misure a 390 e a 320 px con le caselle tutte uguali),
`unita/sotterraneo-roba` (quale pozione si beve, l'elisir),
`integrazione/sotterraneo` (niente globo della luce, la torcia nello zaino).
