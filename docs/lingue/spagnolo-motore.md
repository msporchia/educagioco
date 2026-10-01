# Español a mondi — il motore e il contratto

Lo spagnolo a mondi (`src/giochi/spagnolo/`) è una copia del motore
dell'inglese ([mondi.md](mondi.md), [frasi.md](frasi.md),
[trappole.md](trappole.md)) con la lingua rifatta. Il percorso è in
[spagnolo.md](spagnolo.md). Qui: cosa è proprio dello spagnolo, come si
scrivono frasi, concetti e capitoli, quali trappole nascono da sole, i
limiti.

## Cosa è per lingua

| file | cosa sa dello spagnolo |
|---|---|
| `motore/testo.js` | parole e confronto: gli accenti contano (`él` ≠ `el`, `qué` ≠ `que`), `¿ ? ¡ !` non sono parole; `aSchermo` e `inBella` mettono `¿…?` alle domande |
| `motore/flessioni.js`, `dati/irregolari.js` | presente (`pres`), gerundio (`ger`), pretérito indefinido (`ind`) per persona; la tabella degli irregolari |
| `motore/lessico.js`, `dati/generi.js` | genere, plurale, femminile; determinanti; chiave SRS e traduzione di una parola a schermo |
| `motore/grammatica.js` | `sgrammaticata`: la concordanza |
| `motore/trappole.js`, `dati/trappole.js` | le operazioni e la tabella degli errori tipici, le gemelle |
| `dati/glossario.js` | le parole di struttura toccate |
| `motore/libro.js`, `dati/elenchi.js` | i segnaposto delle storie con articolo e accordo |

Il resto (grafo, sessione, formati, grado, mappa, tocchi, storie) è quello
dell'inglese con le chiavi dello spagnolo: `es:perro`, `verbo-es:jugar`,
`frase-es:<id>` (le stesse del gioco di prima, `data/lessico.js`),
`forma-es:<id>`. **Niente travaso**: non c'è una campagna a mondi di prima;
`travasa` tiene solo `tappa` uguale al conto delle vinte.

**Gli accenti contano.** Una risposta è giusta se, senza punteggiatura né
maiuscole, è uguale alla frase o a una variante: `el es alto` non vale per
`él es alto`. **Niente forme contratte**: `al` e `del` sono una parola sola e
obbligatoria; `contrai`, `espandi`, `inTappa` e il campo `contratta` delle
tappe non ci sono.

**La domanda la dice l'italiano.** Lo spagnolo non gira il verbo: una
frase è una domanda se il suo `it` finisce con `?` (`eDomanda`). La fila
mette da sé `¿` in testa e `?` in fondo (`caselle` di `motore/fila.js` dà
`apre` e `punto`); in «scegli» tutte le opzioni di una domanda hanno `¿…?`,
quindi i segni non dicono quale scegliere. In «riconosci» le italiane
sbagliate sono prima quelle con lo stesso segno.

## Il contratto per chi scrive le frasi

Un file per mondo in `dati/frasi/<mondo>.js`, già elencati in
`dati/frasi.js`: `export default { mondo: 'prima', frasi: [...] }`.

```js
{ id: 'p-gato-negro',          // la chiave SRS (frase-es:p-gato-negro): non si rinomina
  tappa: 'prima-color',        // una tappa di frasi del mondo
  forma: 'color-despues',      // una delle forme della tappa
  it: 'è un gatto nero',       // con «?» se è una domanda
  es: 'es un gato negro',      // minuscolo (tranne i nomi), senza ¿ ? . ,
  varianti: ['…'],             // altre risposte giuste, se ci sono
  trappole: [{ es, it?, perche, parola? }],   // a mano, escono per prime
  niente: ['lui-lei'] }        // righe della tabella da non applicare qui
```

- **Una frase usa solo parole note alla tappa**: quelle delle tappe di
  parole fatte (il suo mondo fino a lì e i mondi garantiti prima), le
  `parole` delle forme già incontrate (anche i pezzi delle voci lunghe:
  `al lado de` fa noti `al`, `lado`, `de`), i nomi dei personaggi. Sono
  note anche le forme accordate (`negra`, `perros`, `lápices`) di una parola
  nota, e le forme dei verbi noti dove una struttura arrivata le ammette
  (`flessione` della forma: `pres` da «Io canto», `ger` da «Che cosa stai
  facendo?», `ind` dal passato). `sconosciute()` di `motore/grafo.js` lo dice.
