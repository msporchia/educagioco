# I moduli di quiz

Il contratto di un modulo di `src/quiz/`, come se ne aggiunge uno, come si
prova e come lo usa un gioco. Difficoltà, ripasso e messa in scena hanno un
file loro (vedi [README.md](README.md)).

Servono a far *pagare* un potenziamento con un esercizio, in tanti giochi e
non in uno: la pausa amara del castello («vuoi la torre, paghi i calcoli»)
portata dappertutto, con domande che non si imparano a memoria. La regola che
tiene su tutto:

> un modulo consegna una **domanda**, e non sa chi gliel'ha chiesta;
> un gioco chiede una domanda, e non sa di che materia sia.

## Si ricava, non si ricorda

Una domanda del tipo «dove vive il koala?» o «quando comincia
l'inverno?» supera ogni controllo di forma del banco (falsi distinti,
varietà alta) e non insegna niente: chi sbaglia non ha ragionato storto,
semplicemente non se lo ricordava — e non c'è nessun passo che porti
dalla domanda alla risposta. Un modulo che tocca materia enciclopedica
(`animali.js`, i macrogruppi di scienze) va bene solo se **il passo da
fare c'è per davvero**: in `animali.js` un animale si porta addosso il
posto dove vive (il pelo bianco dice il freddo, la gobba il deserto), e
la scaletta finisce apposta dove non c'è più nessun animale da
ricordare, solo un indizio del corpo da leggere. Dove il passo non c'è —
l'accento tonico, le nomenclature «tronca/piana/sdrucciola» — la
tipologia si toglie (vedi "Provati e scartati").

Lo stesso vale **dentro la consegna**: perché il passo ci sia, la domanda
deve dire tutto quello che serve per farlo.

- **Una parola tecnica si spiega nella consegna.** «In media» o la sai o
  tiri a caso, e a caso si finisce lontano: la domanda dice cosa vuol dire
  («metti tutto insieme e dividilo in parti uguali»), il conto resta da fare.
- **Un numero porta la sua unità, e l'unità vuole numeri veri.** Un peso
  con scritto «6» non dice 6 di cosa; ma «2 pannocchie pesano 1 kg»
  insegna il falso. Sulle bilance ogni cosa pesata ha il suo peso reale
  (una 🍎 da 150 a 250 g, un 🐶 da 5 a 20 kg) e la domanda chiede «quanti
  g» o «quanti kg»; le cose senza un peso credibile stanno solo negli
  scambi («quante 🥕 pesano come un 🐰»), che non hanno unità.
- **I conti stanno al servizio del ragionamento.** Nella spesa furba i
  prezzi sono tondi (3 kg a 6 €), e al primo gradino la domanda nomina il
  conto da fare («quale costa meno al kg?»): i centesimi sparsi facevano
  sbagliare la divisione a chi aveva capito cosa confrontare.
- **La parola su cui si chiede va in rilievo** (`evidenzia`, sotto), non
  fra virgolette in una frase nel riquadro: scritta lì sembrava una risposta.

## La forma

- `nucleo/domanda.js` — la forma di una domanda: consegna, soggetto
  facoltativo, da 2 a 6 risposte, l'indice della buona, la chiave del
  concetto, `aiuto` (il metodo) e un `perche` per ogni falso. Le risposte
  sono testo, emoji o una scena disegnata (`testo`, `emoji`, `scena`).
  - **`conNome`** mette il nome sotto una figura solo quando figura e
    parola dicono la stessa cosa e la domanda ne chiede un'altra: in una
    domanda di lingua regalerebbe la risposta, e nessun controllo se ne
    accorge. Il perché per esteso sta in testa al file.
  - **Un soggetto può essere una frase con una parola in rilievo**
    (`{ testo: 'Metto lo zaino in spalla.', evidenzia: 'lo' }`), per le
    parole che da sole non hanno risposta («lo» è articolo o pronome). Nel
    dato **mai HTML**: il grassetto lo mettono `Domanda.vue` e
    `grafica/scheda.js` con `evidenziando`. La parola dev'esserci
    esattamente una volta come parola intera, e `guastiDi` lo controlla.
