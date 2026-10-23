# I laghetti, i ponti e la pesca

Nella fascia di mezzo ci sono **laghi naturali veri**: da qualche decina di celle a quasi cento, con la riva frastagliata, che attraversano i confini fra
i lotti (un lago tocca da 3 a 11 lotti) e si vedono anche da un lotto non tuo; si attraversano coi ponti. **A ovest c'è il mare e a est i laghi grandi**,
fatti di celle e non di lotti: [geografia-e-pesca.md](geografia-e-pesca.md). Codice: `dati/biomi.js`, `Fattoria3d.acqua`/`puoMettere`, `scena3d/terreno.js`
(`_acqua`). Il perché dei lotti è in [mondo-infinito.md](mondo-infinito.md).

## I laghi della fascia di mezzo (generazione 2)

Erano stagni da 5–7 celle al mezzo di un lotto su sette: «pozzanghere» (D8, [parita/decisioni.md](parita/decisioni.md)). Ora **l'acqua è una funzione della cella**
(`eLagoDolce(i, j)` in `dati/biomi.js`), come quella dei laghi grandi, quindi un lago non sta in un lotto solo.

- **Le supercelle.** La fascia (a da 0 a 7) è divisa in supercelle di 4×3 lotti (16×12 celle) allineate al rettangolo storico; ciascuna ha con probabilità
  `P_LAGO_DOLCE` (0,52) **un lago**, tutto dentro con una cella di margine: fra due laghi c'è sempre una striscia di terra di almeno due celle, e
  **la terra della fascia resta d'un pezzo** (gli unici pezzi staccati sono gli isolotti). Le due righe di supercelle sopra il rettangolo storico (b da 0 a 5)
  non hanno laghi: il quadrato di partenza e i 42 lotti storici non cambiano.
- **Le forme.** Tre taglie, scelte dal seme: piccolo (ellisse di ~6×4,5 celle), medio (~9×6,5, e una volta su due un lobo) e grande (~11,5×8, uno o due lobi, e un isolotto una
  volta su due). Ogni ellisse è inclinata e col contorno ondulato (tre armoniche): niente è mai un quadrato. Misurato su 120 righe: 35 laghi da 25 a 97 celle (mediana 50), mai
  un riquadro pieno oltre il 90%.
- **La terra.** L'acqua naturale è il **12% delle celle** della fascia (le pozzanghere di prima ~5,6%; i laghi grandi a est ~20%): la regola «nel dubbio più terra»
  ([parita/decisioni.md](parita/decisioni.md), «Terra») vuole che l'acqua non mangi la terra giocabile, e il 88% resta prato e bosco. Un lotto su cinque ha un po' d'acqua (il 27% tocca una
  cella d'acqua), uno su trenta è tutto d'acqua (come il mare: si compra e ci si arriva con un ponte).
- **Il bioma.** Un lotto con tre celle d'acqua o più è `laghetto` (il cartello dice «🏞️ laghetto»); sotto è un prato o un bosco con la sua riva. `acquaDelLotto(l)` dà le celle,
  `moloDelLotto(l)` una cella di riva (non c'è per un lotto tutto d'acqua); `generaLotto` li espone (`acqua`, `molo`); il motore `acqua(i, j)`. Alberi e sassi non nascono sull'acqua.
- **Comprabili e attraversabili.** Ogni lotto si compra come gli altri (confina con un altro). Da ogni cella d'acqua la terra è a **5 passi al più**: una catena di ponti
  da tre celle (il primo appoggiato alla riva, i seguenti uno accanto all'altro, `_appoggioPerPonte`) attraversa anche il lago più largo (13 celle, provato nei test). Il 99,9% dei
  lotti che non sono tutti d'acqua si lascia a piedi; resta qualche lotto con solo un isolotto in mezzo (si raggiunge col ponte).
- **Le rive e il molo.** La riva è la sabbia sotto la lastra d'acqua (un po' più larga), le canne stanno sulle celle di terra che toccano l'acqua, e il molo si mette dove vuole il bambino
  (🪙12): un lago grande dà più banchi di pesca, uno per lotto d'acqua suo ([geografia-e-pesca.md](geografia-e-pesca.md)). Il peso della scena non cambia: l'acqua della finestra di 9×9 lotti è
  ~160 celle (il tetto è 720).

### I salvataggi di prima non perdono pezzi

