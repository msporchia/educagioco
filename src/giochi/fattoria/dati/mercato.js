/* ═══════════════════════════════════════════════════════════════════
   IL MERCATO: CHI ORDINA, E QUANTO RENDE UN ORDINE

   Dato puro, come tutto quello che sta in `dati/`: nessuna funzione che
   gioca, nessun `import` di motore o di Vue. Le regole — quali merci si
   possono chiedere, quando arriva un ordine nuovo — stanno in
   `motore/mercato.js`.

   ── PERCHÉ IL MERCATO ESISTE ──────────────────────────────────────
   Quello che la fattoria produce lo mangiavano solo il cane e il gatto,
   e una ciotola è un consumo che si vede una volta: raccolto il grano,
   fatto il mangime, riempita la pancia, la catena si ferma lì e il silo
   torna a riempirsi. Mancava **qualcuno che chiedesse**, cioè l'unica
   cosa che trasforma un magazzino in una fattoria: «tre grano e due
   uova» è un obiettivo che si legge in due secondi e che dice da solo
   cosa seminare.

   ── E PERCHÉ NON PAGA MONETE ──────────────────────────────────────
   Questo è **il numero più importante del file, ed è zero**. In un
   gioco di fattoria un ordine si paga in monete; qui no, e non è una
   dimenticanza.

   La regola che tiene in piedi tutta l'applicazione sta in
   `dati/coltivazioni.js` e in [`CALIBRAZIONE.md`](../../../../CALIBRAZIONE.md):
   **niente si vende, il verso è sempre monete → cose.** Le monete si
   guadagnano facendo esercizi negli altri giochi e si bruciano qui. Un
   mercato che pagasse il grano chiuderebbe l'anello — semina gratis,
   raccogli per 🪙1, vendi per 🪙5 — e da quel momento la strada più
   corta per le monete non passerebbe più da nessuna tabellina. È lo
   stesso motivo per cui sgomberare il bosco costa e non rende, e per
   cui il carretto del vicino scambia roba con roba e mai con monete.

   Quindi un ordine paga **esperienza**: fa salire il livello della
   fattoria, che apre il catalogo. Il livello era «le monete spese qui
   dentro» e adesso ha una seconda sorgente — il perché del cambio sta
   in `dati/livelli.js`, sotto ESPERIENZA.

   ── QUANTO RENDE ──────────────────────────────────────────────────
   Un ordine rende `PREMIO_BASE` più, per ogni pezzo, **i gesti che ci
   sono voluti** — raccolti più lavorazioni, lungo la strada più corta
   (`gestiDi`) — per `PER_GESTO`, con un bonus di `BONUS_FASE` per ogni
   fase oltre la prima (`profonditaDi`). Cioè:

     3 🌾 grano                  6 + 3·2              =  12
     2 🥣 mangime + 2 🌾 grano   6 + 2·7,2 + 2·2      =  24
     3 🌾 grano + 2 🥚 uova      6 + 3·2 + 2·14       =  40
     3 🍄 tartufi                6 + 3·19,6           =  65
     1 🎂 torta                  6 + 2·18·1,8         =  71

   *Ribalta la scelta di prima.* Il premio era `6 + 4·valoreDi`, cioè
   quello che la roba era costata **in monete** — e un raccolto costa
   🪙1 mentre una lavorazione 🪙0–2, quindi il lavoro di trasformare
   quasi non contava, e ogni ricetta che prende due pezzi per farne uno
   raddoppiava il lavoro senza raddoppiare il premio. Misurato: ⭐10–14
   per gesto su un raccolto crudo, ⭐3,7 su un maglione alla lavanda. La
   mossa giusta era rifiutare la torta e aspettare il grano: il
   contrario di un gioco di fattoria, dove la catena lunga è quella che
   vale. Adesso, a parità di gesti, la catena lunga rende un po' di più
   — da ⭐2 a ⭐4 per gesto (`docs/fattoria-albero.md` §8.2).

   **E in media non rende di più di prima**, ed è voluto. Il primo giro
   aveva `PER_GESTO = 3`, e un raccolto portato al banco rendeva il
   20–30% in più di prima; sopra ci sono le botteghe (+25%), i bonus
   della mongolfiera e la fila nelle macchine, che fa lavorare di più.
   Tutto insieme la fattoria sarebbe salita di livello molto più in
   fretta, cioè sarebbe arrivata roba nuova prima di aver giocato con
   quella che c'era. A 2 il banco da solo rende un po' meno di prima
   (⭐6 per raccolto contro 7), e con botteghe e mongolfiera si torna
   alla media di prima. Cambia **dove** sta l'esperienza, non quanta.

   Il metro è quello di sempre: 🪙1 = dieci secondi di esercizio, 🪙6 =
   un minuto. **Un ordine non rende mai più di quanto costa il tempo di
   produrlo** — il conto è `premio ≤ 🪙6·minuti` (`minutiDi`), e
   `guastiDelMercato()` diventa rosso se una tabella ritoccata lo
   rompesse. È il freno che impedisce al mercato di diventare la
   scorciatoia per salire di livello senza fare esercizi: il livello
   resta tempo, che sia tempo di studio o tempo di fattoria.

   Un ordine **non regala mai monete** e non toglie mai niente oltre
   alla merce che chiede: consegnare non può far male.
   ═══════════════════════════════════════════════════════════════════ */
