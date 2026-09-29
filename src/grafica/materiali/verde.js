// Il verde: l'erba (unico pavimento senza celle squadrate) e gli alberi
// (una muratura che non è muratura: le celle chiuse sono chiome, ma la
// macchina che dipinge i muri va bene lo stesso — il filo di luce diventa
// il sole sulle cime). Vedi docs/core/grafica.md.
import { mescola, dado, rett, ell, velo } from '../comune.js'
import { semina } from './semina.js'

// tinte non usata qui: il verde del prato viene da A.fondo, arrivano solo le chiazze di terra (A.terra)
export function erba(c, reg, A, lato, tinte, scoperto, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 101
  const soglia = modo === 'secca' ? 0.72 : modo === 'alta' ? 0.32 : 0.55
  const tono = modo === 'secca' ? mescola(A.terra, '#c9a04a', 0.4) : A.terra
  const dentro = scoperto ? (x, y) => scoperto(x - lato, y - lato, lato * 2, lato * 2) : null
  semina(reg, lato * 2.1, 11 + sm, 1, dentro, (x, y, r) => {
    if (r(1) > soglia) return
    const rx = lato * (0.4 + r(2) * 0.8) * (modo === 'secca' ? 1.25 : 1)
    velo(c, 0.42 + r(3) * 0.26, () => ell(c, x, y, rx, rx * (0.5 + r(4) * 0.3), tono))
    velo(c, 0.3, () => ell(c, x - rx * 0.2, y - rx * 0.15, rx * 0.6, rx * 0.3,
                           mescola(tono, '#ffffff', 0.25)))
  })
  if (modo === 'alta')
    semina(reg, lato * 0.7, 41 + sm, 1,
      scoperto ? (x, y) => scoperto(x - lato * 0.4, y - lato * 0.4, lato * 0.8, lato * 0.8) : null,
      (x, y, r) => {
        if (r(1) > 0.45) return
        velo(c, 0.34 + r(2) * 0.22, () => {
          c.strokeStyle = mescola(A.chiazze ? A.chiazze[1] : '#284a28', '#000000', 0.2)
          c.lineWidth = lato * 0.03; c.lineCap = 'round'
          c.beginPath()
          c.moveTo(x, y + lato * 0.16)
          c.lineTo(x + lato * (r(3) - 0.5) * 0.24, y - lato * 0.24)
          c.stroke()
        })
      })
}
erba.modi = ['normale', 'secca', 'alta']

// un bosco visto dall'alto è chioma: il tronco si indovina, non si disegna
export function alberi(c, reg, A, lato, tinte, dentro, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 103
  const vira = col => modo === 'autunno' ? mescola(col, '#c96a2c', 0.55)
                     : modo === 'secco' ? mescola(col, '#8a7a52', 0.55) : col
  const sotto = mescola(tinte[1], '#000000', 0.35)
  const passo = lato * 0.5
  for (let k = Math.floor(reg.y0 / passo) - 1; k < Math.ceil(reg.y1 / passo) + 1; k++)
    for (let i = Math.floor(reg.x0 / passo) - 1; i < Math.ceil(reg.x1 / passo) + 1; i++) {
      const r = m => dado(i, k, 1300 + m + sm)
      const cx = (i + 0.5 + (r(1) - 0.5) * 0.9) * passo
      const cy = (k + 0.5 + (r(2) - 0.5) * 0.9) * passo
      const rr = passo * (0.55 + r(3) * 0.45) * (modo === 'secco' ? 0.8 : 1)
      // il permesso si chiede sul riquadro vero della chioma (jitter + raggio), non sulla cella
      if (dentro && !dentro(cx - rr, cy - rr * 1.1, rr * 2, rr * 2.2)) continue
      rett(c, i * passo, k * passo, passo, passo, sotto)
      if (modo === 'secco' && r(6) > 0.72) continue
      const col = vira(mescola(tinte[0], tinte[1], r(4)))
      ell(c, cx, cy + rr * 0.25, rr, rr * 0.82, mescola(col, '#000000', 0.3))
      ell(c, cx, cy, rr, rr * 0.86, col)
      if (r(5) > 0.4)
        ell(c, cx - rr * 0.28, cy - rr * 0.3, rr * 0.45, rr * 0.32,
            mescola(col, modo === 'autunno' ? '#ffe08a' : '#ffffff', 0.22))
    }
  semina(reg, lato * 1.9, 37 + sm, 1,
    dentro ? (x, y) => dentro(x - lato * 0.25, y - lato * 0.25, lato * 0.5, lato * 0.5) : null,
    (x, y, r) => {
      if (r(1) < (modo === 'secco' ? 0.4 : 0.62)) return
      velo(c, 0.55, () => {
        ell(c, x, y, lato * 0.16, lato * 0.13, '#4a3520')
        ell(c, x - lato * 0.05, y - lato * 0.04, lato * 0.07, lato * 0.05, '#6a4f30')
      })
    })
}
alberi.modi = ['normale', 'autunno', 'secco']
