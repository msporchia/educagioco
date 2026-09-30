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
| `dati/monete.js` | quanto paga ogni formato e una domanda del libro |
| `motore/fila.js` | la fila delle tessere: metti, togli, quando si consegna, quali colorare |
| `scena/disposizione.js` | dove cade ogni cosa sulla mappa, e la sua geografia (puro, gira in Node) |
| `scena/costa.js` | il campo di un'isola e le sue curve di livello: la costa, il mare basso (puro) |
| `scena/rotte.js` | il mare per la nave: attracchi, rotte, quanto dura un viaggio (puro) |
| `scena/mappa.js`, `scena/pittori.js` | la pergamena, le isole e i disegnini, su canvas |
| `scena/nave.js` | la caravella, sulla sua tela piccola, e il viaggio a fotogrammi |
| `viste/` | `Mappa`, `Domanda`, `Libro`, `Fine`, `Testo` (le parole da toccare), `Bolla` (la traduzione), `orologio.js`, `tenere.js` |

## La mappa del tesoro

- **Ogni mondo è un'isola**, le sue tappe un sentiero tratteggiato che
  serpeggia, e fra un mondo e l'altro una **rotta per mare**, da un porto
  all'altro attorno alla terra (la stessa che fa la nave). Come sono fatte
  le isole sta sotto, in «Le isole».
- **I mondi stanno in file per profondità nel grafo** (chi non dipende da
  nessuno in cima). Un mondo con le tappe ha **una riga tutta sua**, al
  centro, con mare ai due lati; quelli in arrivo della stessa fila vengono
  sotto, a gruppi (uno per riga sotto i 372 px, due da lì in su), spostati un
  po' a destra e a sinistra perché non sembrino piastrelle. Accanto a un
  mondo lungo non ci stavano: a qualunque larghezza da telefono le isole si
  toccavano, e fra due isole che si toccano la nave non passa. Una rotta si
  disegna solo dalla fila appena sopra: la prova finale dipende da tutti, e
  un filo da ognuno sarebbe una ragnatela. Due rotte che partono dallo
  stesso porto fanno un pezzo di mare insieme, e lì se ne disegna una
  (`sfoltisci`): si stacca come un ramo, invece di due binari paralleli.
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
- **Dove si è arrivati lo dice la nave**, non più una freccia: vedi «La
  nave» qui sotto. La mappa si apre scorrendo fino a lei.
- I nomi e i tasti sono HTML sopra la tela, negli stessi punti: il canvas
  non si tocca, e un nome in HTML resta nitido a ogni zoom.

## Le isole

Le prime isole erano una manciata di cerchi fissi, ognuno riempito e
contornato per conto suo: i contorni si sovrapponevano e la forma veniva a
grumi tondi — «un ammasso di popò lasciata lì», è stato il giudizio, e
aveva ragione. Adesso un'isola è **una costa sola**, come nelle carte
nautiche disegnate a mano.

- **Un campo e una soglia** (`coste` in `disposizione.js`, il mestiere in
  `costa.js`). Il campo di un'isola è la distanza, raccordata (un'unione
  morbida che riempie gli angoli rientranti), da quello che deve portare
  — i medaglioni con le tacche, i nomi sotto, il titolo, i sentieri — e da
  un po' di terra di contorno: la **schiena** dietro il sentiero e qualche
  **promontorio**, tutti dal lato opposto al porto. A quella distanza si
  toglie un margine e si somma un rumore col seme del mondo; la costa è
  dove il campo vale zero (marching squares su una griglia di 4 px, poi
  una lisciata leggera che non stringe). I nomi stanno in stadi e non in
  rettangoli, se no la costa attorno fa gli spigoli.
- **Il rumore è limitato, ed è la garanzia.** Due voci: una larga (golfi e
  promontori, fino a 22 px verso il mare) e una fine (la costa frastagliata,
  4 px). Verso l'interno non va mai oltre `DENTRO`, quindi quello che
  l'isola porta resta sempre a terra con almeno `MARGINE` attorno.