import { COLTURE, RICETTE, PRODOTTI, PROFONDITA, profonditaDi } from './coltivazioni.js'
import { livelloDelProdotto } from './livelli.js'

/* ── CHI ORDINA ───────────────────────────────────────────────────
   Mestieri, non nomi propri: «il fornaio» dice da solo perché vuole del
   grano, e un nome di persona non direbbe niente. Sono la parte del
   mercato che si ricorda — un bambino racconta che «è arrivato il
   pasticcere», non che ha consegnato due uova. */
/* ── E `vuole` DICE PERCHÉ È VENUTO LUI ───────────────────────────
   Il cliente era **una faccia pescata a caso**, e con sette merci non
   si notava; con ventidue sì — il pizzaiolo che chiede la lana e la
   sarta che chiede i pomodori sono la cosa che fa sembrare il banco
   una lotteria invece di un mercato. Adesso la merce si pesca per
   prima e **il cliente si sceglie fra quelli a cui quella roba
   serve** (`clientiPer`, e il gesto sta in `motore/mercato.js`).

   `vuole` è un **restringimento, non un elenco di compiti**: chi non
   lo dichiara prende di tutto, ed è giusto che ce ne siano — la nonna
   e il bottegaio comprano quello che c'è, e senza di loro una merce
   dimenticata da tutti non la chiederebbe più nessuno. */