- `nucleo/modulo.js` — la classe base. Un modulo è `genera(grado, sorte,
  tipo)` e basta: nessuno stato, nessuna memoria, nessun punteggio. Le
  tipologie le dichiara (`tipi`), e quale tirare glielo dice chi chiama.
- `nucleo/sorte.js` — il caso **ripetibile**. Un generatore non chiama mai
  `Math.random()`: senza seme le domande non si provano.

Da copiare: `moduli/ortografia.js` (il **testuale**: dati in cima, classe
sotto, tre modi di chiedere la stessa regola) e `moduli/orologio.js` +
`grafica/pittori/orologio.js` (il **disegnato**: il modulo decide i fatti,
`{ che:'orologio', ore, minuti }`, il pittore li disegna in un quadrato
100×100 e non sa niente di difficoltà o risposte giuste).

**La tavolozza è una sola** (`grafica/pittori/tinte.js`, `TINTE`/`COLORI`):
sei tinte, ognuna con `scuro`/`base`/`luce`/`orlo` (le gradazioni che fanno
sembrare un cubo un cubo, e un contorno chiaro leggibile sul fondo scuro
della scheda). Il nome della tinta **si legge a voce**: in `indizi.js` e
`sequenze.js` finisce dentro il testo della domanda («non è rosso»), quindi
i nomi devono essere parole che un bambino di sei anni ha già — niente
«corallo» o «turchese».

## Le tipologie (`tipi`)

Un modulo dichiara le classi di domande che sa fare, una per una, col peso
a ogni grado; il nucleo pesca il tipo fra quelli accesi e lo passa a
`genera`, che diventa uno switch:

```js
super({ …,
  scaletta: ['le ore intere', 'le mezze ore', "i quarti d'ora", …],
  livelli: [25, 38, 44, 56, 75],                  // vedi quiz-livelli.md
  tipi: [
    { chiave: 'ora:intere', nome: 'Le ore intere', sa: 'orologio',
      gradi: { 1: 1, 2: 0.55, 3: 0.2, 4: 0.03 } },
    { chiave: 'ora:quarti', nome: "I quarti d'ora", sa: 'orologio',
      gradi: { 2: 0.45, 3: 0.5, 4: 0.1 } },
  ],
})
genera(grado, sorte, tipo) { switch (tipo) { … } }
```

- **Dichiarate e non sparse negli `if`**: così le proporzioni si
  controllano, i grandi spengono una tipologia e non un grado intero, e la
  chiave si conosce prima della domanda (serve al ripasso).
- **La chiave emessa dev'essere quella del tipo chiesto.** `unita/saperi`
  gioca trecento domande per grado e fallisce su una chiave non dichiarata
  a quel grado, o su un tipo dichiarato che non esce mai.
- `sa` dice quale pezzo di scuola la tipologia dà per scontato (vedi
  [saperi.md](saperi.md)). Un modulo senza `tipi` funziona ancora con
  `genera(grado, sorte)` e `saperi:` per grado (o una stringa per tutto il
  modulo).

**Un modulo può dichiarare `scala: [0, 0.22]`** per stare tutto sotto il
primo gradino della scala di scuola (`SCALA_SCUOLA` in `quiz/scelta.js`):
è il caso di `moduli/lettere.js`, l'unico modulo che non dà per scontato
che il bambino legga la consegna — tutti gli altri partono da un quarto
della manopola in su. Non è un'etichetta di comodo: un bambino di sei
anni riceve queste domande e non quelle di terza, e uno di quinta non si
vede arrivare «con che lettera comincia 🐝?» come premio di una carta
tosta. Le parole di `lettere.js` sono scelte apposta, diverse da
`data/words.js` (per l'inglese): lì l'emoji è un'illustrazione accanto
alla parola scritta, qui **l'emoji è la domanda** («con che lettera
comincia» su 🐰 ha due risposte se si può chiamare coniglio o lepre),
quindi le voci vanno scelte una per una perché si chiamino in un modo
solo.

## Aggiungere un modulo

Un file in `moduli/`, più uno in `grafica/pittori/` se disegna. Nient'altro:
il registro (`nucleo/registro.js`) e il banco raccolgono dalla cartella, e il
modulo compare **in tutti i giochi** la sera stessa.

