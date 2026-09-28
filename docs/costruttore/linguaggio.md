# Il costruttore — il linguaggio e il cantiere

Le regole del mondo di lato, come si scrive una riga, e cosa rende un
livello una sfida. Codice in `src/giochi/costruttore/`: l'esecutore è
`motore/esecutore.js`, il cantiere `motore/mondo.js`, i livelli
`dati/livelli.js`, il banco `test/unita/costruttore`.

## La sfida sono gli ordini

- **Un livello dichiara più ordini** (la scala da 3 gradini e da 5, il fiume
  largo tre e sei) **e vince solo il programma che li regge tutti.** È l'idea
  delle scene del Generale, ed è quella che rende **necessari** parametri e
  variabili invece di un modo più elegante di fare la stessa cosa.
- **Ogni livello porta le sue `fragili`**: le mosse ingenue (il numero del
  primo ordine scritto a mano, la colonna a righe). `unita/costruttore`
  pretende che ognuna perda almeno un ordine: se ne vincesse una, il livello
  non insegnerebbe quello che dichiara.
- **Il primo ordine si gioca alla velocità scelta**; se regge, gli altri a
  schermo, accelerati.
- **Niente par**: meno righe non vale di più. Il tetto alle righe c'è solo
  dove lo dichiara il livello (lo zaino, vedi [progetti.md](progetti.md)).
- **«lungo» è la lavagnetta dell'ordine**: pavimenti e muri sono lunghi
  diversi e finiscono sul bordo del cantiere, quindi un numero contato a mano
  regge un ordine solo, e uno alto «per stare sicuri» fa dire al robot che non
  può uscire.

## Il robot cammina e cade

`motore/esecutore.js` (`passo`, `cadi`). Provato un robot-drone che volava:
per aria non dava nessun ordine alle cose.

- **Un passo nel vuoto e scende** finché trova qualcosa; sale un gradino alto
  uno, davanti a un muro più alto si ferma.
- **Per salire si mette un mattone sotto i piedi** e ci sale: una torre è
  «metti, metti, metti».
- **Un mattone si posa anche in basso a destra o a sinistra**, dove andrà il
  piede: così si fa un ponte, o la chioma di un albero.
- **Dove c'è già un mattone non ne mette un altro**, e si ferma dicendolo:
  se no «metti dappertutto» vincerebbe senza guardare.
- **L'omino che prova la costruzione** sale un gradino alla volta, cade per
  tre al massimo e nell'acqua non entra.
- Un programma si ferma in due modi che non si somigliano
  (`motore/inciampo.js`): l'`Inciampo` è un errore (un muro davanti, le mani
  piene, una N da scegliere), la `Sera` è la giornata del porto finita, e non
  è un errore.

## Una scelta non nasce fatta, e si fa sulla riga

- **La cassetta ha un tasto per blocco**, non uno per verso: con un tasto per
  verso la freccia nasceva scritta, e nessun bambino capiva che toccandola si
  cambiava.
- **La riga nasce col `?`** sul verso, sul posto del mattone e sul colore
  (`null`), con la scelta già aperta attaccata alla casella: la prima volta la
  si tocca proprio dove poi la si cambia.
- **I numeri nascono N, e ▶ non parte con una N dentro** — tranne i passi di
  «vai», che nascono **1**: un passo è l'unità, chiederlo era una domanda con
  la risposta ovvia.
- **Ogni casella che si cambia ha il suo ▾**; quella che ha una scelta sola
  (un colore solo nel livello) sta ferma e senza.
- **Una domanda è una frase a caselle** — «[↓ sotto i piedi] [c'è] [un
  mattone] [🌈 di qualunque colore]» — e toccandone un pezzo si apre solo la
  sua scelta. Il posto si tocca su un quadretto attorno al robot; il colore
  nasce *qualunque* e si stringe dopo.
- **Si offre tutto**: tutte le cose e tutti i colori, anche quelli che il
  robot non mette (nei nidi si mette il giallo e si guarda il rosso). Capire
  quale domanda ha senso fa parte della sfida.

## Numeri e colori, due specie di valori

- **Una misura può essere un colore** (`tipi: { tinta: 'colore' }`), **un
  ordine può portare colori** (`{ sinistra: 'verde' }`, come «lungo» porta un
  numero), e **una casella offre solo la specie giusta**.
- Nel porto c'è un valore in più, **📖 leggi** (vedi [porto.md](porto.md)).

## L'esecutore e la regia

- **L'esecutore è un generatore** che srotola il programma **un fatto per
  volta** (`riga`, `muovi`, `metti`, `entra`…), e `src/giochi/costruttore/regia.js`
  li anima.
- È così che mentre gira la riga che lavora si accende, le lavagnette
  cambiano sotto gli occhi, un ripeti dice a che giro è, e **la scheda di un
  progetto si apre con le misure di quella chiamata** («rettangolo · largo 2
  · alto 5»): la pila delle chiamate fatta vedere.

## L'ordine dei capitoli

| capitolo | cosa si impara |
|---|---|
| 🧱 Il cantiere | mettere e camminare, salire sui propri mattoni, **ripeti N volte**, la misura dell'ordine, ripeti dentro ripeti, tanti colori (la torta) |
| 👀 Guardare e decidere | **se** c'è un mattone rosso (i nidi), **se… altrimenti** (il mosaico), i buchi, il mattone di prima (le strisce), **ripeti finché** (il ponte) |
| 📐 I progetti | chiamare gli attrezzi (la cinta), il primo progetto tuo (il bosco), con una misura, con due, con un colore (le bandiere), progetti fatti di progetti (il villaggio) |
| 📝 Le lavagnette | una variabile che cresce (la scala), che cala (la piramide), che conta alla rovescia (le candeline) |
| ⚓ Il porto | leggere, aspettare, ripetere per sempre, cercare — vedi [porto.md](porto.md) |
| 🏆 Le sfide | contare camminando (il muro gemello), contare quello che si vede (conta i rossi), un se dentro un se (la scacchiera) |
| 🗺️ I posti del porto · 🌅 Le giornate | vedi [porto.md](porto.md) |
| 🔢 Mettere in ordine · 🔎 Cercare · 🧀 Le pile | vedi [algoritmi.md](algoritmi.md) |

- **Il «se» viene prima delle funzioni**: una decisione è più semplice di un
  progetto, e coi colori ha qualcosa da decidere fin da subito.
- **Il cantiere libero** si apre finito il primo capitolo (`dati/libero.js`):
  un cantiere grande, tutti i blocchi e i colori, i progetti scritti nei
  livelli da riprendere dalla cassetta. Non si vince e non paga.
