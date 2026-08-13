/* ═════ LA PRINCIPESSA ═════
   Non combatte, quindi non impugna niente: nessun `arma()`. È lei
   che va difesa, non chi difende — l'unica cosa che deve dire la
   sagoma è «corte», con l'abito lungo che nasconde le gambe (come
   fa la tonaca del mago) e una coroncina, non un'arma, a farla
   riconoscere da lontano.

   Prima di questo file il livello del tutorial la disegnava con
   `corpo: 'elfo'` — comodo perché già disegnato, ma sbagliato: quel
   pittore ha in mano un arco, e un arco in mano dice «combatte».
   L'elfo resta il pittore di chi tira con l'arco davvero (gli
   abitanti nei livelli non ancora attivi in `data/livelli/todo/`),
   e la principessa ha adesso un pittore suo. */
import { poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const PRINCIPESSA = {
  spalle: 3.8, taglia: 0.95, arti: 0.85,
  col: {
    pelle: '#f8dfc2', pelleS: '#dcbb96',
    manica: '#f2b8d3', manicaS: '#d488ac',
    gambe: '#eb9dc2', gambeS: '#c96f9b',
    scarpe: '#f2c94c', scarpeS: '#c9a13e',
    veste: '#eb9dc2', vesteS: '#c96f9b',
    capelli: '#8a5a35', capelliS: '#6b4326',
    oro: '#f2c94c', gemma: '#7fd8e0',
    bordo: '#2a2036',
  },
  tronco(q, s, C, dir) {
    const b = C.bordo, sp = 0.7 * s
    const w = dir === 'dx' ? 2.7 : 3.6
    /* l'abito lungo: stretto in vita, poi si allarga fin quasi a
       terra — copre le gambe come la campana del mago, ma resta
       aderente sopra invece di essere svasato dalle spalle in giù,
       perché qui il messaggio è «vestito da corte», non «mantello». */
    poligono(q, [[-w * s, -12.4 * s], [w * s, -12.4 * s], [w * 0.7 * s, -8.2 * s],
                 [w * 0.9 * s, -6.2 * s], [w * 1.9 * s, 0.6 * s], [-w * 1.9 * s, 0.6 * s],
                 [-w * 0.9 * s, -6.2 * s], [-w * 0.7 * s, -8.2 * s]],
             C.veste, b, sp)
    // la fusciacca dorata in vita, con una gemma al centro — la stessa
    // idea della spilla dell'elfo, ma qui dice «corte», non «bosco»
    q.rett(-w * 0.95 * s, -6.8 * s, w * 1.9 * s, 1 * s, C.oro)
    tondo(q, 0, -6.3 * s, 0.9 * s, 0.9 * s, C.gemma, b, sp * 0.7)
    if (dir !== 'su')
      poligono(q, [[0, -12.4 * s], [w * 0.55 * s, -11.8 * s], [0, -10 * s],
                   [-w * 0.55 * s, -11.8 * s]], C.vesteS)
  },
  testa(q, s, C, dir, stato) {
    const b = C.bordo, sp = 0.7 * s, R = 4.2 * s
    q.rett(-1.3 * s, 2 * s, 2.6 * s, 2.2 * s, C.pelleS)        // collo
    if (dir === 'dx') {
      tondo(q, 0.2 * s, 0.3 * s, R * 0.82, R * 0.92, C.pelle, b, sp)
      // i capelli lunghi e mossi, che scendono sulla schiena
      poligono(q, [[R * 0.4, -R * 1.05], [-R * 0.85, -R * 0.8], [-R * 1.2, 0.2 * s],
                   [-R * 0.9, 5 * s], [-R * 0.3, 4.8 * s], [-R * 0.5, 0.4 * s],
                   [R * 0.25, -R * 0.4]], C.capelli, b, sp)
      tondo(q, R * 0.55, 0.4 * s, 0.7 * s, 0.8 * s, '#ffffff')
      tondo(q, R * 0.65, 0.5 * s, 0.34 * s, 0.46 * s, '#3a2a1a')
      poligono(q, [[R * 0.85, 0.5 * s], [R * 1.2, 1.2 * s], [R * 0.8, 1.4 * s]], C.pelle)  // naso
      // la coroncina: un arco d'oro con una punta e una gemma — quello
      // che la fa riconoscere da lontano, al posto di un'arma
      poligono(q, [[-R * 0.55, -R * 0.78], [R * 0.45, -R * 0.85], [R * 0.35, -R * 1.35],
                   [0, -R * 1.05], [-R * 0.15, -R * 1.4], [-R * 0.45, -R * 1]], C.oro, b, sp * 0.7)
      tondo(q, -R * 0.1, -R * 1.15, 0.5 * s, 0.5 * s, C.gemma, b, sp * 0.6)
    } else if (dir === 'su') {
      tondo(q, 0, 0, R * 0.92, R, C.capelli, b, sp)
      poligono(q, [[-R * 0.92, 0], [R * 0.92, 0], [R * 0.65, 5 * s], [-R * 0.65, 5 * s]],
               C.capelli, b, sp)
      q.linea([{ x: 0, y: -R * 0.5 }, { x: 0, y: 4 * s }], C.capelliS, 0.6 * s)
      poligono(q, [[-R * 0.7, -R * 0.7], [R * 0.7, -R * 0.7], [R * 0.5, -R * 1.25],
                   [0, -R * 0.95], [-R * 0.5, -R * 1.25]], C.oro, b, sp * 0.7)
      tondo(q, 0, -R * 1.02, 0.5 * s, 0.5 * s, C.gemma, b, sp * 0.6)
    } else {
      tondo(q, 0, 0.4 * s, R * 0.82, R * 0.92, C.pelle, b, sp)
      // i capelli: calotta più due ciocche lunghe ai lati del viso,
      // come l'elfo — qui però castani, non bianchi da bosco
      poligono(q, [[-R * 0.9, R * 0.3], [-R * 0.85, -R * 0.55], [0, -R * 1.05],
                   [R * 0.85, -R * 0.55], [R * 0.9, R * 0.3], [R * 0.55, -R * 0.1],
                   [0, -R * 0.35], [-R * 0.55, -R * 0.1]], C.capelli, b, sp)
      for (const v of [-1, 1])
        poligono(q, [[v * R * 0.85, -R * 0.15], [v * R * 1, 4.6 * s], [v * R * 0.45, 4.4 * s],
                     [v * R * 0.55, -R * 0.1]], C.capelli, b, sp)
      occhi(q, s, 1.5, 0.6, 0.72, stato, '#3a2a1a')
      poligono(q, [[0, 1.3 * s], [0.6 * s, 2.2 * s], [-0.6 * s, 2.2 * s]], C.pelleS)   // naso
      q.ctx.strokeStyle = '#b07a58'; q.ctx.lineWidth = 0.55 * s; q.ctx.lineCap = 'round'
      q.ctx.beginPath(); q.ctx.moveTo(-0.9 * s, 3 * s); q.ctx.quadraticCurveTo(0, 3.6 * s, 0.9 * s, 3 * s)
      q.ctx.stroke()
      poligono(q, [[-R * 0.5, -R * 0.6], [R * 0.5, -R * 0.65], [R * 0.35, -R * 1.1],
                   [0, -R * 0.8], [-R * 0.35, -R * 1.1]], C.oro, b, sp * 0.7)
      tondo(q, 0, -R * 0.85, 0.55 * s, 0.55 * s, C.gemma, b, sp * 0.6)
    }
  },
}
