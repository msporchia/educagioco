/* ── LA CASSA ──
   Serve a due cose insieme: riempire una stanza vuota e **fare da
   ostacolo** senza essere un muro. Per questo è alta poco più di mezza
   cella: si vede che ci si passa dietro ma non davanti.

   Il coperchio in scorcio è quello che dice che la si guarda un po'
   dall'alto, come tutto il resto del gioco. Aperta, dentro c'è il
   buio: quello che ci sta dentro lo mette il livello, non la cassa. */
import { mescola, poligono, tondo } from '../comune.js'
import { LEGNO, asse, ombra } from './attrezzi.js'

export function cassa(p, cosa, S = p.S) {
  const { x, y, aperta = false } = cosa
  const s = S
  const w = 6.2 * s, h = 6.4 * s
  ombra(p, x, y, w * 1.02, 2 * s)
  p.in(x, y - 0.6 * s, q => {
    // il fianco, con tre assi orizzontali
    for (let i = 0; i < 3; i++)
      asse(q, -w, -h + i * (h / 3), w * 2, h / 3 + 0.1 * s,
           i === 1 ? LEGNO.medio : LEGNO.chiaro, LEGNO.bordo, 0.6 * s)
    // le due bande di ferro e i chiodi
    for (const dx of [-w * 0.62, w * 0.62 - 1 * s]) {
      q.rett(dx, -h, 1 * s, h, LEGNO.ferro)
      q.rett(dx, -h, 1 * s, h * 0.12, LEGNO.ferroL)
      for (const dy of [-h * 0.82, -h * 0.18])
        tondo(q, dx + 0.5 * s, dy, 0.32 * s, 0.32 * s, LEGNO.ferroS)
    }
    // il coperchio in scorcio: un trapezio schiacciato
    poligono(q, [[-w, -h], [w, -h], [w * 0.82, -h - 2.2 * s], [-w * 0.82, -h - 2.2 * s]],
             aperta ? '#2a1a10' : mescola(LEGNO.chiaro, '#ffffff', 0.12), LEGNO.bordo, 0.7 * s)
    if (aperta) {
      // il coperchio ribaltato all'indietro, e dentro il buio
      poligono(q, [[-w * 0.82, -h - 2.2 * s], [w * 0.82, -h - 2.2 * s], [w * 0.7, -h - 7 * s],
                   [-w * 0.7, -h - 7 * s]], LEGNO.scuro, LEGNO.bordo, 0.7 * s)
      q.rett(-w * 0.7, -h - 5.4 * s, w * 1.4, 0.8 * s, LEGNO.ferro)
    } else {
      poligono(q, [[-w, -h], [w, -h], [w * 0.9, -h + 0.8 * s], [-w * 0.9, -h + 0.8 * s]],
               mescola(LEGNO.chiaro, '#ffffff', 0.3))
      q.rett(-0.9 * s, -h + 0.2 * s, 1.8 * s, 2.4 * s, LEGNO.ferro)      // la serratura
      tondo(q, 0, -h + 1.6 * s, 0.5 * s, 0.5 * s, LEGNO.ferroS)
    }
  })
}
