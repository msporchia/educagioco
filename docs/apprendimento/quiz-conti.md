# I conti puri (`moduli/conti.js`)

«7 × 8 = ?», «13 − 5 = ?»: un conto di **una** operazione, senza storia
attorno, a una **grandezza** da 1 a 10, con quattro risposte. Esiste per i
giochi che *sono* il conto (Castle Battle) e vogliono comunque tutto quello
che dà il motore dei quiz: il perché dei falsi e il «Si fa così» dopo uno
sbaglio ([la-domanda.md](la-domanda.md)), lo SRS, la finestra d'età e i saperi
spenti dai genitori.

## Come si chiede

```js
import { domandaPerGioco } from '../../quiz/scelta.js'
const q = domandaPerGioco({ moduli: ['conti'], tipi: ['prodotto'], grado: 7 })
```
```vue
<Domanda :domanda="q.domanda" :pittori="q.pittori" :titolo="`${q.icona} ${q.nome}`"
         :origine="q" gioco="arena" @risposto="…" />
```

- **`tipi`**: `somma`, `differenza`, `prodotto`, `quoziente` (o la chiave intera,
  `conti:prodotto`). Restringe le tipologie del modulo nominato; un tipo che
  non esiste non rompe niente, ricade su tutti.
- **`grado`** (1..10) è la grandezza *esatta*: se l'età o i saperi spenti lo
  chiudono si scende al grado aperto più alto sotto di lui, mai si sale. Senza
  `grado`, `difficolta` 0..1 pesca una campana di gradi attorno all'età
  (`quiz-livelli.md`): sale in media, ma non copre 1..10 in modo piatto.
- **`origine`** (`:origine="q"`) accende il ripasso: senza, la risposta non si annota.
- L'evento `risposto` è quello di sempre: `{ giusto, indice, chiave, tempo, diFretta }`.

## Solo su richiesta

Il modulo dichiara `soloSuRichiesta: true`: **non entra nei mazzi generali**
(Survivors, sotterraneo e chiunque non nomini `moduli`), e nemmeno nel ripiego
«spento tutto». Entra solo se `moduli` lo cita. Anche l'elenco dei grandi
(`quiz/catalogo.js`, il quadro dell'età, «Come va») usa `MODULI_DEI_MAZZI`: descrive
quello che un bambino si vede arrivare dai giochi. Gli interruttori dei saperi
invece lo toccano (`moltiplicazioni`, `divisioni`, `numeri`), e `quiz/saperi.js`
ne mostra le sottovoci.

Nei test: `unita/quiz-conti` (400 domande dei giochi generali identiche con e senza il modulo).

## La scala

Dieci gradi per tipo, uno alla volta; il livello 0-100 è dichiarato per tipo e per
grado (`livello: { g: n }`), il quoziente è il più duro perché va a ritroso nella tabellina.

| grado | somma / differenza | prodotto / quoziente |
|---|---|---|
| 1 | dentro il dieci | ×2 e ×10 |
| 2 | dentro il venti senza passare la decina | ×2, ×5, ×10 |
| 3 | passando la decina | tabelline fino al 5 |
| 4 | una cifra e due, senza passaggio (o decine tonde) | fino al 7 |
| 5 | una cifra e due, passando la decina | fino al 9 |
| 6 | due cifre e due, senza riporto | 6-9 per 6-10 |
| 7 | due cifre e due, col riporto | fino al 12 |
| 8 | sopra il cento | due cifre per una, senza riporto; due cifre : una |
| 9 | tre cifre e due, col riporto | due cifre per una col riporto; tre cifre : 2-5 |
| 10 | tre cifre e tre, due riporti | tre cifre per una; tre cifre : 3-9 |

I numeri vengono dalla `sorte` (ripetibile): i generatori di `data/ops.js` usano
`Math.random` e non si possono rifare con un seme, quindi qui si riprende solo
la scala (lunghezze e riporti), non il codice.

## I falsi

Sono gli sbagli veri, ognuno col suo `perche`: il riporto perso o messo due volte,
il prestito non restituito o la sottrazione colonna per colonna (`senzaPrestito`),
un gruppo di troppo nella tabellina («63 è 7 × 9»), uno zero in più o in meno, la
somma al posto del prodotto; nella divisione la **prova** («4 × 8 fa 32, non 28»).
Poi ±1 e ±2 e, per riempire, `erroriTipici` di `data/calcolo.js` (esportata per
questo). Niente a più di sei di distanza o del 60% dal risultato, niente sotto 1.

## Le chiavi per lo SRS

Prefisso **`conti:`** (`conti:somma`, `conti:differenza`, `conti:prodotto`,
`conti:quoziente`): libero in `store/progressi.js` (lì ci sono `math:`, `calc:`, `op:`,
`num:`, `prob:`…) e senza una materia nuova nei progressi. La chiave è la
*tipologia*, non la grandezza: un 7 × 8 e un 345 × 4 pesano sullo stesso ripasso.
