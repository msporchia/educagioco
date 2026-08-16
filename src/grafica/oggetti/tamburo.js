/* ── IL TAMBURO ──
   Come `falena.js`: un pittore che manca da tempo. Nella storia dei
   Fondi gli orchi tengono un tamburo nella sala grande — chi vede
   qualcosa lo suona, e allora arrivano tutti — e sui livelli spenti
   compare con `pittore: 'campana'`, il commento lì dice esplicitamente
   «il giorno che arriva un pittore `tamburo` si cambia questa parola e
   basta». Eccolo.

   Da prendere e portare via (Orso lo strappa e lo porta alla galleria
   vecchia), non appeso al muro come il campanello: usa `raccolta()`
   come la campana, ma non è una campana rimpicciolita — un cilindro
   di legno con le due pelli tese e le corde a X che le tengono, due
   bacchette incrociate sopra. Se `suona`, trema e manda due archi di
   suono: lo stesso segno della campana e del campanello d'allarme, così
   un bambino che ha imparato uno li ha imparati tutti. */
import { mescola, capsula, tondo } from '../comune.js'
import { LEGNO, raccolta } from './attrezzi.js'

export function tamburo(p, cosa, S = p.S) {
  const pelle = '#e8d9ae', bordo = '#5a3f1e'
  const t = p.tempo || 0
  const scossa = cosa.suona ? Math.sin(t * 24) * 0.14 : 0
  raccolta(p, cosa, S, 1.1, (q, s) => {
    q.ctx.save(); q.ctx.rotate(scossa)
    const c = q.ctx
    // il fusto, visto di poco sotto: legno chiaro fra le due pelli
    capsula(q, 0, 0.4 * s, 3.6 * s, 2.2 * s, 0.6 * s, LEGNO.medio, bordo, 0.6 * s)
    // le corde a X che tengono le pelli in tensione — la firma che
    // dice «tamburo» e non «botte» o «cesto»
    c.strokeStyle = LEGNO.scuro; c.lineWidth = 0.32 * s
    for (const [x0, x1] of [[-3.2, -1.6], [-1.6, 0], [0, 1.6], [1.6, 3.2]]) {
      c.beginPath()
      c.moveTo(x0 * s, -1.5 * s); c.lineTo(x1 * s, 1.9 * s)
      c.moveTo(x1 * s, -1.5 * s); c.lineTo(x0 * s, 1.9 * s)
      c.stroke()
    }
    // la pelle di sopra, tesa e chiara, col lume dove batte la luce
    tondo(q, 0, -1.4 * s, 3.6 * s, 1.5 * s, pelle, bordo, 0.6 * s)
    tondo(q, -0.7 * s, -1.7 * s, 2.2 * s, 0.7 * s, mescola(pelle, '#ffffff', 0.3))
    // le due bacchette incrociate sopra
    for (const v of [-1, 1])
      q.in(v * 1.4 * s, -1.6 * s, r => {
        r.rett(-0.3 * s, -3.4 * s, 0.6 * s, 3.6 * s, LEGNO.chiaro)
        tondo(r, 0, -3.6 * s, 0.55 * s, 0.5 * s, mescola(LEGNO.chiaro, '#ffffff', 0.3))
      }, v * 0.5)
    q.ctx.restore()
    if (!cosa.suona) return
    const f = (t * 2.2) % 1
    q.velo(1 - f, () => {
      for (const v of [-1, 1]) for (let i = 0; i < 2; i++) {
        c.strokeStyle = '#fff3c4'; c.lineWidth = 0.85 * s
        c.beginPath()
        c.arc(0, -1.4 * s, (4 + i * 2 + f * 2.4) * s, v > 0 ? -0.6 : Math.PI - 0.6,
              v > 0 ? 0.6 : Math.PI + 0.6)
        c.stroke()
      }
    })
  })
}
