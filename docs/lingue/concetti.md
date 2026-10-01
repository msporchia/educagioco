# English a mondi — i concetti e la loro pagina

Una tappa di frasi insegna una struttura, e una struttura sono due o tre
cose diverse: «Mi piace!» è *I like*, *I do not like* e *do you like?*.
Il bambino le incontra **una alla volta**, ognuna con una pagina che la
spiega. Le tappe di parole non ne hanno: per *dog* non c'è niente da
spiegare. Le frasi e i formati stanno in [frasi.md](frasi.md).

## La regola

- **La prima volta una tappa di frasi presenta i suoi concetti in fila**:
  la pagina del primo, poi `PER_CONCETTO` (3) risposte giuste su frasi sue,
  poi la pagina del secondo, e così via. Finiti i concetti, le frasi si
  mescolano come sempre fino al `bersaglio`, e la tappa non finisce a
  presentazione aperta. «La prima volta» vuol dire **tappa non ancora
  vinta**: rigiocandola, per esempio col grado calato, le pagine non
  tornano da sole.
- **La pagina torna a chi continua a sbagliare lo stesso concetto**: ogni
  `SBAGLI_PER_LA_PAGINA` (5) sbagli sul concetto nella stessa partita, al
  posto dell'attesa. Cinque e non due per scelta del proprietario: uno
  sbaglio ha già il suo perché e il «Si fa così», e la pagina vuol dire
  «vedo che non hai proprio capito, aspetta che ti spiego», non una
  ramanzina al primo errore. Vale anche rigiocando e alla 🏁.
- **Contano solo gli sbagli di grammatica**, quelli che pesano sulla forma
  (`forma:<id>`). Una parola vicina (*cat* per *dog*) o un'altra frase presa
  in «riconosci» non dicono niente sul concetto.
- **La pagina non ha attesa**: resta finché non si tocca «Ho capito». Ha
  solo la finestra cieca dell'orologio (`CIECA`), perché il tocco della
  risposta di prima non la chiuda da solo
  ([../core/il-dito.md](../core/il-dito.md)).

## Com'è fatta una pagina

Un titolo corto in italiano («Non mi piace»), la regola in una o due frasi,
e **due esempi**: il primo è quello che il bambino sa già, il secondo cambia
una cosa sola, colorata (*I like milk* → *I **do not** like milk*). Un
esempio in più non insegna di più: insegna il confronto. Le parole inglesi
si toccano e dicono cosa vogliono dire, sempre gratis. Quando la pagina
torna dopo gli sbagli dice «Aspetta, te lo spiego meglio» e la frase giusta
appena sbagliata.

## Il dato

`dati/concetti.js`, per struttura: `{ id, titolo, spiega, esempi, prende? }`.

- **`id`** comincia con la struttura (`i-like:no`).
- **`esempi`**: `[en, it]`, con fra [quadre] quello che cambia.
- **`prende(f)`** dice quali frasi della struttura sono sue (`f.en` in
  minuscolo, `f.domanda`); si prova nell'ordine scritto, e l'unico concetto
  senza `prende` tiene il resto. L'ordine scritto è anche l'ordine in cui si
  presentano. Una regola e non un campo su ogni frase: una frase nuova trova
  da sé il suo concetto.
- **Ogni concetto ha almeno `PER_CONCETTO` frasi nella sua tappa**: dove ne
  aveva meno (la negativa di «Che cos'è?», la domanda di «Lei ha…») se ne
  sono scritte di nuove, coi loro `id` nuovi.

`guastiDeiConcetti` (`motore/concetti.js`) controlla tutto: ogni frase delle
tappe ha un concetto, ogni concetto abbastanza frasi, gli esempi solo
parole note alla tappa, almeno un esempio con qualcosa di colorato.

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `dati/concetti.js` | i concetti di ogni struttura |
| `motore/concetti.js` | `concettoDi`, `concettiDellaTappa`, `paginaDi`, `PER_CONCETTO`, `SBAGLI_PER_LA_PAGINA`, i controlli |
| `motore/sessione.js` | `presenta`: la fila dei concetti; `rispondi` mette `pagina` nell'esito al quinto sbaglio |
| `viste/Pagina.vue` | la pagina a schermo |
| `Gioco.vue` | `presenta` quando la tappa non è vinta; `mostraPagina` e «Ho capito» |

**Per la vista**: `new Sessione({ …, presenta })`; `prossima()` può tornare
`{ genere: 'pagina', concetto, titolo, spiega, esempi: [{ pezzi, it }],
ripresa, giustaEra }` al posto di una domanda, e l'esito di `rispondi` può
avere `pagina` (la stessa forma, con `ripresa: true`).

Nei test: `unita/inglese-concetti` (il dato, la presentazione, il ritorno
al quinto sbaglio e mai per una parola); `integrazione/inglese-mondi` (la
pagina compare la prima volta, non scade, «Ho capito» porta alle frasi).
Bersagli: `[data-pagina]` con `[data-concetto]` e `[data-ripresa="0"|"1"]`,
`[data-esempio]`, `[data-forte]` su quello che cambia, `[data-azione="capito"]`.
