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
- **Almeno un segno** della forma (`segni` in `dati/forme.js`): una parola, o
  `#c` un colore, `#j` un aggettivo, `#n` un numero (anche accordati:
  `negra`, `grandes`), `#pres` `#ger` `#ind` un verbo di `data/verbi-es.js`
  flesso così (`canto`, `cantando`, `canté`; `soy` e `tengo` non contano).
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
| `{c~x}` · `{c~x.pl}` | `negra`, `negras` (x è una vaca) | l'aggettivo c accordato col nome x |
| `{x.f}` · `{x.fpl}` | `negra` · `negras` | il femminile di un aggettivo |

Chi parla lo dice `chi`: una frase con `yo`, `mi`, `tú`, `te`… o con un
verbo alla prima o seconda persona (`tengo`, `juegas`) senza `chi` è un
guasto, perché la narrazione non dice io né tu.

## Le trappole

La tabella (`dati/trappole.js`) ha una riga per errore tipico di chi parla
italiano, con il suo perché per un bambino (sotto i 70 caratteri, a frase
riempita) e un `esempio` che il test rifà. Ogni forma di `dati/forme.js` ha
almeno una riga. **Nascono da sole**, su ogni frase dove l'errore si può
fare:

| dove | righe |
|---|---|
| genere e numero | `un-una` (*una perro*), `el-la`, `el-agua` (*la agua*), `este-esta`, `aggettivo-genere` (*una vaca negro*, *la vaca es negro*), `aggettivo-numero`, `aggettivo-prima` (*un negro gato*), `buenos-buenas`, `plurale-mancante` (*dos perro*, *los gato*), `plurale-in-piu` (*un gatos*), `plurale-sbagliato` (*lápizes*), `mi-mis`, `mucho-accordo`, `un-poco-de` |
| all'italiana | `mi-me` (*mi llamo*), `te-ti`, `ho-he` (*he un perro*), `tener-ser` (*soy hambre*, *soy siete años*), `gustar-io` (*yo gusto el pan*), `gusta-gustan`, `hace-es` (*es frío*), `muy-mucho` (*muy frío*), `en-a` (*estoy a casa*), `a-en` (*voy en el parque*), `costa` |
| ser, estar, hay | `ser-al-posto-di-estar` (*soy cansado*, *es en casa*, *soy bien*), `estar-al-posto-di-ser` (*está un perro*), `hay-es`, `hay-el`, `estuve-fui` |
| i verbi | `persona-ser`, `persona-tener`, `persona-verbo` (*yo juega*: solo col soggetto scritto), `desinenza-classe` (*ella coma*, *vivemos*), `dittongo` (*quero*), `dittongo-in-piu` (*puedemos*), `infinito-dopo-querer` (*quiero nado*), `riflessivo-mancante`, `riflessivo-persona`, `gerundio-senza-estar`, `gerundio-infinito` (*estoy comer*), `gerundio-classe` (*comando*), `voy-senza-a`, `voy-a-gerundio` |
| il passato | `passato-al-presente`, `passato-regolare` (*hací*), `dijo-regolare` (*deció*), `passato-accento` (*comio*), `passato-ortografia` (*jugé*) |
| al, del, la strada | `contrazione-a` (*a el*), `contrazione-de`, `al-femminile` (*al escuela*), `del-femminile`, `direzione-senza-la`, `al-lado-al`, `posto-scambiato`, `sinistra-destra` |
| l'ora e le date | `ora-es-son` (*es las tres*), `ora-a-en`, `data-senza-de`, `giorno-con-en`, `mese-con-el` |
| la scrittura | `accento-domanda` (*¿que es?*), `accento-in-piu` (*más alto qué*), `el-él`, `tu-tú` |
| il senso | `parola-che-chiede`, `mio-tuo`, `lui-lei`, `oggi-domani`, `cuando-mientras`, `negazione-tolta`, `negazione-aggiunta`, `parola-vicina` |
| i paragoni | `mas-de` (*más alto de*), `mas-bueno`, `mas-mejor` |

**Una trappola sbaglia in un punto solo.** Cambiare una parola rifà il
resto: la parola vicina si porta il suo genere (*el gato negro* → *la vaca
negra*, *esta es mi regla* → *este es mi libro*, *a la* → *al*), tiene il
numero (mai una cosa già plurale al posto di una sola, mai *un* davanti a
una cosa che non si conta), e un verbo resta nella sua persona e nel suo
tempo (*juego* → *canto*); *él* al posto di *ella* riaccorda il predicato
(*él es alto*), e allora l'italiano non si offre. Le trappole di una
domanda sono domande: non ce n'è nessuna che la gira in affermazione.
**`sgrammaticata` controlla** ogni frase e ogni trappola: articolo,
dimostrativo, possessivo e quantità col genere e il numero del nome,
l'aggettivo prima e dopo, il predicato del soggetto in testa, il plurale
dopo un numero, *un* con le cose che non si contano, *el agua*, *a el*,
*primer*. Le righe che sbagliano apposta queste cose stanno in `APPOSTA`.
Un aggettivo che è anche un verbo (*limpia*) non si controlla.

**Le gemelle** (`GEMELLE`, la prima parola di ogni fila è quella a cui la
fila appartiene): *es/son*, *soy/eres*, *estoy/estás/está*, *tengo/tiene*,
*un/una*, *el/la/los/las*, *mi/mis/me*, *gusta/gustan*, *al/a/el*,
*a/en*, *qué/que*… Niente *es/está* né *en/sobre*: darebbero una seconda
frase giusta. Le altre gemelle le fa `motore/formati.js`: le forme dello
stesso verbo che la tappa ammette (*juego* → *juegas*, *jugar*),
l'aggettivo nell'altro genere e numero (*negro* → *negra*, *negros*), il
nome nell'altro numero (*gato* → *gatos*).

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
- **rio, sonrio** senza accento (RAE 2010, monosillabi).
- **Lo spagnolo è quello di casa**: *tú* (niente *vosotros* né *vos*),
  *ustedes* per «voi».

## I limiti noti

- **Le parole a pezzi**: *pavo real*, *fin de semana*, *papas fritas*
  sono una voce; toccato da solo, *pavo* dice la voce intera. Nel grafo
  ogni pezzo di una voce lunga è noto.
- **Le forme di due verbi**: *lavo* è *lavar* (non *lavarse*), *pongo* è
  *ponerse*, *fui* è *ir* e *ser* (toccata dice tutti e due), *viste* è
  *ver* e *vestirse*. La chiave SRS è della prima.
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