- **Il seme è il mondo** (`semeDi`, dall'id): la stessa isola a ogni
  apertura e a ogni partita, e il rumore si legge rispetto al centro
  dell'isola, quindi il carattere della costa è lo stesso su ogni schermo.
  Quanto si è giocato non sposta niente: cambia solo il colore.
- **Due isole si dividono il mare a metà**, con `CANALE` (40 px) in mezzo:
  la terra dell'una non tocca l'altra, anche quando il rumore spinge.
- **Gli isolotti** sono pochi (due per un mondo con le tappe, uno o nessuno
  per quelli in arrivo), vicino alla costa, sulla schiena o in punta: la
  costa del porto resta libera per la nave.
- **Il mare basso**: tre righe che seguono la costa a 7, 14 e 22 px, sempre
  più tenui, calcolate come curve di livello dello stesso campo (senza la
  voce fine, così sono più morbide della costa) e di tutte le isole
  insieme — fra due isole vicine si fondono invece di incrociarsi. Al
  bordo della carta si interrompono.
- **Come si dipinge** (`mappa.js`): la terra nel colore del suo stato
  (aperto, chiuso, in arrivo, come prima), una striscia di sabbia appena
  dentro la costa, un tratteggio corto sul lato in ombra (sud-est), e la
  costa **tracciata una volta** a inchiostro; un mondo in arrivo ha la
  costa tratteggiata e l'inchiostro tenue, come una terra non ancora
  rilevata. Sulla terra libera alberelli, monticelli e ciuffi a
  inchiostro (`decori`, mai sotto una tappa, un nome o il sentiero).
- **Costa una volta sola.** La geografia (coste, mare, porti, rotte) non
  dipende da cosa è vinto ma solo da dove sta ogni cosa, quindi si tiene
  da parte per forma (`geografia`, le ultime sei): la prima volta sono
  ~75 ms su un computer, tornando alla mappa dopo una tappa ~2 ms.

## La nave

Al posto della freccia c'è **una caravella** a inchiostro e acquerello
(`nave.js`), ancorata accanto alla tappa dove si è arrivati.

- **Ogni nodo ha il suo attracco** (`porto`, calcolato con la
  disposizione): il primo punto di mare aperto lungo un raggio che parte
  dal nodo, preferendo la **costa del porto** dell'isola (`lato`, col seme
  del mondo). È per questo che promontori e isolotti stanno sull'altra
  costa: da questa parte le tappe lontane restano in fondo a un golfo, e
  la nave ci entra.
- **Il mare della nave** è una griglia di 8 px con quanta acqua c'è
  attorno a ogni cella (`creaMare`): la nave vuole almeno `NAVE` (12 px)
  e sta nel mare aperto, cioè nel pezzo di acqua più grande. Ai lati di
  un'isola lunga c'è sempre una corsia (`CORSIA`), anche a 320 px.
- **Toccata una tappa aperta, la nave ci naviga**: A* sulle celle
  navigabili, che preferisce l'acqua larga, poi il filo tirato e gli
  angoli arrotondati (`rotta`) — gira attorno alla terra, mai sopra.
  Arrivata, la tappa si apre. Il viaggio dura **al massimo 1,3 s**
  (`durata`), e della rotta si naviga solo **il pezzo che si vede**
  (`pezzoVisibile`): una nave che parte mille pixel più in su passerebbe
  il viaggio fuori dallo schermo. Un tocco qualunque durante il viaggio lo
  chiude subito (la tela è coperta da un velo trasparente, che si prende
  anche il click: niente tocchi fantasma sulla schermata dopo).
- **A fotogrammi, e ferma a schermo nascosto** (`viaggia`): il tempo
  avanza solo fra due fotogrammi e mai più di 50 ms alla volta, quindi a
  schermo spento il viaggio resta dov'era e alla ripresa non salta. La
  nave dondola e si lascia dietro una scia di increspature. Ferma, non
  anima niente: nessun ciclo acceso per una mappa che nessuno tocca.
