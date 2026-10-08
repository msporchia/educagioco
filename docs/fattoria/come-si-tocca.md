# Come si tocca la fattoria

I gesti sul prato, i gettoni dei campi e delle macchine, il baule, girare e
rovesciare, e le regole dei fogli.
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
  raccoglie; da ognuno sale «+1» e il raccolto vola nel suo silo, che
  sobbalza quando lo riceve.
- **Campo che cresce → una targhetta** con la barra e i minuti.
- **Macchina o recinto → le ricette**; una si trascina sopra una
  macchina dello stesso tipo e va in fila (gli ingredienti ci volano
  dentro). I gettoni restano, per metterne un'altra. Premendo una ricetta
  compare sopra l'arco una targhetta con le **caselle** di cosa prende,
  accese o in ombra. Quello che è **pronto si ritira al tocco** della
  macchina, prima che spuntino le ricette, e vola nel silo.
- **La fila sta sul prato, sotto la macchina**: dischetti in riga. Il
  pronto (oro, saltella) si ritira toccandolo, chi lavora ha l'anello che
  si chiude, chi aspetta ha la ✕ e toccato si toglie (la roba torna nel
  silo), i posti vuoti sono tratteggiati. In fondo il **posto da
  comprare**: tratteggiato, col «+» e il prezzo sotto.
- **Toccare un gettone senza trascinarlo** fa il gesto sulla cosa da cui
  si è partiti (semina quel campo, mette in fila in quella macchina): chi
  non ha ancora capito il trascinamento non resta fermo. Se c'erano altri
  campi su cui il gesto lungo avrebbe lavorato, una nuvoletta lo dice.
- **Un no lo dice una nuvoletta sulla cosa** («Il silo è pieno», «Ti manca
  2 🌾»), non un avviso in cima allo schermo e mai un foglio: si guarda
  dove si è toccato. Un gettone spento (oro se lo scomparto è pieno) si
  può toccare lo stesso, ed è così che si sa perché.
- **Il numerino** sul gettone è quanto se ne ha già (*mi serve?*).
- **Il semicerchio**: i gettoni stanno su mezzo cerchio sopra la cosa,
  sotto se in cima non c'è posto, spostati tutti insieme dentro lo
  schermo. Pochi stanno stretti in cima; tanti aprono l'arco fino a mezzo
  cerchio, poi lo allargano fino alla larghezza dello schermo. **Oltre, si
  va a pagina**: l'ultimo posto dell'arco è la freccia ▶️ col numero della
  pagina. Provate le file a griglia: con sedici colture erano un muro di
  gettoni. Il conto è puro, in `scena/bolla.js`, e lo usano sia la tela
  sia il dito (`unita/bolla-fattoria`: mai due gettoni che si coprono).
- **Grandi** (60 px): compaiono solo dopo un tocco, e lo spazio c'è.
- **Dove il gettone fa qualcosa lo dice la tela**: mentre lo si porta, i
  campi o le macchine buone hanno un tratteggio d'oro (largo quanto il
  **piede**, non quanto il disegno: le pannocchie non contano); quella
  sotto il dito si accende di verde. Il gettone in mano sta sopra il
  dito, pende dalla parte in cui va, e per terra lascia un'ombra dove
  lavora.
- **Un tocco sul prato chiude i gettoni**, e se tocca un'altra cosa apre
  i suoi; anche pizzicare, la rotella e un foglio che si apre li chiudono.
- **Il dito che corre salta delle celle**: fra due `pointermove` il
  percorso si ricampiona a un terzo di cella, se no una strisciata svelta
  semina un campo sì e uno no.
- **Contro il bordo il prato scorre** anche col gettone in mano, come
  con una panchina (`scorriDalBordo`).
- **Voli, sbuffi, sobbalzi e nuvolette vivono nella tela** (`vola`,
  `sbuffo`, `rimbalza`, `nuvoletta`): chi gioca dice cosa è successo e
  dove, la tela li anima e li butta quando hanno finito.

Nei test i gettoni non sono elementi della pagina: li dice il gancio
`window.__fattoria` — `bolla()` (`{ tipo, nome }`, `tipo` fra `semina`,
`cresce`, `raccogli`, `macchina`), `gettoni()` (`{ chiave, spento, x, y }`
in pixel della pagina), `posti()` (la fila: `{ come, prezzo, x, y }`),
`fila()`, `dettaglio()`. Non cambia niente: si legge e basta.

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

## Il baule

- **Tre metà, scelte prima di entrare**: 🌾 *La fattoria* (quello che fa
  qualcosa), 🌸 *Decorazioni* (quello che sta lì), 🐕 *Animali*. Sono tre
  tasti tondi fuori dal baule, accanto al gettone del livello, che lo
  aprono già dalla parte giusta; dentro restano come linguette. Compaiono
  solo le metà che hanno qualcosa: al primo livello c'è solo 🌾. Provato
  un 📦 solo con la scelta dentro: due gesti, e un pacco chiuso non fa
  venire in mente né una panchina né un cane.
- **Sotto «la fattoria» la linguetta è una sola, e non si mostra**: campo,
  mulino, silos, macchine e recinti sono i passi della stessa catena, e
  divisi in «Campi» e «Cortile» la fila non si vedeva. Provati anche nove
  finti campi da arredo: si posavano e non facevano niente, e sono stati
  tolti.
- **Griglia a colonne uguali**, figure grandi **in scala fra loro** su un
  ripiano: una casa si vede che è una casa. Quello che non ti puoi
  permettere dice **di quanto** («manca 🪙12»), che è il numero che rimanda
  a fare esercizi. Le cose che lavorano hanno un filo d'oro attorno.
- **Lo scaffale si scorre col dito**: toccare una carta la prende (e resta
  appesa al dito), strisciare in su o in giù scorre e non prende niente,
  strisciare di lato la tira fuori e la posa dove il dito si alza. Col
  mouse si scorre con la rotella. Su e giù è del browser (`touch-action:
  pan-y`), e un `pointercancel` vuol dire «non è successo niente».
  Provato «si prende al primo contatto» (`pointerdown`):
  una strisciata si portava via la carta, e la *comprava*. Soglie in
  `scena/dito.js`, vista `viste/Roba.vue` e `viste/Provino.vue`; lo vede
  solo un test che scorre col dito (`integrazione/campi`).

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