export const CLIENTI = [
  { id: 'fornaio',     nome: 'Il fornaio',     emoji: '🥖',
    vuole: ['grano', 'uova', 'latte', 'patate', 'farina', 'pane', 'biscotti'] },
  { id: 'pasticcera',  nome: 'La pasticcera',  emoji: '🧁',
    vuole: ['uova', 'latte', 'fragole', 'miele', 'merenda', 'burro', 'torta',
            'crostata', 'biscotti', 'gelato', 'frullato', 'marmellata',
            'caramelle', 'zucchero'] },
  { id: 'nonna',       nome: 'La nonna',       emoji: '👵' },
  { id: 'cuoco',       nome: 'Il cuoco',       emoji: '👨‍🍳',
    vuole: ['tartufi', 'patate', 'melanzane', 'peperoni', 'cavolfiori', 'aglio',
            'formaggio', 'burro', 'minestrone', 'conserva', 'salsa',
            'pasta', 'lasagne', 'fritto', 'arancini'] },
  { id: 'maestra',     nome: 'La maestra',     emoji: '🍎',
    vuole: ['fragole', 'carote', 'latte', 'uova', 'merenda', 'pane', 'torta',
            'crostata', 'succo', 'biscotti', 'frullato'] },
  { id: 'bottegaio',   nome: 'Il bottegaio',   emoji: '🏪' },
  { id: 'veterinaria', nome: 'La veterinaria', emoji: '🩺',
    vuole: ['mangime', 'pastone', 'becchime', 'foraggio', 'beverone', 'pastura'] },
  { id: 'giardiniere', nome: 'Il giardiniere', emoji: '🌻',
    vuole: ['concime', 'fiori', 'zucche', 'lavanda', 'fieno'] },
  /* Il bidello è il secondo cliente della mensa (`dati/catalogo.js`,
     le botteghe del paese): porta in tavola la merenda che la maestra
     non chiede — il minestrone, la pasta, il gelato del giovedì — e
     col sapone tiene pulita la scuola, che è il suo mestiere vero e
     il modo di farlo passare anche al banco. */
  { id: 'bidello',     nome: 'Il bidello',     emoji: '🧹',
    vuole: ['pane', 'succo', 'latte', 'minestrone', 'pasta', 'biscotti',
            'gelato', 'sapone'] },
  /* I quattro mestieri dell'orto. Sono qui perché una merce nuova
     senza nessuno che la chieda per mestiere finisce sempre in mano al
     bottegaio, che è il modo di dire «non ci ho pensato». */
  { id: 'pizzaiolo',   nome: 'Il pizzaiolo',   emoji: '🍕',
    vuole: ['pomodori', 'cipolle', 'aglio', 'melanzane', 'peperoni', 'grano',
            'salsa', 'farina', 'pizza'] },
  { id: 'fruttivendola', nome: 'La fruttivendola', emoji: '🥕',
    vuole: ['pomodori', 'patate', 'cipolle', 'cavolfiori', 'carote', 'fragole',
            'zucche', 'mais', 'barbabietola'] },
  { id: 'apicoltore',  nome: 'L\'apicoltore',  emoji: '🐝',
    vuole: ['miele', 'fiori', 'cipolle'] },
  { id: 'sarta',       nome: 'La sarta',       emoji: '🧵',
    vuole: ['lana', 'stoffa', 'maglione', 'maglione_lavanda', 'sacchetto',
            'sciarpa_lana', 'berretto'] },
  /* L'oste vuole quello che si mette in tavola: è il mestiere che
     tiene il pane fuori dalle mani del solo fornaio. */
  { id: 'oste',        nome: 'L\'oste',        emoji: '🍽️',
    vuole: ['pane', 'tartufi', 'uova', 'latte', 'formaggio', 'polenta',
            'minestrone', 'salsa', 'pizza', 'lasagne', 'patatine', 'arancini'] },
  /* La lavandaia è il mestiere della tintoria, e **non chiede solo il
     sapone**: prende anche la lavanda cruda e la stoffa, che è il modo
     di dare un banco a chi la tintoria non ce l'ha ancora. */
  { id: 'lavandaia',   nome: 'La lavandaia',   emoji: '🧼',
    vuole: ['sapone', 'lavanda', 'stoffa', 'sacchetto'] },
  /* Il settimo mestiere dell'albero nuovo, per la catena che nessun
     altro cliente citava: riso e pesce sono crudi da consegnare, sushi
     e maki sono la bottega che li chiude. */
  { id: 'sushi',       nome: 'Il cuoco del sushi', emoji: '🍣',
    vuole: ['riso', 'pesce', 'sushi', 'maki'] },
]

export const clienteDi = id => CLIENTI.find(c => c.id === id) || CLIENTI[0]

/* Chi può venire a chiedere questa roba. Chi non dichiara `vuole`
   c'è sempre; se nessuno la vuole ci sono tutti, perché un ordine
   senza cliente sarebbe un posto vuoto al banco — un `vuole`
   dimenticato deve costare una faccia sbagliata, non un ordine in
   meno. */
export function clientiPer(chiede) {
  const merci = Object.keys(chiede || {})
  const suoi = CLIENTI.filter(c => !c.vuole || c.vuole.some(p => merci.includes(p)))
  return suoi.length ? suoi : CLIENTI
}

/* ── QUANTI ORDINI ALLA VOLTA ─────────────────────────────────────
   Tre, e non uno né dieci. Uno solo vuol dire che chi non ha quello
   che serve non può fare niente e chiude; dieci sono un elenco da
   leggere, e questo gioco lo apre anche chi non legge. Tre stanno in
   uno schermo verticale senza scorrere, e fra tre ce n'è quasi sempre
   uno che si può cominciare adesso. */
export const POSTI = 3

/* Quante merci diverse può chiedere un ordine, e quanti pezzi di
   ognuna. I numeri sono piccoli apposta: «tre grano» si conta sulle
   dita, ed è la stessa ragione per cui un campo rende **uno** e una
   ricetta ne chiede due (vedi `RESA` in `dati/coltivazioni.js`). Tre
   pezzi stanno anche nello scomparto più piccolo, che ne tiene otto:
   un ordine impossibile da tenere in magazzino sarebbe un ordine che
   si può solo rifiutare. */
export const MERCI_MAX = 3
export const PEZZI_MAX = 3

