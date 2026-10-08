# Come si tocca la fattoria

I gesti sul prato, i gettoni dei campi e delle macchine, girare e rovesciare,
e le regole dei fogli. Il baule sta in [baule.md](baule.md).
Le regole del dito che valgono per tutti i giochi stanno in
[`../core/il-dito.md`](../core/il-dito.md), quelle dei fogli in
[`../core/interfaccia.md`](../core/interfaccia.md).

## Sul prato

- **Un gesto solo per tutto: si tocca una cosa propria e si vede cosa ci
  si può fare.** Toccare un cane apre la sua scheda; toccare un campo o
  una macchina fa spuntare i suoi gettoni, sul prato (sotto). Tenere premuto e
  trascinare sposta; tenere premuto sul prato apre il baule lì.
- **Trascinando contro il bordo il mondo scorre da solo**: il dito fermo
  in una fascia lungo un bordo fa scorrere verso quel lato, piano se la si
  sfiora e svelto se ci si appoggia, e la cosa resta sotto il dito. Si
  ferma dove il mondo finisce. Lo schermo di un telefono tiene meno di
  metà fattoria, e prima per portare una panchina di là bisognava posarla,
  spostare la vista e riprenderla. Il conto è puro, in `scena/spinta.js`
  (`unita/spinta-fattoria`).
- **Il baule tenuto premuto si ricorda dove**: il posto è già scelto, e
  la panchina si posa lì. Se lì non ci sta resta appesa al dito, che è il
  modo di dire «scegline un altro» senza un cartello. Aperto dal tasto in
  alto il baule non ha un posto da ricordare: si posa col tocco dopo.
- **Inviti, non rimproveri**: un 🧺 sopra un campo pronto e una macchina
  che ha finito, un 💭 sopra una bestia che ha bisogno, un 📋 sopra la
  bancarella con un ordine consegnabile; un recinto cambia faccia da sé.
  Si vedono da lontano senza aprire niente, e non succede niente se si
  ignorano.
- **Il click fantasma va ingoiato**: chi apre un pannello dal `pointerup`
  della tela riceve subito dopo un `click` sul velo appena comparso
  (`zittisciIlFantasma` in `Gioco.vue`). La prova è un tocco vero via CDP
  (`integrazione/fattoria`).

## I gettoni: semi, cesto e ricette da trascinare

Campi e macchine non aprono un foglio. Attorno alla cosa toccata spuntano
dei **gettoni** tondi, disegnati sul prato dalla tela, e un gettone si
prende e si porta dove serve, come in Hay Day. Un foglio, anche piccolo,
è un riquadro sopra il gioco: i bambini lo vivevano come un gioco
«fermo», tocca-foglio-tocca.

- **Campo vuoto → i semi** che il livello ha aperto. Un seme strisciato
  sopra dei campi vuoti li semina tutti, uno per campo attraversato: il
  campo sobbalza e fa uno sbuffo di terra.
- **Campo pronto → il cesto 🧺**: passato sopra i campi pronti li
  raccoglie; da ognuno sale «+1» e il raccolto vola verso l'angolo in alto
  dello schermo (`vola` con `aSchermo`), e il silo sobbalza.
- **Campo che cresce → una targhetta** con la barra e i minuti.
- **Macchina o recinto → le ricette**; una si trascina sopra una
  macchina dello stesso tipo e va in fila. I gettoni restano, per metterne
  un'altra. Quello che è **pronto si ritira al tocco** della macchina,
  prima che spuntino le ricette, e la merce vola in alto come il raccolto
  dei campi.
- **Toccare un gettone non fa il gesto: si guarda.** L'azione è
  trascinare, e il tocco mostra quello che serve per farlo. Una ricetta
  toccata tiene la **targhetta dei requisiti** (le caselle di cosa prende,
  cosa esce, «ne hai N», i minuti, il costo) finché non si tocca altro;
  seme e cesto dicono in una nuvoletta dove portarli («Trascinalo sui
  campi vuoti!»). Se la ricetta non si può fare, la nuvoletta dice cosa
  manca. Prima il tocco faceva il gesto da sé: chi non capiva il
  trascinamento non restava fermo, ma nemmeno lo imparava.
