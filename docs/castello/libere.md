# Le partite libere e i regali

Le quattro partite senza fine del castello — come sono fatte, come si
tarano, come si dispone la loro fila — e i regali che si prendono solo lì.
I dati stanno in `LIBERE` e `REGALI` di `src/data/castello.js`, i tracciati
in `LIBERE_RACCONTO` di `src/data/campagne-castello.js`.

## Quattro libere, una per terreno

| chiave | nome | tracciato |
|---|---|---|
| `libera-bosco` | La radura grande 🌲 | una bocca che si sdoppia attorno a una radura e si richiude in un tronco che si ripiega |
| `libera-sotterraneo` | Il bivio 🕯️ | due cunicoli a squadra che si incontrano a metà campo, poi una galleria a scala |
| `libera-mura` | Il bastione 🏰 | una strada sola che fa un cappio a squadra e **si attraversa da sé** |
| `libera-palude` | Il delta 🐸 | due canali che si fondono, e il tronco si sdoppia attorno a un'isola |

- **Le chiavi sono stabili**: sono le chiavi di `VITE`, di `OLTRE` e dei
  record (`campagne.torri.primati[<chiave>]`, vedi `giochi/primati.js`).
  Non si rinominano.
- **Ognuna eredita dalla sua campagna** tutti i mostri che ci vivono, le
  torri, i rami e l'`ambiente` dell'ultima tappa. Le abilità sono sempre accese, il capo arriva ogni
  `CAPO.ogni` ondate; il resto è fisso (`posti` 20, `cap` 10, `attesa` 30; le piazzole in [piazzole.md](piazzole.md)).
- **Si aprono tutte insieme a campagna finita.** `LIBERA` è la prima delle
  quattro, per i banchi che ne vogliono una.
- **Il tracciato è il più intricato del suo mondo**: niente da insegnare, e
  una torre ben messa deve poter battere la stessa strada due o tre volte.
  `fronti` (1,5) dice quante difese separate chiede davvero: meno di due,
  perché le strade si fondono.
- **Il bastione è un anello vero**: una bocca sola, e un mostro passa due
  volte dallo stesso incrocio, dove le torri gli sparano all'andata e al
  ritorno — la difesa divisa nel tempo invece che nello spazio. Lo dichiara
  con `incroci: 1`. Il motore non lo sa (un nemico ha una `d` scalare): lo
  sa `strumenti/valida-percorsi.mjs`, che li conta sulla carta, e la
  carta, che vuole la cella dell'incrocio attraversata dritta.
- **I record**: uno per terreno, sul tasto della libera nella mappa e nella
  tabella dei record; in home `recordPiuRecente` racconta quello fatto più
  di recente. Il record della vecchia libera unica lo eredita il bosco
  (`eredita: true`, vedi `giochi/primati.js`).

## Come si tarano

- **Ognuna si tara da sola** (`npm run tara`): la tabella `VITE` delle prime
  venti ondate, come una tappa, con `regali: false` — si tara il pavimento,
  cioè la prima partita di chi apre la modalità a campagna appena finita.
  Tarando con i regali, chi entra la prima volta troverebbe un muro che
  cresce a ogni ritaratura.
- **Oltre la ventesima la vita cresce del passo `OLTRE`**, ricavato con una
  retta sui logaritmi dei **limiti** della seconda metà della tabella
  (`passoOltre` in `strumenti/tara-castello.mjs`; il capo e le miste non
  contano). Provata la media dei rapporti fra le vite spianate: con due bocche
  diceva ×3,9, un muro alla ventunesima che nessun regalo avrebbe comprato.
