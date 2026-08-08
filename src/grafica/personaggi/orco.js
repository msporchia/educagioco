/* ═════ L'ORCO ═════
   Il nemico di tutti i giorni: verde, panciuto, due zanne all'insù e
   un naso enorme. Cattivo per finta — occhi tondi e bocca larga, mai
   denti aguzzi e mai sangue: chi ci gioca ha sei anni. */
import { mescola, capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const ORCO = {
  spalle: 6.2, taglia: 1.02,
  col: {
    pelle: '#74bb52', pelleS: '#54903c',
    manica: '#5fa543', manicaS: '#47823a',      // le braccia un filo più scure
    gambe: '#a8703c', gambeS: '#875929',
    scarpe: '#5b3f22', scarpeS: '#48311a',
    panno: '#b5793f', cintura: '#5b3f22',
    zanne: '#f7f4ea', oro: '#f2c94c',
    bordo: '#20301a',
  },
  tronco(q, s, C, dir) {
    const b = C.bordo, sp = 0.8 * s
    // la pancia: larga in basso, spalle spioventi. È la forma che dice
    // «pesante» prima ancora della faccia
    poligono(q, [[-(dir === 'dx' ? 4 : 5.6) * s, -12.6 * s], [(dir === 'dx' ? 4 : 5.6) * s, -12.6 * s],
                 [(dir === 'dx' ? 4.6 : 6.4) * s, -8 * s], [(dir === 'dx' ? 3.6 : 5) * s, -5 * s],
                 [-(dir === 'dx' ? 3.6 : 5) * s, -5 * s], [-(dir === 'dx' ? 4.6 : 6.4) * s, -8 * s]],
             C.pelle, b, sp)
    if (dir !== 'su') tondo(q, dir === 'dx' ? 1.4 * s : 0, -7.4 * s, (dir === 'dx' ? 2.6 : 3.4) * s, 2.4 * s,
                            mescola(C.pelle, '#ffffff', 0.16))
    q.rett(-(dir === 'dx' ? 4 : 5.4) * s, -6.4 * s, (dir === 'dx' ? 8 : 10.8) * s, 1.8 * s, C.cintura)
    q.rett(-1.1 * s, -6.6 * s, 2.2 * s, 2.2 * s, C.oro)
    // la bretella di cuoio di traverso
    if (dir !== 'su') {
      q.ctx.strokeStyle = C.cintura; q.ctx.lineWidth = 1.4 * s
      q.ctx.beginPath(); q.ctx.moveTo(-3.6 * s, -12.4 * s); q.ctx.lineTo(2.6 * s, -6.6 * s); q.ctx.stroke()
    }
  },
  testa(q, s, C, dir, stato) {
    const b = C.bordo, sp = 0.8 * s, R = 4.7 * s
    q.rett(-2 * s, 1.6 * s, 4 * s, 2.4 * s, C.pelleS)
    // le orecchie a punta: di profilo se ne vede una sola, quella dietro
    for (const v of (dir === 'dx' ? [-1] : [-1, 1]))
      poligono(q, [[v * R * 0.72, -0.8 * s], [v * R * 1.75, -R * 0.72], [v * R * 0.95, 1 * s]],
               C.pelleS, b, sp)
    if (dir === 'dx') {
      tondo(q, 0, 0, R * 0.98, R * 0.94, C.pelle, b, sp)
      // muso sporgente col naso a patata e la zanna che esce
      tondo(q, R * 0.72, 1 * s, R * 0.52, R * 0.42, C.pelle, b, sp)
      tondo(q, R * 0.95, 0.2 * s, R * 0.34, R * 0.3, mescola(C.pelle, '#ffffff', 0.18), b, sp * 0.8)
      poligono(q, [[R * 0.78, 1.9 * s], [R * 1.05, 1.9 * s], [R * 0.95, 0.5 * s]], C.zanne, b, sp * 0.7)
      q.ctx.strokeStyle = b; q.ctx.lineWidth = 0.8 * s; q.ctx.lineCap = 'round'
      q.ctx.beginPath(); q.ctx.moveTo(R * 0.35, 2.1 * s); q.ctx.lineTo(R * 0.95, 2.1 * s); q.ctx.stroke()
      if (stato === 'ko') occhi(q, s, -0.9, -0.4, 0.7, stato)
      else {
        tondo(q, R * 0.42, -0.5 * s, 0.85 * s, 0.95 * s, '#ffffff')
        tondo(q, R * 0.52, -0.4 * s, 0.42 * s, 0.5 * s, '#20182e')
        q.ctx.strokeStyle = C.pelleS; q.ctx.lineWidth = 0.9 * s
        q.ctx.beginPath(); q.ctx.moveTo(R * 0.05, -1.6 * s); q.ctx.lineTo(R * 0.8, -1.2 * s); q.ctx.stroke()
      }
    } else if (dir === 'su') {
      tondo(q, 0, 0, R, R * 0.96, C.pelleS, b, sp)
      // il ciuffo legato: senza, di spalle era una palla verde e basta
      capsula(q, 0, -R * 0.92, 1.2 * s, 1.3 * s, 0.9 * s, C.cintura, b, sp * 0.8)
      for (const [dx, dy] of [[-3, -2], [0, -3.2], [3, -2]])
        poligono(q, [[-1 * s, -R * 1.02], [dx * s, -R * 1.02 + dy * s], [1 * s, -R * 1.02]],
                 '#3f5f2e', b, sp * 0.7)
      tondo(q, 0, 1.4 * s, R * 0.5, R * 0.3, mescola(C.pelleS, '#000000', 0.15))
    } else {
      tondo(q, 0, 0, R, R * 0.96, C.pelle, b, sp)
      // sopracciglia spesse: sono loro che fanno la faccia, non gli occhi
      occhi(q, s, 1.9, -0.5, 0.95, stato)
      q.ctx.strokeStyle = C.pelleS; q.ctx.lineWidth = 1.1 * s; q.ctx.lineCap = 'round'
      q.ctx.beginPath()
      q.ctx.moveTo(-3.4 * s, -2.4 * s); q.ctx.lineTo(-0.9 * s, -1.5 * s)
      q.ctx.moveTo(3.4 * s, -2.4 * s); q.ctx.lineTo(0.9 * s, -1.5 * s)
      q.ctx.stroke()
      tondo(q, 0, 1.1 * s, 1.5 * s, 1.25 * s, mescola(C.pelle, '#ffffff', 0.2), b, sp * 0.8)  // naso
      // il ghigno, e le due zanne che salgono dal labbro di sotto
      q.ctx.strokeStyle = b; q.ctx.lineWidth = 0.9 * s
      q.ctx.beginPath(); q.ctx.moveTo(-2.6 * s, 2.6 * s); q.ctx.quadraticCurveTo(0, 3.9 * s, 2.6 * s, 2.6 * s)
      q.ctx.stroke()
      for (const v of [-1, 1])
        poligono(q, [[v * 1.5 * s, 3.1 * s], [v * 2.5 * s, 2.8 * s], [v * 2.1 * s, 1.4 * s]],
                 C.zanne, b, sp * 0.7)
    }
  },
  arma(q, s, C, dir, sw, mani) {
    const b = C.bordo, sp = 0.7 * s
    // di profilo la clava scende davanti al petto: tenuta alta finiva
    // sulla faccia e l'orco spariva dietro al suo stesso bastone
    q.in(mani.dx.x + (dir === 'dx' ? 1.4 : 0.4) * s, mani.dx.y + (dir === 'dx' ? 1.8 : -0.4) * s, r => {
      capsula(r, 0, -1.6 * s, 0.85 * s, 2.6 * s, 0.7 * s, '#8a6136', b, sp)
      capsula(r, 0, -6.4 * s, 2.1 * s, 3.4 * s, 1.6 * s, '#a8763f', b, sp)
      for (const [dx, dy] of [[-1.1, -7.4], [1.2, -5.6], [0, -8.8]])
        tondo(r, dx * s, dy * s, 0.65 * s, 0.6 * s, '#6e4b26')
    }, dir === 'dx' ? 0.35 : 0.22)
  },
}
