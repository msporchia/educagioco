# English a mondi — la vista

Quello che il bambino vede dell'inglese a mondi, e le scelte prese
costruendolo. Il progetto e il motore stanno in [mondi.md](mondi.md); cosa
manca in [da-fare.md](da-fare.md).

## Dove sta cosa

In `src/giochi/inglese/`, accanto a `dati/` e `motore/`:

| file | cosa tiene |
|---|---|
| `gioco.js` | il manifesto: chiave `inglese`, la stessa della carta di prima |
| `Gioco.vue` | il coordinatore: sessione, libro, monete, profilo |
| `dati/monete.js` | quanto paga ogni formato, il libro, la prima vittoria |
| `motore/fila.js` | la fila delle tessere: metti, togli, quando si consegna, quali colorare |
| `scena/disposizione.js` | dove cade ogni cosa sulla mappa (puro, gira in Node) |
| `scena/mappa.js`, `scena/pittori.js` | la pergamena e i disegnini, su canvas |
| `viste/` | `Mappa`, `Domanda`, `Libro`, `Fine`, `Testo` (le parole da toccare), `Bolla` (la traduzione), `orologio.js`, `tenere.js` |

## La mappa del tesoro

- **Ogni mondo è un'isola**, le sue tappe un sentiero tratteggiato che
  serpeggia, e fra un mondo e l'altro una **rotta sul mare**. Le rotte si
  dipingono sotto la terra: arrivano alla costa invece di attraversare il
  libro e il cassetto.
- **I mondi stanno in file per profondità nel grafo** (chi non dipende da
  nessuno in cima); in una fila quelli con le tappe vanno in mezzo e più
  larghi, quelli in arrivo ai lati, tirati dentro dal bordo. Una rotta si
  disegna solo dalla fila appena sopra: la prova finale dipende da tutti, e
  un filo da ognuno sarebbe una ragnatela.
- **Il medaglione di una tappa** porta il suo disegnino (`disegno` in
  `dati/mondi.js`, un pittore in `scena/pittori.js`, niente emoji) e dieci
  tacche attorno, piene quante il grado. **Il colore del disegno è il
  grado**: a 0 è quasi pergamena, a 10 pieno, e quando la forza cala
  sbiadisce da solo (`sbiadito`). Chiusa: più sbiadita, col lucchetto.
  Vinta: il bordo d'oro, anche se il grado è sceso.
- **I mondi senza tappe** sono un'isola piccola col bordo tratteggiato,
  il loro disegnino (`disegno` del mondo) e «in arrivo».
- **Il libro e il cassetto** sono due medaglioni piccoli sotto la
  bandiera. Il libro si apre con la bandiera (quando si può giocare la
  🏁): il capitolo usa tutte le strutture del mondo. Il cassetto si apre
  alla prima tappa vinta, come dice il motore.
- La freccia rossa ◀ sta **di fianco** alla tappa da fare adesso, una per
  mondo aperto: sopra c'è il nome del mondo o quello della tappa prima. La
  mappa si apre scorrendo fino a lei.
- I nomi e i tasti sono HTML sopra la tela, negli stessi punti: il canvas
  non si tocca, e un nome in HTML resta nitido a ogni zoom.

## Una tappa

- **Le tessere si toccano**: dal banco vanno in coda alla fila (in
  «completa», nel primo buco vuoto), dalla fila tornano nel banco. La fila
  mette la maiuscola alla prima parola e il «?» in coda se la frase è una
  domanda. «Monta» si consegna con tutte le tessere in fila, «completa» coi
  buchi pieni; **«scegli e monta» con una sola**, perché dire quante ne
  vanno regalerebbe la lunghezza della frase.
- **Tenere premuta una tessera**, o una risposta inglese, dice cosa vuol
  dire la parola sotto il dito (`tenere.js`, 450 ms). Un tocco lì ha già
  un mestiere — mettere in fila, rispondere — e la traduzione non può
  rubarglielo; le parole della consegna e del libro invece si toccano e
  basta. Il click che arriva dopo la pressione lunga si ingoia.
- **Dopo uno sbaglio**, tre righe distinte: «Non così» col perché della
  trappola (se è una trappola nota), «Si dice: …» (solo per le frasi
  composte: nelle altre la giusta si accende fra le opzioni) e «Si fa
  così» in un riquadro suo. **La tessera sbagliata si colora**: prima le
  tessere in più (non stanno nella frase giusta), e se non ce ne sono
  quelle fuori posto (`sbagliate` in `motore/fila.js`).
- **L'attesa** è quella di `quiz/Domanda.vue`: `attesaDellEsito` sulle
  righe da leggere, `PONDERA` come pavimento, la fretta di `quiz/fretta.js`
  (la stessa raffica di tutti i giochi), una barra che si riempie, e si
  ferma a schermo spento (`viste/orologio.js`, che conta anche il tempo
  guardato e la finestra cieca di 320 ms).
- **Niente si perde, nemmeno alla 🏁**: una tappa finisce a `bersaglio`
  risposte giuste, e il cartello dice il grado di prima e di adesso.

## Il libro

