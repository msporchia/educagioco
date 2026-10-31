# La geografia grande e la pesca

Il mondo ([mondo-infinito.md](mondo-infinito.md)) non è più solo prato, bosco e laghetti a caso: **a ovest c'è il mare, a est i laghi grandi**, e
nell'acqua si pesca. Si pesca da un **molo** o dal **porticciolo**, il pesce è una merce (quello della 2D, `pesce`) e serve alla friggitoria e al
sushi bar, che sono quelli della 2D con le loro ricette. Il perché: un mare lontano e un lago da «sbloccare» comprando i terreni vicini dà un posto dove
andare, e il sushi è quello che la bambina vuole. Codice: `dati/biomi.js` (la geografia), `dati/pesca.js` (i numeri e il pesce), `motore/pesca.js`
(le regole), `scena3d/{terreno,pesci,pesca3d,modelli-pesca}.js` (il disegno).

## Dove stanno (coordinate di lotto `a_b`, a cresce verso est)

| zona | lotti | cosa |
|---|---|---|
| il quadrato di partenza e i 42 lotti storici | a 0..6, b 0..5 (partenza 2..4 × 2..4) | invariati: prato, niente acqua (un test li confronta con la generazione «vecchia») |
| **il mare** | a ≤ −2, per ogni b | **tutto acqua** (16 celle). Quattro lotti dal bordo ovest del quadrato (a = 2): i lotti 1, 0, −1 e −2 |
| **la costa** | a = −1, per ogni b | terra con la **riva che ondeggia**: le prime colonne sono ancora mare (0, 1 o 2 secondo la riga) e poi **2–3 celle di sabbia** in riva, canne in fondo alla sabbia, qualche albero e sasso |
| la fascia di mezzo | a 0..7, b fuori dal rettangolo storico | prato ~66%, bosco ~14%, **laghi naturali** (un lotto su cinque ha un po' d'acqua, il 12% delle celle): [laghi.md](laghi.md) |
| **i laghi grandi** | a ≥ 8, per ogni b | quattro lotti dal bordo est del quadrato (a = 4): i lotti 5, 6, 7 e poi l'8. Fra i laghi c'è terra (prato e bosco), niente laghetti |

Il primo lago sta a est a x ≈ 19 (dal lotto 8_3): per arrivarci si comprano 5_3 … 9_3. Un lago ha 50–78 celle e tocca quasi sempre 4 lotti o più (il più grande 6 o più).

**L'acqua grande non è «per lotto»: è una funzione continua della cella (i, j)**, così attraversa i confini fra due lotti e **comprando i lotti vicini
si scopre più lago**:

