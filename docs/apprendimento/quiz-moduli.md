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
  concetto. Le risposte sono testo, emoji o una scena disegnata, e una
  figura può portare **il suo nome sotto** (`conNome`) — ma solo quando
  figura e parola dicono la stessa cosa e la domanda ne chiede un'altra:
  in una domanda di lingua straniera la stessa aggiunta regala la
  risposta, e nessun controllo automatico se ne accorge. Il perché per
  esteso sta in testa a quel file.
  Un soggetto scritto può essere **una frase con una parola in
  rilievo** — `{ testo: 'Metto lo zaino in spalla.', evidenzia: 'lo' }`
  — e serve dove la parola da sola non ha una risposta: «che parte del
  discorso è "lo"?» non ne ha nessuna, perché «lo» è articolo in «lo
  zaino» e pronome in «lo vedo». Nel dato non va **mai** HTML: c'è la
  parola, il grassetto lo mettono le due messe in scena
  (`Domanda.vue` e `grafica/scheda.js`, che ritagliano tutte e due con
  `evidenziando`). La parola dev'esserci **esattamente una volta**, come
  parola intera, e `guastiDi` lo controlla: è l'unico modo di
  accorgersi di un refuso su una frase fra trentasei.
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

### Il disegno si guarda grande

Nella carta il disegno del soggetto sta in un riquadro largo al massimo
148 pixel, e per un orologio basta. Per una griglia a sei colonne no: una
casella viene venti pixel, con dentro una lettera, un numero e un'emoji,
e «cosa c'è nella casella E5» smette di essere una domanda sulle
coordinate per diventarne una sulla vista. **Toccando il disegno si apre
grande quanto tutto lo schermo** (`.qz-zoom`), e si chiude toccando
ovunque. «Tutto lo schermo» è letterale ed è costato un guasto: la lente
è appesa al `body` con un `Teleport`, perché montata dentro il pannello
del gioco un `position: fixed` non vuol dire la finestra — vuol dire il
primo antenato con una `transform` addosso, e i fogli del sotterraneo ne
hanno una per entrare in scena. Si apriva ritagliata a metà schermo, con
la caverna a vista sopra.

Due dettagli che sembrano piccoli e non lo sono. Il primo: si ingrandisce
**solo il soggetto**, mai i disegni delle risposte — lì il tocco *è* la
risposta, e un tastino per guardare meglio dentro un tasto che risponde è
il modo di far rispondere a caso chi voleva solo vedere. Il secondo: la
lente si chiude sul `click` e non sul `pointerup`, se no il dito si
lascia dietro un click che atterra sul tasto rimasto sotto e la risposta
parte da sola — è lo stesso fantasma della finestra cieca, che infatti
vale anche per l'apertura della lente.

Il gemello imperativo (`grafica/scheda.js`, le palestre dei prototipi)
non ce l'ha: lì a guardare le domande è un grande, davanti a uno schermo
grande.

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
ognuna un peso a campana centrato sulla difficoltà (`BANDA`). La
manopola resta una sola, ma è un **centro** e non un binario. Quante
domande diverse sappia fare un modulo continua a non pesare: quella è
ripetitività, non frequenza — e la misura il banco, non la scelta.

Quel file non importa niente e gira in Node, perché la distribuzione va
**contata**: `test/unita/quiz-pesi.test.mjs` tira tremila domande per
ogni fascia e controlla che si vedano tutti i moduli, che nessuna classe
si prenda più di un quinto dei tiri, e che una carta facile non
consegni una domanda da carta tosta.

## Quanto è complicata, e a chi arriva

Per un pezzo il primo grado di *qualunque* modulo stava a 0 e l'ultimo a
1. Va bene finché tutti i mazzi sono per lo stesso bambino, e smette di
funzionare appena si guarda cosa c'è dentro quei grado-1: «come si
chiama questa figura» (prima elementare), «che ora segna» (seconda),
«Nina ha 4 mele e ne raccoglie 3» (che vuole leggere in scioltezza).

