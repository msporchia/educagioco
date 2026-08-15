/* ═══════════════════════════════════════════════════════════════════
   I CANCELLI — le tre scelte, e perché non sono finte

   Un cancello è un operatore: `×3`, `+50`, `−20`, `÷5 +80`. Passarci
   dentro fa quello che c'è scritto alla truppa. Non c'è nessuna domanda
   da leggere di corsa: **il conto è la mossa**, e sbagliarlo non è un
   voto brutto — è arrivare al mostro con meno soldati.

   Tre regole, e sono tutto quello che rende la scelta una scelta:

   1. **Niente due cancelli che portano allo stesso numero.** `×2` e `+50`
      con cinquanta soldati sono la stessa cosa detta in due modi: chi
      sceglie non sceglie niente.
   2. **Il migliore non è sempre lo stesso simbolo.** Il moltiplicatore
      convive con un'addizione grossa: con 4 soldati conviene `+18`, con
      12 conviene `×3`, e capirlo *è* il gioco. Se vincesse sempre `×`
      basterebbe cercare la crocetta.
   3. **Le addizioni si tarano su quanti ce ne sono già.** Con 7 soldati
      `+30` è un regalo assurdo, con 700 è polvere. E restano numeri
      tondi, perché un `+237` mentre si corre non lo somma nessuno.

   Il caso arriva da fuori (`rnd`): due partite con lo stesso seme devono
   raccontare la stessa storia, o un test rosso non si sa se è un guasto
   o sfortuna.
   ═══════════════════════════════════════════════════════════════════ */
import { CAMBIO } from '../dati/ordini.js'

