/* La blatta — Sotterraneo, debole alla magica.
   Un guscio ovale e lucido con una riga in mezzo, antenne e zampe
   ridotte a segni: un insetto, non un ragno — il guscio è quasi
   tutta la sagoma, le zampe si vedono a stento. Rosso-bruno, per
   restare lontana dal viola del pipistrello e del ragno. */
import { occhi } from './comune.js'

export const blatta = (p, s) => {
  for (const v of [-1, 1])
    p.linea([{ x: v * 1 * s, y: -5.4 * s }, { x: v * 5 * s, y: -8.8 * s }], '#2c1a14', 1 * s)  // antenna
  p.ellisse(0, 0.6 * s, 6.6 * s, 5.8 * s, '#6b3226')
  p.ellisse(0, -1.8 * s, 5 * s, 4.2 * s, '#8a4432')
  p.linea([{ x: 0, y: -5.4 * s }, { x: 0, y: 5 * s }], '#4a2018', 1 * s)                          // riga del guscio
  // solo un paio di zampe, e in basso: troppe a raggiera sembravano il
  // ragno, che le zampe le ha già tutte
  for (const v of [-1, 1])
    for (let i = 0; i < 2; i++)
      p.linea([{ x: v * 5.6 * s, y: (1.6 + i * 2.2) * s }, { x: v * 8 * s, y: (2.6 + i * 2.6) * s }],
              '#2c1a14', 1 * s)
  occhi(p, s, 2.2, true)
}