- **Niente numerini sopra i gettoni**: «9 e 7» non si capivano. Il «ne hai
  N» sta nella targhetta, per esteso (*mi serve?* si risponde a parole).
- **Mettere in fila**: gli ingredienti usati compaiono sopra la macchina
  col loro «-N», salgono e svaniscono (`scena.consuma`), disegnati sopra i
  gettoni. Si può lasciare la ricetta anche sulla fila sotto la macchina
  (`macchinaSotto`/`sullaFila`): i posti vuoti sembravano il buco dove
  lasciarla.
- **La fila sta sul prato, sotto la macchina**: dischetti in riga. Il
  pronto (oro, saltella) si ritira toccandolo, chi lavora ha l'anello che
  si chiude, chi aspetta è un dischetto più chiaro, i posti vuoti sono
  tratteggiati. Toccare chi lavora o aspetta dice quanto manca. **Quello
  che è in fila ci resta**, come in Hay Day: non c'è la ✕. Il motore sa
  ancora `togliDallaFila`, nessuno lo chiama a schermo. In fondo il
  **posto da comprare**: tratteggiato, col «+» e il prezzo sotto.
- **Un no lo dice una nuvoletta sulla cosa** («Il silo è pieno», «Ti manca
  1» e il sacchetto), non un avviso in cima allo schermo e mai un foglio:
  si guarda dove si è toccato. Le merci la nuvoletta le disegna col loro
  pezzo dopo la frase, mai l'emoji: il becchime è un sacchetto e la sua
  emoji 🌰 sembrava una castagna. Un gettone spento (oro se lo scomparto
  è pieno) si può toccare lo stesso, ed è così che si sa perché.
- **Il semicerchio**: i gettoni stanno su mezzo cerchio sopra la cosa,
  sotto se in cima non c'è posto, spostati tutti insieme dentro lo
  schermo. Pochi stanno stretti in cima; tanti aprono l'arco fino a mezzo
  cerchio, poi lo allargano fino alla larghezza dello schermo.
- **Le pagine**: quando i gettoni non ci stanno si girano con due tasti
  gialli con le punte doppie (« e ») sotto l'arco e i pallini della pagina
  in mezzo, come in Hay Day (`giraPagina`). Provata una freccia dentro l'arco, un ▶️ in
  un gettone: rubava un posto e si vedeva un quadrato dentro un cerchio.
  Provate anche le file a griglia: con sedici colture erano un muro di
  gettoni. Il conto è puro, in `scena/bolla.js`, e lo usano sia la tela
  sia il dito (`unita/bolla-fattoria`: mai due gettoni che si coprono).
- **Grandi** (60 px): compaiono solo dopo un tocco, e lo spazio c'è.
- **Dove lasciare il gettone si capisce da sé**: niente tratteggio sulle
  zone buone. Il gettone in mano sta sopra il dito, pende dalla parte in
  cui va, e per terra lascia un'ombra dove lavora (largo quanto il
  **piede** della cosa, non quanto il disegno: le pannocchie non contano).
- **Un tocco sul prato chiude i gettoni**, e se tocca un'altra cosa apre
  i suoi; anche pizzicare, la rotella e un foglio che si apre li chiudono.
- **Il dito che corre salta delle celle**: fra due `pointermove` il
  percorso si ricampiona a un terzo di cella, se no una strisciata svelta
  semina un campo sì e uno no.
- **Contro il bordo il prato scorre** anche col gettone in mano, come
  con una panchina (`scorriDalBordo`).
