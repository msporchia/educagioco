// Il mostro in scena: quello che sta attorno alla bestia (ombra, volo,
// crosta di ghiaccio, barra della vita, segno «immune», corona del capo).
// Il corpo lo disegna un pittore di corpi-mostri.js, questo file lo chiama
// e basta.
import { BESTIE as VECCHIE } from './corpi-mostri.js'
import { PITTORI_MOSTRI } from '../mostri/indice.js'

const BESTIE = { ...VECCHIE, ...PITTORI_MOSTRI }

export const NOMI_BESTIE = Object.keys(BESTIE)

export const disegnaBestia = (p, id, s) => (BESTIE[id] || BESTIE.slime)(p, s)

export function ritratto(p, { x = 0, y = 0, bestia }) {
  p.in(x, y, q => disegnaBestia(q, bestia, q.S * 1.35))
}

// grigia come il nastro (il colore di una torre direbbe «questa», e il
// segno dice il contrario), scritta per esteso perché a 15 px un simbolo
// non si legge
export function segnoImmune(p, x, y, quanto) {
  if (!(quanto > 0)) return
  const S = p.S, w = 22 * S, h = 7 * S
  const su = (1 - quanto) * 4 * S
  p.velo(Math.min(1, quanto * 1.6), () => {
    p.ctx.fillStyle = '#f2eff6'; p.ctx.strokeStyle = '#6c6480'; p.ctx.lineWidth = 0.9 * S
    p.ctx.beginPath()
    p.ctx.roundRect(x - w / 2, y - h - su, w, h, h / 2)
    p.ctx.fill(); p.ctx.stroke()
    p.testo('immune', x, y - h / 2 - su, '#4a4458', 5.2 * S)
  })
}

export function corona(p, x, y, s) {
  p.figura([[x - 6 * s, y], [x - 6 * s, y - 5 * s], [x - 3 * s, y - 2.5 * s], [x, y - 6 * s],
            [x + 3 * s, y - 2.5 * s], [x + 6 * s, y - 5 * s], [x + 6 * s, y]], '#f5c542')
  p.rett(x - 6 * s, y - 0.8 * s, 12 * s, 1.6 * s, '#c8961e')
}

// `taglia` ingrandisce (il capo) o rimpicciolisce (i pezzi di chi si è
// diviso); `aTerra` lo stende di fianco finché non si rialza.
export function mostro(p, { x, y, bestia, vita = 1, gelo = 0, vola = false, taglia = 1,
                            capo = false, aTerra = false, respinto = 0 }) {
  // grosse quanto due terzi della strada: più piccole erano macchie
  const s = p.S * 1.35 * taglia
  const salto = aTerra ? 0
    : vola ? -7 * s + Math.sin(p.tempo * 2.6 + x * 0.05) * 2.2 * s
           : Math.sin(p.tempo * 6 + x * 0.08) * 1.2 * s
  p.velo(vola ? 0.6 : 1, () => p.ellisse(x, y + 6.5 * s, 6 * s, 2.2 * s, '#00000028'))
  if (aTerra) {
    p.velo(0.55, () => p.in(x, y + 3 * s, q => disegnaBestia(q, bestia, s), Math.PI / 2))
    for (let i = 0; i < 3; i++) {
      const a = p.tempo * 4 + i * 2.09
      p.cerchio(x + Math.cos(a) * 6 * s, y - 6 * s + Math.sin(a) * 2 * s, 1.2 * s, '#ffe27a')
    }
    return
  }
  p.in(x, y + salto, q => {
    disegnaBestia(q, bestia, s)
    if (gelo <= 0) return
    q.velo(0.55, () => q.cerchio(0, -0.6 * s, 8 * s, '#bfe6ff'))
    for (let i = 0; i < 3; i++) {          // la crosta di ghiaccio
      const a = i / 3 * 6.29 + 0.6
      q.figura([[Math.cos(a) * 6 * s, Math.sin(a) * 6 * s - 1 * s],
                [Math.cos(a + 0.5) * 8 * s, Math.sin(a + 0.5) * 8 * s - 1 * s],
                [Math.cos(a - 0.3) * 8.6 * s, Math.sin(a - 0.3) * 8.6 * s - 1 * s]], '#e8f7ff')
    }
  })
  // la barra della vita sta sopra la testa, ferma anche se il mostro vola
  const alto = y - 11 * s + (vola ? -7 * s : 0)
  const b = p.S * 1.35 * Math.min(taglia, 1.6)
  const w = 13 * b, q = Math.max(0, Math.min(1, vita))
  p.rett(x - w / 2 - 0.7 * b, alto - 0.7 * b, w + 1.4 * b, 2.6 * b + 1.4 * b, '#00000044')
  p.rett(x - w / 2, alto, w * q, 2.6 * b,
         q > 0.5 ? '#38c172' : q > 0.25 ? '#ffc93c' : '#ff5c7a')
  if (capo) corona(p, x, alto - 1.5 * b, b * 0.8)
  segnoImmune(p, x, alto - (capo ? 7 : 1.5) * b, respinto)
}
