# Il cielo, il volo infinito e l'astronave

Quanto corre il cielo col livello, il volo che si apre a fila finita, e
cosa possono (e non possono) fare la nave e i gettoni. La fila delle
tappe sta in [scaletta.md](scaletta.md).

## Il livello, e quanto corre il cielo

Il livello sale di uno ogni cinque giuste **di questa partita**
(`salitaOgni` in `src/views/MathGame.vue`): chi è a sette ha appena
azzeccato trenta calcoli e sta dimostrando che il ritmo lo regge. Fa due
cose (`difficolta`, `ritmo`):

- **infittisce il cielo** — un sasso sbagliato in più ogni due livelli,
  fino a sei (`base` 3, `ogniLivelli`, `maxAsteroidi`). È il modo
  principale di salire: scartare un falso in più è il lavoro che si vuole;
- **accelera del 5% a livello fino a un pavimento** (`cadutaSec` 10,
  `ritmoPasso` 0,05):

| dove | pavimento | cioè | lo si tocca a |
|---|---|---|---|
| le tappe (`ritmoTappa`) | 70% | sette secondi invece di dieci | livello 7 (30 centri) |
| il volo (`ritmoVolo`) | 50% | cinque secondi | livello 11 (50 centri) |

- **Perché un pavimento.** Senza fondo, a livello sei la domanda diventava
  «quanto sei svelto di mano», e chi sa il conto in cinque secondi veniva
  segnato come uno che non lo sa. Senza nessuna accelerazione il livello
  era solo un numero, e il volo non finiva mai.
- **Perché due.** Una tappa ha un bersaglio e si chiude in una serata: il
  livello non deve diventarne il muro. Nel volo l'unica cosa è durare.
- **Il sasso giusto è in scena entro tre secondi** (`rispostaEntro`) e,
  anche al pavimento, resta da toccare per almeno due.
- **Il cronometro della risposta parte quando il sasso giusto è tutto
  dentro lo schermo** (`prontaIl` in `src/views/MathGame.vue`), non
  quando compare la domanda o nasce il sasso: contando da prima, l'attesa
  della caduta finirebbe nell'SRS come esitazione sul calcolo. Per questo
  il sasso giusto (mai quello sbagliato) nasce sfalsato in modo da essere
  tutto in scena entro `rispostaEntro`; quando nemmeno partire attaccato
  al bordo basta (boss grosso, schermo piccolo, ultima vita) nasce già
  affacciato invece che accelerare.
- Il peso del calcolo, il boss (`bossLento` 1,45), la domanda difficile
  (`difficileLento` 1,25) e l'ultima vita (`EMERGENZA`: ×1,25, cioè un
  quarto più lenti) allungano moltiplicando sopra.

## Il volo infinito: uno, e si complica col livello

- **A fila finita si apre un volo solo**, tabelline e calcolo a mente
  insieme (`VOLO` in `src/data/asteroidi.js`). Due voli, uno per mestiere,
  rimetterebbero in piedi le due metà che la fila esiste per fondere.
- **Il livello sposta una mira** sulla scala 0..1 della difficoltà
  (`src/store/volo.js`, puro): 0,15 a livello 1 (`MIRA_MIN`), 1 a livello
  9 (`LIVELLO_CATALOGO`), fino a 1,4 a livello 12 (`MIRA_OLTRE`,
  `LIVELLO_TETTO`); oltre il dodici cresce solo la velocità.
- **Le due scale sono riportate a 0..1** perché la mira sia una:
  `altezzaTabellina` per le tabelline (2×2 → 0,14 · 3×7 → 0,5 · 9×9 →
  0,93; ×1 e ×10 a zero), `altezzaMente` per il calcolo a mente (la
  posizione della stazione del concetto: entro il dieci → 0, centinaia → 1).
- **Attorno alla mira una campana stretta** (`BANDA` 0,2, la forma di
  `pesoDi` dei quiz): a livello 5 (mira 0,57) 9×9 pesa il 4% di 3×7. Il
  pool di ogni domanda sono otto chiavi pescate con quei pesi (`QUANTI`,
  `pescaPesati`). A livello 1 7×8 non esce mai, a livello 9 2×3 nemmeno.
