# I moduli di quiz

Mazzi di domande che non finiscono mai, staccati da qualunque gioco.

Nascono da un problema di Survivors: ti potenzi, ti potenzi ancora, e non
c'è mai niente da *fare*. La pausa che chiede un esercizio prima di darti
la carta è quella che il castello fa già da sempre — vuoi la torre bella,
paghi i calcoli — e funziona proprio perché è un po' amara. Ma perché
funzioni davvero servono domande che non si imparino a memoria, e servono
in tanti giochi, non in uno.

Da qui la regola che tiene su tutto:

> un modulo consegna una **domanda**, e non sa chi gliel'ha chiesta;
> un gioco chiede una domanda, e non sa di che materia sia.

## La forma

Tre file per capire tutto, in quest'ordine:

- `nucleo/domanda.js` — la forma di una domanda: consegna, soggetto
  facoltativo, da 2 a 6 risposte, l'indice di quella buona, la chiave del
  concetto. Le risposte sono testo, emoji o una scena disegnata.
- `nucleo/modulo.js` — la classe base. Un modulo è
  `genera(grado, sorte, tipo)` e basta: nessuno stato, nessuna memoria,
  nessun punteggio. Le tipologie che sa fare le dichiara (`tipi`), e
  quale tirare glielo dice chi chiama.
- `nucleo/sorte.js` — il caso **ripetibile**. Un generatore non chiama
  mai `Math.random()`: senza seme le domande non si possono provare.

E due moduli scritti apposta per essere copiati:

- `moduli/ortografia.js` — quello **testuale**: dati in cima, classe
  sotto, tre modi di chiedere la stessa regola.
- `moduli/orologio.js` + `grafica/pittori/orologio.js` — quello
  **disegnato**: il modulo decide i fatti (`{ che:'orologio', ore, minuti }`),
  il pittore li disegna e non sa niente di difficoltà o risposte giuste.
  Un pittore lavora sempre in un quadrato 100×100.

## Aggiungere un modulo

Un file in `moduli/`, e se disegna un secondo in `grafica/pittori/`.
Nient'altro: il registro (`nucleo/registro.js`) e il banco di prova
raccolgono dalla cartella, quindi non c'è nessun elenco da aggiornare —
e nessun posto dove dimenticarsi un modulo.

Le tre cose che fanno la differenza fra un modulo e un quiz qualunque:

1. **La chiave è il concetto, non l'istanza.** `orto:gn` sta su tutte le
   domande sul gruppo *gn*, non su «lavagna». È quello che permette al
   ripasso di seguire *cosa non sa* un bambino invece di *quali domande
   ha visto* — vedi «Il ripasso» più sotto. Un prefisso nuovo si sceglie
   guardando quelli già presi in `store/progressi.js`: le chiavi
   finiscono tutte nello stesso cassetto, e `verbo:` era già dei verbi
   inglesi.
2. **I falsi sono gli errori veri.** *ho andato*, la lancetta scambiata,
   il perimetro contato come area. Un distrattore preso a caso si scarta
   a occhio, e la domanda si risolve per esclusione invece che sapendola.
3. **La varietà è un requisito, non un vezzo.** Un grado che produce
   venti domande diverse si impara a memoria in tre partite. Il banco
   fallisce sotto le 25 e va puntato molto più in alto.

## Provarli

```bash
npm run quiz:banco              # tutti, senza browser
npm run quiz:banco orologio --mostra 3
node test/esegui.mjs quiz --niente-build
```

Il banco (`strumenti/quiz/banco.mjs`) dice se un modulo è **giusto**: la
forma delle domande, le risposte doppie, le scene senza pittore, il caso
ripetibile, la varietà, e che la risposta buona non stia sempre nello
stesso posto. Se è **bello** lo sa solo un occhio, e si guarda **nel
gioco vero**: schermata dei genitori → «cosa ha fatto a scuola» → il
tasto «prova» di una carta o di una sottovoce (`Prova.vue`). Le domande
sono le stesse che riceve il bambino, messe in scena da `Domanda.vue` —
che è il punto: prima c'era una palestra a parte in `poc/`, e una
palestra a parte è una seconda messa in scena da tenere allineata.

Guardare conta quanto provare. I difetti trovati a schermo in questo
giro non li avrebbe presi nessun controllo automatico: una domanda sulle
sillabe che mostrava solo l'emoji senza la parola scritta, «con che cosa
misuri un secchio» che ha due risposte oneste (litri o centimetri, a
seconda di cosa stai misurando), un verbo da coniugare senza dire a che
tempo. **Una domanda con due risposte difendibili supera tutti i
controlli di forma**: si vede solo leggendola.

