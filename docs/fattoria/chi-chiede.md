# Chi chiede: il mercato, le botteghe, la mongolfiera

I posti dove va a finire quello che la fattoria produce, e quanto rende
portarcelo. Senza, la catena finiva contro un muro: il cane e il gatto
mangiano poco, e il silo si riempiva senza una ragione per svuotarlo.

Tre forme diverse, prese da Hay Day, perché ognuna fa un mestiere
diverso: la **bancarella** è il camion (tanti ordini piccoli, sempre), le
**botteghe del paese** sono i visitatori (qualcuno che vuole una cosa
sua), la **mongolfiera** è la nave (un ordine grosso che si riempie un po'
alla volta). Tutte **pagano esperienza e mai monete** (vedi
[regole.md](regole.md)): il numero porta la ⭐ del gettone del livello, non
la 🪙, così si vede dove va a finire.

## Come si vedono

Tutti e tre sono fogli a figure, in legno e carta come in Hay Day, con le
stesse classi del resto dei fogli ([come-si-tocca.md](come-si-tocca.md)).

- **Mercato e botteghe: una bacheca di legno** (`.fa-bacheca`) con **un
  foglietto appuntato per ordine** (`.fa-foglietto`). Chi chiede è grande;
  le merci sono figure grandi col «0/2» (rosso se manca, verde se c'è), poi
  la ⭐, il 🗑 per rifiutare e il ✓ giallo per consegnare. **La merce che
  manca si tocca e apre l'albero** ([pagina-albero.md](pagina-albero.md)).
  Un posto che riposa è un foglietto vuoto col ⏳.
- **La mongolfiera: una stiva di cassette di legno** (`.fa-stiva`) col
  cartellino (la figura e quanti pezzi). Verdi quando sono piene, col «!»
  quando si possono riempire adesso. Anche qui la figura della fila si
  tocca e apre l'albero.

## Il premio: si paga il lavoro

```
⭐ di un pezzo  = PER_GESTO · gesti · (1 + BONUS_FASE · (fasi − 1))
⭐ di un ordine = PREMIO_BASE + Σ pezzi
PER_GESTO = 2 · BONUS_FASE = 0,2 · PREMIO_BASE = 6
```

`gestiDi` conta raccolti più lavorazioni lungo la strada più corta,
`profonditaDi` le fasi (`dati/mercato.js`, `premioDelPezzo`, `premioPer`).

| ordine | ⭐ | | ordine | ⭐ |
|:--|--:|:--|:--|--:|
| 3 🌾 grano | 12 | | 3 🍄 tartufi | 65 |
| 2 🥣 mangime + 2 🌾 grano | 24 | | 1 🎂 torta | 71 |
| 3 🌾 grano + 2 🥚 uova | 40 | | 1 💜 maglione alla lavanda | 98 |
| 1 🍞 pane | 26 | | 1 🍝 lasagne | 110 |

- **A parità di gesti la catena lunga rende di più**: da ⭐2 a ⭐4 per
  gesto. Provato `6 + 4·valoreDi`, cioè il costo in monete: un raccolto
  costa 🪙1 e una lavorazione 🪙0–2, quindi trasformare quasi non contava —
  ⭐10–14 per gesto sul crudo, ⭐3,7 sul maglione alla lavanda. La mossa
  giusta era rifiutare la torta e aspettare il grano.
- **Perché 2 e non 3.** A 3 un raccolto al banco rendeva il 20–30% in più;
  sommato a botteghe (+25%), mongolfiera e fila, i livelli sarebbero
  arrivati prima di aver giocato con quello che c'era. A 2 il banco da solo
  rende ⭐6 a raccolto contro 7, e botteghe e mongolfiera riportano la media
  di prima: **cambia dove sta l'esperienza, non quanta**. Nei primi
  livelli, dove botteghe e mongolfiera non ci sono, il livello lo fanno le
  monete spese. Se la roba nuova arriva troppo in fretta, la leva è
  `PER_GESTO`.
- **Il tetto**: un ordine non rende mai più di 🪙6 per ogni minuto che
  costa produrlo (`MONETE_AL_MINUTO`, `minutiDi` con un campo e una
  macchina sola). `guastiDelMercato()` lo controlla merce per merce sul
  caso peggiore; `unita/mercato` tiene fermo il tetto a ⭐6,8.

## La bancarella

`mercato` nel catalogo (🪙40, livello 2): era una decorazione fra le case.

- **Tre ordini per volta** (`POSTI`), **al massimo tre merci e tre pezzi
  di ognuna** (`MERCI_MAX`, `PEZZI_MAX`): «tre grano» si conta sulle dita,
  e tre pezzi stanno nello scomparto più piccolo — un ordine che non ci
  sta si potrebbe solo rifiutare.
- **Quello che serve sono caselle**, una per pezzo, accesa se ce l'hai:
  lo stesso disegno delle ricette, perché leggere qui non si dà per
  scontato. Premere una casella spenta apre l'albero di quella merce.
- **Si chiede solo quello che si può fare**: merci **ottenibili adesso**
  (`livelloDelProdotto`, `merciDelLivello`), la stessa domanda del silo.
  `unita/mercato` lo controlla per ogni livello, dal primo all'ultimo.
- **La pesca è pesata** (`pesoDellaMerce`): `1 + 0,5·(fasi − 1)`, più 2 se
  la merce è arrivata negli ultimi `NOVITA` (6) livelli. Un grano pesa 1,
  una torta 3, la pasta appena arrivata 4,5. Provata la pesca uniforme: a
  livello 52 metà delle quarantacinque merci erano crudi a un passo, e le
  merci profonde uscivano di rado.
- **Consegnare riempie subito il posto, rifiutare lo lascia vuoto cinque
  minuti** (`RIPOSO_MIN`). Senza attesa il gesto giusto sarebbe premere ✕
  finché non esce l'ordine facile; cinque minuti sono un campo di grano,
  quindi chi rifiuta torna a coltivare. Il tasto lo dice prima («ne arriva
  un altro fra 5 minuti»): una cosa scoperta dopo averla premuta è una
  trappola.
- **Un 📋 sopra la bancarella** quando c'è qualcosa da consegnare adesso,
  muta altrimenti: un invito che c'è sempre non è un invito.
- **Chi ordina è uno a cui quella roba serve.** Si pesca prima la merce,
  poi il cliente fra quelli che la vogliono (`vuole` in `CLIENTI`,
  `clientiPer`). I mestieri sono la parte del mercato che un bambino
  racconta («è arrivato l'apicoltore»): il pizzaiolo che chiede la lana
  era una lotteria. `vuole` è un restringimento, non un elenco di compiti:
  **la nonna e il bottegaio prendono di tutto**, ed è il ripiego che
  garantisce un cliente a ogni merce — `guastiDelMercato()` è rosso se non
  ne resta nessuno. Una merce nuova senza un mestiere che la chieda finisce
  sempre al bottegaio, che è il modo di dire «non ci ho pensato».

## Le botteghe del paese

Quattro posti, ognuno col **suo elenco chiuso** e i suoi clienti (`posto:
{ chiede, clienti }` sulla voce del catalogo: la bottega e il suo elenco
nascono e muoiono insieme). Numeri in `dati/botteghe.js`, regole in
`motore/botteghe.js`, vista `viste/Bottega.vue`.

| bottega | 🪙 | liv | clienti |
|:--|--:|--:|:--|
| 🧁 pasticceria | 180 | 21 | pasticcera, maestra |
| 🍝 osteria | 220 | 29 | oste, cuoco, pizzaiolo, cuoco del sushi |
| 🏫 mensa | 200 | 36 | maestra, bidello |
| 🧵 merceria | 240 | 43 | sarta, lavandaia |

- **Un cliente per bancone, una merce sola, 2–4 pezzi** (`PEZZI_MIN`,
  `PEZZI_MAX`): «la pasticcera vuole 3 biscotti» si legge in un'occhiata.
- **Il cliente dopo arriva fra 10 e 20 minuti** (`ATTESA_MIN`,
  `ATTESA_MAX`): è il motivo per tornare nella stessa sera. Il «non mi va»
  costa quanto una consegna: qui non c'è niente da scorrere, basta che
  rifiutare non sia più svelto che consegnare. Chi aspetta aspetta per
  sempre.
- **Rende il 25% in più del banco** (`PIU_DEL_BANCO`, `premioInBottega`),
  con lo stesso conto del banco moltiplicato: una formula loro smetterebbe
  di stare in proporzione al primo ritocco.
- **La fama**: ogni consegna è un cuore, a cinque cuori (`CUORI`) la
  bottega cresce di un bancone, fino a tre (`BANCONI_MAX`). È la
  progressione per posto che il banco unico non può avere.
- Ogni bottega arriva con **almeno tre merci già consegnabili**
  (`guastiDegliSblocchi` la estende ai posti). La **mensa** è il posto dei
  bambini: la loro scuola che chiede la merenda.

## La mongolfiera

La nave di Hay Day (🪙250, livello 26, `unica`): atterra sulla sua
piazzola ed è la cosa più grande che si vede da lontano. Provato a pensare
a un carro della fiera: un pallone che scende dal cielo si nota in un modo
in cui un carro fermo no. Numeri in `dati/mongolfiera.js`, regole in
`motore/mongolfiera.js`.

- **Tre file di casse** (`FILE`), una merce per fila, 2–3 casse per fila e
  1–3 pezzi per cassa: nove casse al massimo. Dal livello 66 **quattro
  file** (`LIVELLO_GRANDE`): è il pallone che cresce col livello, non una
  cosa da comprare, e chiude il buco fra il sushi e la fine del catalogo.
- **Solo prodotti finiti**: due fasi o più (`FASI_MIN`) e mai mangime
  (`mangime: true` in `dati/coltivazioni.js`). Il crudo lo chiede già il
  banco, e caricare il fieno delle mucche su un pallone non ha senso; il
  banco invece i mangimi li chiede, perché li vuole la veterinaria.
- **Si riempie un po' alla volta**: ogni cassa si consegna da sola e rende
  subito quello che renderebbero i suoi pezzi al banco, senza la base.
  Non serve avere tutto: serve tornare.
- **Una fila piena +25%, tutto pieno +50%** (`BONUS_FILA`, `BONUS_TUTTO`)
  e una **sorpresa**: una delle otto decorazioni della fiera (`fiera: true`
  nel catalogo — bandierine, giostra, zucchero filato, lanterne, barattoli,
  girasole, spaventapasseri, palco), che non si compra nel baule. È il
  premio che si colleziona e non è una moneta travestita.
- **Non ha fretta**: resta finché non si preme «Parti!». Chi la manda via a
  metà si tiene il premio delle casse consegnate. Dopo la partenza il
  cielo resta vuoto un'ora (`CIELO_VUOTO_MIN`).
- Il tetto vale sul totale coi bonus (`guastiDellaMongolfiera`): il caso
  più stretto sta a un terzo.

## Il carretto del vicino

`carretto_mercato` (🪙32, livello 8): **scambia roba con roba, mai
monete**. È il posto dove si svuota lo scomparto pieno, non un cliente. Le
merci che si possono dare sono neutre, quella con lo scomparto colmo è in
oro come nel silo — provato il rosso del cibo rifiutato: un tasto che
funziona si leggeva come «non hai i requisiti».

Nei test: `[data-ordine]`, `[data-cliente]`, `[data-azione]`,
`[data-albero-apri]`, `[data-riposo]`, `[data-attesa]`, `[data-fama]`
(rimasti gli stessi sotto il nuovo aspetto); `unita/mercato`, `unita/botteghe-fattoria`,
`unita/mongolfiera-fattoria`; col dito `integrazione/fattoria-bottega` e
`integrazione/fattoria-mongolfiera`.
