/* ═══════════════════════════════════════════════════════════════════
   IL TAVOLO E LA CESTA — le due cose di casa

   Nascono da un difetto preciso: «il tavolo di casa» e «la cesta del
   gatto» erano due **quadrati verdi vuoti**. Un posto che ha un nome
   nella storia è una cosa della storia (lo dice `elementi/posto.js`), e
   un posto senza faccia obbliga a leggere un'etichetta per sapere
   cos'è — cioè trasforma una mappa che si guarda in una che si
   decifra. Il meccanismo per darla c'era già; mancavano i disegni.
   ═══════════════════════════════════════════════════════════════════ */
import { capsula, tondo } from '../comune.js'

export function tavolo(p, cosa, S = p.S) {
  const s = S
  const legno = '#b07a44', legnoS = '#8a5a30', b = '#4a2c12'
  p.in(cosa.x, cosa.y, q => {
    p.ellisse(cosa.x, cosa.y + 3.4 * s, 8 * s, 2.6 * s, '#00000026')
    // le gambe, viste di tre quarti
    for (const dx of [-5.2, 5.2]) capsula(q, dx * s, 2.4 * s, 0.8 * s, 2.6 * s, 0.6 * s, legnoS, b, 0.6 * s)
    // il piano
    capsula(q, 0, -0.6 * s, 7.6 * s, 2.2 * s, 1 * s, legno, b, 0.8 * s)
    q.rett(-6.6 * s, -1.6 * s, 13.2 * s, 0.8 * s, '#d3a06a')
  })
}

export function cuccia(p, cosa, S = p.S) {
  const s = S
  const legno = '#b4713c', tetto = '#8d4f2a', b = '#4a2c12'
  p.in(cosa.x, cosa.y, q => {
    p.ellisse(cosa.x, cosa.y + 3.2 * s, 7.4 * s, 2.4 * s, '#00000026')
    // le pareti
    q.rett(-5.4 * s, -3.4 * s, 10.8 * s, 6.4 * s, legno)
    q.ctx.strokeStyle = b; q.ctx.lineWidth = 0.8 * s
    q.ctx.strokeRect(-5.4 * s, -3.4 * s, 10.8 * s, 6.4 * s)
    // il tetto a due falde
    q.figura([[-6.6 * s, -3.2 * s], [0, -8.4 * s], [6.6 * s, -3.2 * s]], tetto)
    q.linea([{ x: -6.6 * s, y: -3.2 * s }, { x: 0, y: -8.4 * s }, { x: 6.6 * s, y: -3.2 * s }],
            b, 0.8 * s)
    // il buco tondo
    tondo(q, 0, 1 * s, 2.9 * s, 3.1 * s, '#2a1a10')
  })
}

export function cesta(p, cosa, S = p.S) {
  const s = S
  const vimini = '#c9975a', viminiS = '#a2733c', b = '#5a3a18'
  p.in(cosa.x, cosa.y, q => {
    p.ellisse(cosa.x, cosa.y + 3 * s, 7 * s, 2.4 * s, '#00000026')
    // il cuscino dentro
    tondo(q, 0, 0.4 * s, 5.2 * s, 2.2 * s, '#e2607a', '#a33350', 0.6 * s)
    // il bordo e l'intreccio
    capsula(q, 0, 1.4 * s, 6.4 * s, 2.2 * s, 1.6 * s, vimini, b, 0.8 * s)
    for (const dx of [-4, -1.4, 1.4, 4])
      q.linea([{ x: dx * s, y: 0.2 * s }, { x: dx * s, y: 2.8 * s }], viminiS, 0.7 * s)
    tondo(q, 0, -0.6 * s, 6.4 * s, 1.2 * s, vimini, b, 0.7 * s)
  })
}
