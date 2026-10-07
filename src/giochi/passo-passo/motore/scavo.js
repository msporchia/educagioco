// Lo scavo delle sagome: il foglio dove una sagoma scrive la sua strada,
// la cornice e il fuori (`componi`), il girare e lo specchiare, e i piccoli
// aiutanti del caso. Lo usano le sagome del coniglio (`sagome.js`) e
// quelle del cane (`sagome-cane.js`). Vedi docs/passo-passo/sentiero.md.
import { COLONNE_MAX, RIGHE_MAX, LATO_MIN } from '../dati/mondo.js'

/* una sagoma che non torna (un pezzo di strada sopra un altro, un posto
   troppo largo) si butta e se ne tira un'altra */
export const STORTO = Symbol('storto')
export const storto = () => { throw STORTO }

export const DIR = { destra: [1, 0], sinistra: [-1, 0], giu: [0, 1], su: [0, -1] }
export const LETTERA = { rosso: 'r', blu: 'u', giallo: 'g' }

// Lo scavo: un foglio senza bordi (coordinate anche sotto zero, la
// cornice si decide in `componi`). `metti` rifiuta di sovrascrivere una
// cella già scritta con un carattere diverso, così due pezzi di strada
// che si pestano i piedi si scoprono subito.
export class Scavo {
  constructor() { this.celle = new Map() }
  get(x, y) { return this.celle.get(`${x},${y}`) }
  metti(x, y, ch) {
    const k = `${x},${y}`, c = this.celle.get(k)
    if (c !== undefined && c !== ch) storto()
    this.celle.set(k, ch)
  }
  /* un prato che non copre quello che c'è già (la carota, una lastra) */
  prato(x, y) { if (this.get(x, y) === undefined) this.celle.set(`${x},${y}`, '.') }
  forza(x, y, ch) { this.celle.set(`${x},${y}`, ch) }
}

export const passo = ([x, y], m) => {
  const salto = m.startsWith('salto-')
  const [dx, dy] = DIR[salto ? m.slice(6) : m]
  return salto ? [x + 2 * dx, y + 2 * dy] : [x + dx, y + dy]
}
export const chiave = ([x, y]) => `${x},${y}`

// il fuori: quattro vestiti, ognuno con le sue macchie e quanto pesano
const FUORI = {
  bosco:  [['A', 6], ['B', 2], ['~', 1]],
  prato:  [['B', 4], ['A', 3], ['~', 2]],
  stagno: [['~', 6], ['A', 2], ['B', 1]],
  acqua:  [['~', 9], ['A', 1]],
}

/* dallo scavo alla mappa: la cornice (un giro di fuori qua e là, se ci
   sta), e il fuori dove la sagoma non ha scritto niente */
export function componi(scavo, rnd, fondo) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const k of scavo.celle.keys()) {
    const [x, y] = k.split(',').map(Number)
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
  }
  /* un posto largo e basso va bene lo stesso: si girerà per il lungo
     (`gira`), e le misure si guardano in quel verso */
  const coricato = x1 - x0 + 1 > COLONNE_MAX
  const [TX, TY] = coricato ? [RIGHE_MAX, COLONNE_MAX] : [COLONNE_MAX, RIGHE_MAX]
  if (x1 - x0 + 1 > TX || y1 - y0 + 1 > TY) storto()
  /* un giro di fuori in più da ogni lato, a caso, finché ci sta; e
     comunque abbastanza da non fare un posto più stretto di tre */
  for (const lato of ['x0', 'x1', 'y0', 'y1']) {
    const orizz = lato[0] === 'x'
    const largo = orizz ? x1 - x0 + 1 : y1 - y0 + 1
    const tetto = orizz ? TX : TY
    if (largo < tetto && (largo < LATO_MIN || rnd() < 0.45)) {
      if (lato === 'x0') x0--; else if (lato === 'x1') x1++
      else if (lato === 'y0') y0--; else y1++
    }
  }
  while (x1 - x0 + 1 < LATO_MIN) x1++
  while (y1 - y0 + 1 < LATO_MIN) y1++
  /* le macchie: qualche seme sparso, e ogni cella prende il vestito del
     seme più vicino; dentro una macchia di bosco, ogni tanto un cespuglio */
  const f = FUORI[fondo] || FUORI.bosco
  const totale = f.reduce((n, [, p]) => n + p, 0)
  const pesca = () => {
    let t = rnd() * totale
    for (const [c, p] of f) if ((t -= p) <= 0) return c
    return f[0][0]
  }
  const semi = Array.from({ length: 3 + Math.floor(rnd() * 3) }, () =>
    ({ x: x0 + rnd() * (x1 - x0 + 1), y: y0 + rnd() * (y1 - y0 + 1), c: pesca() }))
  const macchia = (x, y) => {
    let meglio = semi[0], d = Infinity
    for (const s of semi) {
      const q = (s.x - x) ** 2 + (s.y - y) ** 2
      if (q < d) { d = q; meglio = s }
    }
    if (meglio.c === 'A' && rnd() < 0.12) return 'B'
    if (meglio.c === 'B' && rnd() < 0.1) return 'S'
    return meglio.c
  }
  const righe = []
  for (let y = y0; y <= y1; y++) {
    let r = ''
    for (let x = x0; x <= x1; x++) {
      const c = scavo.get(x, y)
      r += c !== undefined ? c : macchia(x, y)
    }
    righe.push(r)
  }
  return righe
}

