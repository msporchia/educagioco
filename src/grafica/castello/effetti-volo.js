// Il colpo in volo, uno per ogni tiro: la freccia, il cecchino, la raffica,
// il dardo magico, il veleno, il fulmine, le tre bombe. `k` è il colpo in
// coordinate locali: parte da (0, 0) e cade in `E`, `u` è a che punto è
// (0–1), `volo` quanto in fretta (u al secondo), `an` l'angolo, `col` la
// tinta del ramo. Dove si disegna una scia si ricampiona la traiettoria
// qualche istante prima, senza ricordarsi niente.
import { TAU, rnd, rgba, glow, disc, ring, add, sparks, flamma, fulmineLinea, freccia } from './effetti-base.js'

const dritto = (k, v) => ({ x: k.E.x * v, y: k.E.y * v })
// il dardo magico ondeggia attorno alla retta
function onda(k, v, amp = 5) {
  const o = Math.sin(v * TAU * 2) * amp * Math.sin(v * Math.PI)
  return { x: k.E.x * v - Math.sin(k.an) * o, y: k.E.y * v + Math.cos(k.an) * o }
}
const arco = (k, v) => ({ x: k.E.x * v, y: k.E.y * v - 4 * k.alto * v * (1 - v) })

// la bocca: un lampo che sparisce in fretta
function bocca(g, k, r, col) {
  if (k.u < 0.35) add(g, () => glow(g, Math.cos(k.an) * 14, Math.sin(k.an) * 14 - 4, r * (1 - k.u / 0.35), col, 0.85))
}

// ricampiona la traiettoria: `fn(punto, al, k)` per ogni istante passato, dal più vecchio
function scia(k, n, dt, pos, fn) {
  for (let i = n; i >= 1; i--) {
    const v = k.u - i * dt * k.volo
    if (v < 0) continue
    fn(pos(k, v), 1 - i / n, i)
  }
}

function arciere(g, k) {
  bocca(g, k, 10, '#fff3c4')
  const p = dritto(k, k.u)
  // tre strisce d'aria sottili, non un tubo
  g.save(); g.translate(p.x, p.y); g.rotate(k.an); g.lineCap = 'round'
  for (const [o, l, a] of [[0, 44, 0.5], [-3, 30, 0.28], [3, 34, 0.28]]) {
    const q = g.createLinearGradient(-l, 0, 0, 0)
    q.addColorStop(0, rgba('#ffffff', 0)); q.addColorStop(1, rgba('#ffffff', a))
    g.strokeStyle = q; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-l, o); g.lineTo(-6, o * 0.4); g.stroke()
  }
  g.restore()
  freccia(g, p.x, p.y, k.an, { col: k.col })
}

function cecchino(g, k) {
  bocca(g, k, 14, '#c8ffd8')
  const p = dritto(k, k.u)
  g.save(); g.lineCap = 'round'
  const q = g.createLinearGradient(0, 0, p.x, p.y)
  q.addColorStop(0, rgba('#c8ffd8', 0)); q.addColorStop(1, rgba('#c8ffd8', 0.8))
  g.strokeStyle = q; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(p.x, p.y); g.stroke(); g.restore()
  freccia(g, p.x, p.y, k.an, { col: k.col, len: 1.5, pen: '#1f7a4a' })
}

// `k.salva`: la seconda freccia parte un po' dopo, e va a destra della prima
function raffica(g, k) {
  bocca(g, k, 9, '#e9ffd2')
  const p = dritto(k, k.u)
  if (k.u < 0.5)
    for (let i = 0; i < 3; i++) {
      const a = k.tt * 14 + i * 2.1
      g.strokeStyle = rgba('#e9ffd2', 0.5 * (1 - k.u * 2)); g.lineWidth = 1.6
      g.beginPath(); g.arc(0, -2, 17 + i * 3, a, a + 1.2); g.stroke()
    }
  g.save(); g.translate(p.x, p.y); g.rotate(k.an); g.lineCap = 'round'
  const q = g.createLinearGradient(-30, 0, 0, 0)
  q.addColorStop(0, rgba('#e9ffd2', 0)); q.addColorStop(1, rgba('#e9ffd2', 0.6))
  g.strokeStyle = q; g.lineWidth = 2; g.beginPath(); g.moveTo(-30, 0); g.lineTo(-5, 0); g.stroke(); g.restore()
  freccia(g, p.x, p.y, k.an, { col: k.col, len: 0.9 })
}

function orbo(g, p, tt, col, r = 5) {
  add(g, () => { glow(g, p.x, p.y, r * 3, col, 0.7); glow(g, p.x, p.y, r * 1.7, col, 0.9) })
  disc(g, p.x, p.y, r, col); disc(g, p.x, p.y, r * 0.55, '#ffffff')
  for (let i = 0; i < 2; i++) {
    const a = tt * 16 + i * Math.PI
    disc(g, p.x + Math.cos(a) * (r + 3.2), p.y + Math.sin(a) * (r + 3.2), 1.7, '#ffffff', 0.95)
  }
}

function magica(g, k) {
  bocca(g, k, 16, k.col)
  scia(k, 14, 0.014, onda, (p, al, i) => {
    const j = (rnd(i + Math.floor(k.tt * 30)) - 0.5) * 3
    add(g, () => disc(g, p.x + j, p.y + j * 0.6, 3.4 * al + 0.5, k.col, 0.6 * al))
  })
  orbo(g, onda(k, k.u), k.tt, k.col)
}