Tre generazioni del generatore (`gen` in `dati/biomi.js`, `generaLotto(a, b, { vecchio })`): **0** prima della geografia grande (solo prato, bosco e pozzanghera), **1** con mare e
laghi grandi ma ancora le pozzanghere, **2** quella di oggi. Un lotto **già comprato** dove la generazione di allora dà un lotto diverso da oggi (un altro bioma o altra acqua, `lottoDiversoDa`) **resta com'era**:
`normalizza` ne mette l'id in `stato.vecchi` (gen 0, da uno stato senza `geo`) o in `stato.vecchi1` (gen 1, da `geo: 1`), e il motore lo genera con la sua generazione (`genDi(l)`): stessa acqua, stessi alberi e sassi,
quindi un pezzo piazzato sulla pozzanghera o su una cella che oggi sarebbe lago non perde niente e un ponte sullo stagno regge. I lotti non comprati sono sempre di oggi. Il prezzo del compromesso: un lotto
vecchio dentro un lago nuovo ha un taglio netto sul suo bordo (il lago finisce dritto contro il suo prato). Uno stato nuovo parte con `geo: 2`; `VERSIONE_STATO` resta 9. Provato in
`unita/fattoria3d-laghi` (stato `geo: 1` col pezzo su una cella che oggi è lago, riletto e salvato; la pozzanghera con la passerella; lo stato senza `geo`; stati rotti). Le visite ai vicini (`statoDaSnapshot`)
trattano gli snapshot come gen 0.

## Lo stagno vecchio (le pozzanghere di prima)

Resta solo per i salvataggi (gen 0 e 1) e per Villa Dolce: il quadrato 2×2 al centro del lotto più da una a tre celle del bordo (5–7 celle, `acquaDelLaghetto`). `moloDelLotto` sceglie la cella di riva.

## Regole

- **Sull'acqua non si cammina e non si costruisce**: `blocca()` e `libera()` dicono di no, `puoMettere` rifiuta con motivo `acqua`
  («Qui c'è l'acqua: serve un ponte», in `detti.js`), niente strada a pennello. Alberi e sassi non nascono sull'acqua.
- **Ponte e passerella** hanno `suAcqua: true` in `dati/catalogo.js`: possono avere l'ingombro sull'acqua, purché almeno una cella sia
  terra, oppure tocchino di lato un altro ponte (`_appoggioPerPonte`): un ponte tutto sull'acqua senza appoggio non regge. Sono
  calpestabili: il contadino e i compagni attraversano l'acqua sopra di loro (`cellaPasso`, che vince su `blocca`). Un ponte da 3 supera i 2
  dello stagno (un'estremità sulla riva, l'altra sull'acqua accanto alla riva opposta).
- Toglierlo richiude il passaggio; non si mette altro sul ponte.
- **Le decorazioni d'acqua** (giro G9, [decorazioni.md](decorazioni.md)) stanno sull'acqua senza fare passaggio: le **ninfee** (`soloAcqua`: tutte le celle d'acqua, sul prato no, motivo `serve-acqua`), le **canne** (`anfibio`: acqua bassa e prato, senza appoggio) e il **mulino ad acqua** (`riva`: tocca l'acqua o ci sta in parte, non solo sull'acqua). Non sono calpestabili e non sono `acqua` (non fanno lago e un ponte non ci passa).

## Il disegno

Una lastra azzurra semitrasparente per cella d'acqua (`lastra`, a istanze, senza ombra) su una **riva** di sabbia un po' più larga
(`riva`); **ninfee** (dischi verdi) sull'acqua e **canne** (tre fili alti) sulle celle di riva, tutto a istanze e deciso dalle
coordinate del lotto. Il movimento è nello shader della lastra (`uT`, lo stesso tempo del vento): un luccichio che scorre,
niente riflessioni e niente luci in più. Le istanze si rifanno con la finestra ([mondo-infinito.md](mondo-infinito.md)). Nel
catalogo 3D c'è `fattoria:stagno`.

Il cartello di un lotto comprabile con un lago naturale dice «🪙 N · 🏞️ laghetto» e l'offerta «Qui c'è un laghetto.» (e «🏞️ lago», «🌊 mare», «🏖️ spiaggia» per la geografia grande).

## Lo stagno e il laghetto che si costruiscono

Oltre ai laghi dei lotti il bambino compra due pezzi dalla scheda **Decori** di «Costruisci qui» e li mette dove
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
`unita/fattoria3d-mondo` (sezioni 6, 7 e 9: proporzioni, molo, `puoMettere` con acqua e ponti su una pozzanghera `geo: 1`, percorso che
attraversa la passerella e non l'acqua, Villa Dolce con il suo laghetto e la sua passerella nel lotto `2_-1`), `unita/fattoria3d-laghi` (la distribuzione: percentuale d'acqua,
taglie e forme, margini, terra d'un pezzo, nessun lotto isolato, la catena di ponti, il generatore puro, i salvataggi di prima).
