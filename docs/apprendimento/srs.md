# Il motore di apprendimento

Come `src/store/srs.js` decide cosa ripassare, e come `src/store/marea.js`
lo corregge per le materie a scala (tabelline, calcolo a mente). Da leggere
prima di toccare uno dei due.

## L'elemento e la forza

Un elemento è indifferentemente una tabellina (`math:7x8`), un vocabolo
(`en:butterfly`) o una tipologia di quiz (`orto:gn`): il motore non sa di
cosa si tratta. Lo stato per elemento è `{ s, ok, err, last, seen, t }`
(`newItem`), più `errAt` dopo il primo sbaglio.

- **La forza `s` va da 0 a 6** (`MAX_S`). Una giusta la alza di 1
  (`gainOk`), uno sbaglio la abbassa di 2 (`lossErr`). Da 4 in su
  (`masterS`) l'elemento è «imparato» (`isMastered`) ed esce dal giro.
- **L'intervallo di ripasso raddoppia a ogni livello**: `IVL`, da ~10
  minuti a 3 settimane (`[0.007, 0.03, 0.3, 1, 3, 8, 21]` giorni).
- **Decadimento.** Superata la scadenza la forza *efficace* (`strength`)
  cala da sola: un punto ogni un intervallo e mezzo di ritardo. Quello che
  non si vede da tempo torna senza bisogno di sbagliarlo: è la curva
  dell'oblio.
- **Il peso di estrazione** (`weight`) scende con la forza efficace e sale
  col ritardo (urgenza fino a ×3); dove la velocità conta (tabelline,
  `useTime`) una risposta più lenta di `slowMs` (3,5 s) pesa ×1,5.
- **Il tempo** `t` è una media mobile al 45%: un campione solo la sposta di
  quasi metà, quindi chi annota deve tagliare i tempi assurdi (vedi
  `TEMPO_MAX` in [la-domanda.md](la-domanda.md)).

## Dentro una sessione (`createPicker`)

- **Distanza minima.** Nessun elemento ricompare prima di 6 altri
  (`minGap`); senza, le ripetizioni arrivavano a raffica.
- **Ripasso dopo l'errore.** Uno sbaglio torna dopo 6 turni e poi dopo 20
  (`reviewGap`).
- **Riposo.** Chi risponde giusto `pausaDopo` volte di fila (tre, negli
  asteroidi) manda l'elemento a riposo fino a fine partita e ne entra un
  altro (`riposati`). Il consolidamento resta ai ripassi dei giorni dopo.
- **`annota(id)`** mette in memoria corta una domanda scelta fuori dal
  picker (il boss degli asteroidi), se no può uscire due volte di fila.

## L'insieme attivo (`activeSet`)

Si lavorano ~10 elementi alla volta (`setSize`); quando uno è imparato ne
entra un altro, e gli scaduti rientrano comunque. Con `gruppi(id)` la scelta
gira a turno fra i gruppi scelti dal bambino: prendendo solo i più facili in
assoluto uscivano per intere partite il ×1 e il ×10, e il 7 mai.

## La marea: sotto il livello si dimentica più piano

Chi sa 7×8 non ha dimenticato 2×3. La curva dell'oblio è una sola, e per le
materie a scala è cieca a questo: un 2×3 non visto da dieci giorni scendeva
come qualunque casella e la pesca lo tirava fuori. `store/marea.js` stima
**la frontiera** — fin dove il bambino sa tutto — e dà a ogni elemento una
**lentezza** (≥ 1, quante volte più lungo è il suo intervallo). Il motore la
riceve come numero (`lentezza` in `overdue`, `strength`, `weight`,
`activeSet`, `createPicker`) e non sa da dove viene; lingue e quiz non la
passano e hanno la curva di sempre.

- **Frontiera delle tabelline** (`frontieraTabelline`): la tabellina più
  alta fin dove i gradini reggono tutti, dal 2. Il gradino di un calcolo è
  il suo fattore più alto (3×7 sta nel 7), quindi la scala è triangolare.
  Un gradino regge se manca al più una casella su cinque (`TOLLERANZA`
  0,2), e comunque una. Un buco al 5 ferma la frontiera al 4 anche se il 7
  regge. ×1 e ×10 non contano.
- **Frontiera del calcolo a mente** (`frontieraCalcolo`): quante stazioni
  reggono di seguito dalla prima. **Stima separata**: le due frontiere non
  si guardano.
- **La curva** (`lentezzaDa`) è `1 + (distanza/2)²`, tetto `MAREA_MAX` 10:
  1,25 a un gradino, 2 a due, 5 a quattro, 10 a sei. Continua, perché uno
  scalino farebbe dimenticare 5×6 e 4×6 in modi diversi. Esempio: per chi
  sa fino al 9, in cento giorni di volo libero escono 268 caselle del 7-8-9
  e nessuna del 2-3-4.
- **Cosa non fa.** Non tocca la frontiera né quello che sta sopra; non
  tocca lo **sbagliato di recente** (per `RIENTRO`, 30 giorni da `errAt`,
  torna alla curva normale); non rende niente eterno (tre settimane al
  tetto fanno sette mesi). Il boss chiede la casella più tosta fra quelle
  che non reggono, e ignora la marea.
- **La frontiera si legge dalla forza nominale**, non dall'efficace, se no
  si morderebbe la coda. La nominale scende con gli sbagli: chi torna dopo
  un anno e sbaglia 7×8 abbassa la frontiera, e tornano anche le sotto.
- **La stessa lentezza** la usano la ⭐ dei pianeti (`tabellineIntereDi`) e
  «Cosa so» («sai tutte le tabelline fino all'8»), se no la stella si
  spegnerebbe mentre il pool, a ragione, non ripropone.

Nei test: `misure/asteroidi` (blocco 10, i numeri della marea).

## Come lo usano i quiz

I quiz usano solo la forza (che decade) e **mai `isMastered`**: un concetto
non finisce mai. Il bisogno che ne ricavano sta in
[quiz-ripasso.md](quiz-ripasso.md).