// girare e specchiare: una sagoma si scrive in un verso solo (destra e
// in giù), e il posto finito si gira, mappa e frecce insieme
const GIRI = {
  tr: { destra: 'giu', giu: 'destra', sinistra: 'su', su: 'sinistra' },
  fx: { destra: 'sinistra', sinistra: 'destra' },
  fy: { su: 'giu', giu: 'su' },
}
function giraMossa(t, tab) {
  if (t.startsWith('salto-')) return 'salto-' + (tab[t.slice(6)] || t.slice(6))
  return tab[t] || t
}
function giraMappa(m, che) {
  if (che === 'fx') return m.map(r => [...r].reverse().join(''))
  if (che === 'fy') return m.slice().reverse()
  return [...m[0]].map((_, x) => m.map(r => r[x]).join(''))
}
export function gira(t, rnd) {
  let { mappa, soluzione, fragili } = t
  const coricato = mappa[0].length > COLONNE_MAX
  for (const che of ['tr', 'fx', 'fy']) {
    if (rnd() < 0.5 && !(che === 'tr' && coricato)) continue
    if (che === 'tr' && !coricato && (mappa.length > COLONNE_MAX || mappa[0].length > RIGHE_MAX)) continue
    mappa = giraMappa(mappa, che)
    soluzione = soluzione.map(m => giraMossa(m, GIRI[che]))
    fragili = fragili.map(f => ({ ...f, fila: f.fila.map(m => giraMossa(m, GIRI[che])) }))
  }
  return { ...t, mappa, soluzione, fragili }
}

export const a = (rnd, n) => Math.floor(rnd() * n)
export const tra = (rnd, da, fino) => da + a(rnd, fino - da + 1)
export const scegli = (rnd, l) => l[a(rnd, l.length)]
export const ruota = (l, k) => [...l.slice(k), ...l.slice(0, k)]
export const mescola = (rnd, l) => l.map(x => [rnd(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1])

// segue una fila di frecce scavando dove passa; con `visti` si rifiuta di ripassare
export function segui(s, da, mosse, { visti = null } = {}) {
  let p = da
  const celle = []
  for (const m of mosse) {
    p = passo(p, m)
    if (visti) { if (visti.has(chiave(p))) storto(); visti.add(chiave(p)) }
    s.prato(p[0], p[1])
    celle.push(p)
  }
  return { fine: p, celle }
}
export const ripetute = (n, motivo) => Array.from({ length: n }, () => motivo).flat()
export const uguali = (p, q) => p[0] === q[0] && p[1] === q[1]

// un cammino a caso che non passa mai accanto a sé stesso (se no il
// risolutore taglierebbe la strada): serve al sentiero dei segni
export function cammino(rnd, versi, pezzi, lungo, largo = 8, alto = 10) {
  const occupate = new Set(['0,0'])
  let [x0, x1, y0, y1] = [0, 0, 0, 0]
  let p = [0, 0]
  const fuori = []
  const libera = (q, da) => !occupate.has(chiave(q)) &&
    [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => {
      const r = [q[0] + dx, q[1] + dy]
      return uguali(r, da) || !occupate.has(chiave(r))
    })
  for (let i = 0; i < pezzi; i++) {
    let prova = mescola(rnd, versi.filter(v => !fuori.length || v !== OPPOSTO[fuori.at(-1).verso]))
    /* dritti di rado: sei segni uguali di fila non si leggono, si contano */
    if (fuori.length && rnd() < 0.7) prova = [...prova.filter(v => v !== fuori.at(-1).verso), ...prova.filter(v => v === fuori.at(-1).verso)]
    let fatto = null
    for (const v of prova) {
      const L = lungo()
      const celle = []
      let q = p, ok = true
      for (let k = 0; k < L; k++) {
        const n = passo(q, v)
        if (!libera(n, q)) { ok = false; break }
        celle.push(n)
        q = n
      }
      if (!ok) continue
      const nx0 = Math.min(x0, q[0]), nx1 = Math.max(x1, q[0]), ny0 = Math.min(y0, q[1]), ny1 = Math.max(y1, q[1])
      if (nx1 - nx0 >= largo || ny1 - ny0 >= alto) continue
      fatto = { verso: v, celle }
      ;[x0, x1, y0, y1] = [nx0, nx1, ny0, ny1]
      break
    }
    if (!fatto) storto()
    for (const c of fatto.celle) occupate.add(chiave(c))
    fuori.push(fatto)
    p = fatto.celle.at(-1)
  }
  return fuori
}
export const OPPOSTO = { destra: 'sinistra', sinistra: 'destra', su: 'giu', giu: 'su' }