1. **La chiave è il concetto, non l'istanza**: `orto:gn`, non «lavagna». Il
   prefisso nuovo si sceglie guardando quelli presi in `store/progressi.js`
   (`verbo:` era già dei verbi inglesi) — vedi [quiz-ripasso.md](quiz-ripasso.md).
2. **I falsi sono gli errori veri** (*ho andato*, la lancetta scambiata, il
   perimetro contato come area), ognuno col suo `perche`. Un distrattore a
   caso si scarta a occhio.
3. **La varietà è un requisito**: il banco fallisce sotto le 25 domande
   diverse per grado, e va puntato molto più in alto.
4. **Un `aiuto` che insegna il metodo in una riga** (vedi
   [la-domanda.md](la-domanda.md)).
5. **Un livello per grado** (`livelli:`): chi tace ricade su una scaletta
   stesa fra sei e undici anni, e `unita/catalogo` lo elenca.

## Provarli

```bash
npm run quiz:banco                       # tutti, senza browser
npm run quiz:banco orologio --mostra 3
npm run quiz:eta                         # chi vede cosa per età → chi-vede-cosa.md
npm run quiz:livelli                     # rigenera livelli-delle-domande.md
node test/esegui.mjs quiz --niente-build
```

Il banco (`strumenti/quiz/banco.mjs`) dice se un modulo è **giusto**: forma,
risposte doppie, scene senza pittore, caso ripetibile, varietà, la buona che
non sta sempre nello stesso posto. Se è **bello** lo dice solo un occhio,
nel gioco vero: dal ▶ di una riga nella schermata dei grandi (`Prova.vue`),
che mette in scena le domande con lo stesso `Domanda.vue` del bambino.

Due difetti che nessun controllo trova:

- **Due risposte difendibili** («con che cosa misuri un secchio»: litri o
  centimetri) superano ogni controllo di forma: si vedono solo leggendo.
- **Le domande che si possono solo ricordare** («quando comincia
  l'inverno?») non insegnano niente, perché fra domanda e risposta non c'è
  un passo. Si chiede *in che stagione cade dicembre*; le date esatte
  stanno nell'`aiuto`; a memoria solo quello che ha una filastrocca (i
  giorni dei mesi) o che è la materia stessa (contrari, participi).

### `Prova.vue`, i quattro modi di guardare

Ha preso il posto delle palestre per modulo di `poc/`: là si provava un
modulo a raffica per vedere se le domande erano belle, qui si prova **una
voce** — perché la domanda che un grande ha in mente è «cosa perdo se
spengo questa?» — una alla volta, col tasto per chiederne un'altra. Quattro
modi, e sono quattro domande diverse:

- `chiave` — «cosa perdo se spengo questa voce?» (dalla scheda «Cosa sa»).
- `sorgente` — «com'è fatta *questa* domanda?»: una classe precisa del
  catalogo (modulo, grado, tipologia).
- `giro` — «fammele vedere tutte»: una lista di classi scorsa in ordine,
  col contatore («7 di 37»).
- `eta` — «cosa becca un bambino di quest'età?»: pesca come pescherebbe un
  gioco (`pescaComeUnGioco`, campana e spenti compresi), non scorre niente.

I primi tre mostrano quello che **esiste**, l'ultimo quello che **capita**:
non si deduce l'uno dall'altro. Il pannello **non decide niente** — profilo
e progressi restano intatti, spegnere resta un tasto separato sulla carta
di fuori — e mette in scena la domanda con lo stesso `Domanda.vue` del
bambino, quindi non ha una copia sua dei disegni da tenere allineata.

## Usarli in un gioco

**Un gioco non nomina mai un modulo.** Chiede una domanda con una manopola
da 0 a 1 e riceve quello da mostrare:

```js
import { domandaPerGioco } from '../quiz/scelta.js'
import Domanda from '../quiz/Domanda.vue'
const q = ref(domandaPerGioco({ difficolta: 0.6, evita: ultimoModulo }))
```
```vue
<Domanda v-if="q" :domanda="q.domanda" :pittori="q.pittori"
         :titolo="`${q.icona} ${q.nome}`" @risposto="incassa" />
```