const mescola = (a, rnd) =>
  a.map(v => [rnd(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1])

/* Un numero tondo dell'ordine di grandezza giusto. Il passo cresce col
   numero apposta: sotto la decina si conta a uno a uno, sopra il
   centinaio si conta a cento. */
export function tondo(base, frazione) {
  const grezzo = Math.max(2, base * frazione)
  const passo = grezzo < 10 ? 1 : grezzo < 60 ? 5 : grezzo < 300 ? 25 : 100
  return Math.max(passo, Math.round(grezzo / passo) * passo)
}

/* ── il cancello col libro ──
   Il premio più forte del gioco (`×5`), ma bisogna fermarsi e fare un
   esercizio. È **un'offerta, non un pedaggio**, e le tre condizioni che
   fanno la differenza sono tutte e tre qui:

     · si vede prima — è d'oro e ha il libro, da quaranta metri
     · non è mai obbligatorio — le altre due corsie sono cancelli veri
     · sbagliare non toglie niente — si è perso solo il tempo di provarci

   Toglierne una qualunque lo trasforma in una tassa, e una tassa la si
   paga svogliati. */
const LIBRO = () => ({ seg: '×' + CAMBIO, libro: true, f: v => v * CAMBIO })

/* Quanto vale un cancello quando bisogna **prevedere il futuro** (il
   mostro va dimensionato su dove sarà la truppa, non su dov'è adesso). Il
   libro si conta come un `×2`, non come un `×5`: tarare i nemici sul caso
   perfetto vuol dire mandare un esercito contro chi ha sbagliato il
   conto, cioè proprio contro chi aveva più bisogno di cavarsela. */
export const resaPrevista = o => (o.libro ? v => v * 2 : o.f)

export function generaCancelli(n, { rnd = Math.random, libri = 0.34 } = {}) {
  /* Le scelte composte: «÷5 +80» contro «×2 −40». Servono a togliere la
     scorciatoia — finché i cancelli sono `+50` e `×2` basta guardare
     quale numero è più grosso, e non si sta calcolando niente. Arrivano
     quando la truppa è abbastanza numerosa da rendere una divisione
     sensata: dividere sette soldati non insegna niente e fa male. */
  const composti = n < 40 ? [] : [
    { seg: `÷${CAMBIO} +${tondo(n, 0.55)}`, doppio: true },
    { seg: `×2 −${tondo(n, 0.5)}`, doppio: true },
    { seg: `÷2 +${tondo(n, 0.35)}`, doppio: true },
  ]

  const candidati = [
    ...(rnd() < libri ? [LIBRO()] : []),
    ...mescola(composti, rnd).slice(0, 2),
    { seg: '×2', f: v => v * 2 },
    ...(n <= 120 ? [{ seg: '×3', f: v => v * 3 }] : []),
    { seg: '+' + tondo(n, 0.35) },
    { seg: '+' + tondo(n, 0.7) },
    /* Con tre soldati in croce niente cancelli che tolgono: chi è finito
       in fondo deve poter risalire scegliendo, se no resta a uno per
       sempre e il gioco diventa una corsa senza scelte. */
    ...(n > 4 ? [{ seg: '−' + tondo(n, 0.35) },
                 { seg: '÷2', f: v => Math.max(1, Math.floor(v / 2)) }] : []),
  ].map(costruisci)

  /* Il cancello col libro, quando esce, ha la precedenza sugli altri: è
     l'offerta che questo gioco esiste per fare. */
  const ordine = [...candidati.filter(c => c.libro),
                  ...mescola(candidati.filter(c => !c.libro), rnd)]
  const scelti = []
  for (const c of ordine) {
    if (scelti.length === 3) break
    if (scelti.some(s => s.f(n) === c.f(n))) continue    // niente scelte finte
    scelti.push(c)
  }
  /* la corsia buona non è sempre la stessa: se no si impara la posizione
     invece del conto, e il gioco diventa un riflesso */
  return mescola(scelti, rnd)
}

/* Da quello che c'è scritto a quello che succede. L'ordine è **quello in
   cui è scritto** — prima chi moltiplica o divide, poi chi aggiunge o
   toglie — perché è l'unico che un bambino può dedurre guardandolo. */
function costruisci(c) {
  if (c.f) return c
  if (c.doppio) {
    const [uno, due] = c.seg.split(' ')
    const a = Number(uno.slice(1)), b = Number(due.slice(1))
    const primo = uno[0] === '÷' ? v => Math.floor(v / a) : v => v * a
    const poi = due[0] === '+' ? v => v + b : v => Math.max(1, v - b)
    return { ...c, f: v => Math.max(1, poi(primo(v))) }
  }
  const k = Number(c.seg.slice(1))
  return { ...c, f: c.seg[0] === '+' ? v => v + k : v => Math.max(1, v - k) }
}

/* Chi guadagna e chi toglie, per chi disegna: il verde e il rosso si
   leggono da lontano, il conto si legge da vicino. Non è un aiuto — il
   `−40` è rosso ma con la truppa a uno può essere l'unico che resta. */
export const cancelloBuono = op => op.seg[0] === '×' || op.seg[0] === '+'

/* Il guasto che nessun occhio trova: una terna che non è una scelta.
   Girata su mille truppe diverse, dice se i cancelli restano tre cose
   distinte anche ai numeri che nessuno prova a mano. */
export function guastiDeiCancelli({ rnd = Math.random, volte = 400 } = {}) {
  const guasti = []
  const truppe = [1, 2, 3, 4, 5, 9, 10, 24, 25, 40, 87, 120, 200, 400, 624]
  for (const n of truppe) {
    for (let i = 0; i < Math.ceil(volte / truppe.length); i++) {
      const ops = generaCancelli(n, { rnd, libri: 0.34 })
      if (ops.length !== 3) { guasti.push(`con ${n} soldati escono ${ops.length} cancelli invece di tre`); break }
      const esiti = ops.map(o => o.f(n))
      if (new Set(esiti).size !== 3) {
        guasti.push(`con ${n} soldati due cancelli portano allo stesso numero (${esiti.join(', ')})`); break
      }
      if (esiti.some(v => v < 1 || !Number.isFinite(v))) {
        guasti.push(`con ${n} soldati un cancello porta a ${esiti.join(', ')}`); break
      }
      /* almeno un cancello deve migliorare la situazione: tre cancelli
         che tolgono sono una punizione, non una scelta */
      if (n <= 4 && !esiti.some(v => v > n)) {
        guasti.push(`con ${n} soldati nessun cancello fa risalire: da lì non si esce più`); break
      }
      if (ops.filter(o => o.libro).length > 1) {
        guasti.push(`con ${n} soldati escono due libri: l'offerta diventa un pedaggio`); break
      }
    }
  }
  /* i numeri tondi restano tondi, o il bonus non lo somma nessuno */
  for (const n of truppe)
    for (const q of [0.35, 0.55, 0.7]) {
      const t = tondo(n, q)
      if (t < 2 || t !== Math.round(t)) guasti.push(`tondo(${n}, ${q}) fa ${t}`)
    }
  return guasti
}
