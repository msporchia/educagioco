/* ═════ IL GOBLIN ═════
   Piccolo, sveltissimo, dispettoso. Tre cose lo tengono lontano
   dall'orco, e servono tutte e tre insieme:

     · **la taglia**: 0.68 contro 1.02. Accanto all'orco gli arriva al
       petto, e questa è la prima cosa che si vede;
     · **la tinta**: verde limone chiarissimo contro verde prato. Fra i
       due c'è un salto di valore, non solo di tono;
     · **la sagoma**: due orecchie lunghe che escono **di lato**, quasi
       orizzontali, larghe quanto tutto il corpo. L'orco è una pancia,
       il goblin è una croce.

   E siccome «veloce» non si disegna, si disegna quello che lascia
   dietro: tre righe che stanno solo quando il passo è a metà. */
import { mescola, capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const GOBLIN = {
  spalle: 3.4, taglia: 0.68, arti: 0.95,
  col: {
    pelle: '#b9dc4e', pelleS: '#8fae35',
    manica: '#b9dc4e', manicaS: '#8fae35',
    gambe: '#7d5236', gambeS: '#5e3c26',
    scarpe: '#3d3225', scarpeS: '#2f271c',
    panno: '#c4553f', pannoS: '#93382a',
    cintura: '#5b4022', ferro: '#cfd8e6', ferroS: '#98a4bb',
    zanne: '#f7f4ea', occhio: '#ffe27a',
    bordo: '#243014',
  },
  dietro(q, s, C, dir, sw) {
    if (!sw) return
    // le righe di velocità: dietro, corte, e solo a mezzo passo. Sempre
    // presenti sembravano baffi; così sono uno sbuffo che va e viene.
    q.velo(0.5, () => {
      const v = dir === 'dx' ? -1 : 1
      for (const [dy, l] of [[-11, 5], [-8, 7], [-4.5, 4]])
        q.linea([{ x: v * 5 * s, y: dy * s }, { x: v * (5 + l) * s, y: dy * s }],
                '#ffffff', 0.9 * s)
    })
  },
  tronco(q, s, C, dir) {
    const b = C.bordo, sp = 0.9 * s
    const w = dir === 'dx' ? 2.8 : 3.6
    // il corpicino: stretto e curvo in avanti, la gobba da furfante
    poligono(q, [[-w * s, -12.4 * s], [w * s, -12.4 * s], [w * 1.25 * s, -8 * s],
                 [w * 1.05 * s, -5 * s], [-w * 1.05 * s, -5 * s], [-w * 1.25 * s, -8 * s]],
             C.pelle, b, sp)
    // il panciotto di straccio rosso, aperto sul davanti
    if (dir !== 'su') {
      for (const v of [-1, 1])
        poligono(q, [[v * w * 0.35 * s, -12.4 * s], [v * w * 1.05 * s, -12.4 * s],
                     [v * w * 1.3 * s, -5.4 * s], [v * w * 0.5 * s, -5.4 * s]],
                 v < 0 ? C.panno : C.pannoS, b, sp * 0.8)
    } else {
      poligono(q, [[-w * 1.02 * s, -12.4 * s], [w * 1.02 * s, -12.4 * s], [w * 1.3 * s, -5.4 * s],
                   [-w * 1.3 * s, -5.4 * s]], C.panno, b, sp * 0.8)
    }
    q.rett(-w * 1.15 * s, -6.4 * s, w * 2.3 * s, 1.4 * s, C.cintura)
  },
  testa(q, s, C, dir, stato) {
    const b = C.bordo, sp = 0.9 * s, R = 4.3 * s
    q.rett(-1.2 * s, 1.8 * s, 2.4 * s, 2.2 * s, C.pelleS)
    /* le orecchie: lunghe il doppio della testa e messe **in
       orizzontale**, con la punta appena all'insù. È la firma. */
    const orecchio = v => {
      poligono(q, [[v * R * 0.6, -1.4 * s], [v * R * 2.5, -R * 0.75], [v * R * 2.35, -R * 0.2],
                   [v * R * 0.75, 1.2 * s]], C.pelleS, b, sp * 0.9)
      poligono(q, [[v * R * 0.7, -1.2 * s], [v * R * 2.1, -R * 0.62], [v * R * 1.5, -R * 0.15]],
               mescola(C.pelle, '#ffffff', 0.18))
    }
    if (dir === 'dx') {
      orecchio(-1)
      tondo(q, 0, 0, R * 0.9, R * 0.86, C.pelle, b, sp)
      // il naso lungo a punta: sporge più del mento, ed è metà del
      // carattere di questa faccia
      poligono(q, [[R * 0.4, -0.4 * s], [R * 1.75, 1.5 * s], [R * 0.45, 1.9 * s]], C.pelle, b, sp * 0.85)
      if (stato === 'ko') occhi(q, s, -0.9, -0.6, 0.7, stato)
      else {
        tondo(q, R * 0.4, -1 * s, 0.8 * s, 0.9 * s, C.occhio, b, sp * 0.6)
        tondo(q, R * 0.52, -0.9 * s, 0.38 * s, 0.46 * s, '#20182e')
      }
      q.ctx.strokeStyle = b; q.ctx.lineWidth = 0.8 * s; q.ctx.lineCap = 'round'
      q.ctx.beginPath(); q.ctx.moveTo(R * 0.15, 2.4 * s); q.ctx.lineTo(R * 0.8, 2.1 * s); q.ctx.stroke()
      poligono(q, [[R * 0.55, 2.3 * s], [R * 0.8, 2.25 * s], [R * 0.7, 1.4 * s]], C.zanne, b, sp * 0.6)
      orecchio(1)
    } else if (dir === 'su') {
      orecchio(-1); orecchio(1)
      tondo(q, 0, 0, R * 0.92, R * 0.88, C.pelleS, b, sp)
      // tre ciuffi di capelli scuri: di spalle era una pallina e basta
      for (const dx of [-1.6, 0, 1.6])
        poligono(q, [[dx * s - 1 * s, -R * 0.82], [dx * s, -R * 1.25], [dx * s + 1 * s, -R * 0.82]],
                 '#4a3a1e', b, sp * 0.6)
    } else {
      orecchio(-1); orecchio(1)
      tondo(q, 0, 0, R * 0.92, R * 0.88, C.pelle, b, sp)
      /* un occhio spalancato e uno strizzato: è la faccia del
         dispettoso, e costa due righe */
      if (stato === 'ko') occhi(q, s, 1.6, -0.6, 0.72, stato)
      else {
        tondo(q, -1.7 * s, -0.8 * s, 1.05 * s, 1.15 * s, C.occhio, b, sp * 0.6)
        tondo(q, -1.5 * s, -0.7 * s, 0.5 * s, 0.6 * s, '#20182e')
        q.ctx.strokeStyle = b; q.ctx.lineWidth = 0.85 * s; q.ctx.lineCap = 'round'
        q.ctx.beginPath()
        q.ctx.moveTo(1 * s, -0.7 * s); q.ctx.quadraticCurveTo(1.9 * s, -1.5 * s, 2.7 * s, -0.7 * s)
        q.ctx.stroke()
      }
      poligono(q, [[-0.9 * s, 0.6 * s], [0.9 * s, 0.6 * s], [0.2 * s, 2.6 * s]], C.pelleS)  // il naso
      // il ghigno storto con un dentino solo
      q.ctx.strokeStyle = b; q.ctx.lineWidth = 0.85 * s; q.ctx.lineCap = 'round'
      q.ctx.beginPath()
      q.ctx.moveTo(-2.2 * s, 2.6 * s); q.ctx.quadraticCurveTo(0.2 * s, 3.9 * s, 2.4 * s, 2.2 * s)
      q.ctx.stroke()
      poligono(q, [[1 * s, 3.1 * s], [1.9 * s, 2.7 * s], [1.5 * s, 1.6 * s]], C.zanne, b, sp * 0.6)
    }
  },
  arma(q, s, C, dir, sw, mani) {
    const b = C.bordo, sp = 0.65 * s
    // un pugnaletto: corto apposta, se no diventava una spada e il
    // goblin un cavaliere piccolo
    q.in(mani.dx.x + (dir === 'dx' ? 0.8 : 0.4) * s, mani.dx.y, r => {
      poligono(r, [[-0.55 * s, 0], [0.55 * s, 0], [0.45 * s, -3.6 * s], [0, -4.8 * s],
                   [-0.45 * s, -3.6 * s]], C.ferro, b, sp)
      r.rett(-0.2 * s, -3.4 * s, 0.4 * s, 3 * s, '#ffffff88')
      capsula(r, 0, 0.3 * s, 1.4 * s, 0.4 * s, 0.35 * s, C.ferroS, b, sp)
      capsula(r, 0, 1.5 * s, 0.5 * s, 1.2 * s, 0.45 * s, C.cintura, b, sp)
    }, dir === 'dx' ? 0.7 : 0.45)
  },
}
