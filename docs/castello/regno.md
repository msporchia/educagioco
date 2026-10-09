# Il regno: la mappa delle tappe

La schermata d'avvio del castello è una mappa dipinta: quattro isole, una per
campagna, e in mezzo il castello con le quattro partite libere. Sostituisce
l'elenco delle tappe a carte (tolto il 9 ottobre 2026: «la schermata
introduttiva è quella brutta»).

## Com'è fatta

- **Le isole sono le campagne, in giro**: il bosco in basso (si parte da lì),
  il sotterraneo sulla lava a sinistra, le mura sulla neve in alto, la palude
  a destra. Il vestito di ogni isola è quello dei campi della sua campagna
  (`VESTITO_DI` in `giochi/castello/scena/vestito.js`).
- **Cinque scudi per isola, sul sentiero**, nell'ordine di `TAPPE`, col
  colore del vestito della loro isola e **il numero in fila su tutto il
  regno** (1–20: ripartire da 1 a ogni isola non diceva la sequenza). Il
  quinto è il capo, più grande e con la corona. Niente icona della tappa
  sullo scudo: il posto la dice già. Tre ponti portano da un'isola alla dopo.
- **Al centro la terra magica**: il castello con un torrione per ogni terra,
  e su ogni torrione la sua partita libera, uno scudo d'oro con la coppa 🏆
  (provato ∞: a un bambino sembra un 8 coricato). Ogni isola ha il suo ponte
  verso il centro: l'infinito è il climax, perché le campagne il bambino le
  finisce e l'interesse deve stare lì ([libere.md](libere.md)). Si aprono
  ancora tutte insieme, a campagna finita.
- **Uno scudo dice solo lo stato**: la ✓ verde in un angolo se è fatta, il
  bordo d'oro che brilla su quella da fare, grigio se è chiusa. Il resto lo
  dice il **fumetto** (`components/Fumetto.vue`, come nelle mappe degli altri
  giochi): nome, campagna e posto, ondate e torri, il capo, il perché di un
  lucchetto, e «Gioca ▶». Una libera ci scrive il suo record.
- **Il cavaliere** (quello del sotterraneo, stesso atlante) sta sulla tappa
  da fare. Toccata una tappa aperta ci va a piedi, scudo dopo scudo — gli
  scudi stanno sul sentiero e ai capi dei ponti, quindi così resta sulla
  strada — e la vista lo segue. A un torrione ci va dalla tappa della sua
  isola per il suo ponte (`centro` nel foglietto). Dopo una tappa vinta parte da dov'era e va
  alla prossima. Dove si è fermato dura la sessione, non va nel profilo.
- **Si naviga**: la mappa è larga almeno 760 px, il doppio del telefono,
  perché si senta enorme; si trascina in tutte e due le direzioni e si apre
  sul cavaliere. La carta della ripresa ([sosta.md](sosta.md)) le galleggia
  sopra senza spingerla.
- Sulla mappa il campo non si vede: resta montato e nascosto, perché entrando
  in partita si rimisura.

## Il foglietto e lo strumento

La mappa è **un'immagine sola** di ChatGPT (`generati/regno-2.png`), fatta
da una pianta a isole coi ritagli dei quattro campi. La generazione aveva
perso due ponti fra le isole: `strumenti/sprite/regno-castello.py` li posa
copiando il ponte che c'è, girato e allungato, e stende i pezzi di sentiero
che li collegano con la terra di una radura. È una toppa, e si vede da
vicino: una mappa nuova coi ponti giusti la rende inutile (si tolgono
`ponti` e `sentieri` dal foglietto).

Tutto quello che il codice sa della mappa sta in
`strumenti/sprite/sorgenti/castello/regno.json`: i ponti, i sentieri, i
venti `posti` (in pixel della mappa) e i quattro `libere`. Lo strumento lo
copia in `src/giochi/castello/dati/regno.js` insieme all'immagine
(`codifica.py`, 1,1 MB); `--provino` disegna i posti sopra la mappa in
`tmp/regno/provino.png`. Un posto si sposta nel foglietto, poi si rilancia.

- provato con Grok: usa la pianta come ispirazione, non come forma (rifatta
  in orizzontale, castelli dappertutto); le mappe vanno a ChatGPT.
- provato a comporla in codice coi pezzi dei campi, impilando le terre:
  sembrava una pila di campi di battaglia, e le libere non avevano un posto.

Nei test: `.tappe` (la mappa è pronta), `.tap[data-tappa="<indice>"]` con
`data-stato` (`fatta`, `ora`, `aperta`, `chiusa`) e le classi omonime,
`[data-tappa="libera-bosco"]` e le altre tre chiavi, `[data-eroe]` il
cavaliere (`data-dove` la tappa o la chiave della libera, `data-in-viaggio` 1 mentre cammina),
`[data-regali]` i potenziamenti sotto il castello,
`[data-fumetto] [data-azione="gioca"]`; l'aiuto `difendi()` in
`test/aiuto/browser.mjs` tocca e gioca, `fumettoDel()` legge un fumetto.
`unita/castello-regno` tiene il modulo uguale al foglietto, un posto per
tappa e per libera, e due scudi mai uno sopra l'altro.
