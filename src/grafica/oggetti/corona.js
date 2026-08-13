/* ═══════════════════════════════════════════════════════════════════
   LA CORONA E LA SPAZZOLA

   Due cose di casa, e stanno insieme perché nascono dallo stesso
   guasto: erano dipinte con quello che c'era — la corona con l'elmo,
   la spazzola con la bacchetta — e a schermo si leggevano come un
   teschio e un bastoncino. Un oggetto che si chiama in un ordine e si
   vede diverso da come si chiama è peggio di un oggetto brutto: è un
   oggetto che mente.
   ═══════════════════════════════════════════════════════════════════ */
import { capsula, tondo } from '../comune.js'

export function corona(p, cosa, S = p.S) {
  const s = S * 1.1
  const oro = '#f2c94c', oroS = '#c79a1e', b = '#6b4a08'
  p.in(cosa.x, cosa.y + 2 * s, q => {
    // la fascia
    capsula(q, 0, 0, 5.6 * s, 1.9 * s, 0.9 * s, oro, b, 0.7 * s)
    // le tre punte, con la gemma in cima
    for (const [dx, alt] of [[-4, 4.4], [0, 6], [4, 4.4]]) {
      q.figura([[dx * s - 1.7 * s, -1 * s], [dx * s + 1.7 * s, -1 * s], [dx * s, -alt * s]], oro)
      q.linea([{ x: dx * s - 1.7 * s, y: -1 * s }, { x: dx * s, y: -alt * s },
               { x: dx * s + 1.7 * s, y: -1 * s }], b, 0.6 * s)
      tondo(q, dx * s, -alt * s, 1 * s, 1 * s, '#ff6b8a', '#a33350', 0.5 * s)
    }
    q.rett(-5 * s, -0.4 * s, 10 * s, 0.8 * s, oroS)
  })
}

export function spazzola(p, cosa, S = p.S) {
  const s = S
  const legno = '#a9713d', legnoS = '#7d4f26', b = '#42250f'
  p.in(cosa.x, cosa.y + 2 * s, q => {
    // il manico
    capsula(q, 3.4 * s, -1 * s, 3.6 * s, 1 * s, 0.9 * s, legno, b, 0.6 * s)
    // il corpo
    capsula(q, -2.4 * s, -1.4 * s, 3.6 * s, 2.2 * s, 1.1 * s, legnoS, b, 0.6 * s)
    // le setole
    for (let i = -3; i <= 3; i++)
      q.linea([{ x: (-2.4 + i * 0.9) * s, y: 0.6 * s }, { x: (-2.4 + i * 0.9) * s, y: 3.4 * s }],
              '#efe3cf', 0.55 * s)
  })
}