- **Il passo ha un pavimento a 1,3** (`OLTRE_MINIMO`), che è il patto della
  modalità e non una misura: prima o poi vince lei. Il passo misurato nudo
  sta fra 1,10 e 1,16, e a quel passo la libera non chiude più (con 35
  regali, a ×1,16 si arriva alla 33ª, a ×1,10 non si muore entro un'ora). A
  ×1,3 senza regali si cede fra la 21ª e la 22ª, con 35 fra la 23ª e la 27ª:
  è la scala su cui sono dimensionati i regali. Sopra 1,3 si tiene quello che
  il tracciato dice (sulla strada curva il bastione diceva 1,35; sulla carta
  stanno tutte e quattro sul pavimento).
- **Il gioco gioca la libera come la taratura**: `ONDATE_TARATE` (20) dice
  al motore da quando le ondate arrivano da tutte e due le bocche anche con
  `ondate: Infinity` (`insiemeDa`). I test la giocano con `Infinity` e
  `finoA`, mai come una campagna corta: il bivio giocato come campagna da
  dodici cedeva alla sesta.
- **Due bocche si tarano**, e `unita/castello` dice per ciascuna dove cede.
  Provata la libera a strada singola «perché con due bocche è intarabile»:
  era una paura.

## La fila di una libera

- **`filaCheRegge` dispone la fila** con le stesse regole delle tappe (vedi
  [mostri.md](mostri.md)): prima gira e scambia, e se non basta la
  costruisce posto per posto (`filaCostruita`). Se nessuna fila arriva a
  coprire le prime otto ondate si allunga coi comuni; una libera che finisse
  sotto andrebbe scritta in `APERTURA_CORTA`, che oggi è vuoto.
- **I capi li devono ferire almeno due torri** (`capiAperti`): alla decima
  ondata la difesa è giovane, e un capo che tocca una torre sola passava con
  qualunque vita (nel Delta il drago era finito capo della decima).
- **Le ondate miste** una su cinque dalla decima, mai sul capo (vedi
  [mostri.md](mostri.md)).

## I regali

- **Solo nella partita libera, e restano per sempre.** Ogni cinque ondate
  (`OGNI_REGALO`) si sceglie un potenziamento fra tre carte
  (`QUANTE_CARTE`: tre si leggono senza scorrere, sette sono un catalogo); il
  giro è deterministico (`regaliOfferti`), quindi chi non vede la carta che
  voleva sa che tornerà. I gradi presi stanno in
  `profile.campagne.torri.regali`, scritti da `regaloPreso` in
  `src/giochi/campagne.js`, e si leggono con `doniDi`.
- **Perché esistono.** Senza, la libera cedeva sempre all'ondata venti: la
  difesa è già in cima alla scaletta, la vita sale del 30% a ondata, e un
  record che non si muove nessuno lo guarda.
- **Il catalogo** (`REGALI`): frecce affilate 🏹, incanto più forte 🔮,
  polvere da sparo 💣, gelo che morde ❄️, vista lunga 🦅, veleno tenace ☠️,
  mani veloci 💨.
- **Un grado è piccolo: +5% a quello che tocca** (+8% alle frecce, perché
  l'arciere per punto rende meno; +3% alla cadenza, che tocca tutte le
  torri). I gradi non si perdono mai e se ne prendono quattro a partita: chi
  gioca spesso ne ha centinaia. Provato +30%: dopo un mese una difesa che
  non cede più, e letto dal bambino come «tantissimo» anche quando al muro
  non sposta niente.
- **Dentro lo stesso regalo i gradi si sommano** (il ventesimo raddoppia),
  **regali diversi si moltiplicano** perché toccano cose diverse.
- **Un tetto per regalo non serve**: oltre la ventesima la vita cresce a
  moltiplicare (×1,3), i gradi a sommare, e il moltiplicare vince sempre.
- **Nella campagna non si applicano**: la tappa deve dichiararli
  (`regali: true`, ce l'hanno solo le quattro `LIBERE`) e il motore ignora
  quelli che gli arrivano per una tappa che non li prevede. La campagna è
  tarata ondata per ondata, e un bonus che cresce col giocare renderebbe la
  promessa dei `calcoli` dipendente da quante libere si sono fatte. Zero
  regali è il gioco senza regali bit per bit (moltiplicatori a 1, somme a 0).
- **Uno per castello, non uno per terreno**: un regalo preso nel bosco vale
  sulle mura. Quattro tasche vorrebbero dire ricominciare da zero a ogni
  cambio di terreno.
- **È un bonus che non passa da un esercizio**, e va contro la regola del
  progetto (vedi [`../apprendimento/calibrazione.md`](../apprendimento/calibrazione.md)).
  Va bene perché le ondate che l'hanno fatto arrivare erano tutte pagate in
  operazioni in colonna, e il regalo non si spende: non compra monete, non
  apre tappe, non esce dalla libera.

## Quanto vale un regalo: si misura

Dimensionare un regalo non si stima: `node strumenti/regali-castello.mjs`
stampa la tabella facendo giocare il simulatore su tutte e quattro le libere,
coi gradi presi come li prende un bambino dal giro delle carte; il banco è
`unita/regali-castello` (`node test/esegui.mjs regali`). L'ondata a cui si
cede, per gradi in tasca:

| gradi | 0 | 10 | 20 | 35 | 50 | 100 | 200 | 400 |
|---|---|---|---|---|---|---|---|---|
| la radura grande | 22 | 24 | 24 | 25 | 27 | 29 | 29 | 35 |
| il bivio | 22 | 22 | 25 | 27 | 27 | 27 | 31 | 42 |
| il bastione | 21 | 21 | 23 | 24 | 24 | 24 | 32 | 32 |
| il delta | 21 | 23 | 23 | 23 | 23 | 31 | 31 | 39 |

Misurata il 29 settembre 2026 sulle carte a scacchiera, coi prezzi che
rincarano salendo e le bombe strette. Sulla strada curva era 24 · 22 · 21 ·
21 a zero gradi, e 26 · 28 · 24 · 31 a cento.

- **Il record si sposta a gradoni**: di colpo quando i gradi bastano a
  passare il mostro del muro, poi resta fermo fino al muro dopo.
- **Dieci gradi quasi mai, cinquanta (una dozzina di partite) su tre
  terreni su quattro, cento (venticinque partite) su tutti**: è quello che il
  banco pretende. Sul bastione il muro della ventunesima lo passa chi ne ha
  una ventina.
- **Provati e tolti**: «+1 cuore» non sposta niente (l'ondata che ferma la
  partita ne fa passare ventotto); «+⚡ per nemico fermato» sposta tutto (al
  muro il metro è a corto di soldi, non di potenza: bastava +2,5% per saltare
  tre ondate).

Nei test: `[data-tappa="libera-bosco"]` e le altre tre chiavi sulla mappa;
`integrazione/torri-libere` (quattro tasti, ognuno apre la sua libera e
scrive il record nel suo quaderno; il conto dell'arciere paga 🪙3 anche in
una partita persa, e il cartello di fine lo dice in `[data-monete-prese]`,
col salvadanaio stanco `[data-nota-monete]`).
