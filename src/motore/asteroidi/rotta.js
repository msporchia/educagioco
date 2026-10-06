// La rotta degli asteroidi: dove sta ogni tappa sulla mappa dello spazio, per
// dove passa la rotta tratteggiata, dove si posa il razzo e che strada fa
// volando. Puro, gira in Node: i disegni stanno in grafica/rotta.js, le
// scelte in docs/asteroidi/mappa.md.

export const LARGO_MAX = 520        // oltre, la mappa resta in mezzo allo schermo
const PASSO = 126                   // fra una tappa e la dopo
const STACCO = 74                   // in più prima di un capitolo: lì sta il suo nome
const CIMA = 6, FONDO = 110
const MARGINE = 12                  // dal bordo, per i nomi
const SCOSTO_NOME = 9               // fra il disegno e il suo nome
const SCOSTO_RAZZO = 26             // fra il disegno e il razzo posato

// l'onda della rotta: fra due tappe di fila si cambia lato quasi sempre
const onda = k => Math.sin(k * 1.1 + 0.35)

// `ingombro(v)`: raggio e mezza larghezza del disegno; l'ultimo nodo è il volo infinito.
// Il nome sta dal `lato` del mezzo, il razzo dall'altra parte.
export function disponiRotta(W, voci, capitoli, ingombro = () => ({ r: 28, mezzo: 28 })) {
  const A = Math.min(W * 0.22, 112)
  const nodi = []
  const titoli = []
  let y = CIMA
  voci.forEach((v, k) => {
    const primo = k === 0 || voci[k - 1].cap !== v.cap
    if (primo) y += STACCO
    const { r, mezzo } = ingombro(v)
    nodi.push({ k, pos: v.pos, tipo: v.tipo, cap: v.cap, x: W / 2 + A * onda(k), y, r, mezzo })
    if (primo) titoli.push({ cap: v.cap, titolo: (capitoli[v.cap] || {}).titolo || '', k })
    y += PASSO
  })
  // il volo infinito chiude la rotta, in mezzo e un po' più staccato
  const iv = ingombro({ tipo: 'volo' })
  y += STACCO * 0.4
  nodi.push({ k: nodi.length, pos: -1, tipo: 'volo', cap: -1, x: W / 2, y, r: iv.r, mezzo: iv.mezzo })
  const H = y + iv.r + FONDO

  for (const n of nodi) {
    const d = n.x - W / 2
    n.lato = Math.abs(d) < 6 ? 1 : d < 0 ? 1 : -1
    const lx = n.lato > 0 ? n.x + n.mezzo + SCOSTO_NOME : n.x - n.mezzo - SCOSTO_NOME
    n.etichetta = { x: lx, largo: Math.max(70, n.lato > 0 ? W - MARGINE - lx : lx - MARGINE) }
    n.razzo = posto(n, W)
  }

  // il nome del capitolo sta nello spazio prima della sua prima tappa,
  // dalla parte dove la rotta non passa
  for (const t of titoli) {
    const n = nodi[t.k], prima = nodi[t.k - 1]
    const yMezzo = prima ? (prima.y + n.y) / 2 : n.y - STACCO * 0.62
    const xRotta = prima ? (prima.x + n.x) / 2 : n.x
    t.lato = xRotta < W / 2 ? 1 : -1
    t.y = yMezzo
    t.x = t.lato > 0 ? Math.max(xRotta + 34, W * 0.52) : Math.min(xRotta - 34, W * 0.48)
    t.largo = Math.max(90, t.lato > 0 ? W - MARGINE - t.x : t.x - MARGINE)
  }

  const { punti, indici } = tracciato(nodi.map(n => [n.x, n.y]))
  nodi.forEach((n, i) => { n.punto = indici[i] })
  return { W, H, nodi, titoli, punti, stelle: cielo(W, H) }
}

// dove si posa il razzo accanto a un nodo: dalla parte opposta al nome
function posto(n, W) {
  const x = n.x - n.lato * (n.mezzo + SCOSTO_RAZZO)
  return { x: Math.max(20, Math.min(W - 20, x)), y: n.y - 2 }
}

// una Catmull-Rom per i centri dei nodi; `indici[i]` è il punto che cade sul nodo i
export function tracciato(centri, passi = 18) {
  const punti = [], indici = []
  const P = i => centri[Math.max(0, Math.min(centri.length - 1, i))]
  for (let i = 0; i < centri.length - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2)
    indici.push(punti.length)
    for (let s = 0; s < passi; s++) {
      const t = s / passi, t2 = t * t, t3 = t2 * t
      const c = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 +
                                        (-a + 3 * b - 3 * c2 + d) * t3)
      punti.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])])
    }
  }
  indici.push(punti.length)
  punti.push([...centri[centri.length - 1]])
  return { punti, indici }
}