const VERDE = '#7dff4a'
function veleno(g, k) {
  bocca(g, k, 12, VERDE)
  const f = (kk, v) => onda(kk, v, 3)
  // le gocce cadono dalla scia
  scia(k, 10, 0.03, f, (p, al, i) => {
    const caduta = i * 0.03
    disc(g, p.x, p.y + caduta * caduta * 160, 2.4 * al + 0.4, VERDE, 0.8 * al)
  })
  const p = f(k, k.u)
  add(g, () => glow(g, p.x, p.y, 16, VERDE, 0.55))
  disc(g, p.x, p.y, 6, '#2f8f1b'); disc(g, p.x, p.y, 5, VERDE, 0.9); disc(g, p.x - 1.6, p.y - 1.6, 1.8, '#eaffd0')
  for (let i = 0; i < 3; i++) {
    const bb = (k.tt * 5 + i / 3) % 1
    ring(g, p.x + (i - 1) * 3, p.y - 5 - bb * 8, 1 + bb * 1.6, '#c9ff9a', 1, 1 - bb)
  }
}

// il fulmine non viaggia: nasce già lungo tutto il tratto, e lo continua
// lo schizzo (effetti-impatto.js)
function catena(g, k) {
  const f = Math.floor(k.tt * 28)
  const P = { x: 0, y: -4 }
  add(g, () => {
    fulmineLinea(g, P, k.E, f * 13, 10, rgba(k.col, 0.35), 8)
    fulmineLinea(g, P, k.E, f * 13, 5, rgba('#e7d5ff', 0.8), 8)
  })
  fulmineLinea(g, P, k.E, f * 13, 1.8, '#ffffff', 8)
}

function bombaTonda(g, p, tt, col) {
  disc(g, p.x, p.y, 6.5, '#2f2a26'); disc(g, p.x - 2, p.y - 2, 2.1, '#6a6258')
  g.strokeStyle = '#c9a06a'; g.lineWidth = 1.4
  g.beginPath(); g.moveTo(p.x + 3, p.y - 5); g.quadraticCurveTo(p.x + 6, p.y - 8, p.x + 4, p.y - 10); g.stroke()
  const fl = 0.7 + 0.3 * Math.sin(tt * 60)
  add(g, () => glow(g, p.x + 4, p.y - 10.5, 9 * fl, '#ffb43a', 0.9))
  disc(g, p.x + 4, p.y - 10.5, 2.3 * fl, '#fff3c4')
  sparks(g, p.x + 4, p.y - 10.5, tt % (1 / 30), { n: 3, v: 30, life: 0.14, col: '#ffd76a', seed: Math.floor(tt * 30), r: 1.2, grav: 60 })
}
function granata(g, p, an, tt) {
  g.save(); g.translate(p.x, p.y); g.rotate(an)
  g.fillStyle = '#3a342f'; g.beginPath(); g.ellipse(0, 0, 8.5, 5, 0, 0, TAU); g.fill()
  g.fillStyle = '#a8652a'; g.fillRect(-1, -5, 2.6, 10)
  g.fillStyle = '#6a6258'; g.beginPath(); g.ellipse(2, -1.4, 5, 1.7, 0, 0, TAU); g.fill()
  add(g, () => glow(g, -8, 0, 7, '#ff8a3a', 0.8)); g.restore()
}
function palla(g, p, an, tt) {
  // palla di fuoco con coda di fiamme
  for (let i = 0; i < 6; i++) {
    const a = an + Math.PI + (rnd(i + Math.floor(tt * 25)) - 0.5) * 0.8, l = 6 + i * 3
    flamma(g, p.x + Math.cos(a) * l, p.y + Math.sin(a) * l, Math.max(1, 5 - i * 0.7), 0.9 - i * 0.1)
  }
  flamma(g, p.x, p.y, 6.4, 1)
}

// il tiro a campana: ombra a terra, fumo dietro, e il corpo che sale e scende
function campana(g, k, corpo, fumoso) {
  bocca(g, k, 12, '#ffd76a')
  const gs = dritto(k, k.u), p = arco(k, k.u)
  const sale = 4 * k.u * (1 - k.u)
  g.save(); g.translate(gs.x, gs.y + 6); g.scale(1, 0.4); disc(g, 0, 0, 8 * (1 - 0.4 * sale), '#000000', 0.35); g.restore()
  scia(k, 12, 0.025, arco, (q, al, i) =>
    disc(g, q.x + (rnd(i) - 0.5) * 2, q.y + (rnd(i + 5) - 0.5) * 2, (fumoso ? 4 : 2.6) * (1 + i * 0.12),
      fumoso ? '#8a8179' : '#d9cfc0', 0.5 * al))
  const v2 = arco(k, Math.min(1, k.u + 0.02))
  corpo(g, p, Math.atan2(v2.y - p.y, v2.x - p.x), k.tt, k.col)
}

export const VOLI = {
  add: arciere, cecchino, raffica,
  sub: magica, veleno, catena,
  div: (g, k) => campana(g, k, bombaTonda, false),
  mortaio: (g, k) => campana(g, k, granata, true),
  napalm: (g, k) => campana(g, k, palla, false),
}
