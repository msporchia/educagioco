/* ═══════════════════════════════════════════════════════════════════
   IL PUGNALE E LA SPADA

   Le prime due armi che si possono **prendere**, e non è un dettaglio
   di catalogo: sono disegnate per stare in due posti diversi — per
   terra, grandi come una casella, e **in mano a qualcuno**, piccole,
   dove le mette `persona()` (`grafica/corpo.js`). Per questo qui non
   si dà mai per scontata la scala: tutto è in unità di `S`, e chi
   disegna decide quanto vale.

   Sono due file in uno perché sono la stessa figura con due
   proporzioni: la lama del pugnale è corta e larga, quella della spada
   lunga e stretta. Separarle vorrebbe dire copiare venti righe per
   cambiare due numeri.
   ═══════════════════════════════════════════════════════════════════ */
import { capsula, poligono, tondo } from '../comune.js'

/* `lama` è quanto è lunga in unità, `largo` quanto è larga: da lì
   escono sia il pugnale che la spada, e domani l'alabarda con un
   manico più lungo. L'angolo lo dà chi disegna — per terra sta di
   sbieco, in mano sta dritta. */
function taglio(p, cosa, S, { lama, largo, oro = '#e8c569', ferro = '#cfd6e2' }) {
  const s = S
  const b = '#2a2334'
  const sp = Math.max(0.5, 0.5 * s)
  p.in(cosa.x, cosa.y, q => {
    // la lama: un rettangolo che finisce a punta, con la sfaccettatura
    q.rett(-largo / 2 * s, -lama * s, largo * s, lama * s, ferro)
    q.ctx.strokeStyle = b; q.ctx.lineWidth = sp
    q.ctx.strokeRect(-largo / 2 * s, -lama * s, largo * s, lama * s)
    poligono(q, [[-largo / 2 * s, -lama * s], [largo / 2 * s, -lama * s],
                 [0, -(lama + largo * 1.4) * s]], ferro, b, sp)
    q.rett(-largo * 0.16 * s, -(lama - 0.3) * s, largo * 0.32 * s, (lama - 0.6) * s, '#ffffff99')
    // la guardia, l'impugnatura, il pomo
    capsula(q, 0, 0, largo * 1.7 * s, 0.55 * s, 0.4 * s, oro, b, sp)
    capsula(q, 0, 1.5 * s, 0.6 * s, 1.5 * s, 0.5 * s, '#6b4a2e', b, sp)
    tondo(q, 0, 3 * s, 0.8 * s, 0.8 * s, oro, b, sp)
  }, cosa.ang || 0)
}

/* per terra sta di sbieco e un po' più in basso del centro, come tutte
   le cose che si raccolgono; in mano l'angolo lo passa chi la impugna */
export function pugnale(p, cosa, S = p.S) {
  taglio(p, { ...cosa, y: cosa.y + 2 * S, ang: cosa.ang ?? -0.5 }, S * 1.15,
         { lama: 4.6, largo: 1.5 })
}

export function spada(p, cosa, S = p.S) {
  taglio(p, { ...cosa, y: cosa.y + 3 * S, ang: cosa.ang ?? -0.5 }, S,
         { lama: 9, largo: 1.4 })
}