`risposto` porta `{ giusto, indice, chiave, tempo }`; il gioco decide cosa
vale e non sa la materia. Un gioco può restringere le materie
(`materie: ['matematica', 'spazio']`, elenco in `MATERIE` di `scelta.js`).
Chi sa del profilo (età, saperi spenti, ripasso) è **solo `scelta.js`**.
Fuori da Vue c'è il gemello imperativo: `await chiedi(ortografia, { grado: 3 })`
(`grafica/scheda.js`). Oggi passano da qui Survivors e sotterraneo,
e lo dichiarano con `quiz: true` nel manifesto.

## Il disegno si guarda grande

Toccando il disegno del soggetto si apre a tutto schermo (`.qz-zoom`), e si
chiude toccando ovunque: in 148 pixel una griglia a sei colonne diventa una
domanda sulla vista.

- **La lente è appesa al `body` con un `Teleport`**: dentro il pannello un
  `position: fixed` si ritaglia sul primo antenato con una `transform`, e i
  fogli del sotterraneo ne hanno una.
- **Si ingrandisce solo il soggetto**, mai le risposte: lì il tocco *è* la
  risposta.
- **Si chiude sul `click`**, non sul `pointerup`, se no il click fantasma
  atterra sul tasto sotto e risponde da solo.

Il gemello imperativo non ha la lente: lì guarda un grande, su uno schermo
grande.

### Il pittore dei grafici e delle tabelle

`grafica/pittori/dati.js` (pittogramma, istogramma, tabella) è l'unico
gruppo di pittori che disegna **su un foglio chiaro**: un grafico è cosa
da quaderno (inchiostro scuro su carta), non da carta blu notte come gli
altri. Il pittogramma riceve **quanti disegni**, non quanto valgono — la
moltiplicazione per la legenda (`vale`) è la domanda, la fa il bambino.
Tutto è tarato per un riquadro di 148 pixel: poche voci, etichette corte,
e nell'istogramma i numeri sull'asse solo una tacca sì e una no (le
tacche senza numero restano tutte, con la loro riga sottile — leggere
dove cade una cima fra due numeri scritti è metà della lezione).

### Il pittore delle figure a attributi

`grafica/pittori/figure.js`, condiviso da `sequenze.js` (cosa viene
dopo, chi non c'entra) e `analogie.js` (A sta a B come C sta a ?): la
stessa figura disegnata due volte in due moduli si vedrebbe diversa. Una
figura ha cinque attributi — forma, colore, quante, grande/piccola,
rotazione — perché sono le cinque cose che una regola può far cambiare;
il pittore non sa quale sia la regola e quali il rumore, lo sa il modulo.
**La taglia non si legge confrontando fila e tasto**: `grande` scala
dentro la propria cella (una figura grande la riempie, una piccola sta
in mezzo), il paragone si fa solo fra celle vicine nella stessa fila.

### Sequenze e analogie: l'intrusa dev'essere una sola

`moduli/sequenze.js` e `moduli/analogie.js` condividono la figura a
cinque attributi di `figure.js`. In «chi non c'entra» un solo attributo
può fare **3+1** (tre carte che concordano, una no): se ne facesse due,
ci sarebbero due intruse difendibili e un bambino che sceglie l'altra
avrebbe ragione. La ricetta: gli attributi rumorosi si distribuiscono
**2+2** sulle quattro carte, quelli fermi valgono uguale per tutte e
quattro, e solo l'attributo della regola fa 3+1 — verificato contando
(`unaSola`), perché una domanda ambigua passa ogni controllo di forma e
la vede solo il bambino che perde. `quante` e `grande` non stanno mai
in gioco insieme: quattro figure grandi non entrano in una cella, quindi
la taglia si confronta solo a parità di numero.

### Il pittore delle bilance

`grafica/pittori/bilance.js` disegna una o due bilance a due piatti,
**sempre in pari** (il pittore non controlla i conti, li fa il modulo):
piatti coi *pesi* (numeri scritti) o le *cose* (emoji × quante). L'ago in
mezzo, dritto in su, è il segno di «uguale» che si vede prima della trave
a figura piccola. I piatti **poggiano** sulla trave invece di essere
appesi: appesi, un filo e il gambo di una pera sarebbero la stessa riga a
questa risoluzione. Le cose uguali stanno raggruppate vicine (i pesi
insieme, le specie insieme), perché un mucchio si legge a colpo d'occhio
solo così; due o tre bilance stanno una sopra l'altra, rimpicciolite (a
tre, un piatto porta una fila sola). Con `unita` (`'g'`, `'kg'`) ogni peso
porta l'unità scritta piccola sotto il numero.

