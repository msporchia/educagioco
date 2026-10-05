// Gli attrezzi degli effetti dei colpi (vedi docs/castello/effetti.md).
// Ogni effetto è una funzione pura del tempo: scintille, fumo e fiamme si
// ricalcolano a ogni fotogramma da un seme, e chi disegna non tiene niente
// in mano. Si disegna in coordinate locali già scalate (`locale`), in unità
// di cella come il resto del campo.
export const TAU = 6.2832
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const ease = t => 1 - Math.pow(1 - clamp(t), 3)
// il caso è deterministico sul seme: un fumo che cambia a ogni ridisegno è un guasto
export const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

const memo = {}
export function rgba(h, a) {
  const k = h + a
  if (memo[k]) return memo[k]
  const n = parseInt(h.slice(1), 16)
  const s = `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`
  if (Object.keys(memo).length < 4000) memo[k] = s
  return s
}

// disegna in coordinate locali: origine in (x, y), una unità = `S` pixel di mondo
export function locale(p, x, y, fn, rot = 0, k = 1) {
  const g = p.ctx
  g.save(); g.translate(x, y); g.scale(p.S * k, p.S * k); if (rot) g.rotate(rot)
  fn(g); g.restore()
}

export function glow(g, x, y, r, c, a = 1) {
  const q = g.createRadialGradient(x, y, 0, x, y, r)
  q.addColorStop(0, rgba(c, a)); q.addColorStop(1, rgba(c, 0))
  g.fillStyle = q; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill()
}
export function disc(g, x, y, r, c, a = 1) {
  g.fillStyle = rgba(c, a); g.beginPath(); g.arc(x, y, Math.max(0, r), 0, TAU); g.fill()
}
export function ring(g, x, y, r, c, w, a = 1) {
  g.strokeStyle = rgba(c, a); g.lineWidth = w
  g.beginPath(); g.arc(x, y, Math.max(0, r), 0, TAU); g.stroke()
}
// luce che si somma: lampi, aloni, scintille
export function add(g, f) { g.save(); g.globalCompositeOperation = 'lighter'; f(); g.restore() }

// scintille: la posizione è una funzione dell'età
export function sparks(g, x, y, age, o) {
  if (age < 0 || age > o.life) return
  for (let i = 0; i < o.n; i++) {
    const a = (o.dir || 0) + (rnd(o.seed + i) - 0.5) * (o.spread ?? TAU)
    const v = o.v * (0.4 + 0.6 * rnd(o.seed + i + 99))
    const d = (o.r0 || 0) + v * age
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d + (o.grav || 0) * age * age
    const al = 1 - age / o.life
    if (o.line) {
      g.strokeStyle = rgba(o.col, al); g.lineWidth = o.w || 1.5; g.lineCap = 'round'
      g.beginPath(); g.moveTo(px, py)
      g.lineTo(px - Math.cos(a) * v * o.line, py - Math.sin(a) * v * o.line); g.stroke()
    } else disc(g, px, py, (o.r || 1.6) * (o.shrink ? al : 1), o.col, al)
  }
}

// l'onda che parte e sbiadisce; `piatto` la schiaccia come se fosse a terra
export function onda(g, x, y, age, dur, rmax, c, w = 3, piatto = 1) {
  const a = age / dur
  if (a < 0 || a > 1) return
  g.save(); g.translate(x, y); g.scale(1, piatto)
  ring(g, 0, 0, rmax * ease(a), c, w * (1 - a) + 0.5, 1 - a)
  g.restore()
}

export function flamma(g, x, y, r, a = 1) {
  add(g, () => glow(g, x, y, r * 2.6, '#ff5a1a', 0.55 * a))
  disc(g, x, y, r, '#ff7a1a', a); disc(g, x, y - r * 0.3, r * 0.62, '#ffd76a', a)
  disc(g, x, y - r * 0.5, r * 0.3, '#fff3c4', a)
}

export function fumo(g, x, y, age, n, sc, seme) {
  if (age < 0 || age > 1.1) return
  const k = age / 1.1
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (rnd(seme + i) - 0.5) * 2.4, v = sc * (0.4 + 0.6 * rnd(seme + i + 7))
    disc(g, x + Math.cos(ang) * v * k * 18, y + Math.sin(ang) * v * k * 16 - k * 10,
      (4 + 6 * rnd(seme + i + 3)) * (0.5 + k) * sc * 0.7, '#6f6862', 0.5 * (1 - k) * (1 - k * 0.3))
  }
}

export function cristallo(g, x, y, r, rot, c, a = 1) {
  g.save(); g.translate(x, y); g.rotate(rot)
  g.fillStyle = rgba(c, a); g.strokeStyle = rgba('#ffffff', a); g.lineWidth = 0.8
  g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.38, 0); g.lineTo(0, r * 0.55); g.lineTo(-r * 0.38, 0)
  g.closePath(); g.fill(); g.stroke(); g.restore()
}

export function fiocco(g, x, y, r, rot, a) {
  g.save(); g.translate(x, y); g.rotate(rot)
  g.strokeStyle = rgba('#ffffff', a); g.lineWidth = 1.2; g.lineCap = 'round'
  for (let i = 0; i < 6; i++) {
    g.rotate(TAU / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(r, 0)
    g.moveTo(r * 0.55, 0); g.lineTo(r * 0.75, r * 0.25)
    g.moveTo(r * 0.55, 0); g.lineTo(r * 0.75, -r * 0.25); g.stroke()
  }
  g.restore()
}

// fulmine a zig-zag da P a Q: il seme cambia a trenta fotogrammi al secondo, così sfarfalla
export function fulmineLinea(g, P, Q, seme, w, c, amp = 7) {
  const n = 7, dx = Q.x - P.x, dy = Q.y - P.y, L = Math.hypot(dx, dy) || 1
  const nx = -dy / L, ny = dx / L
  g.beginPath(); g.moveTo(P.x, P.y)
  for (let i = 1; i < n; i++) {
    const k = i / n, o = (rnd(seme + i) - 0.5) * 2 * amp
    g.lineTo(P.x + dx * k + nx * o, P.y + dy * k + ny * o)
  }
  g.lineTo(Q.x, Q.y); g.strokeStyle = c; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke()
}

export function freccia(g, x, y, an, { col, len = 1, pen }) {
  g.save(); g.translate(x, y); g.rotate(an); g.lineCap = 'round'
  g.strokeStyle = '#3f3427'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(-9 * len, 0); g.lineTo(5, 0); g.stroke()
  g.strokeStyle = '#f7efdd'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(-9 * len, 0); g.lineTo(5, 0); g.stroke()
  g.fillStyle = '#3f3427'; g.beginPath(); g.moveTo(11, 0); g.lineTo(4, -3.6); g.lineTo(4, 3.6); g.fill()
  g.fillStyle = pen || col; g.beginPath()
  g.moveTo(-8 * len, 0); g.lineTo(-13 * len, -3.6); g.lineTo(-9.6 * len, 0); g.lineTo(-13 * len, 3.6); g.fill()
  g.restore()
}
