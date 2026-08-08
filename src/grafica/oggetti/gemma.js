/* ── LA GEMMA ──
   Il premio piccolo. Cinque tinte, e la faccetta chiara in alto a
   sinistra è tutto quello che serve perché sembri di vetro: le pietre
   preziose dei giochi non si disegnano tonde, si disegnano **con due
   piani di luce diversi**. */
import { mescola, poligono } from '../comune.js'
import { raccolta } from './attrezzi.js'

const TINTE = {
  azzurra: '#7fe0ff', rossa: '#ff5a7a', verde: '#4fe08a',
  viola: '#c9a2ff', gialla: '#f7c945',
}
export const COLORI_GEMMA = Object.keys(TINTE)

export function gemma(p, cosa, S = p.S) {
  const col = TINTE[cosa.colore] || TINTE.azzurra
  const scuro = mescola(col, '#1a1226', 0.42)
  raccolta(p, cosa, S, 1, (q, s) => {
    const r = 3.4 * s, w = r * 0.9
    poligono(q, [[-w * 0.5, -r], [w * 0.5, -r], [w, -r * 0.25], [0, r], [-w, -r * 0.25]],
             col, scuro, 0.6 * s)
    poligono(q, [[-w * 0.5, -r], [w * 0.5, -r], [w * 0.15, -r * 0.25], [-w * 0.35, -r * 0.25]],
             mescola(col, '#ffffff', 0.55))
    poligono(q, [[-w, -r * 0.25], [-w * 0.35, -r * 0.25], [0, r]], mescola(col, '#ffffff', 0.3))
  })
}
