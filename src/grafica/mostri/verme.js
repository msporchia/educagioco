/* Il verme — Sotterraneo, debole alle bombe.
   Tre anelli separati da una riga scura, che si assottigliano verso
   il basso, e una bocca rotonda piena di dentini: l'unica sagoma
   segmentata del gruppo, invece del solito busto tondo. Rosa-terra,
   il colore di un grosso baco di caverna — lontano dal viola del
   pipistrello, del ragno e della blatta. */
import { occhi } from './comune.js'

export const verme = (p, s) => {
  p.ellisse(0, 5 * s, 3.6 * s, 2.6 * s, '#6b4f3d')
  p.linea([{ x: -3.6 * s, y: 2.8 * s }, { x: 3.6 * s, y: 2.8 * s }], '#3c2a1e', 1 * s)
  p.ellisse(0, 1.8 * s, 4.8 * s, 3 * s, '#8a6b56')
  p.linea([{ x: -4.6 * s, y: -0.4 * s }, { x: 4.6 * s, y: -0.4 * s }], '#3c2a1e', 1 * s)
  p.ellisse(0, -2 * s, 5.8 * s, 5.4 * s, '#c9a68a')
  p.cerchio(0, 1.2 * s, 2.6 * s, '#2c1710')                    // bocca
  for (let i = 0; i < 5; i++) {                                 // corona di dentini
    const a = i / 5 * 6.29
    p.figura([[Math.cos(a) * 2.2 * s, 1.2 * s + Math.sin(a) * 2.2 * s],
              [Math.cos(a) * 3.2 * s, 1.2 * s + Math.sin(a) * 3.2 * s],
              [Math.cos(a + 0.35) * 2.5 * s, 1.2 * s + Math.sin(a + 0.35) * 2.5 * s]], '#f2eee2')
  }
  occhi(p, s, 2.6, true)
}
