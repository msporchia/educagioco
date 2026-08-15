/* ═════ IL GRANCHIONE ═════
   Roba di fogna e di pozza: guscio largo a piastre, due chele grosse
   tenute alte, occhi su due steli. Gli steli sono la firma — un
   granchio con gli occhi sul guscio è un sasso con le pinze.

   Le chele si aprono e si chiudono in controtempo fra loro: due chele
   sincronizzate sembrano un meccanismo, sfasate sembrano una bestia. */
import { mescola, tondo } from '../comune.js'
import { zampe, chela, corazza } from './comune.js'

export const GRANCHIO = {
  quadrupede: true, taglia: 1.05,
  col: {
    guscio: '#c0503f', guscioS: '#8e3327', pancia: '#e8a07e',
    stelo: '#a8402f', occhio: '#f7f4ea', bordo: '#3d1610',
  },
  disegna(q, s, C, dir, sw, stato) {
    const t = q.tempo || 0
    const b = C.bordo
    zampe(q, s, 3, { lungo: 6.4, apri: 1.15, su: 2.6, y: -0.6,
                     col: C.guscioS, sp: 1.1, fremito: t * 2.6 })
    for (const v of [-1, 1])                                         // le chele in controtempo
      chela(q, s, v * 5.6 * s, -3.4 * s, v, C.guscio, b,
            { grande: 1.25, stretta: 0.5 + Math.sin(t * 2.2 + (v > 0 ? 0 : 1.7)) * 0.5 })
    q.in(0, -3 * s, r => corazza(r, s, 6, 4, C.guscio, b, 3))        // il guscio largo
    tondo(q, 0, -2 * s, 3.4 * s, 1.6 * s, mescola(C.pancia, C.guscio, 0.5))
    for (const v of [-1, 1]) {                                       // gli occhi sugli steli
      const oscilla = Math.sin(t * 1.6 + v) * 0.4 * s
      q.linea([{ x: v * 1.8 * s, y: -5.4 * s }, { x: v * 2.2 * s + oscilla, y: -9 * s }],
              C.stelo, 1 * s)
      if (stato === 'ko') {
        q.ctx.strokeStyle = b; q.ctx.lineWidth = 0.5 * s; q.ctx.lineCap = 'round'
        q.ctx.beginPath()
        q.ctx.moveTo(v * 1.4 * s + oscilla, -10 * s); q.ctx.lineTo(v * 3 * s + oscilla, -8.6 * s)
        q.ctx.moveTo(v * 3 * s + oscilla, -10 * s); q.ctx.lineTo(v * 1.4 * s + oscilla, -8.6 * s)
        q.ctx.stroke()
      } else {
        q.cerchio(v * 2.2 * s + oscilla, -9.4 * s, 1.3 * s, C.occhio)
        q.cerchio(v * 2.2 * s + oscilla, -9.4 * s, 0.62 * s, '#1b1430')
      }
    }
    // la bocca schiumosa, due file di frange che si muovono
    q.ctx.strokeStyle = mescola(C.pancia, '#ffffff', 0.3); q.ctx.lineWidth = 0.5 * s
    for (const v of [-1, 1]) {
      q.ctx.beginPath()
      q.ctx.moveTo(v * 0.8 * s, -1.4 * s)
      q.ctx.lineTo(v * (1.4 + Math.sin(t * 4 + v) * 0.3) * s, 0.4 * s)
      q.ctx.stroke()
    }
  },
}
