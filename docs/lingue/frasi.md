# English a mondi — le frasi e i formati

Le tappe di frasi, come si scrive una frase componibile, i sei formati e
la partita. Il grafo e le tappe stanno in [mondi.md](mondi.md), le frasi
sbagliate in [trappole.md](trappole.md), le strutture di quarta e quinta in
[strutture.md](strutture.md).

## Le tappe di frasi

**Dentro un mondo le frasi sono capitoli fra le parole, e in fondo la
🏁.** Una tappa di frasi viene subito dopo le tappe di parole che le
servono (*Mi piace!* dopo il cibo e il pranzo), mai tutte in blocco alla
fine: chi gioca un mondo compone frasi entro la quarta tappa, e mai
più di quattro tappe di parole di fila (lo controlla
`test/unita/inglese-mondi`). Una tappa di parole non chiede frasi, una di
frasi non insegna parole.

Una tappa di frasi ha **una struttura** (a volte due forme della stessa,
*it is / is it*) e **nessuna parola nuova**: le sue frasi usano solo parole
già viste nelle tappe di parole di quel mondo o dei mondi prima, e ognuna
contiene almeno un **segno** della struttura (`segni` in `dati/forme.js`:
una frase di «C'è» dice *there*). Un segno con `#` è una specie di parola:
`#c` un colore, `#j` un aggettivo, `#n` un numero, `#s` `#ing` `#ed` `#irr`
un verbo flesso (*plays*, *playing*, *played*, *went*), `#er` `#est` un
paragone (*bigger*, *the biggest*). **I verbi flessi valgono dalla tappa
della loro struttura** (`flessioniNote` in `motore/grafo.js`): *plays* è
una parola nota solo da «Lei gioca» in poi, e *went* solo dal passato.

**Il dato di una frase**: `id`, mondo e tappa, `forma` (la struttura),
`it`, `en` (in forma lunga, senza punteggiatura), `varianti` accettate,
`trappole` a mano, `niente` (righe della tabella da non applicare perché
qui darebbero una frase giusta). Le frasi di oggi tengono il loro `id`: è
la chiave SRS. Gli `id` nuovi cominciano con `m-` (i mondi di prima), `q-`
(quarta), `v-` (quinta); dove la frase c'era già in `data/frasi.js` si è
tenuto il suo `id`, e il test pretende che sia la stessa frase.

## I formati, decisi dalla forza

Le parole tengono la scala di oggi (figura → ascolto → capisci → produci). Le
frasi salgono di un gradino a ogni punto di forza, **o della forza della
loro struttura meno uno** (`gradino` in `motore/sessione.js`): la forma sale
a ogni frase giusta, quindi in una partita sola si arriva alle tessere anche
con frasi mai viste. Prima il gradino guardava solo la frase, e una partita
restava ai primi due formati. In un mondo passato per età, o con «Sblocca
tutti i livelli», si parte dal terzo gradino (`partenza`); una frase
sbagliata in questa partita torna alla sua forza.

1. **Riconosci** — la frase inglese e quattro italiane (`fraseIt` di oggi).
2. **Cosa vuol dire** («Leggi bene: che vuol dire?») — anche qui le italiane
   sbagliate ricalcano le trappole della grammatica («è un cane» / «è un cane?»).
3. **Scegli** — la frase italiana e quattro inglesi: la giusta e tre trappole.
4. **Componi**, a gradini:
   - **completa**: la frase c'è già con dei buchi (due da tre parole in su,
     tre da sei), e le tessere sono quelle dei buchi più una di troppo;
   - **monta**: solo le tessere giuste, da mettere in ordine;
   - **scegli e monta**: il banco con le parole trappola (due, tre, quattro).

Le tessere si **toccano** e vanno in fila, si ritoccano e tornano nel banco:
niente trascinamento. La punteggiatura non è una tessera: la fila mette da sé
la maiuscola e il `?`.

