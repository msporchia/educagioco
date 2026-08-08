/* ── IL FUOCO DA CAMPO ──
   Legna accatastata a piramide, sassi intorno, fuoco sopra. Non è un
   braciere senza treppiede: è **l'accampamento**, cioè il posto dove i
   personaggi si fermano — e in una campagna a tappe quel posto vuole
   una figura sua, riconoscibile da lontano. */
import { mescola, tondo } from '../comune.js'
import { PIETRA, fiamma, pozzaLuce, ombra } from './attrezzi.js'

export function falo(p, cosa, S = p.S) {
  const { x, y, acceso = true } = cosa
  const s = S, t = p.tempo || 0
  const f = (x * 0.06 + y * 0.08) % 6.28
  if (acceso) pozzaLuce(p, x, y, 19 * s, '#ffa63c', 0.62 + 0.1 * Math.sin(t * 4.5 + f))
  ombra(p, x, y, 6.4 * s, 2.2 * s)
  // il cerchio di sassi: solo quelli davanti, se no coprono il fuoco
  for (let i = 0; i < 5; i++) {
    const a = 0.3 + i / 5 * 2.5
    const sx = x + Math.cos(a) * 5.6 * s, sy = y + Math.sin(a) * 2.2 * s
    tondo(p, sx, sy, 1.5 * s, 1.1 * s, PIETRA.media, PIETRA.bordo, 0.5 * s)
    tondo(p, sx - 0.3 * s, sy - 0.3 * s, 0.7 * s, 0.4 * s, PIETRA.chiara)
  }
  // i tre ceppi, incrociati
  for (const [dx, ang] of [[-2.4, -0.55], [2.4, 0.55], [0, 0.05]]) {
    p.in(x + dx * s, y - 1.4 * s, q => {
      q.rett(-0.9 * s, -4.4 * s, 1.8 * s, 5.4 * s, '#7a5433')
      q.rett(-0.9 * s, -4.4 * s, 0.7 * s, 5.4 * s, '#96683f')
      q.ctx.strokeStyle = '#3a2312'; q.ctx.lineWidth = 0.5 * s
      q.ctx.strokeRect(-0.9 * s, -4.4 * s, 1.8 * s, 5.4 * s)
      tondo(q, 0, -4.4 * s, 0.9 * s, 0.4 * s, '#5b3f22')
    }, ang)
  }
  if (!acceso) {
    // spento: cenere e due tizzoni, e si capisce che il fuoco c'era
    tondo(p, x, y - 1.6 * s, 3.4 * s, 1.2 * s, '#3a3630')
    tondo(p, x - 1 * s, y - 1.8 * s, 1.2 * s, 0.5 * s, '#2b2723')
    return
  }
  // la brace sotto e le tre lingue sopra
  tondo(p, x, y - 1.6 * s, 3.4 * s, 1.2 * s,
        mescola('#ff6a1e', '#ffe27a', 0.3 + 0.3 * Math.sin(t * 4 + f)))
  p.velo(0.94, () => {
    fiamma(p, x - 1.8 * s, y - 4 * s, 1.8 * s, t, f + 1.9)
    fiamma(p, x + 2 * s, y - 4.2 * s, 1.9 * s, t, f + 3.6)
    fiamma(p, x, y - 4.6 * s, 3 * s, t, f)
  })
  p.velo(0.28 + 0.08 * Math.sin(t * 5.5 + f), () => p.ellisse(x, y - 7 * s, 7.4 * s, 8 * s, '#ffa63c'))
  // due scintille che salgono, sfasate: il fuoco vivo manda su roba
  for (let i = 0; i < 2; i++) {
    const u = (t * 0.6 + i * 0.5) % 1
    p.velo(1 - u, () => tondo(p, x + Math.sin(t * 2 + i * 3) * 2.4 * s, y - 8 * s - u * 10 * s,
                              0.5 * s, 0.5 * s, '#ffd88a'))
  }
}