- **il mare**: `eMare(i, j)` = `i ≤ −19 + rivaDelMare(j)`, con `rivaDelMare` fra 0 e 2 (somma di tre sinusoidi, da una riga all'altra al più una colonna);
  `eSpiaggia` sono le 2–3 celle dopo, mai oltre `i = −15` (la sabbia non entra nel lotto storico);
- **un lago** è un'ellisse irregolare (centro, due raggi e tre fasi dal seme: 5–6,6 × 3,4–4,4 celle, contorno ondulato) con **zero, uno o due isolotti** (terra in
  mezzo all'acqua); ogni supercella di 5×3 lotti ne ha al più uno (75%) e ci sta tutto dentro: `eLago(i, j)` guarda solo la sua supercella;
- un lotto è `mare`, `costa` o `lago` (e ha le sue celle d'acqua: `acquaDelLotto`) a seconda di dove sta; il resto è `prato`/`bosco`/`laghetto` come prima.
  Mai un laghetto a est del lotto 8 né a ovest del −1.

### I salvataggi di prima non perdono niente

(`geo: 1` e i laghi naturali della fascia di mezzo: `stato.vecchi1`, [laghi.md](laghi.md).)

Un lotto già comprato in uno stato senza `geo` (il campo che dice «geografia grande») **resta com'era**: `normalizza` mette in `stato.vecchi` gli id dei lotti
comprati dove ora il bioma cambierebbe (mare, costa, lago, o un laghetto che sparisce), e il motore li genera con `generaLotto(a, b, { vecchio: true })`: stessi
alberi e sassi, stesso suolo. Quelli non ancora comprati sono nuovi. Se sta sotto il mare, la scena disegna il suo prato sopra l'acqua (`terraSuMare`). Uno stato
nuovo parte con `geo: 2`. `VERSIONE_STATO` resta 9 (i campi nuovi si riempiono da sé). Le visite ai vicini seguono la stessa regola (`statoDaSnapshot`); gli snapshot di
oggi non portano ancora `geo`, quindi la fattoria di un amico si vede con la geografia di prima per i lotti dove cambierebbe (voce in [da-fare.md](da-fare.md)).

**Si compra come ogni lotto**: `prezzoDelLotto`, 40 + 20 per ogni lotto già comprato (l'acqua si paga come la terra). Il cartello dice «🪙 N · 🌊 mare», «🏞️ lago» o «🏖️
spiaggia» (e l'offerta: «Qui c'è il mare: con un molo e il porticciolo ci si pesca»).

**Dal 22/10/2026 (G3) la pesca è al livello 57**, dove la 2D ha la peschiera: molo, molo girato e porticciolo al 57; friggitoria 58, sushi bar 62 (i 17/18 di questa pagina sono storia). Un banco dà un pesce ogni 15 minuti (5 di attesa + 10 di riposo, come la ricetta `pesce` della peschiera). Le soglie dal 58 si spostano di −258 ([livelli.md](livelli.md)).

## Come si vede

- **Il mare lontano** è **un piano solo** (`Terreno._mare`, opaco, a perdita d'occhio verso ovest, da x = −18): turchese in riva e blu al largo (colori nei vertici), lo
  stesso scintillio dell'acqua con meno ampiezza, e la nebbia lo sfuma nel cielo: dal prato si capisce che a ovest c'è il mare. Non ha istanze per lotto: **il peso non cambia**
  con un lotto di mare o con cento. Un lotto di mare non ha velo né recinto (sull'acqua non si piantano pali: `ricostruisciRecinti` salta le celle d'acqua).
- **La costa e i laghi**: una lastra azzurra per cella con la riva di sabbia sotto (come i laghetti), la sabbia della spiaggia (una piastrella per cella), canne e ninfee.
- **I pesciolini** (`pesci.js`): sagome scure (~0,55 celle) sotto il pelo dell'acqua che nuotano in tondo e ogni tanto **saltano** (uno su quattro, ogni ~17 s: si fanno chiari e salgono
  mezzo metro). **Una sola `InstancedMesh`** per tutta la scena, tetto 220, mossa tutta nello shader col tempo dell'acqua: niente matrici aggiornate e niente allocazioni per
  fotogramma. Si ricalcolano solo quando cambia la finestra o uno stagno. Un pesce ogni dieci celle d'acqua (laghi, laghetti, mare, stagni costruiti). Si spengono con l'opzione dei
  ciuffi e col degrado adattivo (`mondo.livello > 0`): sono i primi a sparire.
- **Il molo** (3×1 e 1×3, `modelli-pesca.js`): assi su pali, bitte, una cima, una cassetta col pesce. **Il porticciolo** (4×3): la capanna con l'insegna ⚓, la banchina, le reti stese,
  i barili, la barca che dondola, la lanterna. **Friggitoria** (tendone a righe, friggitrici, il cartoccio di patatine che gira sul tetto) e **sushi bar** (il chiosco giapponese, il noren
  rosso che ondeggia, il bancone coi piattini, due lanterne): `modelli-macchine.js`. Tutti in cache con `memoModello` e fusi per materiale.

## Pescare: le regole

- **Serve un molo** (🪙12, livello 4: `molo` 3×1, `molo_v` «molo girato» 1×3; nella scheda Strade con ponte e passerella: calpestabili, `suAcqua`, partono dalla riva) **o il porticciolo**
  (🪙90, livello 9, uno solo, 4×3, scheda Edifici: `riva: true`, si mette solo su un posto che tocca l'acqua; «Il porticciolo si mette sulla riva»). Non sono produttivi: non spostano la
  scaletta.
- **Il gesto**: si tocca **una cella d'acqua tua** (o la punta del molo). Il contadino cammina fino alla cella da cui si lancia (una cella del molo, o una libera attorno al porticciolo),
  **lancia** (la canna indietro e avanti, il galleggiante in acqua) e **resta lì con la canna alzata**. Il tocco su un'acqua di un lotto non tuo apre l'acquisto del lotto.
- **Il raggio**: la cella toccata deve stare entro **6 celle** (`PESCA.raggio`) dal posto da cui si lancia e **nello stesso specchio d'acqua** (la ricerca è a quattro direzioni
  entro 8 celle: due laghi vicini, o un lago e un laghetto, non sono lo stesso specchio: «L'acqua è troppo lontana dal molo»). Senza moli: «Per pescare serve un molo vicino all'acqua».
- **Il mare vuole il porticciolo** («Per pescare in mare serve il porticciolo»); un molo lungo dal porticciolo allunga il raggio.
- **Il banco**: **ogni lotto d'acqua tuo è un banco** (`stato.pesca[lottoId] = { i, j, fine, riposo }`, `i, j` dov'è il galleggiante): più lotti, più lenze in parallelo, una per banco.
  `lancia → aspetta PESCA.ms = 12 s → ritira → riposo PESCA.riposoMs = 60 s → di nuovo calmo`. Il tempo è assoluto (`ora()`): vale anche a pagina chiusa, come un campo. Il banco **non
  si esaurisce mai per sempre**: si ripopola.
- **Tre stadi a colpo d'occhio** (come le bestie): **acqua calma** (niente) → **il galleggiante dondola piano** con un anello lento (in attesa) → **si immerge a scatti, gli anelli si
  allargano e compare «🐟 Abbocca!»** (tocca per ritirare). Se il contadino è ancora lì quando abbocca, **ritira da sé** (lo strappo, lo spruzzo, il «+1» col pesce, l'esultanza); se se n'è
  andato il galleggiante aspetta: un tocco sull'acqua lo manda a ritirare. **L'attesa non blocca niente**: ci si muove, si fa altro, la lenza resta in acqua.
- **Quanto rende un lancio** (`resaDellaPesca`): 1 pesce da un molo in acqua dolce; **+1 col porticciolo** (le reti, la barca: anche per i laghi); **+1 in mare**, dove si pesca solo col
  porticciolo, quindi **3**. La pesca dà **merci, non monete** (niente si vende).
- Togliere o spostare un molo, il porticciolo o uno stagno **ritira da sé le lenze che non hanno più un molo vicino** (niente pesce: `riesaminaPesca`), così un banco non resta bloccato.
- **Le specie**: la 2D ha un solo pesce (`pesce`, `merce_pesce`, che nasce dalla peschiera): in acqua dolce e in mare è lo stesso, più abbondante in mare. Il gamberetto e il granchio non ci sono
  perché non ci sono in 2D.

## Il pesce e le ricette (identiche alla 2D, tempi in scala 3D)

`pesce` sta in `stato.prodotti` come le uova (ha `dove: 'molo'`: da quel pezzo il livello 4; dati/pesca.js `PESCI`, dentro `PRODOTTI_ANIMALI` con un `ms` suo). Le macchine
sono edifici liberi come gli altri: `posseduti[tipo]` = in mappa, un posto di coda di partenza e fino a sei comprandoli, come ogni macchina ([regole.md](regole.md)); **non hanno un posto «storico»** da migrare
(nessun salvataggio le ha mai avute: i posti di `POSTI_STORICI` con `nuovo: true` servono solo ai controlli).

| macchina (id) | livello | 🪙 | ricette (ingredienti → 1) |
|---|---|---|---|
| Friggitoria (`friggitoria`) | 17 | 170 | patatine (patata 2, 5 s), **pesce fritto** (`fritto`: pesce 1, farina 1, 7 s), arancini (riso 2, formaggio 1, 9 s) |
| Sushi bar (`sushi_bar`) | 18 | 180 | **sushi** (riso 1, pesce 1, 8 s), maki (riso 1, carota 1, peperone 1, 6 s) |

Id, ingredienti, quantità e tempi (minuti → secondi) sono quelli della 2D (`unita/fattoria3d-merci` li confronta uno per uno); le facce sono quelle dell'atlante (`merce_patatine`, `merce_fritto`,
`merce_arancini`, `merce_sushi`, `merce_maki`, `merce_pesce`). **Il sushi è un prodotto finito visibile**: sta in inventario, negli ordini
del banco (`chiedibili`: da livello 18), nelle casse della mongolfiera e nel mercato dei vicini come ogni ricetta.

**I livelli**: la scaletta ha **una cosa produttiva per livello** e tutti e sedici i livelli ne avevano una, quindi le due macchine aprono due livelli in coda: **17 e 18**.
Le soglie dei livelli di prima non si muovono (la soglia di un livello somma solo i costi dei livelli sotto); `ULTIMO` passa da 16 a 18 e **l'ultimo livello costa ~495 minuti di
esercizio (8 ore e un quarto)**, quindi il tetto della taratura passa da 7 a **8 ore e mezza** (`TETTO_ULTIMO_MIN` 510): ~45 minuti per livello come i vicini. Provato: il sushi bar a 🪙190 era
oltre i due terzi del salto del suo livello (190 su 290); 🪙180 sta dentro, e la friggitoria sta a 🪙170. `npm run tara:fattoria3d` e `unita/fattoria3d-taratura` restano verdi.
**Il pesce si pesca dal livello 4 ma serve dal 17**: fino ad allora si accumula (non marcisce) e basta; è il compromesso della scaletta, non un'idea.

## Il peso

Una `InstancedMesh` di pesci (220 al massimo, 32–60 triangoli in tutto), un piano di mare, due `InstancedMesh` di sabbia e di prato-sul-mare (240 e 40 istanze), l'acqua dei laghi
(lastra e riva: 720 celle al massimo per finestra, erano 200), canne 300, ninfee 200, e i galleggianti (un gruppo da 4 mesh per banco con la lenza in acqua, un solo `Line` per il filo).
Il molo costa 1 mesh fusa (562 triangoli), il porticciolo 6, la friggitoria 7 e il sushi bar 9 (le animate restano separate). Il peso non cresce con la fattoria.

## Nei test

`unita/fattoria3d-geografia` (la geografia: i lotti storici invariati, il mare a a ≤ −2, la costa e la riva che ondeggia, i laghi grandi continui fra lotti e con isolotti, la
funzione solo della cella; i prezzi; i salvataggi di prima; il catalogo; la pesca: raggio, specchio, mare e porticciolo, il tempo, il ripopolamento, il pesce nelle ricette; i rifiuti),
`unita/fattoria3d-merci` (le ricette del pesce come la 2D), `unita/fattoria3d-mondo` (le proporzioni nella fascia di mezzo), `unita/fattoria3d-taratura`, `unita/catalogo-3d`
(molo, molo girato, porticciolo, galleggiante, pesci, mare, friggitoria, sushi bar, il contadino con la canna). `integrazione/fattoria3d`: il blocco «la pesca» (un molo sul lago,
il tocco sull'acqua, il galleggiante, il tempo spostato con `motore.ora`, il pesce, il contatore `fattoria3dPesci`, il mare col porticciolo) **scritto ma non eseguito sulla build**
(vietata mentre lavorava un altro agente): la logica è provata nel dev server con un Chrome senza schermo.