**Forma lunga prima, contratta dopo**: le prime tappe di ogni struttura usano
*it is*, *do not*; le successive *it's*, *don't*. Sono accettate sempre tutte e
due. *Have got* resta, come a scuola. Contratta o lunga lo dice la tappa
(`contratta: true`), non la struttura: la prima tappa di una forma è lunga
sulla contrazione che la forma insegna (*does not*, *am playing*), e può
contrarre quelle vecchie (*it's seven o'clock*). Le frasi nei dati sono
sempre lunghe.

## Le tessere di troppo

- **Il formato lo decide il gradino**: 0 riconosci, 1 cosa vuol dire, 2
  scegli, 3 completa, 4 monta, 5–6 scegli e monta. Le tessere di troppo di
  «scegli e monta» sono due a 5, tre a 6, **quattro a 6 quando anche la
  forma è a 6** (`tessereInPiu`): con una sola, e per di più una parola
  vicina, la scelta era *sad* o *tired* e si scartava dal significato.
- **Dalle più istruttive** (`tessereDiTroppo` in `motore/formati.js`):
  prima le parole delle trappole di grammatica, poi le **gemelle** delle
  parole della frase, per ultime le parole vicine.
- **Le gemelle** sono di due specie. Quelle di grammatica stanno in
  `GEMELLE` (`dati/trappole.js`: *am/is/are/was/were*, *do/does/did*,
  *my/your/his/her*, *he/she/they*, *have/has*, *in/on/under*, *more/most*…).
  Quelle dei verbi e degli aggettivi sono **le altre forme della stessa
  parola che la tappa conosce** (`gemelleDi`): accanto a *goes* ci sono *go*
  e, in quinta, *went*; accanto a *bigger*, *big* e *biggest*. Sempre solo
  parole note, e solo scambi che non danno una seconda frase giusta: niente
  *this/it* o *a/the*, che in italiano si somigliano; *played* al posto di
  *play* sì, perché l'italiano dice il tempo.
- **In «completa» la tessera di troppo contende un buco** (`rivale`): se è
  *play*, il buco di *plays* c'è di sicuro. Prima i buchi si sceglievano a
  caso e la tessera in più poteva non entrare in nessuno: non era una
  scelta. Lo controlla `guastiDellaFrase`.
- **Riconosci e cosa vuol dire** differiscono nelle sbagliate: la prima
  prende l'italiano di altre frasi della tappa, la seconda quello delle
  trappole che hanno un senso in italiano (la domanda girata «è un cane?»,
  mio/tuo, lui/lei, il «non» tolto), e riempie con le altre frasi.
- **Il «?» nelle opzioni inglesi non c'è** (la regola di
  [vocaboli.md](vocaboli.md): la domanda si riconosce dall'ordine); lo
  mette la fila composta, con la maiuscola (`inBella`, `rigaInBella`).
  **L'italiano ha sempre il punto o il «?»** (`aSchermo`), in consegna e
  nelle opzioni: senza, «È un cane» si leggeva anche come domanda e
  *it is / is it* non aveva una risposta sola.

## La partita

- **Una tappa di frasi non chiede mai parole.** Provato un riscaldamento
  che passava prima le parole delle frasi con forza sotto 1: non funziona,
  perché la forza cala in poche ore e il giorno dopo «Mi piace!» chiedeva
  di nuovo *strawberry*, e sembrava una tappa di parole. Una parola che non
  sa si tocca (le prime tre volte gratis); le frasi con tutte le parole
  sapute escono per prime (`pronta`).
- **La sessione**: il primo giro passa le parole una volta, dalla più
  debole; poi pesca col picker di `store/srs.js`, e una frase entra solo
  quando ogni sua parola è già saputa (forza ≥ 1) o è stata indovinata in
  quella partita (`pronta`). Finisce a `min(20, voci + 4)` risposte giuste, e
  sbagliando non si perde niente. Alla 🏁 il primo giro è di 16.
