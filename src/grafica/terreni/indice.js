// I terreni del castello — l'indice: tre terreni, venti tavolozze.
// Vedi docs/core/grafica.md per lo schema completo.
import { seminato } from '../tela.js'
import { BOSCO, VARIANTI_BOSCO, VARIANTI_PALUDE, TERRENO_BOSCO } from './bosco.js'
import { SOTTERRANEO, VARIANTI_SOTTERRANEO, TERRENO_SOTTERRANEO } from './sotterraneo.js'
import { MURA, VARIANTI_MURA, TERRENO_MURA } from './mura.js'

function tavolozze(base, varianti, terreno) {
  const out = {}
  for (const k in varianti) out[k] = { ...base, ...varianti[k], terreno }
  return out
}

export const TERRENI = {
  ...tavolozze(BOSCO, VARIANTI_BOSCO, TERRENO_BOSCO),
  ...tavolozze(BOSCO, VARIANTI_PALUDE, TERRENO_BOSCO),   // la palude è un bosco allagato
  ...tavolozze(SOTTERRANEO, VARIANTI_SOTTERRANEO, TERRENO_SOTTERRANEO),
  ...tavolozze(MURA, VARIANTI_MURA, TERRENO_MURA),
}

export const NOMI_TERRENI = Object.keys(TERRENI)

export const terrenoDi = nome => TERRENI[nome] || TERRENI['bosco-chiaro']

// il fondale intero: la funzione che tela.dipingiFondale vuole
export function campo({ via, vie, postazioni, seme = 1, ambiente }) {
  const A = terrenoDi(ambiente)
  const strade = vie && vie.length ? vie : [via]
  const T = A.terreno
  return p => {
    const { W, H, S } = p
    const caso = seminato(seme * 7919 + 13)
    const lato = (T.maglia || 26) * S
    const reg = { x0: 0, y0: 0, x1: W, y1: H }

    const lungoStrada = strade.flatMap(v => v.campiona(8))
    const vicino = (x, y) => {
      let m = Infinity
      for (const c of lungoStrada) {
        const d = (c.x - x) ** 2 + (c.y - y) ** 2
        if (d < m) m = d
      }
      return Math.sqrt(m)
    }

    const scena = { caso, vicino, lato, reg, via, vie: strade, postazioni }
    T.fondo(p, A, scena)
    for (const v of strade) T.strada(p, A, { ...scena, via: v })
    T.minuti(p, A, scena)
    T.sparso(p, A, scena)
    for (const q of postazioni) T.piazzola(p, q.x, q.y, A, caso)
    T.velo(p, A, scena)
  }
}
