/* ═════ IL CAVALIERE ═════
   L'eroe. Argento e azzurro, spalle larghe, e sopra l'elmo una cresta
   rossa che è la cosa che si vede per prima da lontano: fra tutti è
   l'unico che ha qualcosa di **acceso in cima**. */
import { mescola, capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const CAVALIERE = {
  spalle: 5.4, taglia: 1,
  col: {
    pelle: '#f2c9a0', pelleS: '#d9a97f',
    manica: '#3f63c8', manicaS: '#2f4a9c',
    gambe: '#48557a', gambeS: '#38445f',
    scarpe: '#6b4a2e', scarpeS: '#54381f',
    ferro: '#cfd8e6', ferroS: '#98a4bb',
    blu: '#3f63c8', bluS: '#2c469a',
    oro: '#f2c94c', cresta: '#e0453f', crestaS: '#a92f2b',
    bordo: '#241b33',
  },
  tronco(q, s, C, dir) {
    const b = C.bordo, sp = 0.75 * s
    // la sopravveste azzurra, poi la corazza sopra: due strati e si
    // vede subito che è vestito di ferro e non di stoffa
    capsula(q, 0, -9.2 * s, (dir === 'dx' ? 3.9 : 5.4) * s, 4.2 * s, 2.2 * s, C.blu, b, sp)
    capsula(q, 0, -10 * s, (dir === 'dx' ? 3.4 : 4.8) * s, 3 * s, 1.8 * s, C.ferro, b, sp)
    if (dir !== 'su') {
      // il petto: due lastre e un rilievo centrale
      capsula(q, 0, -10.2 * s, (dir === 'dx' ? 1 : 1.1) * s, 2.6 * s, 0.8 * s, C.ferroS)
      q.rett(-4.6 * s, -6.6 * s, 9.2 * s, 1.5 * s, C.oro)      // cintura
      if (dir !== 'dx') q.rett(-1.1 * s, -6.6 * s, 2.2 * s, 1.5 * s, '#b98f22')
    } else {
      q.rett(-4.6 * s, -6.6 * s, 9.2 * s, 1.5 * s, C.oro)
      capsula(q, 0, -9.6 * s, 3.6 * s, 2.2 * s, 1.4 * s, C.ferroS)
    }
    // spalline
    if (dir === 'dx') tondo(q, 1.6 * s, -12.2 * s, 2.4 * s, 1.8 * s, C.ferro, b, sp)
    else for (const v of [-1, 1]) tondo(q, v * 5.2 * s, -12 * s, 2.6 * s, 1.9 * s, C.ferro, b, sp)
  },
  testa(q, s, C, dir, stato) {
    const b = C.bordo, sp = 0.75 * s, R = 4.5 * s
    q.rett(-1.6 * s, 2.2 * s, 3.2 * s, 2 * s, C.pelleS)           // collo
    if (dir === 'dx') {
      // elmo di profilo, con la coda che scende sulla nuca
      poligono(q, [[-R, 1.4 * s], [-R * 0.95, -R * 0.6], [-R * 0.2, -R * 1.25],
                   [R * 0.8, -R * 0.7], [R * 0.95, 0.6 * s], [R * 0.5, 2.2 * s],
                   [-R * 0.6, 2.4 * s]], C.ferro, b, sp)
      poligono(q, [[R * 0.1, -0.6 * s], [R * 0.95, -0.2 * s], [R * 0.9, 1.9 * s], [R * 0.1, 1.6 * s]],
               '#2a2436')                                          // la fessura
      tondo(q, R * 0.62, 0.7 * s, 0.72 * s, 0.85 * s, '#ffffff')
      q.rett(R * 0.44, -0.9 * s, 0.9 * s, 3.2 * s, C.ferroS)       // nasale
      /* la cresta di profilo: una spazzola che corre dalla fronte alla
         nuca e ricade dietro. A punta pareva un cappello da nano. */
      const c2 = q.ctx
      c2.beginPath()
      c2.moveTo(R * 0.6, -R * 0.78)
      c2.quadraticCurveTo(R * 0.05, -R * 1.5, -R * 0.7, -R * 1.2)
      c2.quadraticCurveTo(-R * 1.35, -R * 0.95, -R * 1.2, -R * 0.15)
      c2.quadraticCurveTo(-R * 0.85, -R * 0.7, -R * 0.15, -R * 0.85)
      c2.closePath()
      c2.fillStyle = C.cresta; c2.fill()
      c2.strokeStyle = b; c2.lineWidth = sp; c2.lineJoin = 'round'; c2.stroke()
      c2.beginPath()
      c2.moveTo(R * 0.5, -R * 0.85)
      c2.quadraticCurveTo(R * 0.02, -R * 1.32, -R * 0.6, -R * 1.1)
      c2.quadraticCurveTo(-R * 0.3, -R * 0.95, -R * 0.1, -R * 0.88)
      c2.closePath()
      c2.fillStyle = C.crestaS; c2.fill()
    } else {
      tondo(q, 0, 0, R, R * 1.02, C.ferro, b, sp)
      if (dir === 'giu') {
        poligono(q, [[-R * 0.72, -0.6 * s], [R * 0.72, -0.6 * s], [R * 0.6, 2.6 * s],
                     [-R * 0.6, 2.6 * s]], '#2a2436')
        occhi(q, s, 1.7, 0.9, 0.78, stato, '#ffffff')
        q.rett(-0.55 * s, -1.2 * s, 1.1 * s, 4 * s, C.ferroS)      // nasale
      } else {
        // di spalle: la calotta liscia con la coppa sulla nuca
        capsula(q, 0, 1.3 * s, R * 0.8, 1.5 * s, 1 * s, C.ferroS, b, sp)
        q.linea([{ x: -R * 0.85, y: -0.3 * s }, { x: R * 0.85, y: -0.3 * s }], C.ferroS, 0.8 * s)
      }
      /* il pennacchio visto di faccia: un ciuffo largo. Stretto e alto
         sembrava un'antenna, e a 36 px spariva del tutto */
      const cy = -R * 0.72
      poligono(q, [[-1.7 * s, cy], [1.7 * s, cy], [2.1 * s, cy - R * 0.35],
                   [0.9 * s, cy - R * 0.78], [0, cy - R * 0.88], [-0.9 * s, cy - R * 0.78],
                   [-2.1 * s, cy - R * 0.35]], C.cresta, b, sp)
      poligono(q, [[-1.7 * s, cy], [0, cy], [0, cy - R * 0.88], [-0.9 * s, cy - R * 0.78],
                   [-2.1 * s, cy - R * 0.35]], mescola(C.cresta, '#ffffff', 0.26))
    }
    tondo(q, -R * 0.55, -R * 0.5, R * 0.3, R * 0.2, '#ffffff66')    // luce sul ferro
  },
  arma(q, s, C, dir, sw, mani) {
    const b = C.bordo, sp = 0.7 * s
    const spada = (x, y, ang) => q.in(x, y, r => {
      r.rett(-0.75 * s, -11 * s, 1.5 * s, 11 * s, C.ferro)
      r.ctx.strokeStyle = b; r.ctx.lineWidth = sp; r.ctx.strokeRect(-0.75 * s, -11 * s, 1.5 * s, 11 * s)
      poligono(r, [[-0.75 * s, -11 * s], [0.75 * s, -11 * s], [0, -13 * s]], C.ferro, b, sp)
      r.rett(-0.3 * s, -10.6 * s, 0.6 * s, 10 * s, '#ffffff88')
      capsula(r, 0, 0, 2.8 * s, 0.7 * s, 0.5 * s, C.oro, b, sp)     // guardia
      capsula(r, 0, 1.8 * s, 0.7 * s, 1.6 * s, 0.6 * s, '#6b4a2e', b, sp)
      tondo(r, 0, 3.6 * s, 0.9 * s, 0.9 * s, C.oro, b, sp)
    }, ang)
    const scudo = (x, y, f) => {
      tondo(q, x, y, 3.6 * s * f, 4 * s, C.blu, b, sp)
      tondo(q, x, y, 2.6 * s * f, 2.9 * s, C.bluS)
      tondo(q, x, y, 1.2 * s * f, 1.3 * s, C.oro)
    }
    if (dir === 'dx') {
      // di profilo lo scudo va davanti — un cavaliere che cammina col
      // brocchiere avanti si capisce anche da lontanissimo
      spada(mani.sx.x - 0.2 * s, mani.sx.y, 0.16)
      scudo(mani.dx.x + 1.4 * s, mani.dx.y - 1 * s, 0.42)
    } else { spada(mani.dx.x, mani.dx.y, 0.3); scudo(mani.sx.x, mani.sx.y - 1 * s, 1) }
  },
}