Lo stesso vale per **le domande che si possono solo ricordare**. «Quando
comincia l'inverno?», «che anno è stato il tal fatto», «quanti abitanti
ha»: la risposta non si ricava da niente, e chi sbaglia non ha ragionato
storto — non se lo ricordava. Sono domande che il banco trova
ineccepibili (forma giusta, falsi distinti, varietà alta) e che non
insegnano niente, perché non c'è un passo da fare fra la domanda e la
risposta. La versione buona della stessa materia c'è quasi sempre: non
*quando* comincia l'inverno ma *in che stagione* cade dicembre, non la
data dell'equinozio ma il giro che le stagioni fanno sempre uguale. Le
date esatte restano dove servono — nell'`aiuto`, che la regola te la
regala — e le poche cose da sapere a memoria si chiedono solo se hanno
una filastrocca che le tiene su (i giorni dei mesi) o se sono la materia
stessa (i contrari, i participi irregolari).

## Usarli in un gioco

**Un gioco non nomina mai un modulo.** Chiede una domanda con una
manopola di difficoltà da 0 a 1, e riceve quello che deve mostrare:

```js
import { domandaPerGioco } from '../quiz/scelta.js'
import Domanda from '../quiz/Domanda.vue'

const q = ref(domandaPerGioco({ difficolta: 0.6, evita: ultimoModulo }))
```
```vue
<Domanda v-if="q" :domanda="q.domanda" :pittori="q.pittori"
         :titolo="`${q.icona} ${q.nome}`" @risposto="incassa" />
```

`risposto` porta `{ giusto, indice, chiave, tempo }`. Il gioco decide
cosa vale — una carta di potenziamento, una porta che si apre, niente —
e non sa di che materia fosse la domanda.

È fatto così perché un modulo nuovo deve comparire **in tutti i giochi**
la sera in cui lo scrivi, senza aprirne nessuno: il registro lo raccoglie
dalla cartella, `scelta.js` lo pesca. E infatti quando le chiavi sono
finite in `store/srs.js` è cambiato solo `scelta.js` — «di cosa ha
bisogno questo bambino» invece di «una a caso» — e nessuno dei cinque
giochi se n'è accorto.

Fuori da Vue (le palestre dei prototipi) c'è il gemello imperativo:

```js
const esito = await chiedi(ortografia, { grado: 3 })   // grafica/scheda.js
```

## Si pesca una classe, non un modulo

Una **classe di domande** è la coppia (modulo, grado): «il perimetro»,
«i contrari», «le conversioni facili». È l'unità che `scelta.js` tira a
sorte, e per un pezzo è stata sbagliata.

Prima si pescava il *modulo* (uno su undici) e poi il grado si
**calcolava** dalla difficoltà: `round(1 + d × (gradi−1))`. Due guai,
tutti e due invisibili a ogni controllo di forma:

- le difficoltà che i giochi chiedono sono poche e fisse — 0.15, 0.50,
  0.85 in Survivors — quindi da ogni modulo usciva **sempre lo stesso
  grado**. Area e perimetro stanno in cima alla scaletta della griglia:
  per vederli serviva una carta da 0.8;
- una classe pesava quanto il modulo che se la portava dietro. Un modulo
  con sei classi le mostrava una alla volta, uno con una classe sola la
  mostrava sempre.

Adesso `nucleo/classi.js` mette insieme tutte le classi giocabili e dà a
ognuna un peso a campana centrato sulla difficoltà (`BANDA = 0.25`). La
manopola resta una sola, ma è un **centro** e non un binario. Quante
domande diverse sappia fare un modulo continua a non pesare: quella è
ripetitività, non frequenza — e la misura il banco, non la scelta.

Quel file non importa niente e gira in Node, perché la distribuzione va
**contata**: `test/unita/quiz-pesi.test.mjs` tira tremila domande per
ogni fascia e controlla che si vedano tutti i moduli, che nessuna classe
si prenda più di un quinto dei tiri, e che una carta facile non
consegni una domanda da carta tosta.

## Il ripasso: quello che va male torna più spesso

Ogni risposta si annota (`memoria.js` → `store/profile.js`) sotto la
chiave del concetto, e la pesca la rilegge: una tipologia che va male
esce **1.5 volte**, una saputa **0.5**, le altre restano dov'erano.
Nient'altro: niente «imparato», niente uscita dal giro, nessuna materia
nuova in `progressi.js`. Il perché della banda stretta sta in testa a
`nucleo/bisogno.js`, e in due righe è questo: negli asteroidi il gioco
*è* lo studio e concentrarsi su quello che non sai è il punto; qui la
domanda è il pedaggio di un gioco d'avventura, e una partita di sola
geometria a chi la geometria non la capisce è una punizione.