// le stelle del fondo, col seme della larghezza: la stessa mappa a ogni apertura
export function cielo(W, H) {
  const caso = sorte(Math.round(W) * 7919 + 17)
  const quante = Math.round((W * H) / 2300)
  const stelle = []
  for (let i = 0; i < quante; i++) {
    const grande = caso() < 0.07
    stelle.push({ x: caso() * W, y: caso() * H, r: grande ? 1.3 + caso() * 0.9 : 0.5 + caso() * 0.7,
                  a: 0.25 + caso() * 0.6, tinta: caso() < 0.18 ? 1 : 0 })
  }
  return stelle
}

// un generatore col seme (mulberry32): lo stesso cielo a ogni giro
export function sorte(seme) {
  let a = seme >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ═══════════ il volo del razzo ═══════════ */

// dal posto del razzo alla rotta e di nuovo fuori; i punti vicini ai disegni si saltano, se no ci passa sopra
export function stradaDelRazzo(quadro, da, a) {
  const n0 = quadro.nodi[da]
  if (!n0 || da === a) return null
  return stradaDaPunto(quadro, { x: n0.razzo.x, y: n0.razzo.y, i: n0.punto, nodo: da }, a)
}

/* la stessa strada, ma da un punto qualunque (`inizio`: { x, y, i }, i è il punto della rotta
   dove ci si aggancia, `nodo` la tappa che si lascia, se ancora si sta lì): per chi cambia meta in volo */
export function stradaDaPunto(quadro, inizio, a) {
  const n1 = quadro.nodi[a]
  if (!inizio || !n1) return null
  const i0 = inizio.i, i1 = n1.punto
  let pezzo = quadro.punti.slice(Math.min(i0, i1), Math.max(i0, i1) + 1)
  if (i0 > i1) pezzo = pezzo.reverse()
  const n0 = inizio.nodo != null ? quadro.nodi[inizio.nodo] : null
  const lontano = (p, n) => Math.hypot(p[0] - n.x, p[1] - n.y) > n.mezzo + 14
  const dentro = pezzo.filter(p => lontano(p, n1) && (!n0 || lontano(p, n0)))
  const grezza = [[inizio.x, inizio.y], ...dentro, [n1.razzo.x, n1.razzo.y]]
  if (lunghezza(grezza) < 1) return null
  return smussa(smussa(grezza))
}

// il punto della rotta più vicino a (x, y), fra due estremi: dove ci si aggancia partendo da lì
export function agganciaARotta(quadro, x, y, i0, i1) {
  let meglio = Math.min(i0, i1), d = Infinity
  for (let i = Math.min(i0, i1); i <= Math.max(i0, i1); i++) {
    const q = Math.hypot(quadro.punti[i][0] - x, quadro.punti[i][1] - y)
    if (q < d) { d = q; meglio = i }
  }
  return meglio
}

// Chaikin: tiene il primo e l'ultimo punto, taglia gli angoli
export function smussa(punti) {
  if (punti.length < 3) return punti
  const out = [punti[0]]
  for (let i = 0; i < punti.length - 1; i++) {
    const [ax, ay] = punti[i], [bx, by] = punti[i + 1]
    out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75])
  }
  out.push(punti[punti.length - 1])
  return out
}

export function lunghezza(punti) {
  let l = 0
  for (let i = 1; i < punti.length; i++) l += Math.hypot(punti[i][0] - punti[i - 1][0], punti[i][1] - punti[i - 1][1])
  return l
}

// il punto a una frazione q della strada, misurata in lunghezza, e il verso lì
export function lungo(punti, q) {
  const tot = lunghezza(punti)
  let resta = Math.max(0, Math.min(1, q)) * tot
  for (let i = 1; i < punti.length; i++) {
    const [ax, ay] = punti[i - 1], [bx, by] = punti[i]
    const l = Math.hypot(bx - ax, by - ay)
    if (resta <= l || i === punti.length - 1) {
      const k = l ? Math.min(1, resta / l) : 0
      return { x: ax + (bx - ax) * k, y: ay + (by - ay) * k, angolo: Math.atan2(by - ay, bx - ax) }
    }
    resta -= l
  }
  const p = punti[0]
  return { x: p[0], y: p[1], angolo: 0 }
}

// quanto dura un volo: abbastanza da vederlo, mai un'attesa
export const durataVolo = l => Math.max(0.9, Math.min(2.4, l / 210))

// il giro più corto da un angolo all'altro, in (-π, π]
export function giro(da, a) {
  let d = (a - da) % (2 * Math.PI)
  if (d > Math.PI) d -= 2 * Math.PI
  if (d <= -Math.PI) d += 2 * Math.PI
  return d
}

// se il verso cambia più di così, il razzo prima gira sul posto
export const GIRA_PRIMA = 0.35

// il verso del razzo fermo, quando non ha volato: lungo la rotta, in avanti
export function versoDellaRotta(quadro, k) {
  const n = quadro.nodi[k]
  if (!n) return Math.PI / 2
  const p = quadro.punti, i = n.punto
  const a = p[Math.max(0, i - 2)], b = p[Math.min(p.length - 1, i + 2)]
  return Math.atan2(b[1] - a[1], b[0] - a[0])
}