- **Voli, sbuffi, sobbalzi e nuvolette vivono nella tela** (`vola`,
  `sbuffo`, `rimbalza`, `nuvoletta`, `consuma`): chi gioca dice cosa è
  successo e dove, la tela li anima e li butta quando hanno finito.

Nei test i gettoni non sono elementi della pagina: li dice il gancio
`window.__fattoria` — `bolla()` (`{ tipo, nome }`, `tipo` fra `semina`,
`cresce`, `raccogli`, `macchina`), `gettoni()` (`{ chiave, spento, x, y }`
in pixel della pagina), `posti()` (la fila: `{ come, prezzo, x, y }`),
`fila()` (quanti pezzi), `dettaglio()` (la targhetta è aperta?),
`pagine()` (`{ pagina, totale, indietro, avanti }` o `null`), poi `strada()`,
`cappelli()` e `desideri()` ([baule.md](baule.md), [stagioni.md](stagioni.md)).
Non cambia niente: si legge e basta.

## Il bersaglio, l'aggancio, e i numeri che li tarano

- **Il bersaglio si decide alla pressione, non al rilascio**: fra i due
  momenti le bestie camminano, e chiedendo di nuovo al rilascio si
  toccherebbe quello che è rimasto sotto il dito, o niente. `bersaglio()`
  cerca in due giri: prima i bersagli esatti (la bestia dov'è disegnata,
  la cosa sulla cella dove appoggia), poi allargati — una cosa anche dove
  si *vede* (`riquadroPosa`, perché un silo alto quasi quattro celle si
  vedeva grande e si toccava solo nella striscia in basso) e una bestia
  con qualche pixel di margine (`GRAZIA = 6`). La grazia non ruba mai un
  bersaglio esatto: il primo giro vince sempre sul secondo.
- **Un bersaglio col foglio non scende mai sotto `MINIMO_TOCCO` (44 px)**:
  la misura che Android e iOS chiedono da anni per un tasto, perché alla
  scala più stretta un campo misura 32 px, meno di un polpastrello.
- **Tenere premuto aggancia** (420 ms, `ATTESA`): la cosa non si solleva
  subito, resta dov'è finché il dito non si muove (`SCARTO_DITO`,
  [`../core/il-dito.md`](../core/il-dito.md)) — a quel punto comincia il
  trascinamento. Un tocco che si stacca senza essersi mai mosso è un
  tocco, per quanto a lungo sia rimasto giù: apre le opzioni, non trascina
  niente. L'anello che segna l'attesa aspetta 180 ms prima di comparire
  (`RITARDO_ANELLO`), così un tocco normale — un centinaio di
  millisecondi — non lo fa mai vedere.
- **Il click fantasma si ingoia in due modi**: `preventDefault()` sul
  `touchend` nato sul campo toglie il click alla radice
  ([`../core/il-dito.md`](../core/il-dito.md)); dove non si può
  (`cancelable` falso) resta una rete stretta, `zittisciIlFantasma` —
  ingoia solo un click arrivato entro 100 ms e 32 px da dove il dito si è
  alzato (`FANTASMA_MS`, `FANTASMA_PX`), perché un ascolto largo si
  mangiava anche il primo click vero premuto in fretta dopo un
  trascinamento.
- **Il pannello confronta l'identità con `toRaw`**: è un `ref`, quindi
  quello che ci mettiamo dentro esce avvolto nel proxy di Vue, mai uguale
  per identità alla cosa vera in `mondo.cose`. Senza `toRaw`, «c'è
  ancora?» rispondeva sempre di no e il foglio di una macchina si
  richiudeva da solo cinque secondi dopo averlo aperto.
- **Lo scorrimento al bordo non ha un `requestAnimationFrame` suo**: usa
  il fotogramma che il gioco fa girare comunque per le bestie, perché un
  secondo orologio è uno in più da ricordarsi di spegnere. La frazione di
  pixel che avanza (meno di uno a fotogramma, a spinta docile) si tiene
  da parte invece di buttarla, se no metà della fascia non muove niente.

