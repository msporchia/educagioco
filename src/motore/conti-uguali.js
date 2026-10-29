// I conti che vengono uguali al bit su ogni telefono, per i motori che girano in due col lockstep (docs/core/insieme.md).
// La specifica lascia a ogni browser come arrotondare `Math.hypot`, la trigonometria, `pow`, `exp` e `log`; le quattro operazioni
// e `Math.sqrt` invece sono esatte ovunque. Qui c'è solo quello: riduzione dell'argomento e serie fino all'ultima cifra.
// Lo controlla unita/conti-uguali (lo scarto da Math sotto 1e-14).

const PI = Math.PI, MEZZO_PI = PI / 2, DUE_PI = 2 * PI
const LN2 = 0.6931471805599453
const RADICE3 = Math.sqrt(3)
const TAN_PI_12 = 2 - RADICE3          // sotto questa la serie dell'arcotangente converge in pochi termini

export const ipot = (dx, dy) => Math.sqrt(dx * dx + dy * dy)

// la potenza intera (`x ** n` con n intero non negativo), moltiplicando
export function potenzaIntera(x, n) {
  let r = 1
  for (let i = 0; i < n; i++) r *= x
  return r
}

export function arcotangente(x) {
  if (x !== x) return x
  if (x < 0) return -arcotangente(-x)
  if (x > 1) return MEZZO_PI - arcotangente(1 / x)
  let base = 0
  if (x > TAN_PI_12) { base = PI / 6; x = (x * RADICE3 - 1) / (x + RADICE3) }   // atan x = π/6 + atan((x√3 − 1)/(x + √3))
  const q = x * x
  let termine = x, somma = 0
  for (let k = 1; k < 40; k += 2) { somma += termine / k; termine *= -q }
  return base + somma
}

export function arcotangente2(y, x) {
  if (x > 0) return arcotangente(y / x)
  if (x < 0) return y >= 0 ? arcotangente(y / x) + PI : arcotangente(y / x) - PI
  return y > 0 ? MEZZO_PI : y < 0 ? -MEZZO_PI : 0
}

export function arcocoseno(x) {
  if (x >= 1) return 0
  if (x <= -1) return PI
  return 2 * arcotangente(Math.sqrt((1 - x) / (1 + x)))
}

// coseno e seno: l'angolo riportato fra −π/4 e π/4, poi la serie
function serieCos(a) { const q = a * a; let t = 1, s = 0; for (let k = 0; k < 14; k++) { s += t; t *= -q / ((2 * k + 1) * (2 * k + 2)) } return s }
function serieSin(a) { const q = a * a; let t = a, s = 0; for (let k = 0; k < 14; k++) { s += t; t *= -q / ((2 * k + 2) * (2 * k + 3)) } return s }
function quarto(a) {
  a -= DUE_PI * Math.round(a / DUE_PI)
  const n = Math.round(a / MEZZO_PI)
  return { n: ((n % 4) + 4) % 4, r: a - n * MEZZO_PI }
}
export function coseno(a) {
  const { n, r } = quarto(a)
  return n === 0 ? serieCos(r) : n === 1 ? -serieSin(r) : n === 2 ? -serieCos(r) : serieSin(r)
}
export function seno(a) {
  const { n, r } = quarto(a)
  return n === 0 ? serieSin(r) : n === 1 ? serieCos(r) : n === 2 ? -serieSin(r) : -serieCos(r)
}

// il logaritmo naturale: x = m · 2^k con m fra 0,75 e 1,5, poi ln m = 2 · atanh((m − 1)/(m + 1))
export function logaritmo(x) {
  if (!(x > 0)) return x === 0 ? -Infinity : NaN
  if (x === Infinity) return x
  let k = 0
  while (x >= 1.5) { x /= 2; k++ }
  while (x < 0.75) { x *= 2; k-- }
  const z = (x - 1) / (x + 1), q = z * z
  let termine = z, somma = 0
  for (let j = 1; j < 40; j += 2) { somma += termine / j; termine *= q }
  return 2 * somma + k * LN2
}

// l'esponenziale: e^t = 2^k · e^r con |r| ≤ ln2/2, poi la serie
export function esponenziale(t) {
  if (t !== t) return t
  if (t > 709) return Infinity
  if (t < -745) return 0
  const k = Math.round(t / LN2), r = t - k * LN2
  let termine = 1, somma = 0
  for (let j = 1; j < 24; j++) { somma += termine; termine *= r / j }
  let p = somma
  for (let i = 0; i < Math.abs(k); i++) p = k > 0 ? p * 2 : p / 2
  return p
}

// x^e per x ≥ 0
export const potenza = (x, e) => (x === 0 ? (e > 0 ? 0 : e === 0 ? 1 : Infinity) : esponenziale(e * logaritmo(x)))
