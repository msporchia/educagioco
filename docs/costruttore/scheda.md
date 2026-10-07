# La scheda del robot

La schermata da cui si sceglie il livello: un circuito stampato verde scuro
che si scorre in verticale. Ogni capitolo è un chip, ogni livello un led
lungo le piste di rame, e il robot sta accanto al led da fare. Si parte dal
basso (il primo capitolo) e si sale.

![La scheda del robot](../img/costruttore-scheda.png)

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `motore/scheda.js` | dove stanno chip, led, piste, componenti sopra la pista, stelline e decoro; la strada del robot da un led a un altro o da un punto qualunque (puro, gira in Node) |
| `scena/scheda.js` | com'è fatto ogni componente, come tracciati SVG a strati; i colori |
| `viste/Scheda.vue` | la vista: SVG, i tasti sopra i led, il fumetto, il robot che viaggia e il rame che si accende |
| `scena/robot.js` | il robot come dati (`pezzi`): rettangoli, cerchi e linee in unità sue, e `dipingiRobot` che li mette su un canvas |
| `viste/Robot.vue` | lo stesso robot dentro un `<svg>`: scheda, cartello di fine livello, quadretto «attorno al robot» |
| `Gioco.vue` | decide lo stato di ogni livello, il lasciato a metà e cosa dice il cantiere libero (`livelliScheda`, `libero`) |

## La disposizione

- **Una S larga per capitolo**: ogni led si scosta dal mezzo di `A·sin`, su
  un giro intero di seno, quindi la pista parte da un lato e finisce
  dall'altro. L'ampiezza cresce con la larghezza, fino a 480 px; oltre la
  scheda resta in mezzo.
- **Le piste vanno dritte o a 45°**: fra due nodi un tratto verticale, una
  diagonale, un tratto verticale. Lo spazio fra due led è sempre più alto
  dello scarto in orizzontale, così la diagonale ci sta.
- **La strada è una sola** e passa per tutti i led nell'ordine della fila;
  dentro un chip entra dalla piazzola sotto ed esce da quella sopra.
- **Dove la diagonale fra due led è lunga, passa sotto un componente**
  (batteria a bottone, display a sette segmenti, chip DIP, a giro), con una
  via per parte. Il componente ha il fondo pieno e copre la pista; quel
  tratto si fa più alto, perché il componente non tocchi i led.
- **Il cantiere libero è un connettore a pettine in fondo**, attaccato al
  primo chip: il rame si accende quando si apre.
- **Il decoro è abbondante, verde su verde**: resistenze, condensatori,
  transistor, diodi, quarzi, induttanze, trimmer, connettori a pettine,
  sigle stampate, i bus ai bordi, i fori di montaggio. Niente rame e niente
  led: non deve sembrare da toccare, come il decoro del porto
  ([porto.md](porto.md)).
  Si piazza a caso in quello che resta libero, con un seme fisso: la stessa
  scheda a ogni apertura, alla stessa larghezza. Prima gli ostacoli (chip,
  led col posto del robot, connettore, componenti sopra la pista), poi i
  componenti grossi, poi i piccoli coi fili verso il bus, poi le vie.
- **La riga «dice» dei capitoli non si mostra più**: il chip ha nome, icona
  e «N di M livelli».

## Lo stato a colpo d'occhio

Lo decide `Gioco.vue`, la scheda lo dipinge.

| stato | come si vede |
|---|---|
| `vinto` | led acceso giallo caldo con l'alone |
| `adesso` | led chiaro con l'alone che pulsa, e il robot accanto |
| `aperto` | aperto ma non vinto (dai grandi, o saltato): bordo di rame, corpo scuro |
| `spento` | led spento, bordo opaco |

- **La corrente arriva fin dove sei**: il rame è lucido fino al led da fare,
  opaco dopo. Un chip è acceso quando la corrente l'ha raggiunto.
