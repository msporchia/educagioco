/* ═════ IL CINGHIALE ═════
   Un muro di muscoli col muso basso e le zanne all'insù, visto di
   fronte mentre sta per partire. È il primo nemico che *pesa*: dove il
   ragno è largo cinque unità lui ne è largo undici, e la differenza
   deve sentirsi prima di leggere qualunque numero.

   La criniera sulla schiena è il pezzo che lo distingue da un maiale:
   una fila di setole dritte, non un dorso liscio. */
import { mescola, tondo, capsula, poligono } from '../comune.js'
import { occhi } from '../segni.js'

export const CINGHIALE = {
  quadrupede: true, taglia: 1.1,
  col: {
    pelo: '#6b5442', peloS: '#4a382c', muso: '#8c6d55',
    setole: '#33261e', zanne: '#f0e6cf', zoccoli: '#2b211a', bordo: '#241a13',
  },
  disegna(q, s, C, dir, sw, stato) {
    const t = q.tempo || 0
    const b = C.bordo, sp = 0.85 * s
    /* Adimensionale, come tutto quello che poi viene moltiplicato per
       `s`: scritto `* 0.5 * s` e riusato dentro un `* s` diventava una
       misura al quadrato — invisibile sulle figure piccole del banco
       di prova, e una palla di nebbia grande quanto il cinghiale sul
       campo vero, dove la scala è dieci volte tanto. */
    const sbuffo = Math.max(0, Math.sin(t * 1.6)) * 0.5
    for (const v of [-1, 1]) {                                       // le quattro zampe tozze
      for (const [dx, dy] of [[3.4, 0], [5.4, -1]]) {
        capsula(q, v * dx * s, (-2 + dy) * s, 1.4 * s, 2.4 * s, 1 * s, C.peloS, b, sp)
        capsula(q, v * dx * s, 0.4 * s, 1.5 * s, 0.9 * s, 0.6 * s, C.zoccoli, b, sp * 0.8)
      }
    }
    // il corpo: una massa larga che si restringe verso il collo
    poligono(q, [[-7.4 * s, -4 * s], [7.4 * s, -4 * s], [6.2 * s, -0.6 * s], [-6.2 * s, -0.6 * s]],
             C.pelo, b, sp)
    tondo(q, 0, -5.6 * s, 7 * s, 4.4 * s, C.pelo, b, sp)
    for (let i = 0; i < 7; i++) {                                    // la criniera dritta
      const x = (i - 3) * 1.5 * s
      poligono(q, [[x - 0.6 * s, -9.2 * s], [x, -12.4 * s + Math.sin(t * 3 + i) * 0.3 * s],
                   [x + 0.6 * s, -9.2 * s]], C.setole)
    }
    tondo(q, 0, -7.4 * s, 4.6 * s, 3.6 * s, C.pelo, b, sp)           // la testa bassa
    for (const v of [-1, 1])                                          // le orecchie
      poligono(q, [[v * 3.4 * s, -9.4 * s], [v * 5.4 * s, -11.4 * s], [v * 4.6 * s, -7.6 * s]],
               C.peloS, b, sp * 0.8)
    occhi(q, s, 2.2, -8.4, 0.75, stato)
    tondo(q, 0, -5 * s, 2.8 * s, 2.1 * s, C.muso, b, sp)             // il grugno
    for (const v of [-1, 1]) {
      q.cerchio(v * 1 * s, -5 * s, 0.55 * s, '#2b211a')
      /* le zanne larghe alla base: strette come le avevo fatte, il
         bordo se le mangiava e restavano due graffi scuri sul muso */
      poligono(q, [[v * 2 * s, -3.4 * s], [v * 3.4 * s, -3.8 * s],
                   [v * 4.2 * s, -7.8 * s], [v * 3 * s, -4.6 * s]], C.zanne, b, sp * 0.6)
      // lo sbuffo dalle narici: si vede solo quando c'è, e c'è a tempo
      if (sbuffo > 0.1 && stato !== 'ko')
        q.velo(0.4, () => q.cerchio(v * 1 * s, (-3.6 - sbuffo) * s, (0.8 + sbuffo) * s, '#ffffff'))
    }
  },
}
