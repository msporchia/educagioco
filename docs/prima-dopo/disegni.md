# Le storie disegnate, e la regola delle icone

Perché le storie di «Prima e dopo» passano dalle emoji ai disegni, come
sono fatte, e le regole che disegnare ha insegnato. In testa c'è la regola
generale sulle icone, che vale per tutti i giochi.

## La regola delle icone

- **Se non esiste un'icona perfettamente aderente non si mette un'icona,
  si mette il testo.** Il vocabolario delle emoji è chiuso: per «mese» non
  ci si chiede come si rappresenta un mese, ci si chiede quale emoji ci
  somiglia di più, ed è un criterio di inventario, non di didattica.
- **Due icone della stessa famiglia visiva non compaiono mai nella stessa
  domanda** (`conFamiglia` in `src/data/domande.js`): si riconoscerebbero
  per come sono fatte invece che per quello che dicono.
- **Le metafore convenzionali sono lasciate apposta** (`famiglia` 🏡,
  `amico` 🤝, `cantante` 🎤, `parco` 🎠, `gara` 🏁, `gioco` 🎮): non sono
  sbagliate, sono figurate.
- **Quello che l'emoji non sa dire si disegna** col pittore che c'è già
  (`src/grafica/corpo.js`, le schede di dati): è il «cassetto dei concetti
  disegnati», che serve alle icone del lessico e a «Prima e dopo» insieme,
  e conviene pagarlo una volta per due giochi. Oggi esiste solo quello di
  «Prima e dopo»; cosa manca sta in [da-fare.md](da-fare.md).

## Perché le storie si disegnano