- **×1 e ×10 si dividono mezza casella** (`PESO_BANALE`): sono diciannove
  caselle per una regola sola, e senza a livello 1 un terzo delle domande
  sarebbe 1×7.
- **I due magazzini si alternano** a monetina, mai più di tre di fila
  dello stesso (`creaAlternanza`): un pool unico lo sceglierebbe il motore
  per bisogno, e il bisogno di 55 fatti non si confronta con quello di una
  strategia. Il boss chiede dal magazzino dell'ultima domanda.
- **La marea si somma**: il picker pesca nel pool della mira con la
  lentezza di quel mestiere (`mareaTabelline`, `mareaCalcolo` in
  `src/store/marea.js`, vedi [../apprendimento/srs.md](../apprendimento/srs.md));
  per chi sa fino all'8, a livello 3 il 2 e il 3
  escono un terzo delle volte che uscirebbero senza.

### Oltre il catalogo: dal livello 9

Vincere sempre la stessa cosa, solo più in fretta, è logoramento: sopra
l'uno ci stanno **le tabelline grandi**.

- **`GRANDI`** in `src/data/tabelline.js`: l'11 e il 12 interi, 2..5 del
  13-14-15, senza ×1 e ×10. Ognuna ha la sua altezza (`altezzaGrande`:
  11×2 a 1,06, 12×5 a 1,22, 12×12 a 1,40).
- **Hanno la forma delle altre (`math:8x11`) ma non sono caselle**: non
  contano fra le 55, non stanno in nessuna tappa, né nella mappa, né in una
  stella, né nella marea. `eCasella` è il filtro, e `unita/asteroidi` lo
  prova su ogni consumatore.
- **Una grande su tre scende girata** (96 : 12 = ?, `giraLaGrande`) e si
  segna sulla sua casella. Il boss del volo alto pesca fra le grandi
  (`caselleDelBoss`, `SOGLIA_BOSS`).
- **Per il calcolo a mente l'oltre è la taglia**, che nel volo la dice il
  livello (`tagliaDelVolo`: 0 a livello 1, 1 al 12) e non la forza del
  concetto. Nelle tappe resta quella della forza: passa a
  `esercizioDaChiave` come opzione, non come globale. «Quante volte ci sta»
  a taglia piena divide anche per due cifre, col resto.

Quello che esce, per livello (misurato in `unita/asteroidi`):

| livello | mira | taglia | grandi fra le tabelline | esempi |
|---|---|---|---|---|
| 3 | 0,36 | 0,18 | nessuna | 3×5 · 2×4 · 30+40 · 26+7 |
| 7 | 0,79 | 0,55 | il 7% | 6×7 · 8×9 · 47+29 · 4×43 |
| 8 | 0,89 | 0,64 | una su quattro | 7×8 · 11×3 · 350+200 · 4×61 |
| 9 | 1,00 | 0,73 | la metà | 9×9 · 11×8 · 132 : 11 · 560+320 |
| 10 | 1,13 | 0,82 | quasi tutte | 12×5 · 11×9 · 7×86 · in 87 quante volte c'è 12 |
| 12 | 1,40 | 1,00 | tutte | 12×12 · 11×12 · 96 : 8 · 640+380 |

### Il record, e da dove si riparte

- **Chi ha un record riparte due livelli sotto** (`partenzaDalRecord`,
  dai dettagli del quaderno): dieci calcoli di scaldamento dentro la sua
  fascia. Due e non tre perché da 11 si riparte da 9, dove le grandi sono
  metà del magazzino; da 8 sarebbero una su quattro, forse nessuna prima
  del boss. Sassi e velocità leggono quel livello: la partita è quella di
  livello 9 in tutto. Senza record si parte da 1.
- **Il record è in punti** (`senzaFine` di `mate` in `src/data/giochi.js`,
  misura `punti`), raccontato «livello 7 · 43 centri · serie 12».
- **Il record vecchio sta in `best.math`**, fuori dalla campagna: il
  manifesto lo dichiara con `vecchio`, e si legge finché un quaderno non
  c'è. Si scrive **prima** di `riassunto()`, che riscrive `best.math` coi
  punti di adesso: letto dopo, ogni primo volo era un pareggio con sé
  stesso. Le regole comuni dei record stanno in
  [../core/primati.md](../core/primati.md).