/* Quanto aspetta un posto **rifiutato** prima che ci arrivi un ordine
   nuovo. Consegnare invece riempie subito: sono due gesti diversi e
   devono costare diverso, se no si scorre finché esce quello facile —
   che è il modo di trasformare il mercato in una slot machine. Cinque
   minuti è il tempo di un campo di grano: chi rifiuta torna a
   coltivare, non aspetta guardando. */
export const RIPOSO_MIN = 5

/* ── IL PREMIO ────────────────────────────────────────────────────
   Il ragionamento sta in testa al file. `PREMIO_BASE` è il disturbo di
   portare la roba al banco (uguale per tutti gli ordini), `PER_GESTO`
   quanto vale un raccolto o una lavorazione, `BONUS_FASE` quanto in
   più vale ogni passaggio della catena oltre il primo. */
export const PREMIO_BASE = 6
export const PER_GESTO = 2
export const BONUS_FASE = 0.2

/* 🪙6 = un minuto di esercizio (`CALIBRAZIONE.md`): è il cambio con cui
   si controlla che un ordine non renda più del tempo che chiede. */
export const MONETE_AL_MINUTO = 6

/* ── QUANTO È COSTATA, E QUANTO CI È VOLUTA ───────────────────────
   Due conti che **risalgono la catena da soli**, come fa
   `livelloDelProdotto` in `dati/livelli.js`: un uovo non sa di essere
   fatto di grano, lo sanno le ricette.

   Si prende sempre **la strada più economica** (e la più svelta): il
   foraggio si fa dalle carote o dall'erba medica, e chi ha l'erba lo
   fa in meno tempo — il premio deve valere per chi lo produce meglio,
   se no chi ha aspettato viene pagato di più per la stessa roba.

   I due conti rifanno esatti i numeri della tabella in
   [`docs/fattoria.md`](../../../../docs/fattoria.md) — mangime 🪙3 e
   ~14 min, uovo 🪙5 e ~36, pastone 🪙7 e ~30, tartufo 🪙9 e ~72 — che è
   il modo di sapere che non si sono inventati. */
const menoDi = (a, b) => (a < b ? a : b)

/* `giri` è `PROFONDITA` di `dati/coltivazioni.js`, e non un numero
   scritto qui: era 5, e il maglione alla lavanda — sei fasi — sarebbe
   valso `Infinity`, cioè premio base e «non si produce in nessun modo». */
export function valoreDi(prodotto, giri = PROFONDITA) {
  if (giri <= 0 || !PRODOTTI[prodotto]) return Infinity
  let min = Infinity
  for (const c of COLTURE)
    if (c.da === prodotto) min = menoDi(min, (c.semina || 0) + (c.raccolta || 0))
  for (const r of RICETTE) {
    if (r.da !== prodotto) continue
    let n = r.costo || 0
    for (const [k, q] of Object.entries(r.prende || {})) n += q * valoreDi(k, giri - 1)
    min = menoDi(min, n)
  }
  return min
}

export function minutiDi(prodotto, giri = PROFONDITA) {
  if (giri <= 0 || !PRODOTTI[prodotto]) return Infinity
  let min = Infinity
  for (const c of COLTURE) if (c.da === prodotto) min = menoDi(min, c.minuti || 0)
  for (const r of RICETTE) {
    if (r.da !== prodotto) continue
    let n = r.minuti || 0
    for (const [k, q] of Object.entries(r.prende || {})) n += q * minutiDi(k, giri - 1)
    min = menoDi(min, n)
  }
  return min
}

/* Quanti gesti ci vogliono, al minimo, per avere **un** pezzo: un
   raccolto è un gesto, una ricetta è un gesto più i gesti dei suoi
   ingredienti moltiplicati per quanti ne prende. È il lavoro vero, e
   lo paga il premio: il costo in monete no, perché i gesti costano
   quasi tutti uguale e la differenza fra una torta e un grano sta nel
   numero di volte che si è toccato lo schermo. */
export function gestiDi(prodotto, giri = PROFONDITA) {
  if (giri <= 0 || !PRODOTTI[prodotto]) return Infinity
  let min = Infinity
  for (const c of COLTURE) if (c.da === prodotto) min = menoDi(min, 1)
  for (const r of RICETTE) {
    if (r.da !== prodotto) continue
    let n = 1
    for (const [k, q] of Object.entries(r.prende || {})) n += q * gestiDi(k, giri - 1)
    min = menoDi(min, n)
  }
  return min
}

