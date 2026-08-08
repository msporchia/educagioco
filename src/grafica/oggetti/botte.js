/* ── LA BOTTE ──
   In piedi è un cilindro con le doghe e due cerchi di ferro; coricata
   (`coricata: true`) è lo stesso cilindro visto per il lungo, che è
   quello che si trova rotolato in una cantina.

   La pancia non è un rettangolo: sono due archi. È la pancia a fare la
   botte — un cilindro dritto sembra un secchio grande. */
import { mescola, tondo } from '../comune.js'
import { LEGNO, ombra } from './attrezzi.js'

export function botte(p, cosa, S = p.S) {
  const { x, y, coricata = false } = cosa
  const s = S
  if (coricata) {
    const w = 7 * s, h = 3.8 * s
    ombra(p, x, y, w * 1.05, 1.8 * s)
    p.in(x, y - h - 0.4 * s, q => {
      const c = q.ctx
      c.beginPath()
      c.moveTo(-w + 1.6 * s, -h)
      c.arcTo(w, -h, w, h, 1.6 * s); c.arcTo(w, h, -w, h, 1.6 * s)
      c.arcTo(-w, h, -w, -h, 1.6 * s); c.arcTo(-w, -h, w, -h, 1.6 * s)
      c.closePath()
      c.fillStyle = LEGNO.medio; c.fill()
      c.strokeStyle = LEGNO.bordo; c.lineWidth = 0.75 * s; c.lineJoin = 'round'; c.stroke()
      // le doghe corrono per il lungo, quindi si vedono come righe
      for (const dy of [-h * 0.55, 0, h * 0.55])
        q.rett(-w * 0.98, dy - 0.25 * s, w * 1.96, 0.5 * s, mescola(LEGNO.scuro, '#000000', 0.1))
      q.rett(-w * 0.98, -h * 0.9, w * 1.96, h * 0.3, mescola(LEGNO.chiaro, '#ffffff', 0.12))
      for (const dx of [-w * 0.45, w * 0.45]) q.rett(dx - 0.6 * s, -h, 1.2 * s, h * 2, LEGNO.ferro)
      tondo(q, -w, 0, 1.2 * s, h, LEGNO.scuro, LEGNO.bordo, 0.7 * s)     // il fondo, di taglio
    })
    return
  }
  const w = 4.6 * s, h = 7.4 * s
  ombra(p, x, y, w * 1.15, 2 * s)
  p.in(x, y - 0.6 * s, q => {
    const c = q.ctx
    c.beginPath()
    c.moveTo(-w * 0.82, -h)
    c.quadraticCurveTo(-w * 1.28, -h * 0.5, -w * 0.82, 0)
    c.lineTo(w * 0.82, 0)
    c.quadraticCurveTo(w * 1.28, -h * 0.5, w * 0.82, -h)
    c.closePath()
    c.fillStyle = LEGNO.medio; c.fill()
    c.strokeStyle = LEGNO.bordo; c.lineWidth = 0.75 * s; c.lineJoin = 'round'; c.stroke()
    // le doghe verticali, ritagliate dentro la pancia
    c.save(); c.clip()
    for (let i = -3; i <= 3; i++)
      q.rett(i * w * 0.3 - 0.2 * s, -h, 0.4 * s, h, mescola(LEGNO.scuro, '#000000', 0.12))
    q.rett(-w * 1.3, -h, w * 0.7, h, mescola(LEGNO.medio, '#ffffff', 0.1))
    c.restore()
    // i due cerchi di ferro
    for (const dy of [-h * 0.78, -h * 0.22]) {
      const larg = w * (1.02 + Math.abs(dy / h + 0.5) * -0.3 + 0.14)
      q.rett(-larg, dy - 0.7 * s, larg * 2, 1.4 * s, LEGNO.ferro)
      q.rett(-larg, dy - 0.7 * s, larg * 2, 0.45 * s, LEGNO.ferroL)
    }
    tondo(q, 0, -h, w * 0.82, 1.5 * s, mescola(LEGNO.chiaro, '#ffffff', 0.1), LEGNO.bordo, 0.7 * s)
    tondo(q, 0, -h, w * 0.5, 0.9 * s, LEGNO.chiaro)
  })
}

/* ── IL BARILE ──
   La botte piccola: due terzi della taglia e un cerchio di ferro solo.
   Non è un vezzo — accanto a una botte grande dice «qui la roba è
   poca», e due misure diverse rendono un magazzino un magazzino invece
   che una fila di copie. */
export function barile(p, cosa, S = p.S) {
  botte(p, { ...cosa, coricata: false }, S * 0.68)
}
