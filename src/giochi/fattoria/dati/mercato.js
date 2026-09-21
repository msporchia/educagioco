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
   Un ordine rende `PREMIO_BASE` più `PER_VALORE` volte quello che la
   roba è **costata a produrre in monete** (`valoreDi`, che risale la
   catena da sola). Cioè:

     3 🌾 grano                  6 + 4·3  =  18
     2 🥣 mangime + 2 🌾 grano   6 + 4·8  =  38
     3 🌾 grano + 2 🥚 uova      6 + 4·13 =  58
     3 🍄 tartufi                6 + 4·27 = 114

   Il metro è quello di sempre: 🪙1 = dieci secondi di esercizio, 🪙6 =
   un minuto. Un ordine da 18 vale tre minuti di esercizi e chiede
   quindici minuti veri di campo (`minutiDi`); uno da 114 ne chiede più
   di tre ore. **Non rende mai più di quanto costa il tempo di
   produrlo** — il conto è `PER_VALORE·valore ≤ 🪙6·minuti`, e
   `guastiDelMercato()` diventa rosso se una tabella ritoccata lo
   rompesse. È il freno che impedisce al mercato di diventare la
   scorciatoia per salire di livello senza fare esercizi: il livello
   resta tempo, che sia tempo di studio o tempo di fattoria.

   Un ordine **non regala mai monete** e non toglie mai niente oltre
   alla merce che chiede: consegnare non può far male.
   ═══════════════════════════════════════════════════════════════════ */
import { COLTURE, RICETTE, PRODOTTI, PROFONDITA } from './coltivazioni.js'
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
    vuole: ['grano', 'uova', 'latte', 'patate'] },
  { id: 'pasticcera',  nome: 'La pasticcera',  emoji: '🧁',
    vuole: ['uova', 'latte', 'fragole', 'miele', 'merenda'] },
  { id: 'nonna',       nome: 'La nonna',       emoji: '👵' },
  { id: 'cuoco',       nome: 'Il cuoco',       emoji: '👨‍🍳',
    vuole: ['tartufi', 'patate', 'melanzane', 'peperoni', 'cavolfiori', 'aglio'] },
  { id: 'maestra',     nome: 'La maestra',     emoji: '🍎',
    vuole: ['fragole', 'carote', 'latte', 'uova', 'merenda'] },
  { id: 'bottegaio',   nome: 'Il bottegaio',   emoji: '🏪' },
  { id: 'veterinaria', nome: 'La veterinaria', emoji: '🩺',
    vuole: ['mangime', 'pastone', 'becchime', 'foraggio', 'beverone', 'pastura'] },
  { id: 'giardiniere', nome: 'Il giardiniere', emoji: '🌻',
    vuole: ['concime', 'fiori', 'zucche'] },
  /* I quattro mestieri dell'orto. Sono qui perché una merce nuova
     senza nessuno che la chieda per mestiere finisce sempre in mano al
     bottegaio, che è il modo di dire «non ci ho pensato». */
  { id: 'pizzaiolo',   nome: 'Il pizzaiolo',   emoji: '🍕',
    vuole: ['pomodori', 'cipolle', 'aglio', 'melanzane', 'peperoni', 'grano'] },
  { id: 'fruttivendola', nome: 'La fruttivendola', emoji: '🥕',
    vuole: ['pomodori', 'patate', 'cipolle', 'cavolfiori', 'carote', 'fragole', 'zucche'] },
  { id: 'apicoltore',  nome: 'L\'apicoltore',  emoji: '🐝',
    vuole: ['miele', 'fiori', 'cipolle'] },
  { id: 'sarta',       nome: 'La sarta',       emoji: '🧵',
    vuole: ['lana', 'stoffa'] },
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
   portare la roba al banco (uguale per tutti gli ordini), `PER_VALORE`
   è quante volte si ripaga quello che la merce è costata. */
export const PREMIO_BASE = 6
export const PER_VALORE = 4

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

/* Quanto rende un ordine, dato quello che chiede (`{ prodotto: n }`).
   Sta qui e non nel motore perché è **un numero della tabella**: chi
   ritocca l'economia lo ritocca leggendo il ragionamento in testa al
   file, non frugando dentro le regole. */
export function premioPer(chiede) {
  let valore = 0
  for (const [k, n] of Object.entries(chiede || {})) valore += n * valoreDi(k)
  if (!Number.isFinite(valore)) return PREMIO_BASE
  return PREMIO_BASE + PER_VALORE * valore
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