/* Quanto rende **un pezzo** di questa merce, senza la base dell'ordine.
   Sta a parte perché la mongolfiera e le botteghe pagano pezzo per
   pezzo, e il conto dev'essere lo stesso del banco. */
export function premioDelPezzo(prodotto) {
  const g = gestiDi(prodotto), f = profonditaDi(prodotto)
  if (!Number.isFinite(g) || !Number.isFinite(f)) return 0
  return PER_GESTO * g * (1 + BONUS_FASE * (f - 1))
}

/* ── QUANTO COSTA **UNA** STRADA, E QUAL È LA MIGLIORE ────────────
   `valoreDi` e `minutiDi` dicono quanto costa una *merce* per la
   strada più economica. Queste due dicono quanto costa **quella
   ricetta lì**, e servono a scegliere fra due strade aperte per la
   stessa merce: la lana esce dall'ovile (1 foraggio, 8 min), dalla
   conigliera (2 foraggi, 14 min) e dal recinto degli alpaca (1
   foraggio, 5 min).

   Stanno qui, e non nei due file che le usano, perché **devono
   ordinare allo stesso modo**. Il consiglio le ordinava in ordine di
   tabella e l'albero per costo, e a schermo veniva fuori una colonna
   che diceva «Recinto degli alpaca · 🪙330» con sotto un tasto che
   apriva il baule sull'ovile: la riga mostrava una macchina e il suo
   tasto ne comprava un'altra. Nessun errore, e nessun test poteva
   vederlo — le due regole coincidono finché una sola delle tre
   ricette è arrivata col livello, e la terza arriva al 41.

   `megliaDi` è il confronto intero: **prima quella di cui hai già gli
   ingredienti** (chi ha due fieni in mano non va mandato a comprare
   per l'altra strada), poi la più economica, poi la più svelta. */
export const costoDellaRicetta = r =>
  Object.entries(r.prende || {}).reduce((n, [k, q]) => n + q * valoreDi(k), r.costo || 0)
export const minutiDellaRicetta = r =>
  Object.entries(r.prende || {}).reduce((n, [k, q]) => n + q * minutiDi(k), r.minuti || 0)
export const megliaDi = haTutto => (a, b) =>
  (haTutto(b) - haTutto(a))
  || (costoDellaRicetta(a) - costoDellaRicetta(b))
  || (minutiDellaRicetta(a) - minutiDellaRicetta(b))

/* Quanto rende un ordine, dato quello che chiede (`{ prodotto: n }`).
   Sta qui e non nel motore perché è **un numero della tabella**: chi
   ritocca l'economia lo ritocca leggendo il ragionamento in testa al
   file, non frugando dentro le regole. */
export function premioPer(chiede) {
  let pezzi = 0
  for (const [k, n] of Object.entries(chiede || {})) pezzi += n * premioDelPezzo(k)
  return Math.round(PREMIO_BASE + pezzi)
}

/* ── QUALE MERCE SI CHIEDE ────────────────────────────────────────
   La pesca era **uniforme** fra tutte le merci ottenibili, e al livello
   52 sono quarantacinque: metà colture e mangimi a un passo. Le merci
   profonde — quelle che tengono impegnati, e che adesso rendono di più
   — uscivano di rado, e quelle appena arrivate si perdevano nel mucchio
   proprio quando sono la novità.

   Adesso ogni merce ha un peso: mezzo punto per ogni fase oltre la
   prima, e due punti se è arrivata negli ultimi `NOVITA` livelli. Un
   grano pesa 1, una torta 3, la pasta appena sbloccata 4,5. Il crudo
   continua a uscire — è l'ordine che si fa subito, e serve — ma non è
   più metà del banco. */
export const NOVITA = 6
export function pesoDellaMerce(prodotto, livello) {
  const f = profonditaDi(prodotto)
  const nuova = livelloDelProdotto(prodotto) > Math.max(1, livello | 0) - NOVITA
  return 1 + 0.5 * (Math.max(1, Number.isFinite(f) ? f : 1) - 1) + (nuova ? 2 : 0)
}