Il conto è a due livelli — la classe (modulo, grado) e la tipologia
dentro — e vanno composti con attenzione: la classe usa la **media** dei
bisogni dei suoi tipi, il tipo il proprio, e il prodotto torna lineare.
Il fattore pieno tutte e due le volte darebbe nove a uno invece di tre,
e la banda scelta non varrebbe più niente. `unita/quiz-ripasso` conta
esattamente quello.

Chi non tocca il profilo (`nucleo/`, che gira in Node) riceve il bisogno
come **funzione passata a mano**, e senza si comporta come prima: è il
motivo per cui il banco di prova e il pannello dei genitori pescano
neutri senza doverlo chiedere.

## Le tipologie: dire quali domande so fare

Un modulo dichiara le sue **tipologie** — le classi di domande che sa
fare, una per una — con il peso che ognuna ha a ogni grado:

```js
super({
  …,
  scaletta: ['le ore intere', 'le mezze ore', "i quarti d'ora", …],
  tipi: [
    { chiave: 'ora:intere', nome: 'Le ore intere', sa: 'orologio',
      gradi: { 1: 1, 2: 0.55, 3: 0.2, 4: 0.03 } },
    { chiave: 'ora:quarti', nome: "I quarti d'ora", sa: 'orologio',
      gradi: { 2: 0.45, 3: 0.5, 4: 0.1 } },
  ],
})

genera(grado, sorte, tipo) {          // il tipo arriva già scelto
  switch (tipo) { … }
}
```

Prima la tipologia se la sceglieva il generatore per conto suo
(`sorte.forse(0.55) ? intere() : quarti()`) e costava tre cose. Le
proporzioni stavano sparse dentro gli `if` di undici file, e nessuno
poteva controllarle. I genitori potevano spegnere al massimo un grado
intero, mentre un grado ne mescola due o tre — spegnere gli accenti
portava via anche la lettera h. E la chiave si scopriva solo a domanda
fatta, quindi non si poteva né chiedere né evitare: proprio la cosa che
serve a `store/srs.js` il giorno che arriverà.

Dichiarate, il tipo lo pesca il nucleo fra quelli ancora accesi e lo
passa a `genera`, che diventa uno switch. **La chiave che la domanda
emette dev'essere quella del tipo che l'ha chiesta**, e
`test/unita/saperi.test.mjs` lo controlla giocando: trecento domande per
grado, e nessuna può uscire con una chiave che a quel grado non è
dichiarata. Un tipo dichiarato che non esce mai è lo stesso guasto visto
dall'altro lato, e lo dice anche quello.

Un modulo che non dichiara `tipi` continua a funzionare come prima:
`genera(grado, sorte)` e basta.

## Quello che il bambino non ha mai fatto

Il `sa` di un tipo dice cosa quella domanda dà per scontato che il
bambino abbia già fatto a scuola, con le chiavi di
`src/data/saperi.js`. La forma vecchia — una voce per grado — vale
ancora per i moduli che le tipologie non le dichiarano:

```js
saperi: [['misure'], ['misure'], ['misure', 'conversioni'], …],
// oppure una stringa sola, se vale per tutto il modulo: saperi: 'orologio'
```

I genitori spengono dalla loro schermata (seconda scheda, «Cosa sa») **o
un gruppo intero, o una singola tipologia** dal dettaglio. Per chi fa le
domande sono la stessa cosa: due chiavi nella stessa lista di spenti.
Dentro un grado si pescano solo le tipologie ancora accese; un grado che
le perde tutte sparisce, il modulo **degrada** al grado buono più vicino
— verso il basso, perché una domanda più facile è sempre onesta — e se
non gliene resta nessuno esce dal mazzo. Non è una manopola di
difficoltà: una conversione a chi non sa cosa è un litro non è
difficile, è muta, e si può solo indovinare.

Le sottovoci che il genitore vede nel dettaglio sono esattamente i
`tipi`, raccolti da `src/quiz/saperi.js`: un modulo nuovo le porta con
sé e compaiono da sole. Una chiave che non esiste nel catalogo è un
guasto, non un commento: `test/unita/saperi.test.mjs` lo dice, prova il
degrado giocando quattrocento domande per ogni combinazione, e controlla
che spenta una singola tipologia quella non arrivi più.
