// I cancelli: un operatore (×3, +50, −20, ÷5 +80) per corsia. Tre regole
// tengono la scelta una scelta vera (niente due cancelli allo stesso
// numero, il migliore non è sempre lo stesso simbolo, le addizioni si
// tarano su quanti soldati ci sono già): docs/corsa/regole.md. Il caso
// arriva da fuori (`rnd`) per i test.
import { CAMBIO } from '../dati/ordini.js'

const mescola = (a, rnd) =>
  a.map(v => [rnd(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1])

// un numero tondo dell'ordine di grandezza giusto: il passo cresce col
// numero, sotto la decina si conta a uno a uno, sopra il centinaio a cento
export function tondo(base, frazione) {
  const grezzo = Math.max(2, base * frazione)
  const passo = grezzo < 10 ? 1 : grezzo < 60 ? 5 : grezzo < 300 ? 25 : 100
  return Math.max(passo, Math.round(grezzo / passo) * passo)
}

// il cancello col libro: ×5, ma bisogna fermarsi e fare un esercizio —
// un'offerta e non un pedaggio, vedi docs/corsa/regole.md
const LIBRO = () => ({ seg: '×' + CAMBIO, libro: true, f: v => v * CAMBIO })

// quanto vale un cancello quando bisogna prevedere il futuro (il mostro
// va dimensionato su dove sarà la truppa): il libro conta come un ×2,
// non un ×5, o tarare i nemici sul caso perfetto punirebbe chi ha
// sbagliato il conto
export const resaPrevista = o => (o.libro ? v => v * 2 : o.f)

export function generaCancelli(n, { rnd = Math.random, libri = 0.34, tetto = Infinity } = {}) {
  // le scelte composte («÷5 +80» contro «×2 −40») tolgono la scorciatoia
  // di guardare solo il numero più grosso; arrivano quando la truppa è
  // abbastanza numerosa da rendere sensata una divisione
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
    // con tre soldati in croce niente cancelli che tolgono: chi è finito
    // in fondo deve poter risalire scegliendo
    ...(n > 4 ? [{ seg: '−' + tondo(n, 0.35) },
                 { seg: '÷2', f: v => Math.max(1, Math.floor(v / 2)) }] : []),
  ].map(costruisci)

  // il cancello col libro, quando esce, ha la precedenza sugli altri
  const ordine = [...candidati.filter(c => c.libro),
                  ...mescola(candidati.filter(c => !c.libro), rnd)]

  // niente scelte finte: il confronto va fatto sul risultato già
  // tagliato dal tetto, o vicino al tetto uscirebbero terne che
  // arrivano tutte allo stesso numero
  const dove = c => Math.min(tetto, Math.max(0, c.f(n)))
  const scelti = []
  for (const c of ordine) {
    if (scelti.length === 3) break
    if (scelti.some(s => dove(s) === dove(c))) continue
    scelti.push(c)
  }
  // con la truppa a uno o due i cancelli possibili sono pochissimi: si
  // riempie con addizioni piccole finché la terna è piena
  for (let k = 1; scelti.length < 3 && k < 40; k++) {
    const c = costruisci({ seg: '+' + k })
    if (!scelti.some(s => dove(s) === dove(c))) scelti.push(c)
  }
  return mescola(scelti, rnd)
}

// dal segno a quello che succede: l'ordine è quello in cui è scritto
// (prima chi moltiplica o divide, poi chi aggiunge o toglie), l'unico
// che un bambino può dedurre guardandolo
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

// Il guasto che nessun occhio trova: una terna che non è una scelta,
// girata su mille truppe diverse.
export function guastiDeiCancelli({ rnd = Math.random, volte = 400, tetti = [24, 124, 624] } = {}) {
  const guasti = []
  const truppe = [1, 2, 3, 4, 5, 9, 10, 24, 25, 40, 87, 120, 200, 400, 624]
  for (const tetto of tetti) for (const n of truppe.filter(v => v <= tetto)) {
    for (let i = 0; i < Math.ceil(volte / truppe.length); i++) {
      const ops = generaCancelli(n, { rnd, libri: 0.34, tetto })
      if (ops.length !== 3) { guasti.push(`con ${n} soldati escono ${ops.length} cancelli invece di tre`); break }
      const esiti = ops.map(o => Math.min(tetto, o.f(n)))
      if (new Set(esiti).size !== 3) {
        guasti.push(`con ${n} soldati e tetto ${tetto} due cancelli portano allo stesso numero (${esiti.join(', ')})`); break
      }
      if (esiti.some(v => v < 1 || !Number.isFinite(v))) {
        guasti.push(`con ${n} soldati un cancello porta a ${esiti.join(', ')}`); break
      }
      if (n <= 4 && !esiti.some(v => v > n)) {
        guasti.push(`con ${n} soldati nessun cancello fa risalire: da lì non si esce più`); break
      }
      if (ops.filter(o => o.libro).length > 1) {
        guasti.push(`con ${n} soldati escono due libri: l'offerta diventa un pedaggio`); break
      }
    }
  }
  for (const n of truppe)
    for (const q of [0.35, 0.55, 0.7]) {
      const t = tondo(n, q)
      if (t < 2 || t !== Math.round(t)) guasti.push(`tondo(${n}, ${q}) fa ${t}`)
    }
  return guasti
}
