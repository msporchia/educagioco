# English a mondi — le trappole

Le frasi sbagliate delle domande: da dove vengono, perché sbagliano, su
cosa pesano. Le frasi e i formati sono in [frasi.md](frasi.md).

## Le trappole sono il dato

Una tabella di **errori tipici per struttura** (`dati/trappole.js`) genera
le frasi sbagliate, ognuna col suo perché in una riga (sotto i 70
caratteri): *it is* al posto di *is it* nella domanda, *she play*, *does he
likes*, *I not like*, *a hat red*, *three dog*, *the* davanti a un nome
generico, *he/she*, *have/has*, *can to*, *goed*… Le trappole scritte a mano
(parole vicine: *pen/pencil*) si aggiungono alla frase, non sono
obbligatorie. Le opzioni sbagliate di «scegli», la tessera di troppo di
«completa» e quelle di «componi» vengono dalle stesse trappole (più le
gemelle, [frasi.md](frasi.md#le-tessere-di-troppo)): una scrittura, tutti i
formati.

**Una riga nomina un'operazione** (`fa`, coi parametri in `con`) di
`motore/trappole.js`. Un errore che somiglia a uno che c'è è una riga
(`can-to` è `inserisci` con `to` dopo `can`, `told-to` lo stesso dopo
`told`); un errore di specie nuova è un'operazione nuova. Ogni riga porta
un `esempio` `[giusta, sbagliata]` e il test lo rifà. Una riga può valere
solo per certe forme (`soloForme`: *in/on* è un errore di mesi in «Oggi è
lunedì» e di posto in «Dov'è?», e le due spiegazioni sono diverse) o solo
dai mondi di un anno in su (`dallAnno`: *does you like?* è un errore vero
anche in seconda, ma lì *does* non si sa ancora e la tessera sarebbe una
parola mai vista).

**Su cosa pesa uno sbaglio** lo dice la riga (`pesa`): le trappole di
grammatica su frase e forma (la forma della riga, o quella della frase),
le parole vicine sulla parola. Aver preso in «riconosci» l'italiano di
un'altra frase pesa solo sulla frase.

## Una trappola sbaglia per il motivo che dice, e per nessun altro

Le parole vicine si generavano senza guardare il numero: «I have got a
trousers», «has she got a big hair», «it is a orange ball». Adesso la parola
vicina rifà l'articolo (*an orange*), non mette una cosa che non si conta o
già plurale dopo *a* (`NON_CONTABILI` in `motore/lessico.js`), al posto di
una che non si conta ne mette una al plurale («I like milk» → «I like
apples»), ma non davanti a un verbo al singolare («lunch is at one» non
diventa «mornings is at one»). Lo controlla per ogni frase e ogni trappola
`sgrammaticata()` di `motore/grammatica.js`: *a/an* giusti, niente *a*
davanti a un plurale o a una cosa che non si conta, il plurale dopo un
numero. Le righe che sbagliano apposta proprio questo (`a-an`,
`plurale-senza-s`) stanno in `APPOSTA`.

Con i verbi la stessa regola vuol dire **rifare il resto della frase**:

- togliere *does* da una domanda ridà la *s* al verbo («does she play?» →
  «she plays?», non «she play?»); togliere *does not* o *did not* ridà la
  frase che dice di sì («he drinks», «I saw»), non «I did see»;
- mettere il presente al posto del passato lo accorda con chi lo fa («she
  went» → «she goes», non «she go»);
- *s-con-io* non tocca *do* e *have*, che hanno le loro righe
  (`accordo-do`, `accordo-have`);
- *doed* non esce: nessuno lo dice, e al posto di *did* c'è già *do*.

Dove l'italiano non dice chi fa la seconda cosa («ha riso quando ha visto
Pip») la frase porta `niente: ['lui-lei']`: *he* e *she* sarebbero giuste
tutte e due.

## Le parole vicine

**Si generano da sole** (`parola-vicina`: un nome, un colore, un aggettivo
o un verbo della frase scambiato con uno dello stesso gruppo già noto) e
riempiono quando le trappole di grammatica non bastano; quelle scritte a
mano nella frase (`trappole: [{ en, it, perche, parola }]`) escono prima.
**Il gruppo** è l'argomento della tappa che insegna la parola (i giorni
con i mesi, non con *morning*), se no la categoria; un verbo si scambia con
un verbo, e uno sbaglio lì pesa sul verbo (`verbo:`).

**La scelta** (`scegliTrappole`): una per riga della tabella, e una forma
debole fa uscire più spesso la sua; le parole vicine riempiono, non
comandano.

## Le righe, per anno

| anno | righe |
|---|---|
| prima–terza | `gira-domanda`, `gira-affermazione`, `soggetto-mancante`, `accordo-be`, `accordo-have`, `aggettivo-dopo`, `aggettivo-con-s`, `plurale-senza-s`, `a-an`, `the-generico`, `do-mancante`, `not-senza-do`, `lui-lei`, `mio-tuo`, `negazione-tolta`, `negazione-aggiunta`, `wh-ordine`, `come-cosa`, `there-is-are`, `c-e`, `preposizioni`, `in-on-tempo`, `can-to` |
| quarta | `s-con-io` (*I plays*), `terza-senza-s` (*she play*), `accordo-do` (*do she*), `does-con-s`, `doesnt-con-s`, `ing-senza-be` (*I eating*), `ing-senza-ing` (*I am eat*), `ora-at` (*in seven o'clock*), `what-hour` |
| quinta | `accordo-was` (*we was*), `be-al-presente`, `passato-in-ed` (*goed*), `passato-al-presente`, `did-col-passato` (*did you went*), `did-mancante`, `said-told`, `told-to`, `soggetto-dopo-when` (*when is cold*), `quando-mentre`, `quando-dove`, `going-senza-be` (*I going to*), `going-senza-to`, `going-to-ing`, `more-corto` (*more big*), `er-lungo` (*beautifuler*), `more-doppio`, `than-superlativo` (*biggest than*), `the-comparativo`, `than-of` |

`wh-ordine` gira anche quando la parola che chiede si porta dietro una
cosa («what time is it» → «what time it is»).
