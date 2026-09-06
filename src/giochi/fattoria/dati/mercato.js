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
import { COLTURE, RICETTE, PRODOTTI } from './coltivazioni.js'
import { livelloDelProdotto } from './livelli.js'

/* ── CHI ORDINA ───────────────────────────────────────────────────
   Mestieri, non nomi propri: «il fornaio» dice da solo perché vuole del
   grano, e un nome di persona non direbbe niente. Sono la parte del
   mercato che si ricorda — un bambino racconta che «è arrivato il
   pasticcere», non che ha consegnato due uova. */
export const CLIENTI = [
  { id: 'fornaio',     nome: 'Il fornaio',     emoji: '🥖' },
  { id: 'pasticcera',  nome: 'La pasticcera',  emoji: '🧁' },
  { id: 'nonna',       nome: 'La nonna',       emoji: '👵' },
  { id: 'cuoco',       nome: 'Il cuoco',       emoji: '👨‍🍳' },
  { id: 'maestra',     nome: 'La maestra',     emoji: '🍎' },
  { id: 'bottegaio',   nome: 'Il bottegaio',   emoji: '🏪' },
  { id: 'veterinaria', nome: 'La veterinaria', emoji: '🩺' },
  { id: 'giardiniere', nome: 'Il giardiniere', emoji: '🌻' },
]

export const clienteDi = id => CLIENTI.find(c => c.id === id) || CLIENTI[0]

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

export function valoreDi(prodotto, giri = 5) {
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

export function minutiDi(prodotto, giri = 5) {
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
  }
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