/* Quanti minuti veri costa produrre quello che un ordine chiede, con
   **un campo e una macchina sola**: è il tetto contro cui si misura il
   premio, e il numero che il foglio scrive sotto l'ordine («ci vuole
   circa mezz'ora»). Chi ha tre campi ci mette un terzo, ed è il motivo
   per cui il secondo campo è la spesa che cambia di più la giornata. */
export function minutiPer(chiede) {
  let m = 0
  for (const [k, n] of Object.entries(chiede || {})) m += n * minutiDi(k)
  return Number.isFinite(m) ? m : 0
}

/* ── COSA SI PUÒ CHIEDERE A UN CERTO LIVELLO ──────────────────────
   Non c'è nessun elenco a mano: una merce si può ordinare quando è
   **ottenibile**, e quando lo diventa lo sa già `livelloDelProdotto`
   (la prima coltura che la fa, o la prima ricetta contando la macchina
   e gli ingredienti). Scriverlo due volte vorrebbe dire un mercato che
   chiede zucche a chi le vedrà fra ventimila monete — la stessa
   promessa che non si può mantenere che il carretto del vicino evita
   allo stesso modo. */
export const merciDelLivello = livello =>
  Object.keys(PRODOTTI).filter(p => livelloDelProdotto(p) <= Math.max(1, livello | 0))

export function guastiDelMercato() {
  const g = []
  if (!CLIENTI.length) g.push('nessun cliente: il mercato sarebbe vuoto')
  const visti = new Set()
  for (const c of CLIENTI) {
    if (visti.has(c.id)) g.push(`il cliente ${c.id} c'è due volte`)
    visti.add(c.id)
    if (!c.nome || !c.emoji) g.push(`il cliente ${c.id} è senza nome o senza faccia`)
    /* Una merce che non esiste dentro un `vuole` non dà nessun errore:
       fa solo sì che quel cliente non venga mai per quella roba, ed è
       invisibile — un mestiere che non compare più al banco senza che
       niente sia cambiato a schermo. */
    for (const p of c.vuole || [])
      if (!PRODOTTI[p]) g.push(`${c.id}: vuole «${p}», che non è una merce`)
    if (c.vuole && !c.vuole.length)
      g.push(`${c.id}: dichiara un «vuole» vuoto — non verrebbe mai`)
  }
  /* Almeno un cliente che prende di tutto: è quello che garantisce che
     ogni merce trovi qualcuno anche quando nessuno la chiede per
     mestiere. Senza, `clientiPer` cadrebbe sempre sul ripiego — cioè
     su tutti — e il mestiere non direbbe più niente. */
  if (!CLIENTI.some(c => !c.vuole))
    g.push('nessun cliente prende di tutto: una merce dimenticata non la chiederebbe nessuno')
  if (!(POSTI >= 2 && POSTI <= 4)) g.push('gli ordini aperti non sono due o tre')
  if (!(RIPOSO_MIN > 0)) g.push('rifiutare non fa aspettare: si scorrerebbe fino al facile')
  /* ── UN ORDINE NON RENDE PIÙ DEL TEMPO CHE COSTA ────────────────
     Il freno scritto in testa al file, controllato merce per merce sul
     caso peggiore (un ordine di soli pezzi di quella merce). Se un
     giorno una coltura diventasse istantanea o una ricetta gratis,
     questo diventa rosso prima che qualcuno se ne accorga giocando. */
  for (const p of Object.keys(PRODOTTI)) {
    const v = valoreDi(p), m = minutiDi(p)
    if (!Number.isFinite(v) || !Number.isFinite(m)) {
      g.push(`nota: ${p} non si produce in nessun modo`)
      continue
    }
    if (!(m > 0)) g.push(`${p} si produce in zero minuti: il tetto del premio non tiene`)
    const reso = premioPer({ [p]: PEZZI_MAX })
    const tempo = MONETE_AL_MINUTO * m * PEZZI_MAX
    if (reso > tempo)
      g.push(`${PEZZI_MAX} ${p} rendono ${reso} e costano ${tempo} di tempo: troppo`)
    /* E niente si può chiedere in quantità che non ci sta in uno
       scomparto appena costruito: sarebbe un ordine da rifiutare
       sempre. Otto è `SCOMPARTO_BASE`, e il controllo è qui perché il
       numero da correggere sarebbe `PEZZI_MAX`. */
    if (PEZZI_MAX > 8) g.push('un ordine chiede più di quanto tenga uno scomparto')
  }
  return g
}