## L'astronave, e cosa può e non può fare

- **La nave è l'unico posto dove si leggono le vite.** Chi gioca guarda il
  cielo, e la nave sta dentro lo stesso sguardo. La barra in cima dice solo
  le due cose che la nave non può dire: quanto manca al bersaglio della
  tappa e quanti centri sulla cosa nuova (nel volo, i punti). Il filotto
  🔥 compare da cinque in su.
- **I tre stati dello scafo**: intatto · l'ala **strappata** (bordo
  frastagliato, pezzi che galleggiano, scintille, spia ambra che
  lampeggia) · lo strappo che si mangia l'ala, vetro crepato, fumo, spia
  rossa che batte il doppio. Quello che si legge di sfuggita è qualcosa
  che si muove, un buco nel contorno e dei pezzi staccati. Provato: l'ala
  che si accorcia — non c'è niente con cui confrontarla, e non dice
  *rotta*. (`statoScafo`, `puntoRotto` in `src/grafica/spazio.js`)
- **La nave cresce col livello**: navetta, al 3 caccia, al 6 incrociatore.
- **`src/grafica/spazio.js` non sa di vite né di punti**: riceve fatti
  già decisi (`danno: 0.5`). Il pianeta in basso non c'è: una cosa in
  scena che non fa niente è una domanda senza risposta.

### I gettoni

Si guadagnano giocando, stanno in tasca in basso a destra (mai più di tre,
`TASCA_MAX`), si spendono premendoli e finiscono con la partita
(`src/data/potenziamenti.js`, dove stanno numeri e ragioni).

| | come arriva | cosa fa |
|---|---|---|
| ❄️ gelo | 5, 15, 25… giuste di fila, o un boss abbattuto | congela **la domanda in corso e basta**: i sassi al 42% (`lento`), e dalla domanda dopo il cielo riparte |
| 🎯 mirino | idem, a turno col gelo | fa sparire **una** risposta sbagliata a caso; quel sasso non lascia niente in archivio |

- **Un gettone non si perde mai sbagliando**: si spende o resta lì. Un
  premio che si accende da solo è un lampo giallo, e uno che si perde
  sbagliando è una seconda punizione. Provato: scudo e cannone doppio che
  si accendevano da soli.
- **I due si alternano guardando l'ultimo uscito** (`gettoneDopo`), da
  qualunque parte arrivi: legati alla serie, il mirino lo vedeva solo chi
  non sbagliava mai. A dieci e a venti di fila arriva una vita invece del
  gettone (`premioDaSerie`, `serieVita`).
- **Il gelo vale per la domanda che si ha davanti**: a tempo, dieci
  secondi coprivano tre domande. Chi non lo usa se lo trova speso alla
  domanda dopo, non regalato.
- **Un gettone non risponde mai al posto del bambino**: nessuno accorcia
  un calcolo, ne salta uno o indica il sasso giusto. Il mirino regge
  perché si paga con cinque centri di fila e, con quattro o sei sassi in
  cielo, toglierne uno sbagliato a caso lascia il conto da fare. Possono
  dare più tempo a chi è in difficoltà, non di più.
- **Non si comprano**: le monete sono la valuta della fattoria, e un
  hangar che le succhia sposterebbe un gioco che non c'entra.
- **Il cannone a riposo non punta niente** (`SPAZZATA`: ±54°, andata e
  ritorno ogni 3,4 s, moto che dipende solo dal tempo) e si ferma su un
  bersaglio solo dopo che il dito ha scelto. Provato: agganciato al sasso
  più basso finiva per indicare il giusto; un dondolio stretto attorno
  alla verticale si leggeva come «guarda lì».

## La pausa

Il ⏸, il telefono posato, il foglio del `?` e un cartello di traguardo
fermano il cielo (`usaPausa`, con `anche: fase !== 'gioco'`: fuori dalla
partita non scende niente). Le regole comuni stanno in
[../core/interfaccia.md](../core/interfaccia.md).

Nei test: `integrazione/pausa-asteroidi`; `button[aria-label="pausa"]`,
`[data-pausa]`, `[data-azione="riprendi"]`.
