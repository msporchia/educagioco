/* ═════ IL GOLEM ═════
   Pietra, non carne: niente di tondo, tutto a spigoli, e le giunture
   che si vedono. È la creatura che dice «difesa alta» a colpo d'occhio
   — nel dungeon la difesa è il numero che rende un colpo inutile, e
   avere una figura che la annuncia vale più di una scritta.

   La vena luminosa che gli corre nel petto pulsa piano: è l'unica cosa
   viva addosso a un mucchio di sassi, ed è il modo di dirlo senza
   dargli una faccia. */
import { mescola, capsula, poligono, tondo } from '../comune.js'

export const GOLEM = {
  spalle: 7.8, taglia: 1.16, arti: 1.4,
  col: {
    pelle: '#7a7568', pelleS: '#5a564c',
    manica: '#6e6a5e', manicaS: '#524e45',
    gambe: '#6a6659', gambeS: '#4e4a41',
    scarpe: '#413d36', scarpeS: '#332f2a',
    vena: '#ffb347', muschio: '#5c7a45', bordo: '#2a2620',
  },
  tronco(q, s, C) {
    const b = C.bordo, sp = 0.9 * s
    const t = q.tempo || 0
    // un blocco squadrato, non un busto: gli angoli sono il personaggio
    poligono(q, [[-7.4 * s, -13.6 * s], [7.4 * s, -13.6 * s], [6.4 * s, -4.6 * s], [-6.4 * s, -4.6 * s]],
             C.pelle, b, sp)
    // le crepe fra i blocchi, dritte e ad angolo retto
    q.ctx.strokeStyle = C.pelleS; q.ctx.lineWidth = 0.7 * s
    q.ctx.beginPath()
    q.ctx.moveTo(-7 * s, -9.4 * s); q.ctx.lineTo(7 * s, -9.4 * s)
    q.ctx.moveTo(-2.4 * s, -13.4 * s); q.ctx.lineTo(-2.4 * s, -9.4 * s)
    q.ctx.moveTo(3 * s, -9.4 * s); q.ctx.lineTo(3 * s, -4.8 * s)
    q.ctx.stroke()
    // la vena: pulsa, ed è l'unica luce addosso
    const pulsa = 0.55 + Math.sin(t * 1.8) * 0.45
    q.velo(0.35 + pulsa * 0.3, () => q.cerchio(0, -10.4 * s, 3.4 * s, C.vena))
    poligono(q, [[-1 * s, -12.4 * s], [1 * s, -12.4 * s], [0.4 * s, -10.6 * s],
                 [1.6 * s, -10.6 * s], [-0.6 * s, -8 * s], [0.2 * s, -10 * s], [-1.2 * s, -10 * s]],
             mescola(C.vena, '#ffffff', 0.3))
    // il muschio sulle spalle: la cosa che dice «sta qui da sempre»
    for (const [dx, dy] of [[-5.4, -13.2], [5, -13.4], [-6.2, -11.6]])
      tondo(q, dx * s, dy * s, 1.6 * s, 0.9 * s, C.muschio)
  },
  testa(q, s, C, dir, stato) {
    const b = C.bordo, sp = 0.85 * s, R = 3.8 * s
    // la testa è un masso incassato: nessun collo, e sta più in basso
    // delle spalle. Un golem col collo sembra un cavaliere in armatura
    poligono(q, [[-R, -R * 0.5], [R, -R * 0.5], [R * 0.86, R], [-R * 0.86, R]], C.pelle, b, sp)
    poligono(q, [[-R * 0.9, -R * 0.5], [R * 0.9, -R * 0.5], [R * 0.7, -R * 1.1], [-R * 0.7, -R * 1.1]],
             C.pelleS, b, sp * 0.9)
    if (stato === 'ko') {
      q.ctx.strokeStyle = C.pelleS; q.ctx.lineWidth = 0.7 * s; q.ctx.lineCap = 'round'
      for (const v of [-1, 1]) {
        q.ctx.beginPath()
        q.ctx.moveTo(v * 1.2 * s - 0.7 * s, -0.5 * s); q.ctx.lineTo(v * 1.2 * s + 0.7 * s, 0.7 * s)
        q.ctx.moveTo(v * 1.2 * s + 0.7 * s, -0.5 * s); q.ctx.lineTo(v * 1.2 * s - 0.7 * s, 0.7 * s)
        q.ctx.stroke()
      }
      return
    }
    // due fessure che brillano, non due occhi: dentro non c'è nessuno
    for (const v of [-1, 1]) {
      q.velo(0.45, () => q.ellisse(v * 1.5 * s, 0.2 * s, 1.5 * s, 0.9 * s, C.vena))
      q.ellisse(v * 1.5 * s, 0.2 * s, 0.9 * s, 0.4 * s, mescola(C.vena, '#ffffff', 0.5))
    }
    q.rett(-2 * s, 2.2 * s, 4 * s, 0.7 * s, C.pelleS)                 // la fessura della bocca
  },
}
