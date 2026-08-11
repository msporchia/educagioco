/* ── LA CHIAVE ──
   La cosa da raccogliere per antonomasia. `colore` la fa d'oro, di
   ferro, di rame o d'argento — è il *materiale*. `sigillo`, quando
   c'è, è un'altra cosa: è la gemma incastonata nell'anello, tinta
   uguale alla serratura che apre. In una mappa con più porte è
   l'abbinamento che conta, e si deve vedere senza leggere niente. */
import { capsula, mescola, tondo } from '../comune.js'
import { raccolta, SIGILLI } from './attrezzi.js'

const TINTE = {
  oro:     { c: '#f2c94c', b: '#8a6412', l: '#fff3c4' },
  ferro:   { c: '#b9c3d2', b: '#5c6472', l: '#f0f5fb' },
  rame:    { c: '#d98a4a', b: '#8a4a1e', l: '#ffd6a8' },
  argento: { c: '#dfe6f0', b: '#7d8794', l: '#ffffff' },
}
export const COLORI_CHIAVE = Object.keys(TINTE)

export function chiave(p, cosa, S = p.S) {
  const T = TINTE[cosa.colore] || TINTE.oro
  const G = cosa.sigillo && SIGILLI[cosa.sigillo]
  raccolta(p, cosa, S, 1.05, (q, s) => {
    q.ctx.save(); q.ctx.rotate(-0.22)
    /* ── LA TESTA INTERA PRENDE IL COLORE, NON SOLO IL FORO ──
       La gemma nell'anello era due pixel a 36: sullo schermo rosso,
       blu e viola erano la stessa chiave gialla, e l'abbinamento —
       che è tutto il punto — non si leggeva. Adesso è la **testa**
       a tingersi, che è la parte grossa e quella che si riconosce da
       lontano; i denti restano del metallo, se no non è più una
       chiave, è un gettone colorato. */
    tondo(q, -3.4 * s, 0, 2.6 * s, 2.6 * s,
          G ? mescola(T.c, G, 0.78) : T.c,
          G ? mescola(G, '#000000', 0.45) : T.b, 0.7 * s)
    if (G) tondo(q, -3.4 * s, 0, 1.15 * s, 1.15 * s, mescola(G, '#ffffff', 0.4))
    else tondo(q, -3.4 * s, 0, 1.1 * s, 1.1 * s, T.b)
    capsula(q, 1.6 * s, 0, 3.4 * s, 0.85 * s, 0.6 * s, T.c, T.b, 0.7 * s)
    // i due denti, disegnati e poi ripassati: senza il contorno a 36 px
    // la chiave diventa un bastoncino
    q.rett(3.4 * s, 0.4 * s, 0.9 * s, 2 * s, T.c)
    q.rett(1.6 * s, 0.4 * s, 0.9 * s, 1.5 * s, T.c)
    q.ctx.strokeStyle = T.b; q.ctx.lineWidth = 0.6 * s
    q.ctx.strokeRect(3.4 * s, 0.4 * s, 0.9 * s, 2 * s)
    q.ctx.strokeRect(1.6 * s, 0.4 * s, 0.9 * s, 1.5 * s)
    tondo(q, -3.4 * s, -1.7 * s, 0.9 * s, 0.5 * s, T.l)
    q.ctx.restore()
  })
}
