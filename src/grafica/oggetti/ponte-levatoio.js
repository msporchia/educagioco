/* ── IL PONTE LEVATOIO ──
   Il ponte che si alza. `abbassato` da 0 (in piedi contro il muro) a 1
   (giù, ci si passa): mentre si abbassa le assi si accorciano in
   scorcio, e le due catene restano tese fino in fondo.

   Non è il ponte fisso con un'animazione: è un oggetto suo, perché a
   metà strada deve **sembrare inclinato**, e per farlo l'assito si
   schiaccia mentre le catene si allungano. */
import { mescola, tondo } from '../comune.js'
import { LATO, LEGNO, asse } from './attrezzi.js'

export function ponteLevatoio(p, cosa, S = p.S) {
  const { x, y, abbassato = 1, lato = LATO } = cosa
  const L = lato * S, h = L / 2
  const a = Math.max(0, Math.min(1, abbassato))
  const c = p.ctx
  // il fossato sotto: si vede solo se il ponte non copre tutto
  p.rett(x - h, y - h, L, L, '#14181e')
  p.velo(0.5, () => p.rett(x - h, y - h, L, L * 0.16, '#000000'))
  // l'assito: alto quanto la cella per `a`, schiacciato verso il muro
  const alt = Math.max(L * 0.12, L * a)
  const cima = y + h - alt
  const n = 4
  for (let i = 0; i < n; i++) {
    const hh = alt / n
    asse(p, x - h * 0.92, cima + i * hh, L * 0.92, hh * 0.94,
         i % 2 ? LEGNO.medio : LEGNO.chiaro, LEGNO.bordo, Math.max(0.8, L * 0.02))
  }
  // le fasce di ferro di traverso
  for (const v of [-1, 1])
    p.rett(x + v * h * 0.5 - L * 0.04, cima, L * 0.08, alt, mescola(LEGNO.ferroS, '#000000', 0.1))
  // le due catene, tese dal muro agli angoli del ponte
  for (const v of [-1, 1]) {
    c.strokeStyle = LEGNO.ferro; c.lineWidth = Math.max(1, L * 0.035)
    c.beginPath()
    c.moveTo(x + v * h * 0.8, y - h)
    c.lineTo(x + v * h * 0.86, cima + L * 0.04)
    c.stroke()
    tondo(p, x + v * h * 0.86, cima + L * 0.04, L * 0.035, L * 0.035, LEGNO.ferroL)
  }
}