- **Le stelle** sono quelle del gioco, due al massimo
  ([campagna.md](campagna.md#stelle-monete-e-il-)): su un led **vinto**
  stanno anche accanto al led, due stelline (`STELLE_MAX`), piene quelle
  prese e vuote le altre; sui led aperti, da fare e spenti non ci sono.
  Il posto lo sceglie il motore (`stelline`): dalla parte opposta al robot,
  dove non passa la pista, e conta come ostacolo per il decoro. Stanno
  anche nel fumetto.
- **Lasciato a metà**: un livello non vinto il cui programma in archivio
  non è più quello con cui si comincia (`impronta` in `motore/zaino.js`,
  che non guarda gli id). Sul led c'è una matita, dalla parte opposta al
  robot, e il fumetto lo dice. Basta aprire un livello per avere un
  programma in archivio: per questo si confronta con l'inizio, non si
  guarda se c'è.

## Il fumetto

È il componente comune `src/components/Fumetto.vue`
([../core/interfaccia.md](../core/interfaccia.md#il-fumetto)).

- **Su un led aperto**: numero e nome, «Impari: …» (il campo `impara` del
  livello), le stelle, il segno del lasciato a metà, «▶ costruisci».
- **Su un led spento**: «🔒 prima il livello N» (N è quello da fare) e il
  nome, senza tasto. Chiuso per età: «per ora è chiuso».
- **Sul cantiere libero**: aperto, cosa si fa e «▶ costruisci»; chiuso,
  dopo quale livello si apre (`APRE_DOPO`).
- **Si apre al `click`**, non al `pointerup` ([../core/il-dito.md](../core/il-dito.md)),
  e toccando fuori si chiude.

## La corrente e il robot

- **Il robot sta accanto al led dove l'abbiamo lasciato**: la prima volta
  quello da fare (o l'ultimo, a fila finita), dalla parte di fuori se lì
  non passa la pista. La scheda si apre scorsa fin lì.
- **Toccato un led aperto il robot ci va**, avanti o indietro, mentre il
  fumetto si apre subito: si gioca dal suo tasto senza aspettare. Stessa
  camminata del viaggio dopo una vittoria (sparisce sotto i componenti dove
  la pista passa sotto), ma il rame non si accende né si spegne e la scheda
  non scorre: tocca a chi guarda. Un altro tocco in
  viaggio cambia meta e il robot riparte da dove si trova
  (`stradaDaPunto`); un led spento, o il cantiere libero, apre il suo
  fumetto e non muove il robot, né ferma quello che viaggia. Un tocco fuori
  non chiude il fumetto finché il robot viaggia, e toccare di nuovo il led
  della meta non fa niente. Un viaggio non dura mai più di 2,8 s, da 1 a 30
  compreso.
- **La corrente segue la partita, non il robot**: il rame è lucido fino al
  led da fare anche se il robot sta altrove (`gioco` in `ultimo`).
- **Vinto un livello che ne apre uno nuovo, il robot porta la corrente**:
  tornando alla scheda il robot è ancora dov'era; dopo 0,45 s cammina lungo
  la pista fino al posto accanto al led dopo, e il rame, i chip e i led che
  si lascia alle spalle si accendono al suo passaggio: la corrente è sua, e
  la parte già percorsa è la parte accesa. Attraversa i chip e sparisce
  sotto i componenti dove la pista passa sotto. Un viaggio dura fra 0,9 e
  2,8 s (`durataViaggio`).
- **Dove era l'ultima volta lo ricorda la sessione**, per bambino (`ultimo`
  in `Scheda.vue`), non il profilo, come il razzo degli asteroidi
  ([../asteroidi/mappa.md](../asteroidi/mappa.md#il-razzo)). Si arriva al
  livello dopo anche col tasto «avanti» del cartello, senza passare dalla
  scheda: la corrente corre la volta dopo, per tutti i led vinti nel
  frattempo.
- **A fotogrammi, e fermo a schermo nascosto**: il tempo avanza al massimo
  50 ms per fotogramma.
- **Un tocco durante il viaggio dopo una vittoria lo chiude**: un velo
  trasparente si prende il tocco, il robot arriva subito e non si apre
  niente. Il viaggio verso un led toccato non ha il velo.
- Provato: una scintilla gialla che corre davanti al robot, a portare la
  corrente: non funziona perché a schermo sembra un cane che insegue la
  palla, e nessuno la legge come corrente.
- Provato: il rame che si accende disegnato con un trattino lungo zero in
  testa a `stroke-dasharray`: col capo tondo è un puntino che resta al
  posto di partenza. L'inizio si sposta con `stroke-dashoffset`.

## Il robot

Il personaggio del gioco, e il suo nome. **Un robot fa alla lettera quello
che gli si scrive**: che da solo non faccia niente, e che sbagli quando il
programma è sbagliato, è quello che ci si aspetta da una macchina, non da
una persona. Lo dicono la guida in app e la guida del primo livello.

- **È uno solo**: i pezzi stanno in `scena/robot.js` e li dipingono la
  scheda e il cartello (SVG, `viste/Robot.vue`), il cantiere e il porto
  (canvas). Cambiarne uno è cambiarli tutti.
- **Le pose** sono tre scelte: `verso` (`fronte`, `destra`, `sinistra`,
  `retro`: il porto dall'alto lo vede di spalle quando va in su), `braccia`
  (`giu`, `avanti` verso dove guarda, `su`) e `occhi` (`aperti`,
  `spalancati`, `contenti`, `strizzati`). Il cantiere: cammina con le
  braccia avanti e i mozzi dei cingoli che girano; cade a braccia alzate e
  occhi spalancati; ha sbattuto (`fermo`) con gli occhi strizzati,
  l'antenna rossa e il «!»; vinto l'ordine fa due saltelli e resta di
  fronte, contento (`contento` nel quadro, lo scrive la regia). Nel porto
  le pinze tengono la cosa in mano.
- **I cingoli sono il suolo** (`suolo: true`): sulla scheda dondola il
  resto, loro stanno fermi.
- **L'omino che prova un passaggio resta una persona**: non esegue niente,
  è chi usa quello che il robot ha costruito.

## La guida del primo giro

Finché il primo livello non è vinto la guida comincia sulla scheda
(`guidaScheda` in `motore/guida.js`): indica il led 1, poi, col suo fumetto
aperto, «▶ costruisci». La riga col 👇 sta ferma sopra la scheda. Il
fumetto aperto lo tiene `Gioco.vue` (`v-model:aperto`), perché è lui a
sapere la guida. Dentro il livello continua quella di sempre
([../core/guida.md](../core/guida.md)).

Nei test: `unita/scheda-costruttore` (a cinque larghezze: un led per
livello e un chip per capitolo, nell'ordine; la pista una sola, dritta o a
45°, che tocca tutti i led in ordine; niente sopra niente, il decoro e il
robot fuori dalla pista; i componenti sopra la pista con le loro vie; da
ogni led il robot va al dopo, a ogni altro e indietro, e riparte da un punto della
strada; le stelline fuori dalla pista e dagli altri pezzi; la stessa scheda a ogni apertura; la guida;
l'impronta; ogni posa del robot nel suo riquadro), `integrazione/scheda-costruttore` (col dito vero: il fumetto
si apre e non parte niente, fuori si chiude, un led spento dice cosa fare
prima, il cantiere libero chiuso dice quando si apre, il segno del lasciato
a metà, vinto un livello il robot porta la corrente: il rame si accende dietro di lui e
non davanti, anche oltre un chip, e un tocco chiude il viaggio; le stelline sui vinti e non sugli altri,
col numero giusto e senza coprire robot e led; il robot va al led toccato col
fumetto già aperto, un altro tocco cambia meta, un led spento non lo muove, il rame non cambia, un
tocco fuori non chiude il fumetto in viaggio). Bersagli: la scheda
`[data-scheda-robot]` (con la classe `.cst-mappa`); i led
`[data-livello="<indice>"]` con `[data-stato="vinto"|"adesso"|"aperto"|"spento"]`
e `[data-a-meta]`; il cantiere libero `[data-libero]` con
`[data-stato="aperto"|"chiuso"]`; i chip `[data-capitolo="<chiave>"]` con
`[data-acceso]`; il fumetto `[data-fumetto]` con `[data-fumetto-per]`,
`[data-azione="costruisci"]`, `[data-serve]`, `[data-stelle]`; le stelline di
un led vinto `[data-stelle-tappa="<indice>"]` con `[data-piene]` e `[data-di]`
(e dentro `.cst-stella-piena` / `.cst-stella-vuota`); il robot
`[data-robot]` con `[data-al]` (l'indice del livello), `[data-in-viaggio]`
e `[data-visibile]`; il velo del viaggio `[data-viaggio]`; il rame acceso `[data-rame-acceso]` e, solo dopo una
vittoria e mentre il robot cammina, il pezzo che si accende `[data-scia]`; il robot
contento sul cartello di fine livello `[data-robot-contento]`
(`integrazione/costruttore`).
`costruisci(page, indice)` in `test/aiuto/browser.mjs` fa i due tocchi
(`'libero'` per il cantiere libero). La foto: `npm run scatti costruttore`.
