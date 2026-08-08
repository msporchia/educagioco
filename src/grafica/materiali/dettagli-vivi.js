/* ═══════════════════════════════════════════════════════════════════
   I DETTAGLI VIVI — erba, fiori, muschio, foglie, funghi, pozze

   Gli stessi patti degli altri dettagli — piccoli, tanti, deterministici,
   firma `(c, x, y, s, A, r)` — ma questi sono quelli che crescono, e
   prendono i colori dall'ambiente (`A.erbaC`, `A.erbaS`, `A.muschio`,
   `A.fungo`), non da una tavolozza loro: lo stesso ciuffo deve poter
   stare in un cortile assolato e in una cripta.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, ell, velo, poly } from '../comune.js'

export function ciuffi(c, x, y, s, A, r) {        // erba a V, come nel castello
  const h = (2 + r(1) * 2.4) * s
  c.strokeStyle = r(2) > 0.35 ? A.erbaS : A.erbaC
  c.lineWidth = 0.65 * s; c.lineCap = 'round'
  c.beginPath(); c.moveTo(x, y)
  c.quadraticCurveTo(x - 0.75 * s, y - h * 0.6, x - 1.5 * s, y - h); c.stroke()
  c.beginPath(); c.moveTo(x + 0.75 * s, y)
  c.quadraticCurveTo(x + 1 * s, y - h * 0.5, x + 1.8 * s, y - h * 0.8); c.stroke()
}

export function fiori(c, x, y, s, A, r) {
  const col = ['#fff6d8', '#ffd9e8', '#ffe9a0'][Math.floor(r(1) * 3)]
  for (let k = 0; k < 5; k++) {
    const a = k / 5 * 6.29
    ell(c, x + Math.cos(a) * 0.95 * s, y + Math.sin(a) * 0.95 * s, 0.65 * s, 0.65 * s, col)
  }
  ell(c, x, y, 0.5 * s, 0.5 * s, '#e8a33c')
}

export function muschio(c, x, y, s, A, r) {
  velo(c, 0.55 + r(1) * 0.35, () => {
    for (let k = 0; k < 5; k++)
      ell(c, x + (r(k) - 0.5) * 3.5 * s, y + (r(k + 5) - 0.5) * 2 * s,
          (0.7 + r(k + 10) * 0.9) * s, (0.5 + r(k + 15) * 0.6) * s,
          k % 2 ? A.muschio : mescola(A.muschio, '#ffffff', 0.25))
  })
}

export function foglie(c, x, y, s, A, r) {
  if (r(1) < 0.5) return
  const col = ['#c9803c', '#a8642c', '#d9a04a'][Math.floor(r(2) * 3)]
  c.save(); c.translate(x, y); c.rotate(r(3) * 6.29)
  poly(c, [[0, -1.2 * s], [0.9 * s, 0], [0, 1.2 * s], [-0.9 * s, 0]], col)
  c.restore()
}

export function pozze(c, x, y, s, A, r) {
  if (r(1) < 0.55) return
  const rx = (2.5 + r(2) * 3.5) * s
  velo(c, 0.5, () => ell(c, x, y, rx, rx * 0.42, '#0d1418'))
  velo(c, 0.35, () => ell(c, x - rx * 0.15, y - rx * 0.08, rx * 0.55, rx * 0.16, '#9fd8ff'))
  velo(c, 0.25, () => {
    c.strokeStyle = '#c9e8ff'; c.lineWidth = 0.45 * s
    c.beginPath(); c.ellipse(x, y, rx, rx * 0.42, 0, 0, 6.29); c.stroke()
  })
}

/* i funghi della grotta e del bosco: due o tre, minuscoli, il cappello
   chiaro e il gambo più chiaro ancora. Al buio sono l'unica cosa che
   si vede, e bastano. */
export function funghi(c, x, y, s, A, r) {
  if (r(1) < 0.55) return
  const n = 1 + Math.floor(r(2) * 3)
  const col = r(3) > 0.6 ? '#c05a4a' : (A.fungo || '#8fb8c9')
  for (let k = 0; k < n; k++) {
    const mx = x + (r(k + 4) - 0.5) * 3.5 * s, my = y + (r(k + 7) - 0.5) * 2 * s
    const h = (1 + r(k + 10) * 1) * s
    c.fillStyle = '#e8e0cc'; c.fillRect(mx - 0.24 * s, my - h, 0.48 * s, h)
    ell(c, mx, my - h, (0.78 + r(k + 13) * 0.45) * s, (0.5 + r(k + 16) * 0.25) * s, col)
    ell(c, mx - 0.2 * s, my - h - 0.15 * s, 0.26 * s, 0.16 * s, mescola(col, '#ffffff', 0.45))
  }
}

/* il sottobosco: un cespuglio è tre ellissi scure e due lumi. Più di
   così, in una stanza dove ci si deve muovere, diventa un ostacolo
   che ostacolo non è. */
export function cespugli(c, x, y, s, A, r) {
  if (r(1) < 0.5) return
  const scuro = A.erbaS, chiaro = A.erbaC
  velo(c, 0.9, () => {
    ell(c, x, y + 0.5 * s, 3 * s, 1 * s, '#00000022')
    for (const [dx, dy, rr] of [[-1.2, -0.5, 1.6], [1.1, -0.7, 1.5], [0, -1.3, 1.7]])
      ell(c, x + dx * s, y + dy * s, rr * s, rr * 0.8 * s, mescola(scuro, '#000000', 0.12))
    for (const [dx, dy] of [[-1.3, -1.2], [0.8, -1.7]])
      ell(c, x + dx * s, y + dy * s, 0.8 * s, 0.55 * s, chiaro)
    if (r(2) > 0.75)                    // qualche bacca
      for (const [dx, dy] of [[0.7, -0.5], [-0.9, -0.2]])
        ell(c, x + dx * s, y + dy * s, 0.35 * s, 0.35 * s, '#c0453f')
  })
}
