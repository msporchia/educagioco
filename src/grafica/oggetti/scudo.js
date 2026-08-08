/* ── LO SCUDO ──
   Rotondo, con l'umbone al centro e le borchie: è lo scudo del
   cavaliere staccato dal cavaliere, e serve così — un pezzo di
   equipaggiamento per terra vuol dire «qui c'è stata una battaglia»
   oppure «prendimi», e in tutti e due i casi funziona. */
import { mescola, tondo } from '../comune.js'
import { raccolta } from './attrezzi.js'

export function scudo(p, cosa, S = p.S) {
  const blu = cosa.colore || '#3f63c8'
  const ferro = '#cfd8e6', bordo = '#241b33', oro = '#f2c94c'
  raccolta(p, cosa, S, 1, (q, s) => {
    tondo(q, 0, 0, 4.2 * s, 4.6 * s, blu, bordo, 0.7 * s)
    tondo(q, 0, 0, 3.4 * s, 3.8 * s, mescola(blu, '#000000', 0.22))
    tondo(q, 0, 0, 1.5 * s, 1.6 * s, ferro, bordo, 0.6 * s)      // l'umbone
    tondo(q, -0.4 * s, -0.5 * s, 0.6 * s, 0.5 * s, '#ffffff')
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * 6.29 + 0.78
      tondo(q, Math.cos(a) * 2.9 * s, Math.sin(a) * 3.2 * s, 0.5 * s, 0.5 * s, oro)
    }
  })
}
