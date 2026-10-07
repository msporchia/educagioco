# Passo passo — la mappa delle isole

La schermata da cui si sceglie la tappa: isole una sotto l'altra, una per
scalino, collegate da ponti e da tane, e un segnalino che salta da una
casella all'altra. Il modello è la rotta degli asteroidi
([../asteroidi/mappa.md](../asteroidi/mappa.md)): la mappa sa dove sta ogni
cosa, il gioco le dice in che stato è ogni tappa. Chi apre cosa sta in
[livelli.md](livelli.md#le-due-strade).

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `motore/strade.js` | le due strade dai dati, cosa apre cosa, il ▶ e la tappa di adesso (puro) |
| `scena/isole.js` | dove cade ogni isola, casella, tana, bivio e ponte; la strada del segnalino e i suoi salti; le cose sparse (puro) |
| `viste/Mappa.vue` | il disegno (SVG sotto, caselle e cartelli in HTML sopra), il segnalino, il fumetto, il dito |
| `viste/Coniglio.vue`, `viste/Cane.vue` | i due animali a forme piatte |
| `Gioco.vue` | lo stato di ogni casella (`voci`), cosa dice una chiusa, dove sta il segnalino |

## Le isole

- **Una per scalino, una sotto l'altra**; la mappa scorre in verticale
  (`touch-action: pan-y`). Le caselle girano a serpente, quattro per riga
  sul telefono (tre sotto i 340 px), e la strada fa la curva oltre l'ultima.
- **La strada maestra è del coniglio**: da un'isola del coniglio alla dopo
  si passa su un ponte di assi, dalla parte dove la riga è finita. In fondo
  c'è il sentiero senza fine, un'isola tonda e d'oro.
- **I rami del cane stanno nello spazio dopo l'isola della loro tana**,
  dalla parte opposta al ponte: il pascolo dopo le buche (largo, undici
  caselle), un'isoletta di tre caselle dopo ripeti, fino a, se e tutto il
  mondo (le tappe in coda, [livelli.md](livelli.md#le-tappe-in-coda)). Il
  ponte del coniglio ci passa accanto, mai sopra — tranne sotto i 340 px,
  dove oggi un'isoletta di tre caselle è larga quanto la riga e il ponte
  ci passa sopra (`unita/passo-passo-isole` lo dice a 320 px).
- **Ogni isola ha il suo vestito** (`VESTITI` in `scena/isole.js`, solo
  disegno): prato, orto coi solchi, stagno con la pozza, ghiaccio con le
  crepe; quelle del cane sono pascoli con lo steccato. Il nome dello scalino
  sta su un cartello in cima all'isola, dalla parte dove la prima riga non
  comincia; un isolotto ha solo l'icona della sua carta.
- **Colori piatti, niente sfumature**: il mare è il fondo della copertina
  in home (`#f29e5c`), le caselle hanno lo spessore del suo disegno
  (`#e07d3a`). Le cose sparse (fiori, ciuffi, canne, cristalli) cadono dove
  non c'è una casella, la strada o il cartello, col caso fisso sulla
  posizione: la stessa mappa a ogni apertura.

## Le tane e i bivi

- **Fra due isole di animali diversi c'è una tana per parte**, una sopra
  l'altra: quella del coniglio sul bordo di sotto della sua isola, in capo a
  un ramo di strada; quella del cane in cima al pascolo. Il tunnel sotto il
  mare è una fila di puntini.
- **Il ramo parte dall'ultima casella se la tana è la fine dell'isola** (le
  buche: il bivio è proprio lì), se no dalla casella più vicina dell'ultima
  riga.
- **Il bivio è un paletto con due assi**: 🐇 con la freccia verso il ponte,
  🐕 con la freccia verso la tana. Sta dove non copre niente.
- **Una tana chiusa ha il sasso davanti**: è chiusa finché nessuna casella
  del suo ramo è aperta.

## Il segnalino

- **Sulle isole del coniglio salta il coniglio, su quelle del cane il cane**:
  l'animale è quello dell'isola dove sta.
- **Toccando una casella aperta ci va**, sulla strada più corta della mappa
  (`percorso`): di casella in casella fino a cinque salti, oltre un balzo
  solo. Se la casella è su un'isola dell'altro animale va alla tana, ci
  sparisce dentro, e dall'altra parte sbuca l'altro animale, che salta fino
  alla casella. Il fumetto non aspetta l'arrivo: compare subito sopra la
  casella toccata, e «gioca» si può premere anche a viaggio in corso.
- **Un altro tocco durante il viaggio** porta il fumetto sulla nuova tappa
  e cambia la meta, da dove il segnalino è atterrato (finisce il salto che
  stava facendo). Un tocco fuori chiude il fumetto e il viaggio finisce.
- **Su una chiusa non va**: il fumetto subito, e dice cosa manca.
- **All'apertura sta sulla tappa di adesso** (`tappaDiAdesso` in
  `motore/strade.js`): l'ultima giocata se non è vinta, se no quella dopo
  come col ▶; non restando niente, il sentiero. La mappa si apre scorrendo
  fino a lui.
- **Dove si era fermato lo ricorda la sessione**, per bambino (`ultimo` in
  `Mappa.vue`), non il profilo: tornando con una tappa di adesso nuova parte
  da dov'era e ci va, anche passando da una tana.
- **A fotogrammi, fermo a schermo nascosto** (al massimo 50 ms per
  fotogramma). Non rincorre con lo scorrimento chi è lontano fuori dallo
  schermo: si guarda il fumetto.

## Il fumetto

- **Toccando una casella compare un fumetto sopra di lei** (e sopra
  l'animale, se ci è seduto), con la coda che la indica: lo scalino (e «col
  cane»), il nome, il racconto, le quattro stelle e «gioca» (o «continua» se
  c'è una fila a metà). Mai un foglio dal basso. In cima alla mappa, dove
  sopra non c'è posto, va sotto.
- **Su una chiusa dice cosa manca, senza tasto** (`cosaManca`): «Prima tocca
  a «X», poi ad altre N tappe», e per il cane «si apre quando il coniglio
  impara 🔁 («Il viale»)» o «finisce «Le buche»»; chiusa dall'età, «Questa
  tappa per ora è chiusa».
- **Resta fermo e sopra il segnalino** (`z-index` più alto) mentre quello
  viaggia; sta sopra la meta come se l'animale ci fosse già seduto.
- **Si apre al `click`, non al `pointerup`**, e una strisciata oltre 16 px
  (o la mappa che scorre di tanto) non apre niente
  ([../core/il-dito.md](../core/il-dito.md)). Toccando fuori si chiude.
- **Si vede tutto**: se sborda, la mappa scorre quanto basta.

## Lo stato a colpo d'occhio

| stato | come si vede |
|---|---|
| `fatta` | la casella bianca con la sua icona e le stelle prese |
| `ora` | un anello d'oro che respira, e il segnalino sopra |
| `aperta` | la casella bianca, stelle spente |
| `chiusa` | color pesca, col lucchetto |

Una casella con una fila a metà ha la ✏️ ([sosta.md](sosta.md)). Un'isola
con tutte le caselle chiuse non è ancora raggiunta: è velata. La partita a
metà del sentiero (`Ripresa.vue`) sta ferma in cima, sopra lo scorrimento.

Nei test: `unita/passo-passo-isole` (a cinque larghezze: caselle nello
schermo e nella loro isola, isole che non si toccano, il ponte che non
passa sopra il cane, il bivio che non copre niente, il coniglio che resta
coniglio sulla sua strada e diventa cane solo da una tana),
`integrazione/passo-passo-mappa` (col dito vero). Bersagli: la mappa
`[data-mappa]`, lo scorrimento `[data-isole]`; le isole
`[data-isola="<chiave>"]` con `[data-animale="coniglio"|"cane"]` e
`[data-velata="1"|"0"]`; le caselle `[data-tappa="<indice>"|"senza-fine"]`
con `[data-stato]` e `[data-strada="coniglio"|"cane"]`, la matita
`[data-a-meta]`; i cartelli `[data-insegna]` (con `[data-scalino]`); le tane
`[data-tana="<id>"]` con `[data-aperta]`; i bivi `[data-bivio]` con
`[data-ramo]` e le assi `[data-verso="coniglio"|"cane"]`; il segnalino
`[data-segnalino]` con `[data-animale]`, `[data-al]` e `[data-in-viaggio]`;
il fumetto `[data-fumetto]` con
`[data-fumetto-per]`, `[data-azione="parti"]` e `[data-serve]`.
`giocaSullIsola(page, indice)` in `test/aiuto/browser.mjs` aspetta il
segnalino fermo (per non far scorrere la casella sotto il click) e fa i due tocchi; `statoSullIsola` legge lo stato.
