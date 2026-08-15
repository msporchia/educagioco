/* ═════ IL TOPO ═════
   Il nemico più debole del gioco intero, e deve sembrarlo: piccolo,
   tondo, con le orecchie enormi e il naso rosa. Non fa paura ed è
   giusto così — è quello su cui si impara che rispondere bene fa
   danno, e se facesse paura la prima lezione arriverebbe storta.

   Le orecchie sono grandi quanto mezza testa: è l'unica cosa che a
   colpo d'occhio lo distingue da un qualunque batuffolo grigio. */
import { mescola, tondo, capsula } from '../comune.js'
import { occhi } from '../segni.js'

export const TOPO = {
  quadrupede: true, taglia: 0.86,
  col: {
    pelo: '#7d7486', peloS: '#5c5468', pancia: '#b3a9bd',
    orecchio: '#d99ab0', naso: '#e07f9c', coda: '#c69cae', bordo: '#241c33',
  },
  disegna(q, s, C, dir, sw, stato) {
    const t = q.tempo || 0
    const b = C.bordo, sp = 0.75 * s
    // la coda esce da dietro e frusta piano: è il segno che è vivo
    q.ctx.strokeStyle = C.coda; q.ctx.lineWidth = 0.9 * s; q.ctx.lineCap = 'round'
    q.ctx.beginPath()
    q.ctx.moveTo(0, -1 * s)
    q.ctx.quadraticCurveTo(5.5 * s, (0.5 + Math.sin(t * 3) * 1.4) * s,
                           7.5 * s, (-4 + Math.sin(t * 3) * 2.2) * s)
    q.ctx.stroke()
    // le zampette davanti, appoggiate come chi rosicchia
    for (const v of [-1, 1]) capsula(q, v * 2 * s, 1.4 * s, 0.8 * s, 1.4 * s, 0.7 * s, C.peloS, b, sp * 0.8)
    tondo(q, 0, -3 * s, 4.6 * s, 4.2 * s, C.pelo, b, sp)          // il corpo
    tondo(q, 0, -1.6 * s, 2.6 * s, 2.4 * s, C.pancia)
    for (const v of [-1, 1]) {                                     // le orecchie
      tondo(q, v * 3 * s, -7.4 * s, 2.4 * s, 2.4 * s, C.peloS, b, sp)
      tondo(q, v * 3 * s, -7.2 * s, 1.4 * s, 1.5 * s, C.orecchio)
    }
    tondo(q, 0, -5.6 * s, 3.4 * s, 3 * s, C.pelo, b, sp)           // la testa
    occhi(q, s, 1.5, -6, 0.68, stato)
    tondo(q, 0, -4.2 * s, 0.75 * s, 0.6 * s, C.naso)               // il musetto
    q.ctx.strokeStyle = mescola(C.peloS, '#ffffff', 0.35); q.ctx.lineWidth = 0.34 * s
    for (const v of [-1, 1])
      for (const d of [-0.7, 0.2]) {
        q.ctx.beginPath()
        q.ctx.moveTo(v * 0.6 * s, -4.2 * s)
        q.ctx.lineTo(v * 4 * s, (-4.6 + d) * s)
        q.ctx.stroke()
      }
  },
}