- **Almeno un segno della sua forma** (`segni` in `dati/forme.js`, quelli
  della forma della frase, non di tutta la tappa): una parola (un aggettivo
  o una quantità anche accordati: `caro` vale `cara`, `poca` vale `pocos`;
  gli articoli no), o `#c` un colore, `#j` un aggettivo, `#n` un numero,
  `#mese`, `#giorno`, `#stagione`, `#pres` `#ger` `#ind` un verbo di
  `data/verbi-es.js` flesso così (`canto`, `cantando`, `canté`; `soy` e
  `tengo` non contano). Un segno di più parole vuole quelle parole di fila:
  `son las`, `a la una`, `#n de #mese`, `en #stagione`. I segni dicono la
  struttura, non parole che stanno in ogni frase (`el`, `en`, `de` da soli no).
- **Sta in piedi** (`sgrammaticata` è null), e ha almeno tre trappole.
- **Il soggetto si scrive quando l'italiano lo dice** («io gioco» → `yo
  juego`, «gioco» → `juego`). Le trappole sulla persona del verbo nascono
  solo col soggetto scritto: senza, `tiene` al posto di `tengo` sarebbe
  una frase giusta.
- **Un id di `data/frasi-es.js`** (il gioco di prima) si può riusare solo
  per la stessa frase: è la stessa chiave SRS.

I controlli sono `guastiDellaFrase` e `guastiDelleFrasi` di
`motore/guasti.js`, e i formati costruiti con sei tiri del caso.

**I concetti** (`dati/concetti.js`, oggi vuoto) hanno la forma di
[concetti.md](concetti.md): `CONCETTI[<forma>] = [{ id: '<forma>:<nome>',
titolo, spiega, esempi: [['[una] vaca negra', 'una mucca nera'], …],
prende?: ({ es, domanda }) => … }]`. `guastiDeiConcetti()` vuole un
concetto per forma di ogni tappa di frasi e tre frasi per concetto.

## Il contratto per chi scrive i capitoli

Un capitolo per file in `dati/capitoli/`, raccolto da sé, con il formato
di [libro.md](libro.md): le frasi hanno `es` al posto di `en`. Gli elenchi
(`dati/elenchi.js`, da riempire) hanno `es` (senza articolo), `it`, `un`,
`il`, `itPl`, `ilPl`, `genere` se la regola sbaglia, `pl` se il plurale è
irregolare. I segnaposto:

| scritto | esce | |
|---|---|---|
| `{x}` · `{x.pl}` | `perro` · `perros` | la parola, il plurale |
| `{un:x}` · `{Un:x}` | `un perro`, `una vaca`, `un agua` | indeterminativo col genere |
| `{el:x}` · `{El:x}` | `el perro`, `la vaca`, `el agua` | determinativo |
| `{los:x}` · `{Los:x}` | `los perros`, `las vacas` | plurale con l'articolo |
| `{este:x}` · `{Este:x}` | `este perro`, `esta vaca`, `esta agua` | il dimostrativo col genere |
| `{al:x}` · `{Al:x}` | `al parque`, `a la escuela`, `al agua` | a + l'articolo, contratto se va |
| `{del:x}` · `{Del:x}` | `del banco`, `de la tienda` | de + l'articolo, contratto se va |
| `{c~x}` · `{c~x.pl}` | `negra`, `negras` (x è una vaca) | l'aggettivo c accordato col nome x; c è una variabile o un aggettivo scritto lì (`{bonito~cosa}`) |
| `{x.f}` · `{x.fpl}` | `negra` · `negras` | il femminile di un aggettivo |
| `{x.campo}` | quello che c'è nel campo | un campo che il capitolo dà ai suoi valori (`{vicino.de}`: `de: 'del banco'`); per «del banco / de la tienda» c'è `{del:x}` |

Chi parla lo dice `chi`: una frase con `yo`, `mi`, `tú`, `te`… o con un
verbo alla prima o seconda persona (`tengo`, `juegas`) senza `chi` è un
guasto, perché la narrazione non dice io né tu. Una battuta che si chiede e
si risponde (`¿Es un gato? No, es un perro`) sono due battute; non lo è chi
ripete una domanda senza verbo (`¿Pip? No, no es Pip.`, `¿La pelota de Tom?
No, no la vi.`) né chi nella risposta ripete le parole della domanda.

`sgrammaticata` guarda ogni pezzo fra due segni da sé (`A las ocho, mamá
abre la puerta`: *las* non va con *mamá*), e i puntini sono un segno come
la virgola (`Leo… hoy`). Le parolette per raccontare nella sesta (`lo`,
`para`, `todo`, `otra vez`, `algo`, `nada`, `desde`) sono `parole` della
forma `ayer`, la prima dell'isola.

## Le trappole

Nascono da sole dalla tabella `dati/trappole.js`, su ogni frase dove
l'errore si può fare: le righe, come si riaccordano, quali parole possono
mostrare, le gemelle e le scelte di ogni operazione stanno in
[spagnolo-trappole.md](spagnolo-trappole.md).

## Le scelte

- **el agua sì, un agua no**: *el agua* (e *del agua*, *al agua*) è giusto,
  *la agua* e *una agua* sono sbagliati; *un agua* è segnato perché
  *agua* sta fra le cose che non si contano. L'aggettivo resta femminile:
  *el agua fría*.
- **Le cose che non si contano** (`NON_CONTABILI`): *leche, agua, arroz,
  sal, miel, música, dinero, gente, lluvia…* e *hambre, sed, frío…*. *Pan*,
  *jugo*, *café* no: *un pan*, *un jugo* si dicono.
- **I nomi di genere comune** (*el cantante / la cantante*, *el policía /
  la policía*, *bebé*): il genere lo dice l'articolo, e la parola vicina
  non li scambia con gli altri.
- **rio** senza accento (RAE 2010: monosillabo, come *vio*, *dio*, *fue*,
  *fui*); **sonrió** lo tiene, è di due sillabe.
- **I femminili delle persone e degli animali** (*gata*, *cocinera*,
  *doctora*, *niña*): il nome in *-o* o *-or* delle categorie animali e
  persone fa da sé il femminile, con la chiave della voce maschile
  (`es:gato`) e il genere femminile; toccato dice *gatta*, *cuoca*,
  *dottoressa* (se l'italiano non si sa fare: «… (femmina)»).
- **Una parola con due letture le dice tutte**: *mañana* «mattina /
  domani», *tarde* «pomeriggio / tardi», *viste* «vedere (al passato) /
  vestirsi (lui/lei)».
- **L'altro genere di una parola nota è noto** (*ninguna* da *ningún*,
  *esta* da *este*), l'altro numero no (*mis* non è noto da *mi*).
- **Lo spagnolo è quello di casa**: *tú* (niente *vosotros* né *vos*),
  *ustedes* per «voi».

## I limiti noti

- **Le parole a pezzi**: *pavo real*, *fin de semana*, *papas fritas*
  sono una voce; toccato da solo, *pavo* dice la voce intera. Nel grafo
  ogni pezzo di una voce lunga è noto.
- **Le forme di due verbi**: *lavo* è *lavar* (non *lavarse*), *pongo* è
  *ponerse*, *fui* è *ir* e *ser* (toccata dice tutti e due), *viste* è
  *ver* e *vestirse*. La chiave SRS è della prima. Le trappole su *fue* e
  *fui* scelgono: *ir* se dopo c'è *a* o *al*, se no *ser*.
- **I pronomi attaccati** (*levantarme*, *dámelo*) e l'imperfetto non ci
  sono; il futuro è solo *voy a*.
- **Un nome che è anche un verbo** (*cocina*, *juego*, *cuento*) conta come
  nome per la chiave; toccato dice tutti e due.
- **Alcune frasi hanno poche trappole**: *qué es*, *hace frío*, *tengo
  hambre* ne fanno due o tre. Si allunga la frase o si scrive una trappola
  a mano.

## Nei test

`unita/spagnolo-lingua` (`node test/esegui.mjs spagnolo-lingua
--niente-build`): le tabelle dei verbi e il ritorno alla base, il genere di
ogni nome di `data/parole-es.js` (quelli senza si stampano), plurali e
femminili, `sgrammaticata` su frasi giuste e storte, ogni riga delle
trappole che rifà il suo esempio, un mazzo di frasi di prova con le loro
trappole e i formati, i segnaposto del libro, una partita a una tappa di
parole. I guasti dei dati delle altre parti (grafo, argomenti, frasi) si
stampano e non fermano il test; i contenuti li controlla il test dei mondi.
