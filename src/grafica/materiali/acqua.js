/* ═══════════════════════════════════════════════════════════════════
   L'ACQUA — il mattone bagnato delle fogne

   Gli stessi mattoni della cripta, e poi l'acqua che ci sta sopra: le
   colature scure lungo i giunti, il velo verdastro a chiazze, e i
   lucidi — righe chiare piatte che sono il riflesso della volta.

   Il velo è tenuto basso apposta: **bagnato vuol dire lucido a
   tratti**, non verde tutto. Una fogna verde piena diventa una tinta
   piatta, e i personaggi ci annegano dentro come in un pavimento
   troppo carico.
   ═══════════════════════════════════════════════════════════════════ */
import { ell, velo } from '../comune.js'
import { semina } from './semina.js'
import { mattoniPosa } from './pietra.js'

export function umido(c, reg, A, lato, scoperto) {
  mattoniPosa(c, reg, A, lato, scoperto)
  semina(reg, lato * 1.55, 27, 1, null, (x, y, r) => {
    if (r(1) < 0.45) return
    const rx = lato * (0.25 + r(2) * 0.65)
    velo(c, 0.1 + r(3) * 0.13, () =>
      ell(c, x, y, rx, rx * (0.3 + r(4) * 0.3), r(5) > 0.5 ? A.muschio : '#0d1418'))
  })
  // i lucidi: piatti, orizzontali, e mai due uguali
  semina(reg, lato * 2.2, 29, 1, null, (x, y, r) => {
    if (r(1) < 0.6) return
    velo(c, 0.14 + r(2) * 0.1, () =>
      ell(c, x, y, lato * (0.15 + r(3) * 0.25), lato * 0.03, '#bfe8ef'))
  })
}
