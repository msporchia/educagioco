# I laghetti, i ponti e la pesca

Un lotto su sette della fascia di mezzo è un **laghetto**: al mezzo uno stagno, intorno terra. Si vede anche da un lotto non tuo; si attraversa coi
ponti. **A ovest c'è il mare e a est i laghi grandi**, fatti di celle e non di lotti: [geografia-e-pesca.md](geografia-e-pesca.md). Codice: `dati/biomi.js`,
`Fattoria3d.acqua`/`puoMettere`, `scena3d/terreno.js` (`_acqua`). Il perché dei lotti è in [mondo-infinito.md](mondo-infinito.md).

## Lo stagno

Il quadrato 2×2 al centro del lotto più **da una a tre celle del bordo** (al più una per lato, mai un angolo): 5–7 celle d'acqua,
una forma a blob che non è mai un quadrato. **Le quattro celle d'angolo e almeno tre celle per lato restano terra**: il lotto si
compra e si attraversa dai lati. Un margine di terra di una cella tutt'intorno lascerebbe quattro celle d'acqua (il lotto è 4×4):
poco più di una pozzanghera, per questo il bordo si lascia toccare in un punto per lato al massimo.

`acquaDelLotto(l)` dà le celle, `moloDelLotto(l)` una **cella di riva** (terra che tocca l'acqua) col verso dell'acqua, scelta dal
generatore: è il posto candidato per la pesca. `generaLotto` espone tutti e due (`acqua`, `molo`); il motore `acqua(i, j)`.

## Regole

- **Sull'acqua non si cammina e non si costruisce**: `blocca()` e `libera()` dicono di no, `puoMettere` rifiuta con motivo `acqua`
  («Qui c'è l'acqua: serve un ponte», in `detti.js`), niente strada a pennello. Alberi e sassi non nascono sull'acqua.
- **Ponte e passerella** hanno `suAcqua: true` in `dati/catalogo.js`: possono avere l'ingombro sull'acqua, purché almeno una cella sia
  terra, oppure tocchino di lato un altro ponte (`_appoggioPerPonte`): un ponte tutto sull'acqua senza appoggio non regge. Sono
  calpestabili: il contadino e i compagni attraversano l'acqua sopra di loro (`cellaPasso`, che vince su `blocca`). Un ponte da 3 supera i 2
  dello stagno (un'estremità sulla riva, l'altra sull'acqua accanto alla riva opposta).
- Toglierlo richiude il passaggio; non si mette altro sul ponte.

## Il disegno

Una lastra azzurra semitrasparente per cella d'acqua (`lastra`, a istanze, senza ombra) su una **riva** di sabbia un po' più larga
(`riva`); **ninfee** (dischi verdi) sull'acqua e **canne** (tre fili alti) sulle celle di riva, tutto a istanze e deciso dalle
coordinate del lotto. Il movimento è nello shader della lastra (`uT`, lo stesso tempo del vento): un luccichio che scorre,
niente riflessioni e niente luci in più. Le istanze si rifanno con la finestra ([mondo-infinito.md](mondo-infinito.md)). Nel
catalogo 3D c'è `fattoria:stagno`.

Il cartello di un lotto comprabile con laghetto dice «🪙 N · 🏞️ laghetto» e l'offerta «Qui c'è un laghetto.» (e «🏞️ lago», «🌊 mare», «🏖️ spiaggia» per la geografia grande).

## Lo stagno e il laghetto che si costruiscono

Oltre ai laghetti dei lotti (che restano com'erano) il bambino compra due pezzi dalla scheda **Decori** di «Costruisci qui» e li mette dove
vuole nel suo terreno: lo **stagno** (3×3, 🪙 35, livello 5) e il **laghetto** (5×4, 🪙 110, livello 11). Sono decorazioni: non
produttive, non spostano la scaletta (`tara:fattoria3d` resta verde). Scheda scelta: **Decori**, non una scheda nuova: il menu ha già
cinque schede che scorrono di lato, e un pezzo d'acqua è una decorazione come la fontana. `acqua: true` in `dati/catalogo.js` (nessun
`suAcqua`, nessun `calpestabile`).

- **Tutte le celle dell'impronta sono acqua**: `acqua(i, j)` risponde vero sia per i lotti-laghetto sia per i pezzi d'acqua; `blocca`,
  `libera` e `puoMettere` si comportano come sui laghi naturali (motivo `acqua`, ponte e passerella sì se hanno una cella di terra o un
  ponte accanto, strada a pennello no). Gli alberi e i sassi sotto uno stagno sono già un «occupato» (`bloccoFisso`).
- **Una mappa a parte, `cellaAcqua`** (cella → id del pezzo): lo stagno **non sta in `cellaCosa`**, dove ci va ciò che occupa la cella;
  così un ponte può stare sopra (ha la sua `cellaCosa` e la sua `cellaPasso`) senza spostare né cancellare lo stagno, e i due pezzi
  restano due cose a sé. `cosaSu(i, j)` dà il ponte se c'è, altrimenti lo stagno (il tocco e la pressione lunga). `_occupa` e `_libera`
  per un pezzo d'acqua toccano solo `cellaAcqua`.
- **Il ponte sopra lo stagno**: `spostaPezzo` e `mettiVia` rifiutano con motivo `ponte-sopra` («Togli prima il ponte», `detti.js`) se una
  cella dell'impronta ha un ponte o una passerella; `puoMettere(.., ignora)` lo dice anche al fantasma (rosso). Un pezzo d'acqua
  sopra un ponte non si può mettere (la cella è occupata); un ponte accanto è libero. `ignora` vale anche per l'acqua: uno stagno
  spostato di una cella non si urta con se stesso.
- **La strada sotto**: una strada disegnata sparisce dove si mette lo stagno (senza rimborso); una strada di serie lo impedisce
  (`occupato`). **Salvataggio**: sono `cose` come le altre (`tipo: 'stagno'`), nessuna migrazione, `VERSIONE_STATO` invariata; il ponte e
  lo stagno si rileggono nell'ordine che hanno nella lista, senza dipendere da quello. Mongolfiera: i pezzi d'acqua non sono fra le
  sorprese (`SORPRESE` esclude `acqua`).
- **Il disegno** (`scena3d/modelli-acqua.js`, `creaStagno(w, d)`, in cache per misura): una riva di terra chiara in rilievo (anello
  estruso, 9 cm) dal contorno **arrotondato e un po' ondulato** (superellisse, esponente 3), il fondo scuro, i sassi, le canne agli angoli e
  due o tre ninfee con un fiore; per ultima la lastra d'acqua. Il rettangolo resta la geometria del gioco, ma agli angoli si vede la
  terra: la forma si legge irregolare. **Il materiale è uno solo**: `materialeAcqua()` (azzurro, semitrasparente, scintillio nello shader
  da `uTAcqua`, che `Terreno.muovi` scrive a ogni fotogramma) lo usano i laghi del terreno a istanze e gli stagni come mesh; l'acqua è
  trasparente e non si fonde, il resto sì (`fondiPerMateriale`). Il fantasma clona il materiale (`fantasma`) e perde lo scintillio: resta
  verde o rosso come gli altri.
- Nel catalogo 3D: `fattoria:stagno-costruito` e `fattoria:laghetto-costruito` (il vecchio `fattoria:stagno` è il lago dei lotti).

## La pesca (fatta: [geografia-e-pesca.md](geografia-e-pesca.md))

Tutta l'acqua, dei laghetti, dei laghi grandi, del mare e degli stagni costruiti, si pesca da un **molo** (🪙12, livello 4, 3×1 o 1×3) o dal **porticciolo** (🪙90, livello 9):
si tocca una cella d'acqua tua entro 6 celle dal molo e nello stesso specchio, il contadino lancia, aspetta 12 s e ritira un pesce (uno per lotto d'acqua alla volta: ogni lotto è un
banco che si ripopola in un minuto). Il posto candidato `generaLotto(..).molo` resta nei dati ma non guida più niente: il molo lo mette il bambino dove vuole. La peschiera della 2D
(il recinto dei pesci, che mangiano il mangime del mulino) **non c'è ancora**: [da-fare.md](da-fare.md).

## Nei test

`unita/fattoria3d` (il blocco «stagno e laghetto»: misure, `acqua`, ponte sopra, rifiuti, percorso, salvataggio) e `integrazione/fattoria3d` (la carta
`[data-carta="stagno"]`, messa con un tocco vero, il ponte sopra, il contadino che ci sale).
`unita/fattoria3d-mondo` (sezioni 6, 7 e 9: biomi e proporzioni, forma e margini, molo, `puoMettere` con acqua e ponti, percorso che
attraversa la passerella e non l'acqua, Villa Dolce con il suo laghetto e la sua passerella nel lotto `2_-1`).