Una storia fatta di emoji non si sceglie, si cerca: si parte da cosa il set
mette a disposizione e ci si incastra un prima e un dopo, accettando passi
zoppi (🥣 per l'impasto del pane, 🏰 per il castello di sabbia) o
scartando la storia (la farfalla: non c'è il bruco nel bozzolo). Il costo
grosso è **quello che non si può raccontare**: un bambino che si sbuccia il
ginocchio e poi il cerotto, uno che rompe qualcosa e lo dice, un litigio
che finisce bene. Sono le storie che a quattro anni servono di più — causa
ed effetto sulle *persone* — e l'informazione sta in una faccia, che le
emoji hanno solo su una testa gialla staccata dal corpo.

## Come è fatto

- **Il motore non se n'è accorto**: `passi` resta un array di stringhe che
  il motore non guarda mai dentro, e una stringa che è il nome di una scena
  si disegna invece di stamparsi (`èScena`). Cambiare il contenuto dei
  passi non tocca né `motore/` né la campagna.
- I file, in `src/giochi/prima-dopo/`: `dati/scene.js` (le schede: chi
  c'è, che faccia fa, cosa tiene in mano — dato puro), `scena/persone.js`
  (bimba, bimbo, grande per `corpo.js`), `scena/luoghi.js`, `scena/cose.js`,
  `scena/tela.js` (il disegno e la telecamera), e `viste/Passo.vue`,
  **l'unico posto che sa che esistono due specie di vignetta**.
- **Una storia disegnata porta `disegnata: true`** (`dati/storie.js`).

## Le regole che disegnare ha insegnato

- **La faccia è tutta l'informazione, quindi va inquadrata stretta**
  (`inquadra: { zoom, x, y }` nella scheda). A settanta pixel — la
  larghezza di una vignetta su un telefono — una figura intera in mezzo al
  paesaggio aveva la faccia di quattro pixel.
- **I distrattori stanno nella stessa famiglia** (`motore/quesito.js`
  filtra su `disegnata`): un'emoji in mezzo a tre vignette disegnate si
  riconosce per come è fatta, non per quello che racconta.
- **Ogni categoria che ha una storia disegnata ne ha almeno due**: sotto,
  i distrattori della stessa famiglia non bastano e il quesito ripiega
  sulle emoji (`unita/prima-dopo`).
- **Due vignette della stessa storia cambiano massa, non dettaglio.** Tre
  passi con lo stesso bambino allo stesso tavolo (la spremuta) si
  distinguevano solo da un bicchiere di otto pixel: è servito togliere il
  tavolo all'ultimo passo e raddoppiare il bicchiere.
- **Un disegno con dentro una faccia non sta in un francobollo.** La
  vignetta non ha una misura fissa: la ricava da quante ne stanno in fila
  (`--pd-riga`) e da quante righe ci sono a schermo (`--pd-file`,
  `viste/Storia.vue`). Tre in fila su un telefono fanno 115 px; quattro
  **si mettono in quadrato** (158 px l'una, e il verso lo dicono i numeri
  nelle buche); nell'intruso si arriva a 176.
- **Dopo uno sbaglio la storia si spiega** (`viste/Spiegazione.vue`): la
  storia intera, un passo per riga, in grande, con sotto cos'è — una
  didascalia per passo (`dati/didascalie.js`, 141), che lette di fila
  fanno una frase («prima il seme, poi si annaffia, infine il girasole»).
  Si va avanti col tasto, o da soli dopo sette secondi (`DURATA`) con la
  barra che si svuota. Provato: un lampo da 700 ms, che non bastava a
  guardare tre disegni.
- **La finestra di «Manca» è contigua** (`motore/quesito.js`): il primo
  passo, l'ultimo e il buco in mezzo facevano vedere, in una storia da
  quattro, una fila 1-2-4 che nella storia non esiste.

## Scrivere una storia

Le regole stanno in testa a `src/giochi/prima-dopo/dati/storie.js`; in
breve:

- **il verso è obbligato**: fra un passo e il vicino c'è un prima e un dopo
  veri, non due cose che capitano insieme (il pomodoro e il formaggio sulla
  pizza). Due passi paralleli: se ne tiene uno e si cerca un passo che
  segua per forza — il fuoco, il coltello, la porta;
- **niente abitudini travestite da nessi** né file di oggetti che stanno
  insieme (il sapone non viene *dopo* la doccia, viene dentro);
- `ambiguaAlContrario: true` per le storie che hanno senso anche al
  contrario (l'acqua che gela): `motore/corsa.js` le toglie dalle tappe
  facili;
- un passo non si ripete nella stessa storia (`guastiDelleStorie`), la
  stessa emoji vuol dire la stessa cosa in tutte (🔪 si taglia, 🔥 si
  cuoce), e niente emoji arrivate da poco;
- **in «causa-effetto» il verso è una convenzione**, la stessa in tutte:
  prima la cosa a cui succede, poi chi gliela fa succedere, poi come va a
  finire;
- `categoria` decide dove una storia può capitare: la campagna chiede
  categorie, non storie una per una.

## Cosa c'è

**Dodici storie disegnate su cinquanta**, 42 scene, 8 luoghi (prato,
cortile, salotto, cameretta, cucina, bagno, orto, aula), 38 cose, 3
persone:

- **causa-effetto (6)** — il ginocchio sbucciato · il vaso rotto e detto ·
  dal fango alla doccia · il gelato caduto · il litigio che finisce bene ·
  esce senza giacca;
- **routine (2)** — la mattina · la sera;
- **crescita (2)** — si pianta il seme · il gattino diventa grande;
- **cucina (2)** — la torta di compleanno · la spremuta d'arancia.

Nessun test guarda i pixel: la prova a occhio è `npm run storie` (le
strisce in fila, `strumenti/banco/storie.html`; `-- --host` per guardarle
dal telefono, che è la taglia che conta). I controlli a freddo — scene
esistenti, storie disegnate per intero, nessuna scena orfana, nessun
quesito misto — sono in `unita/prima-dopo`; `integrazione/prima-dopo`
misura le vignette su un telefono da 390 px e sbaglia apposta per guardare
la spiegazione e verificare che dopo «ho capito» il gioco vada avanti.

Nei test: `.carta.gioco[data-gioco="prima"]`, `.pd-tappa[data-tappa]`,
`.pd-pesca .pd-vignetta`, `.pd-striscia .pd-buca` (`.pd-piena`),
`.pd-adesso`, `[data-spiega]` (con `.pd-passi li`, `.pd-frase`,
`.pd-grosso`, `.pd-riquadro`, `.pd-fuori`, `.pd-nome`).
