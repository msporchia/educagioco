// La roccia: massi tondeggianti, non allineati — la stanza legge scavata, non costruita.
// Vedi docs/core/grafica.md.
import { mescola, dado, ell, velo } from '../comune.js'
import { masso, semina, crepa } from './semina.js'

// il pavimento della grotta
export function rocciaPosa(c, reg, A, lato, tinte, scoperto, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 53
  const passo = lato * 0.83                 // 83/100: non torna mai al passo della cella
  for (let k = Math.floor(reg.y0 / passo) - 1; k < Math.ceil(reg.y1 / passo) + 1; k++)
    for (let i = Math.floor(reg.x0 / passo) - 1; i < Math.ceil(reg.x1 / passo) + 1; i++) {
      if (scoperto && !scoperto(i * passo, k * passo, passo, passo)) continue
      const r = m => dado(i, k, 1000 + m + sm)
      const cx = (i + 0.5 + (r(1) - 0.5) * 0.7) * passo
      const cy = (k + 0.5 + (r(2) - 0.5) * 0.7) * passo
      const col = mescola(tinte[0], tinte[1], r(3))
      const g = r(4)
      const taglia = modo === 'franata' ? passo * (0.28 + g * g * g * 0.7) : passo * (0.6 + g * 0.34)
      masso(c, cx, cy, taglia, col,
            mescola(col, '#ffffff', modo === 'bagnata' ? 0.2 : 0.1),
            mescola(col, '#000000', 0.13),
            m => dado(i * 5 + m, k, 1020 + sm))
      if (modo === 'bagnata' && r(6) > 0.55)
        velo(c, 0.4, () => ell(c, cx - taglia * 0.15, cy - taglia * 0.2, taglia * 0.4, taglia * 0.14, '#bfe8ef'))
    }
  semina(reg, lato * 1.5, 13 + sm, 1, null, (x, y, r) => {
    if (r(1) < (modo === 'franata' ? 0.42 : 0.6)) return
    velo(c, modo === 'bagnata' ? 0.24 : 0.16, () =>
      ell(c, x, y, lato * (0.25 + r(2) * 0.45), lato * (0.1 + r(3) * 0.2),
          modo === 'bagnata' ? '#0d1418' : A.giunto))
  })
}
rocciaPosa.modi = ['normale', 'franata', 'bagnata']

// la parete di roccia viva: stessi massi ma più grossi e più contrastati
export function roccia(c, reg, A, lato, tinte, dentro, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 43
  const passo = lato * 0.42
  const bande = modo === 'stratificata'
  for (let k = Math.floor(reg.y0 / passo) - 1; k < Math.ceil(reg.y1 / passo) + 1; k++)
    for (let i = Math.floor(reg.x0 / passo) - 1; i < Math.ceil(reg.x1 / passo) + 1; i++) {
      if (dentro && !dentro(i * passo, k * passo, passo, passo)) continue
      const r = m => dado(i, k, 1200 + m + sm)
      const cx = (i + 0.5 + (r(1) - 0.5) * 0.9) * passo
      const cy = (k + 0.5 + (r(2) - 0.5) * 0.9) * passo
      let col = mescola(tinte[0], tinte[1], r(3))
      if (bande) {
        const banda = dado(0, Math.floor(cy / (lato * 0.55)), 1290 + sm)
        col = mescola(col, banda > 0.5 ? '#ffffff' : '#000000', 0.06 + banda * 0.06)
      }
      const g = r(4)
      const taglia = 0.34 + g * g * g * 1.25
      if (r(6) > 0.35)
        velo(c, 0.22, () => ell(c, cx, cy + passo * taglia * 0.42,
                                passo * taglia * 0.78, passo * taglia * 0.3,
                                mescola(tinte[1], '#000000', 0.55)))
      masso(c, cx, cy, passo * taglia, col,
            mescola(col, '#ffffff', 0.24), mescola(col, '#000000', 0.2),
            m => dado(i * 3 + m, k, 1220 + sm))
      if (r(7) > 0.72)
        velo(c, 0.5, () => ell(c, cx + passo * (r(8) - 0.5) * 0.5,
                               cy + passo * (r(9) - 0.5) * 0.5,
                               passo * taglia * 0.28, passo * taglia * 0.14,
                               mescola(col, '#ffffff', 0.3)))
    }
  semina(reg, lato * 1.5, 31 + sm, 1, null, (x, y, r) => {
    if (r(1) < (modo === 'frantumata' ? 0.2 : 0.55)) return
    velo(c, 0.42, () => crepa(c, x, y, lato * (0.6 + r(2) * 0.8),
                              mescola(tinte[1], '#000000', 0.5), r))
  })
}
roccia.modi = ['normale', 'stratificata', 'frantumata']