- **Le forme deboli ripescano**: in una tappa di frasi e alla 🏁, tre frasi
  di una forma debole (forza < 2) dei mondi già fatti entrano nel giro,
  scelte a caso; in una tappa di parole mai. **Debole vuol dire vista e poi
  calata**: una forma mai vista non ripesca, se no un bambino di quinta con
  gli anni prima passati per età apriva ogni tappa con «Io sono Leo.». La chiave **`forma:<id>`** registra le risposte
  sulla struttura: una forma debole fa uscire più spesso la sua trappola.
- **Cosa si segna**: una frase composta giusta conta come ripasso delle sue
  parole **già scadute** (solo quelle), anche dei verbi flessi (*went* è
  `verbo:go`, *bigger* è `en:big`). Uno sbaglio su una parola vicina pesa
  sulla parola, uno di grammatica sulla frase e sulla forma.

## Estendibile

Aggiungere varietà vuol dire aggiungere dati, mai toccare il motore: un
mondo nuovo di frasi è un file in `dati/frasi/` più una riga in
`dati/frasi.js`; un errore tipico nuovo è una riga della tabella delle
trappole; un capitolo è un file in una cartella, raccolto da sé.

**Un test solo controlla tutto**, anche quello che nascerà
(`guastiDellaFrase` in `motore/guasti.js`): la tappa e la forma esistono,
la frase usa solo parole note e almeno un segno, sta in piedi sul numero
(`sgrammaticata`), ha almeno tre trappole, nessuna uguale alla giusta o a
una variante né sgrammaticata per caso, ogni perché sotto i 70 caratteri,
e ogni formato si costruisce con sei tiri del caso e ha una sola giusta.
**Uno script stampa** i banchi: `node strumenti/inglese/banchi.mjs` con un
mondo (`quarta`), una tappa (`quinta-piu`) o una frase (`m-pen`).

## L'interfaccia per la vista: una partita

```js
const s = new Sessione({ tappa: tappaDi(id) /* o cassettoDi(mondo) */,
                         itemDi: item, haVoce: p => haVoce(p, 'en') })
const d = s.prossima()                    // la domanda
const t = new Tocchi({ itemDi: item })    // uno per domanda
t.prova('dog')                            // { costa, volte, nuova }: non segna niente
domandaDelTocco(p, { libro })             // la domanda da fare prima, se costa
t.tocca('dog')                            // { it, gratis, chiave }: se !gratis, «questa non paga»
const e = s.rispondi(d, risposta, { tocchi: t })
e.registra.forEach(r => answer(r.chiave, { correct: r.correct }))
if (e.paga) …                             // quanto, lo decide la vista (calibrazione.md)
if (s.finita) segnaVinta(c, id)           // vero la prima volta: il premio grosso
```
- `d.genere === 'parola'`: è il turno di `data/domande.js` di sempre
  (`d.tipo`, `d.domanda`, `d.opzioni`); si risponde con l'opzione toccata.
- `d.genere === 'frase'`: `d.formato` è `riconosci`, `senso` o `scegli`
  (con `d.opzioni`: si risponde con l'opzione), oppure `completa`, `monta`,
  `scegliMonta` (con `d.tessere` `{ id, testo }`, e per `completa` anche
  `d.righe`, fatte di `{ testo }` e `{ buco: n }`: si risponde con gli id
  delle tessere nell'ordine della fila, per `completa` nell'ordine dei
  buchi). `rigaInBella(d, ids)` è la fila come va scritta a schermo;
  `d.domanda` è `{ testo, lingua: 'en' | 'it' }`.
- L'esito sbagliato porta `perche` (una riga, o null se lo sbaglio non è
  una trappola nota), `siFa` (la regola della forma) e `giustaEra`.

Nei test: `unita/inglese-mondi`, senza browser: i controlli di ogni frase,
i formati, cosa segna uno sbaglio, la partita giocata da un finto bambino,
le frasi ripescate solo dove si ripassano le frasi. La vista e i suoi
bersagli `data-…`: [mondi-vista.md](mondi-vista.md#nei-test).
