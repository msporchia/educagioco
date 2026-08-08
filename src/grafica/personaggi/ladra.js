/* ═════ LA LADRA ═════
   Agile e simpatica: cappuccio a punta, sciarpa che svolazza, mantello
   corto. È la più stretta di spalle di tutti — la sagoma dice «veloce»
   prima ancora che si veda la faccia. */
import { capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const LADRA = {
  spalle: 4.2, taglia: 0.97,
  col: {
    pelle: '#f6d0ac', pelleS: '#dcae86',
    manica: '#6a4fbf', manicaS: '#513a99',
    gambe: '#3b3358', gambeS: '#2e2745',
    scarpe: '#4a3a6a', scarpeS: '#382c52',
    veste: '#7b5ad6', vesteS: '#553b9e',
    sciarpa: '#3fd0b0', sciarpaS: '#28a68b',
    maschera: '#2a2138', oro: '#f2c94c',
    bordo: '#221a30',
  },
  dietro(q, s, C, dir, sw) {
    // il mantello, sempre dietro a tutto: di spalle si vede intero, di
    // fronte spuntano solo i lembi ai fianchi
    const onda = Math.sin((sw + 2) * 1.3) * 1.2 * s
    if (dir === 'su') {
      poligono(q, [[-5 * s, -12.6 * s], [5 * s, -12.6 * s], [6.4 * s, -2 * s],
                   [onda, -0.4 * s], [-6.4 * s, -2 * s]], C.veste, C.bordo, 0.75 * s)
    } else if (dir === 'dx') {
      poligono(q, [[-1 * s, -12.6 * s], [-4.6 * s, -12 * s], [-6.6 * s + onda, -3 * s],
                   [-3.4 * s, -2.4 * s], [-1 * s, -5 * s]], C.vesteS, C.bordo, 0.75 * s)
    } else {
      for (const v of [-1, 1])
        poligono(q, [[v * 3 * s, -12.4 * s], [v * 6 * s, -11 * s], [v * (6.6 * s + onda * v), -3 * s],
                     [v * 3.4 * s, -3.6 * s]], C.vesteS, C.bordo, 0.75 * s)
    }
  },
  tronco(q, s, C, dir) {
    const b = C.bordo, sp = 0.75 * s
    capsula(q, 0, -9.2 * s, (dir === 'dx' ? 3.2 : 4.3) * s, 4 * s, 2 * s, C.manica, b, sp)
    capsula(q, 0, -10.4 * s, (dir === 'dx' ? 2.9 : 4) * s, 2 * s, 1.4 * s, C.veste)
    if (dir !== 'su') {
      // le cinghie incrociate e la borsa: il mestiere si vede addosso
      q.ctx.strokeStyle = C.vesteS; q.ctx.lineWidth = 1 * s
      q.ctx.beginPath()
      q.ctx.moveTo(-3.2 * s, -12 * s); q.ctx.lineTo(2.4 * s, -6.6 * s)
      q.ctx.stroke()
    }
    q.rett(-4 * s, -6.8 * s, 8 * s, 1.4 * s, '#4a3a2a')
    q.rett(-0.9 * s, -6.9 * s, 1.8 * s, 1.6 * s, C.oro)
    // la sciarpa al collo, con la coda che vola dalla parte opposta
    capsula(q, 0, -11.4 * s, (dir === 'dx' ? 2.8 : 4 * 0.95) * s, 1.2 * s, 1 * s, C.sciarpa, b, sp)
    const v = dir === 'dx' ? -1 : 1
    poligono(q, [[v * 2.4 * s, -12.2 * s], [v * 7.4 * s, -11 * s], [v * 8.6 * s, -8.6 * s],
                 [v * 6 * s, -9.6 * s], [v * 2.4 * s, -10.4 * s]], C.sciarpaS, b, sp)
  },
  testa(q, s, C, dir, stato) {
    const b = C.bordo, sp = 0.75 * s, R = 4.1 * s
    q.rett(-1.4 * s, 2 * s, 2.8 * s, 2 * s, C.pelleS)
    if (dir === 'dx') {
      tondo(q, 0.4 * s, 0.4 * s, R * 0.86, R * 0.9, C.pelle, b, sp)
      // il cappuccio: la punta scappa indietro, ed è la firma della ladra
      poligono(q, [[R * 0.95, -0.6 * s], [R * 0.3, -R * 1.15], [-R * 0.7, -R * 1.1],
                   [-R * 1.9, -R * 0.15], [-R * 1.2, R * 0.35], [-R * 0.55, R * 0.15],
                   [-R * 0.5, -R * 0.2], [R * 0.5, -R * 0.35]], C.veste, b, sp)
      q.rett(-R * 0.3, -0.5 * s, R * 1.4, 1.7 * s, C.maschera)
      tondo(q, R * 0.62, 0.35 * s, 0.72 * s, 0.8 * s, '#ffffff')
      tondo(q, R * 0.72, 0.45 * s, 0.36 * s, 0.5 * s, '#20182e')
      poligono(q, [[R * 0.9, 0.4 * s], [R * 1.3, 1.1 * s], [R * 0.85, 1.3 * s]], C.pelle)   // nasino
    } else if (dir === 'su') {
      poligono(q, [[-R * 1.05, 2 * s], [-R * 1.15, -R * 0.3], [-R * 0.3, -R * 1.35],
                   [R * 0.75, -R * 1.05], [R * 1.15, -R * 0.1], [R * 1.05, 2 * s]], C.veste, b, sp)
      poligono(q, [[R * 0.55, -R * 1.2], [R * 1.9, -R * 0.5], [R * 1.2, -R * 0.1]], C.vesteS, b, sp)
      capsula(q, 0, 2.2 * s, R * 0.9, 1.2 * s, 1 * s, C.sciarpa, b, sp)
    } else {
      tondo(q, 0, 0.5 * s, R * 0.86, R * 0.92, C.pelle, b, sp)
      // il cappuccio visto di faccia: la punta cade all'indietro, non
      // sta dritta — dritta era un cappello da mago
      poligono(q, [[-R * 1.12, 1.8 * s], [-R * 1.3, -R * 0.35], [-R * 0.95, -R * 1.15],
                   [-R * 0.45, -R * 1.6], [R * 0.2, -R * 1.05], [R * 1.25, -R * 0.3],
                   [R * 1.12, 1.8 * s], [R * 0.72, 0.2 * s], [0, -R * 0.45],
                   [-R * 0.72, 0.2 * s]], C.veste, b, sp)
      poligono(q, [[R * 0.2, -R * 1.05], [R * 1.25, -R * 0.3], [R * 1.12, 1.8 * s],
                   [R * 0.72, 0.2 * s], [0, -R * 0.45]], C.vesteS)
      q.rett(-R * 0.8, -0.2 * s, R * 1.6, 1.8 * s, C.maschera)
      occhi(q, s, 1.5, 0.75, 0.72, stato, '#ffffff')
      poligono(q, [[0, 1.6 * s], [0.7 * s, 2.5 * s], [-0.7 * s, 2.5 * s]], C.pelleS)
      q.ctx.strokeStyle = '#a8724f'; q.ctx.lineWidth = 0.6 * s; q.ctx.lineCap = 'round'
      q.ctx.beginPath(); q.ctx.moveTo(-1 * s, 3.1 * s); q.ctx.quadraticCurveTo(0, 3.8 * s, 1 * s, 3.1 * s)
      q.ctx.stroke()
    }
  },
  arma(q, s, C, dir, sw, mani) {
    const b = C.bordo, sp = 0.6 * s
    q.in(mani.dx.x, mani.dx.y, r => {
      poligono(r, [[-0.6 * s, 0], [0.6 * s, 0], [0.5 * s, -4.6 * s], [0, -5.8 * s], [-0.5 * s, -4.6 * s]],
               '#dfe6f0', b, sp)
      capsula(r, 0, 0.4 * s, 1.6 * s, 0.45 * s, 0.4 * s, C.oro, b, sp)
      capsula(r, 0, 1.6 * s, 0.55 * s, 1.3 * s, 0.5 * s, '#4a3a2a', b, sp)
    }, dir === 'dx' ? 0.5 : 0.35)
  },
}
