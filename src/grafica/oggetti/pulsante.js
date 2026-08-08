/* ── LA PIASTRA A PAVIMENTO ──
   Piatta, incassata nel pavimento, e si abbassa quando qualcuno ci
   sale (`premuto`). È l'oggetto più semplice del catalogo e forse il
   più utile: «metti qualcosa qui sopra» è una regola che un bambino
   capisce senza che gliela spieghino.

   L'unica cosa che deve fare bene è **il salto d'ombra**: alzata ha
   una fascia scura sotto, premuta no. Senza quella non si vede se è su
   o giù. */
import { mescola, poligono } from '../comune.js'
import { LATO, PIETRA } from './attrezzi.js'

export function pulsante(p, cosa, S = p.S) {
  const { x, y, premuto = false, lato = LATO, colore = '#c9a83c' } = cosa
  const L = lato * S, h = L / 2
  const alto = premuto ? L * 0.03 : L * 0.11
  // l'incasso
  p.rett(x - h * 0.74, y - h * 0.62, L * 0.74, L * 0.62, mescola(PIETRA.scura, '#000000', 0.4))
  // il fianco che si vede quando è alzata
  poligono(p, [[x - h * 0.7, y + h * 0.28], [x + h * 0.7, y + h * 0.28],
               [x + h * 0.7, y + h * 0.28 + alto], [x - h * 0.7, y + h * 0.28 + alto]],
           mescola(colore, '#000000', 0.45))
  // il piatto
  p.rett(x - h * 0.7, y - h * 0.34 - alto, L * 0.7, L * 0.62, colore)
  p.rett(x - h * 0.7, y - h * 0.34 - alto, L * 0.7, L * 0.1, mescola(colore, '#ffffff', 0.35))
  p.ctx.strokeStyle = mescola(colore, '#000000', 0.55)
  p.ctx.lineWidth = Math.max(1, L * 0.03)
  p.ctx.strokeRect(x - h * 0.7, y - h * 0.34 - alto, L * 0.7, L * 0.62)
  // il segno in mezzo: un cerchio inciso, così si vede dov'è il centro
  p.ctx.beginPath()
  p.ctx.arc(x, y - alto, L * 0.13, 0, 6.29)
  p.ctx.strokeStyle = mescola(colore, '#000000', 0.4); p.ctx.stroke()
}