Il capitolo si legge **di seguito, come prosa**, con la tipografia di un
libro (serif, 19–22 px, capolettera): le frasi di un capitolo sono un
racconto, e una riga per frase lo faceva sembrare un esercizio. Poi le
domande in italiano, una alla volta, col testo sempre sopra (ridotto e
scorrevole): rileggere è lecito. Le sbagliate non si spiegano — «rileggi il
testo qui sopra» — perché la risposta è nel testo.

## La parola da toccare

La nuvoletta dice la traduzione per 2,2 s. Il conto è quello del motore
(`Tocchi`): **se il tocco costa, l'indicatore delle monete nella barra
diventa grigio e con la 🔍 subito**, e la nuvoletta lo dice anche lei.
A domanda chiusa toccare è gratis e non segna niente (`traduci` e basta).
Il conto dei tocchi gratis sta sull'elemento SRS della parola, quindi dopo
un tocco si salva il profilo.

## Le monete

🪙1 = dieci secondi di esercizio, **niente moltiplicatore di livello**,
tutto passa da `incassa` (quindi dalla varietà), e il cartello di fine
dice quanto è arrivato davvero.

| cosa | 🪙 | perché |
|---|---|---|
| una parola | 1 | un colpo d'occhio, come un asteroide |
| riconosci, cosa vuol dire, scegli, completa | 2 | leggere una frase e quattro risposte, o due buchi |
| monta, scegli e monta | 3 | una frase intera messa in fila: una domanda vera |
| una domanda del libro | 4 | dentro c'è anche la lettura del testo |
| una tappa vinta la prima volta | 5 | il premio d'arrivo; la 🏁 10 |

Una tappa da diciotto risposte rende ~30 monete in quattro-cinque minuti,
cioè quello che la calibrazione dice. Il cassetto non ha premio d'arrivo:
è facoltativo e si rigioca quanto si vuole.

## Il posto del gioco

- **La carta è quella di prima**: il manifesto ha chiave `inglese`, in
  `data/giochi.js` la sua riga prende il posto di quella vecchia (davanti
  allo spagnolo, `AL_POSTO_DI_UNO_VECCHIO`), e in `App.vue` le schermate
  dei giochi nuovi vincono su `viste`. Interruttori dei grandi, varietà,
  sessioni e portata della carta restano sotto la stessa chiave. La home
  si racconta dal manifesto (`riassunto`) più le parole sicure di sempre.
- **Lo spagnolo resta su `views/LinguaGame.vue`** com'è.
- **Chi aveva giocato riparte dai mondi** (le chiavi SRS sono le stesse,
  quindi le prime tappe passano in fretta) e `p.eng` non si tocca. **Chi
  aveva finito la campagna vecchia** (`p.eng.libera`) trova in fondo alla
  mappa «Il gioco di prima»: `LinguaGame` con `libero`, che parte dritto
  nel gioco libero e uscendo torna alla mappa del tesoro. È il modo più
  semplice di non togliere niente a nessuno senza tenere in vita la
  campagna vecchia.
- **L'albo è quello di sempre**: niente blocco `albo` nel manifesto (ci
  sarebbero due aree «English»). Le risposte giuste salgono sui contatori
  di prima (`en`, `verbi`, `frasi`); «In viaggio» conta le tappe della
  campagna vecchia o dei mondi, la più avanti (`tappeEn`).
- **La materia «Frasi inglesi»** conta l'unione delle frasi di prima e dei
  mondi, una volta sola (alcune hanno lo stesso `id`), e con `vale`
  ignora le chiavi `frase:` che non stanno in nessuna delle due liste:
  senza, le frasi nuove l'avrebbero portata oltre il cento per cento.

## Niente pausa

Il gioco è a turni e non ha un orologio: niente ⏸
([../core/interfaccia.md](../core/interfaccia.md)). Il `?` apre
`AIUTI.inglese` di `guide/contenuti.js`.

## Nei test

Nei test: `unita/inglese-vista` (la fila su ogni frase in tre formati, la
mappa a 320/390/520 px senza sovrapposizioni, un pittore per ogni disegno,
le monete, la materia delle frasi), `integrazione/inglese-mondi` (entra,
compone a tocchi, sbaglia, legge il libro e risponde) e
`integrazione/inglese` (il gioco di prima). Bersagli: la carta
`.carta.gioco[data-gioco="inglese"]`; la mappa `[data-mappa-inglese]`,
`[data-tappa="<id>"]` con `[data-stato]` (`aperta`, `chiusa`, `vinta`) e
`[data-grado]`, `[data-mondo][data-pronto]`, `[data-libro="<mondo>"]`,
`[data-cassetto="<mondo>"]`, `[data-prima]`; la domanda `[data-domanda]`
con `[data-formato]`, `[data-opzione]` (e `[data-giusta]`), `[data-banco]
[data-tessera]` con `[data-posto]` (dove va nella frase giusta),
`[data-fila] [data-in-fila]`, `[data-azione="consegna"]`, l'esito
`[data-esito="giusta"|"sbagliata"]` con `[data-perche]`,
`[data-giusta-era]`, `[data-si-fa]`, `[data-sbagliata]` e `[data-attesa]`;
l'indicatore `[data-paga][data-paga-si="1"|"0"]`, la parola
`[data-parola]` e la nuvoletta `[data-traduzione]`; il libro
`[data-libro-testo]`, `[data-azione="ho-letto"]`, `[data-libro-domanda]`;
il cartello `[data-fine]` con `[data-azione="mappa"|"avanti"]`.