- **Su una tappa chiusa la nave non parte**: dà uno scossone e un
  cartiglio sopra la tappa dice cosa serve (`cosaServe` in
  `motore/mappa.js`: «Prima vinci «È un cane»», «Prima finisci «Che
  cos'è»», «Questo mondo arriva presto»…), e se ne va da solo. Il tasto
  di una tappa chiusa quindi non è più `disabled`: si tocca, e risponde.
- **Dove sta quando la mappa si apre** (`doveStaLaNave`): dove ha
  attraccato l'ultima volta in questa sessione, se lì si può ancora
  andare — tornati da una tappa la si ritrova lì, come il personaggio
  sulla mappa di un videogioco — se no accanto alla tappa da fare adesso.
  L'ultimo porto vive in memoria, non nel profilo.

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
  basta. Il click che arriva dopo la pressione lunga si ingoia — anche
  quando al posto della traduzione compare la domanda (sotto).
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

**Un tocco che toglierebbe il guadagno si chiede prima.** Il bambino lo
scopriva dopo, a guadagno già sparito. Adesso `prova` del motore dice se
il tocco costerebbe, senza segnare niente, e al posto della traduzione
compare una **bolla accanto alla parola** (`Bolla.vue` con `chiede`): il
perché («Hai già chiesto questa parola 3 volte» / «la conosci già»), la
domanda, «questa domanda non ti darà monete» (nel libro «una domanda del
libro»), e due tasti, «Sì, dimmelo» e «No, ci provo». Solo al sì si fa il
tocco vero. Tre cose:

- **non è un velo**: sta sopra la parola (sotto, se sopra non c'è posto),
  il resto dello schermo si tocca, e un dito appoggiato altrove vale «no»;
  rispondere la chiude;
- **i tasti sono ciechi per 320 ms**, come ogni schermata appena comparsa;
- **col dito**: dalla pressione lunga su una tessera la bolla compare con
  il dito ancora giù e sopra la tessera, quindi il click dell'alzata
  arriva alla tessera, che lo ingoia (`tenere.js`). La prova è un tocco
  vero in `integrazione/inglese-mondi`.

Si chiede solo quando c'è qualcosa da perdere: le volte gratis e le parole
di struttura passano dritte, e così un tocco su una domanda che non paga
già, o nel libro quando nessuna domanda paga più.
A domanda chiusa toccare è gratis e non segna niente (`traduci` e basta).
Il conto dei tocchi gratis sta sull'elemento SRS della parola, quindi dopo
un tocco si salva il profilo.

## Le monete

🪙1 = dieci secondi di esercizio, **pagate nel momento in cui si risponde
giusto**, niente moltiplicatore di livello e niente premio d'arrivo; tutto
passa da `incassa` (quindi dalla varietà), e il cartello di fine dice
quanto è arrivato davvero.

| cosa | 🪙 | perché |
|---|---|---|
| una parola | 1 | un colpo d'occhio, come un asteroide |
| riconosci, cosa vuol dire, scegli, completa | 2 | leggere una frase e quattro risposte, o due buchi |
| monta, scegli e monta | 3 | una frase intera messa in fila: una domanda vera |
| una domanda del libro | 4 | dentro c'è anche la lettura del testo |

Una tappa da diciotto risposte rende ~25 monete in quattro-cinque minuti,
cioè quello che la calibrazione dice. **Il premio d'arrivo non c'è più**
(🪙5 alla prima vittoria di una tappa, 🪙10 alla 🏁): il proprietario
vuole la cosa lineare, «appena fai qualcosa per ottenerla, la moneta la
ottieni» ([../apprendimento/calibrazione.md](../apprendimento/calibrazione.md)).
Nel libro una domanda giusta paga quando si risponde, **se un tocco a
pagamento non se l'è già mangiata**: ogni parola chiesta toglie la
prossima domanda che pagherebbe, non quella di prima.

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
le monete, la materia delle frasi), `unita/inglese-isole` (a cinque
larghezze: una costa chiusa per isola con dentro, col margine, tappe, nomi,
sentieri e titolo; la stessa isola ricalcolata da capo e a ogni punto del
gioco; forme diverse per mondi diversi; isole che non si toccano; rotte in
mare; un attracco in mare accanto a ogni tappa, e da ognuno la nave arriva
a ogni altro in meno di 1,5 s; dove sta la nave e cosa serve),
`integrazione/inglese-mondi` (entra, la nave è ancorata, una tappa chiusa
dice cosa serve, la nave naviga fino alla tappa, passa le parole, compone a
tocchi, chiede prima di un tocco che costa col dito vero, sbaglia,
un tocco chiude il viaggio, legge il libro e risponde; con `--scatti` anche
la tela intera a 390 e a 320 px) e
`integrazione/inglese` (il gioco di prima). Bersagli: la carta
`.carta.gioco[data-gioco="inglese"]`; la mappa `[data-mappa-inglese]`,
`[data-tappa="<id>"]` con `[data-stato]` (`aperta`, `chiusa`, `vinta`),
`[data-grado]` e `[data-chiuso]`, `[data-mondo][data-pronto]`,
`[data-libro="<mondo>"]`, `[data-cassetto="<mondo>"]`, `[data-prima]`; la
nave `[data-nave]` con `[data-porto]` (la chiave del nodo: `tappa:<id>`,
`libro:<mondo>`…) e `[data-in-viaggio="1"|"0"]`, il velo del viaggio
`[data-viaggio]`, il cartiglio `[data-serve]` con `[data-serve-per]`; la domanda `[data-domanda]`
con `[data-formato]`, `[data-opzione]` (e `[data-giusta]`), `[data-banco]
[data-tessera]` con `[data-posto]` (dove va nella frase giusta),
`[data-fila] [data-in-fila]`, `[data-azione="consegna"]`, l'esito
`[data-esito="giusta"|"sbagliata"]` con `[data-perche]`,
`[data-giusta-era]`, `[data-si-fa]`, `[data-sbagliata]` e `[data-attesa]`;
l'indicatore `[data-paga][data-paga-si="1"|"0"]`, la parola
`[data-parola]` e la nuvoletta `[data-traduzione]`; la domanda prima del
tocco `[data-svela]` (con `[data-pronta]`) e i suoi
`[data-azione="svela-si"|"svela-no"]`; il libro
`[data-libro-testo]`, `[data-azione="ho-letto"]`, `[data-libro-domanda]`;
il cartello `[data-fine]` con `[data-azione="mappa"|"avanti"]`.