## Girare e rovesciare

Tenendo premuto una cosa posata escono **↻ giralo**, **⇄ rovescialo** e
**📦 mettilo via**. I primi due compaiono solo se quel pezzo li regge:
meglio niente che un tasto che fa una cosa storta.

- **Certe cose il foglio le disegna in due versi** (la staccionata
  sdraiata e il palo in piedi, la casa davanti e di dietro): ↻ cambia
  disegno, e il pezzo si porta dietro il suo ingombro ([2,1] → [1,2]).
- **Certe cose si coricano**: ↻ le ruota davvero con un `ctx.rotate` (la
  pixel art regge i novanta gradi esatti), senza copie nell'atlante. Quasi
  tutte hanno **due versi e non quattro**: niente è disegnato dallo zenit,
  e il quarto di giro sposta l'ombra di lato (l'occhio lo accetta), il
  mezzo giro la porta sopra (a gambe per aria). I quattro versi pieni sono
  solo per quello che non poggia su niente: pozza, ninfea, coccinella.
- **Quasi tutto si rovescia**: la porta del fienile dal lato sbagliato, due
  casette identiche affiancate. Lo specchio non tocca l'ingombro, quindi ⇄
  non dice mai di no per mancanza di posto.
- **Quello che no**: una casa girata cade (facciata di lato, ombra in su);
  i campi e i cartelli (vedi [campi-e-silos.md](campi-e-silos.md)).
- **Lo decide il foglietto, non il gioco**: il campo `trasforma` in
  `strumenti/sprite/FORMATO.md`, che `atlante.py` porta nel modulo
  generato. Chi ha guardato il disegno è chi scrive quel file; duecento
  righe di catalogo che lo ridicono sarebbero da tenere d'accordo per
  sempre.

## Quello che si guarda prima di scegliere

**Davanti a una scelta, quello che serve per farla dev'essere a schermo.**

- **Le ricette sono caselle, non formule**: una casella per pezzo, accesa
  se ce l'hai, tratteggiata con la figura in ombra se manca («questo ti
  manca», non «non si può»). Provato «3 → 2»: una formula si legge, e
  leggere qui non si dà per scontato. Il foglio delle ricette è largo 400
  px: a 360 la freccia andava a capo nel mezzo.
- **«Ne hai N» ovunque si sceglie**, sotto ogni coltura e ogni ricetta:
  risponde a *mi serve?*. Uno scomparto colmo lo dice **prima** di
  seminare, in oro.
- **Il nome, dove c'è un disegno accanto**: nelle schede, nel silo e nei
  consigli si scrive «foraggio» e non 🥬, perché l'emoji è un ripiego e a
  volte non somiglia alla figura. L'emoji resta dove niente la
  contraddice.
- **L'oro vuol dire pieno** (silo, carretto), mai il rosso di un rifiuto.

## I fogli

- **Ogni foglio ha la stessa ✕ in alto a destra**, appiccicata
  (`viste/Chiudi.vue`). I tasti in fondo restano **solo dove sono una
  scelta** («Lascia stare / Compra», «Chiudi / Ritira», «🎩 Vestilo / Va
  bene»); dove l'unica cosa da fare era chiudere (baule, livelli, mercato,
  albero) lo fa la ✕.
- **Ogni foglio è una colonna**: titolo e tasti fermi, l'elenco in mezzo
  si stringe e scorre (`flex: 0 1 auto; min-height: 0`), e nessuno dichiara
  un'altezza in `vh` — misura presa a occhio su un telefono solo, che su
  uno schermo basso faceva uscire il foglio dal velo con i tasti
  irraggiungibili.
- `unita/fattoria` legge i `.vue` e pretende la ✕ da ogni vista che
  dichiara `'chiudi'` fra i suoi `emits`.

Nei test: `[data-chiudi]` o `aria-label="chiudi"`, non il carattere.