Adesso ci sono due cose, e stanno in due posti diversi:

- **il livello, sulla domanda**: un numero da 0 a 100 per ogni grado,
  sulla stessa scala per tutte le materie. Zero è il primo giorno di
  materna, cento la fine della primaria: dodici punti e mezzo per anno.
- **due larghezze, sul bambino**: la sua età (`settings.eta`) decide
  chi è **ammesso** — tre anni e mezzo sotto, due sopra: fuori di lì
  c'è solo la presa in giro e il muro — e dove **mira** la manopola, che
  è più stretto (un anno indietro, e in avanti fin dove finisce il
  mazzo). Per un
  pezzo erano lo stesso numero, e il risultato era che a nove anni le
  ore intere dell'orologio sparivano del tutto invece di diventare rare.

```js
scaletta: ['una storia sola: quello che arriva si somma', …],
livelli: [38, 44, 56, 63, 75, 81],          // uno per grado
tipi: [
  { chiave: 'cal:giorni-mese', livello: 38, … },   // se sta fuori dal suo grado
  { chiave: 'num:catena', livello: { 3: 30, 4: 44, 5: 52, 6: 60 }, … },   // o grado per grado
],
```

Il `livello` di una tipologia può essere **un numero solo** — vale per
tutti i gradi in cui esce — oppure **uno per grado**, con la stessa
forma di `gradi`. La seconda serve quando è la stessa cosa che si
allunga: gli indovinelli del senso del numero si dichiaravano 56 (otto
anni e mezzo) sia col passo singolo sia con la catena da tre da
disfare, e la catena da tre finiva così davanti a bambini di sette anni
e mezzo. Un numero solo lì mente due volte: dice troppo per il primo
grado e troppo poco per l'ultimo.

Il «fin quando una domanda è utile» **non si dichiara**: lo decide la
finestra. È la differenza che conta rispetto al giro precedente, dove
ogni classe portava una coppia di età `[da, a]`: `a` era arbitraria —
nessuno sa davvero dire da che anno una domanda diventa banale — e gli
anni interi sono grossi, dentro la prima elementare ci stanno due passi
diversi che finivano sullo stesso gradino.

Chi pesca (`nucleo/classi.js`) fa due conti separati:

1. **chi entra** (`adatta`): dentro la finestra, taglio netto. Sotto c'è
   la presa in giro — i pallini da contare a un bambino di dieci anni,
   come premio di una carta tosta — sopra il muro, e nessuna delle due
   si aggiusta uscendo di rado.
2. **quanto pesa** (`pesoDi`): la manopola del gioco diventa un punto
   dentro quella finestra (`bersaglio`: fondo con la carta debole, cima
   con quella tosta), e ogni classe pesa quanto gli è vicina. La
   gradualità resta tutta, ma dentro il mazzo che gli compete.

C'è anche `quantoPesa(livello, finestra)`, che dice quanto una domanda è
dura **per chi la riceve** (0 = fondo della sua finestra, 1 = cima): un
gioco che volesse pagare di più una domanda tosta ha già il numero
pronto, senza sapere niente di età.

### Quando decide un grande

I livelli che dichiariamo sono **un punto di partenza**, non una
sentenza: su centosessantadue righe qualcuna è tarata male di sicuro, e
non c'è modo di accorgersene guardandola. Nella scheda «Cosa sa» ogni
gruppo ha, oltre al tasto per spegnerlo, due frecce — **‹ gli è
difficile** e **gli è facile ›** — che spostano la finestra *per quella
chiave soltanto*, mezzo anno di scuola per gradino e non oltre tre
(`settings.ritocchi`, `PASSO` in `nucleo/modulo.js`). I ritocchi di una
tipologia e dei gruppi che se la portano dietro si sommano: sono
affermazioni diverse.