### Il pittore delle frazioni: i pezzi storti

`grafica/pittori/frazioni.js` disegna torta, barra e tavoletta da
`{ parti, colorate, tinta, pezzi? }`. Senza `pezzi` le parti sono uguali;
con `pezzi: [0.6, 0.6, 1.4, 1.4]` ognuna è larga quanto il suo peso —
serve al falso più importante del modulo: una figura divisa in quattro
pezzi che non sono quarti. Il pittore disegna, il modulo sa perché.

Tre regole per farle sembrare giuste a 148 pixel: il tratto che separa i
pezzi è unico e dello stesso spessore ovunque (un bordo esterno più
grosso farebbe sembrare più stretti i pezzi in cima); il pieno e il vuoto
non si scambiano mai (niente due colori, che si confondono); e **il
giallo non si usa** — pieno e vuoto si distinguono troppo poco, il
pittore ripiega da solo sull'arancione.

### I soldi in mano: i pezzi della bancarella

La scena `{ che: 'monete', pezzi }` di `moduli/soldi.js` («Hai in mano questi
soldi») **non è un canvas**: `Domanda.vue` (e `scheda.js`, con `mazzoDom`) la
mostrano con gli stessi pezzi della bancarella, `components/Soldo.vue` e
`MazzoSoldi.vue`, il cui stile e i cui fatti stanno in `grafica/soldi.js`
([grafica.md](../core/grafica.md)). Il pittore `monete` in
`pittori/soldi.js` è vuoto apposta: c'è solo perché `guastiDi` vuole un
pittore per ogni scena, e la scena dei soldi non ha la lente (il disegno è già
grande).

- **In file, mai sovrapposti**: prima le banconote, poi le monete da euro, poi
  i centesimi; in ogni fila dal valore più alto, i pezzi uguali attaccati e un
  poco staccati dai diversi. Se sono tanti si va a capo (flex-wrap), a 320 px
  come a 390. Provato: la griglia da tre colonne su un canvas da 148 px — i
  pezzi diventavano cerchi da 25 px e non si capiva quale fosse quale.
- **Il valore si legge sul pezzo** come alla bancarella (`2€` sulla moneta
  bimetallica, `20c` sul centesimo, `5€` sulla banconota); le scene dei soldi
  hanno `data-soldi`, i pezzi `data-cents`.

Nei test: `unita/soldi-disegnati` (l'ordine, nessun pezzo perso, la somma),
`integrazione/soldi` (nessuna sovrapposizione a 320 e 390 px).

## Provati e scartati

- **Catene alimentari**: proposte, non convincono.
- **Classi degli animali** (mammifero, uccello… dagli indizi): scritte e
  tolte, non convincono (`git log -- src/quiz/moduli/classi-animali.js`).
- **Spaziale** (poliomini girati): lo fa già `geometria` grado 4, meglio.
- **Percorsi**: li copre `griglia`.
- **Memoria** (figure coperte dopo due secondi): vuole due tempi, non entra
  nella forma di una domanda; semmai è una meccanica di gioco.
- **Lo scienziato** (`poc/la-regola.html`): è un gioco a più mosse, va in
  `src/giochi/`, non qui.
- **`poc/compagno.html`**: è un tamagotchi che si nutre di ripasso, non un
  quiz.
- **L'accento tonico** (`moduli/sillabe.js`, come le nomenclature «tronca,
  piana, sdrucciola»): si risponde solo dicendo la parola a voce alta, e
  un bambino che gioca in silenzio tira a indovinare — non è una domanda
  che sullo schermo funziona, non è una lacuna di taratura.
- **Il confronto di figure a quadretti** (`moduli/griglia.js`): «quale di
  queste quattro ha gli stessi quadretti ma il bordo diverso?» erano otto
  conti a dito su figure senza una forma da cui dedurre niente — il
  concetto si afferra in tre secondi, il minuto dopo lo occupa l'indice
  sullo schermo, e sbaglia chi perde il conto, non chi non ha capito. Era
  stata spostata in cima alla scaletta invece che tolta: spostare non era
  la cura.
