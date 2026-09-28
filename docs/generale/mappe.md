# Le mappe del Generale

Come una mappa scritta in un livello (griglia di token + legenda) diventa la
stanza a schermo: i token di serie, la legenda, la decompressione in mappa
piena e l'arredamento automatico. Come si disegna un livello intero sta in
`src/data/livelli/GUIDA.md`.

## I tre token di serie

Si scrivono senza dichiararli, e stanno in un posto solo: `DI_SERIE` in
`src/data/livelli/livello.js`, letto dal controllo dei refusi e da chi
trasforma la mappa in campo (`src/motore/generale/campo.js`).

| token | cos'è | per il gioco | per chi dipinge |
|---|---|---|---|
| `..` | pavimento | ci si cammina | il suolo dell'ambiente |
| `##` | muro | non ci si passa, la vista si ferma | conci, spessore, ombra, torce |
| due spazi | **il fuori** | come il muro | nero, fino al filo del pavimento |

- **Il muro vero solo dove serve**: fra due stanze, attorno a una porta, dove
  qualcosa ci sta appeso. Il resto è fuori, e **la forma del posto la dà il
  nero** (una cucina con la sua nicchia, un corridoio che gira).
- Provato tutto-muro: una cella di muro accanto al pavimento si dipinge a
  conci, quindi ogni mappa finiva in una **cornice di mattoni**, sembrava un
  edificio solo, e il nero dove i muri erano spessi si leggeva come un buco.

## La legenda: chi, cosa, e di che è fatto il posto

```js
scena: campo([
  '##|##|##|##|##|##|##',
  '##|,,|,,|PT|==|==|##',
  '##|,,|@@|,,|==|BT|##',
], { '@@': eroe, PT: cose.porta(), ',,': suoli.erba(), '==': suoli.lastre(),
     BT: arredo.botte() }),
```

- `chi.*` chi cammina, `cose.*` cosa c'è (le fabbriche di
  `src/data/livelli/scrivi.js`).
- **`suoli.*`** — di che è fatto il pavimento. La cella resta pavimento: il
  motore non lo sa, cambia solo chi dipinge.
- **`muri.*`** — di che è fatta la muratura. La cella resta muro.
- **`arredo.*`** — un mobile che **occupa la cella**: un ostacolo vero, per
  questo sta in legenda e non in `scenografia`.
- **`arredo.niente()`** — «qui non ci va niente», nemmeno l'arredatore
  automatico. È la valvola per la cella che deve restare libera (una
  piazzola, il punto dove qualcuno si ferma): il livello ha l'ultima parola.

**Quello che si vede ingombrare, ingombra.** Non esiste «disegnato solido,
calpestabile». Vale per l'arredo dichiarato; quello che nasce da sé sta
sulla faccia dei muri che ci sono già (sotto).

## La decompressione: `src/motore/generale/stanze.js`

`mappaPiena`: funzione pura, griglia compressa → mappa piena. Per ogni cella
dice cos'è (muro, pavimento, fuori, arredo, con che materiale) e cosa **sa
di essere** rispetto alla stanza:

- `stanza` — in che stanza sta (le stanze si separano ai varchi; un
  corridoio largo uno è una soglia lunga, non una stanza);
- `soglia` — un passaggio, una strozzatura fra due aperti;
- `bordo`, `angolo` — pavimento con uno o due muri accanto;
- `obbligata` — toglierla spezzerebbe il pavimento in due;
- `facce` — un muro che dà su un pavimento, e da che parte.

Il perché: senza questo passo ogni pezzo si ricavava da sé la forma della
stanza, e una botte è finita disegnata sopra un muro perché nessuno sapeva
cos'è un muro. Qui dentro sta anche **il riempimento dei buchi**: la cella
che ospita una chiave non può dichiarare anche il pavimento, e prende il
terreno dei vicini (se no: una macchia d'erba sotto ogni oggetto in mezzo
al lastricato). Essendo pura, **si prova** (`test/unita/stanze.test.mjs`)
invece di fidarsi di quello che esce dipinto.

## L'arredamento automatico: `src/motore/generale/arreda.js`

Sopra la mappa piena e separato, così si prova da solo e si spegne. Il
catalogo (chi nasce in che ambiente, e quanto) è dato:
`src/data/arredamento.js`.

- **Il seme serve alle imperfezioni, non alle scelte.** Una macchia d'usura
  può nascere dal rumore; una torcia o una botte seminate a caso si
  ripetono a caso. Qui le scelte sono informate (angolo, soglia, muro che
  dà sul prato).
- **Dove sa stare una cosa è una proprietà dell'oggetto**:

| regola | vuol dire | esempi |
|---|---|---|
| `sulMuro` | sulla faccia del muro | torcia, ragnatela, bandiera |
| `alMuro` | appoggiata alla parete: sulla casella di muro, col pavimento davanti | botte, cassa, sacco, stalagmite |
| `ovunque` | sul pavimento, quindi roba che si calpesta | pozzanghere, ossa, funghi |

- **E su che terreno**: fiori sul prato sì, sul lastricato no; ragnatele in
  cripta sì, in cortile no. Ogni ambiente dichiara cosa può nascere da lui.
- **Quanto**: un fattore di riempimento per l'area della stanza
  (`riempimento`, di base 0,06): una stanzetta da sei caselle prende una
  cosa, un salone sei.
- **La presenza è la dichiarazione.** Una torcia messa a mano serve alla
  storia: fa luce, e il motore non ne aggiunge in quella stanza. Senza,
  ne mette di scenografiche, che non cambiano la vista di nessuno. Nessun
  flag: la differenza è chi ce l'ha messa.
- Niente sopra una cosa in gioco, né dove il livello ha chiesto una casella
  libera.

**La mappa non si tocca.** L'arredatore non mura mai una casella: disegna
sulla faccia dei muri che ci sono già, il cui ingombro è vero senza che
nessuno lo dichiari. Provato il contrario (murare una casella di pavimento
contro una parete, con divieti su soglie e passi obbligati): una botte che
non chiude niente allungava di un passo una strada misurata a cammino e un
livello giocato a vista smetteva di vincersi; e nella grotta comparivano
rettangoli di pavimento chiaro attorno alle stalagmiti. Quello che sta sul
pavimento è roba che si calpesta; un mobile che occupa lo scrive il livello
con `arredo.*`, e il banco lo gioca.

Nei test: `test/unita/stanze.test.mjs`; il banco dei livelli controlla che
la scenografia non sieda su niente in gioco e che gli ingombranti stiano
sui muri (`INGOMBRANTI` in `src/grafica/oggetti/indice.js`).

Quello che resta da fare sulle mappe è in [da-fare.md](da-fare.md).
