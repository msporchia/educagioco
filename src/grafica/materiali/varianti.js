// Le varianti di posa: il disegno che cambia a macchie, non a celle. Vedi docs/core/grafica.md.
import { dado, velo } from '../comune.js'
import { POSATURE } from './posature.js'

export const MODULO = 5

// i siti delle macchie, deterministici come tutto il resto
export function macchie(reg, lato, seme, quali, fn) {
  const passo = lato * MODULO
  const gx0 = Math.floor(reg.x0 / passo) - 1, gx1 = Math.ceil(reg.x1 / passo) + 1
  const gy0 = Math.floor(reg.y0 / passo) - 1, gy1 = Math.ceil(reg.y1 / passo) + 1
  for (let gy = gy0; gy < gy1; gy++)
    for (let gx = gx0; gx < gx1; gx++) {
      const d = m => dado(gx * 13 + m, gy * 7, seme)
      const cx = (gx + 0.5 + (d(1) - 0.5) * 1.1) * passo
      const cy = (gy + 0.5 + (d(2) - 0.5) * 1.1) * passo
      const raggio = passo * (0.46 + d(3) * 0.38)
      // i siti nascono anche fuori dalla stanza (altrimenti il bordo si vedrebbe), ma
      // quello che cade tutto fuori non lo dipinge nessuno: su una mappa grande è metà dei siti
      if (cx + raggio < reg.x0 || cx - raggio > reg.x1 ||
          cy + raggio < reg.y0 || cy - raggio > reg.y1) continue
      fn(quali[Math.floor(d(4) * quali.length) % quali.length], cx, cy, raggio,
         (a, b = 0) => dado(gx * 31 + a, gy * 17 + b, seme + 5))
    }
}

// il sacchetto di scorta, per un ambiente che non dice il suo
const PREDEFINITE = ['liscio', 'liscio', 'usura', 'ombra', 'detriti']

// il passaggio che mappa.js chiama: prima il fondo mosso, poi le macchie che dicono dove
export function variazioni(c, reg, A, lato, seme = 71) {
  semina0(c, reg, A, lato)
  macchie(reg, lato, seme, A.varianti || PREDEFINITE, (quale, cx, cy, R, r) => {
    const fn = POSATURE[quale]
    if (fn) fn(c, cx, cy, R, A, lato, r)
  })
}

// il fondo mosso: senza, il pavimento sotto le macchie sarebbe una tinta piatta
function semina0(c, reg, A, lato) {
  const passo = lato * 0.8
  const gx0 = Math.floor(reg.x0 / passo), gx1 = Math.ceil(reg.x1 / passo)
  const gy0 = Math.floor(reg.y0 / passo), gy1 = Math.ceil(reg.y1 / passo)
  for (let gy = gy0; gy < gy1; gy++)
    for (let gx = gx0; gx < gx1; gx++) {
      const r = m => dado(gx * 7, gy * 13, 3 + m)
      const x = (gx + r(1)) * passo, y = (gy + r(2)) * passo
      const rx = lato * (0.14 + r(3) * 0.4)
      velo(c, 0.04 + r(4) * 0.055, () => {
        c.fillStyle = r(5) > 0.5 ? A.chiazze[0] : A.chiazze[1]
        c.beginPath()
        c.ellipse(x, y, rx, rx * (0.35 + r(6) * 0.4), r(7) * 3, 0, 6.29)
        c.fill()
      })
    }
}