E il conto lo tiene già il bambino, giocando. `quiz/consiglio.js` legge
le risposte annotate in `store/srs.js` e, quando una chiave ha almeno
otto tiri con meno di metà giuste — o più di nove su dieci — lo scrive
nella carta insieme al tasto per correggere: *«ne ha sbagliate 7 su 10 —
abbassale di mezzo anno»*. **Consiglia e non ritocca da sé**, ed è una
scelta: un gioco che si ritara da solo sembra intelligente finché non
sbaglia, e un pomeriggio storto o un fratello che ha giocato al posto
suo gli insegnerebbero la cosa sbagliata senza che nessuno possa
vederlo.

### La banda: quanto è sfocato il tiro, e perché si è stretta

La banda è la larghezza della campana intorno al bersaglio. Era 19 — un
anno e mezzo — con una mira che ne correva 31 in tutto: la rosa era
larga quanto metà del poligono, quindi ovunque puntasse la manopola ci
finiva dentro mezzo mazzo.

Il difetto si vedeva solo contando, e si sentiva giocando. Misurato su
**una porta della terza tappa del sotterraneo** — che è un punto
perfettamente determinato, sempre difficoltà 0.45 — a un bambino di otto
anni: il 41% delle domande stava sotto gli otto anni, il 10% sotto i sei
e mezzo, e due domande di fila distavano in media 1,1 anni. Due tappe
adiacenti ne distavano 0,25. **Il rumore batteva il segnale quattro a
uno**, ed è tutto lì il «un po' facile, un po' difficile, a caso» che si
sente giocando: la difficoltà chiesta era giusta e deterministica, la
domanda consegnata era quasi un sorteggio.

Adesso la banda è **11** (poco meno di un anno) e la mira arriva fino al
tetto dell'ammissione. Sulla stessa porta: la coda sotto i sei anni e
mezzo passa dal 10% allo 0,4%, la dispersione da ±0,95 a ±0,55 anni, e
la campagna del sotterraneo corre da 7,1 a 9,5 anni invece che da 7,2 a
8,8 — il doppio di strada con metà del rumore.

**Ammesse non vuol dire frequenti**, ed è il prezzo dichiarato: le ore
intere dell'orologio restano nel mazzo di un bambino di nove anni, ma
con la campana stretta non gli capitano più. Restano ammesse per il caso
in cui servano davvero, che è quello qui sotto.

#### E quando il mazzo finisce, la banda si allarga

Stringere la campana si paga agli estremi della scala, dove le classi
scarseggiano: a dieci anni, sopra i dieci, il catalogo intero ne ha
tredici, e con la banda ferma **una sola classe si prendeva il 54% dei
tiri** davanti al capo dell'ultima tappa. È ripetitività, cioè l'altro
modo di rovinare la stessa cosa — e il difetto è del catalogo, non del
bambino: quelle domande lì non le abbiamo ancora scritte.

Il rimedio è **un degrado felice, a tentativi**: si guarda quante classi
contano davvero intorno al bersaglio, e se sono poche si allarga la
banda di tre punti e si riprova, finché non ce ne sono abbastanza
(`VARIETA_MINIMA`) o finché la campana non è tornata larga come prima
(`BANDA_MASSIMA`). Chi sta in mezzo alla primaria non se ne accorge mai.

«Quante contano davvero» non è «quante ce ne sono»: una classe con peso
un millesimo c'è e non esce mai. Si conta col numero effettivo
(`quanteContano`, l'inverso della somma dei quadrati dei pesi), che dà
quattordici quando quattordici classi se la giocano alla pari e scende
verso uno man mano che una sola se le mangia tutte.

Il degrado si vede anche col mazzo svuotato da un genitore: acceso il
solo orologio, la banda va al massimo e le ore intere tornano a uscire —
più con la carta debole (222 tiri su 3000) che con quella tosta (17).
Anche nel degrado il verso resta giusto.

Un gioco non se n'è accorto di niente: continua a chiedere «una domanda
facile» o «una tosta» senza sapere chi ha in mano il telefono. È lo
stesso patto dei saperi spenti — chi sa del profilo è `scelta.js`, e
nessun altro.

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
