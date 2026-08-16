/* ═════ LA GUARDIA ═════
   Lo stesso sangue dell'orco, ma dentro il ferro: elmo con due corna,
   spallacci quadrati, ascia. Larga il doppio e **scura** — l'orco è
   una macchia verde chiara, la guardia una macchia grigia con le
   corna, e a 36 px basta quello. */
import { mescola, capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const GUARDIA = {
  spalle: 7, taglia: 1.08,
  col: {
    pelle: '#5d9c45', pelleS: '#42722f',
    manica: '#5d9c45', manicaS: '#42722f',
    gambe: '#4d5566', gambeS: '#3b4250',
    scarpe: '#3a3f4c', scarpeS: '#2c303b',
    ferro: '#6d7789', ferroS: '#4e5766', ferroL: '#98a3b5',
    corno: '#e2d6bd', rosso: '#c0392f',
    zanne: '#f7f4ea', bordo: '#191d28',
  },
  tronco(q, s, C, dir) {
    const b = C.bordo, sp = 0.85 * s
    const w = dir === 'dx' ? 4.4 : 6.2
    // corazza squadrata: gli spigoli fanno «duro» dove le curve fanno «buffo»
    poligono(q, [[-w * s, -12.8 * s], [w * s, -12.8 * s], [w * 1.06 * s, -6.4 * s],
                 [w * 0.8 * s, -4.6 * s], [-w * 0.8 * s, -4.6 * s], [-w * 1.06 * s, -6.4 * s]],
             C.ferro, b, sp)
    if (dir !== 'su') {
      q.rett(-w * 0.9 * s, -11.4 * s, w * 1.8 * s, 1 * s, C.ferroL)
      poligono(q, [[-1.4 * s, -12.6 * s], [1.4 * s, -12.6 * s], [0, -8.4 * s]], C.rosso)
      for (const v of [-1, 1]) for (const dy of [-10.2, -7.6])
        tondo(q, v * w * 0.66 * s, dy * s, 0.5 * s, 0.5 * s, C.ferroL)
    } else {
      q.rett(-w * 0.9 * s, -11.4 * s, w * 1.8 * s, 1 * s, C.ferroL)
      q.rett(-1.6 * s, -12.6 * s, 3.2 * s, 8 * s, C.ferroS)
    }
    q.rett(-w * 0.95 * s, -6 * s, w * 1.9 * s, 1.6 * s, C.rosso)     // fascia rossa
    // spallacci con la punta
    const spallaccio = (x, v) => {
      poligono(q, [[x - 2.8 * s * v, -13.4 * s], [x + 2.4 * s * v, -13.2 * s],
                   [x + 3.2 * s * v, -10.6 * s], [x - 2.4 * s * v, -10.8 * s]], C.ferroL, b, sp)
      poligono(q, [[x + 2.6 * s * v, -13 * s], [x + 5.4 * s * v, -12.4 * s], [x + 3.3 * s * v, -11 * s]],
               C.ferroS, b, sp * 0.8)
    }
    if (dir === 'dx') spallaccio(1 * s, 1)
    else { spallaccio(-w * 0.95 * s, -1); spallaccio(w * 0.95 * s, 1) }
  },
  testa(q, s, C, dir, stato, cosa) {
    const b = C.bordo, sp = 0.85 * s, R = 4.9 * s
    q.rett(-2.2 * s, 1.4 * s, 4.4 * s, 2.6 * s, C.pelleS)
    /* ── SENZA ELMO ──
       `{ che: 'guardia', elmo: false }` la spoglia: niente ferro,
       niente corna, resta la faccia verde della stessa razza
       dell'orco — orecchie a punta invece delle corna, e la stessa
       coppia di zanne. Serve a raccontare «l'hanno disarmata»,
       «è un prigioniero», senza inventare un personaggio nuovo solo
       per quello. */
    if (cosa && cosa.elmo === false) {
      for (const v of (dir === 'dx' ? [-1] : [-1, 1]))
        poligono(q, [[v * R * 0.68, -0.8 * s], [v * R * 1.55, -R * 0.66], [v * R * 0.88, 1 * s]],
                 C.pelleS, b, sp * 0.8)
      if (dir === 'dx') {
        tondo(q, 0, 0, R * 0.9, R * 0.86, C.pelle, b, sp)
        tondo(q, R * 0.7, 1 * s, R * 0.5, R * 0.4, C.pelle, b, sp * 0.8)
        poligono(q, [[R * 0.62, 1.6 * s], [R * 0.9, 1.6 * s], [R * 0.8, 0.3 * s]], C.zanne, b, sp * 0.6)
        if (stato === 'ko') occhi(q, s, -0.9, -0.5, 0.65, stato)
        else {
          tondo(q, R * 0.4, -0.5 * s, 0.75 * s, 0.85 * s, '#ffd24a')
          tondo(q, R * 0.5, -0.4 * s, 0.36 * s, 0.44 * s, '#20182e')
        }
      } else if (dir === 'su') {
        tondo(q, 0, 0, R * 0.92, R * 0.9, C.pelleS, b, sp)
      } else {
        tondo(q, 0, 0, R * 0.92, R * 0.9, C.pelle, b, sp)
        if (stato === 'ko') occhi(q, s, 1.7, -0.4, 0.75, stato)
        else for (const v of [-1, 1]) {
          tondo(q, v * 1.7 * s, -0.4 * s, 0.7 * s, 0.8 * s, '#ffd24a')
          tondo(q, v * 1.7 * s + 0.14 * s, -0.32 * s, 0.32 * s, 0.4 * s, '#20182e')
        }
        poligono(q, [[-0.8 * s, 0.6 * s], [0.8 * s, 0.6 * s], [0, 2.2 * s]], C.pelleS)
        for (const v of [-1, 1])
          poligono(q, [[v * 1.3 * s, 2.4 * s], [v * 2.1 * s, 2.1 * s], [v * 1.7 * s, 1 * s]],
                   C.zanne, b, sp * 0.6)
      }
      return
    }
    /* le corna: grosse alla base e affusolate in punta, curve all'insù.
       A punte sottili sembravano antenne, ed è la cosa che si vede per
       prima di questo personaggio */
    const corna = (v) => {
      const c = q.ctx
      c.beginPath()
      c.moveTo(v * R * 0.55, -R * 0.88)
      c.quadraticCurveTo(v * R * 1.35, -R * 1.12, v * R * 1.72, -R * 0.72)
      c.quadraticCurveTo(v * R * 1.2, -R * 0.62, v * R * 0.62, -R * 0.02)
      c.closePath()
      c.fillStyle = C.corno; c.fill()
      c.strokeStyle = b; c.lineWidth = sp; c.lineJoin = 'round'; c.stroke()
      c.beginPath()
      c.moveTo(v * R * 0.6, -R * 0.8)
      c.quadraticCurveTo(v * R * 1.2, -R * 0.98, v * R * 1.45, -R * 0.74)
      c.quadraticCurveTo(v * R * 1.02, -R * 0.7, v * R * 0.62, -R * 0.36)
      c.closePath()
      c.fillStyle = mescola(C.corno, '#ffffff', 0.4); c.fill()
    }
    if (dir === 'dx') {
      corna(-1); corna(1)
      poligono(q, [[-R * 0.95, -R * 0.2], [-R * 0.3, -R * 1.15], [R * 0.75, -R * 0.85],
                   [R * 0.95, 0.6 * s], [R * 0.4, 1.6 * s], [-R * 0.85, 1.4 * s]], C.ferro, b, sp)
      q.rett(R * 0.05, -0.6 * s, R * 0.95, 1.5 * s, '#141824')
      tondo(q, R * 0.62, 0.2 * s, 0.6 * s, 0.55 * s, stato === 'ko' ? '#6a6274' : '#ffd24a')
      // mento verde e zanna sotto l'elmo
      tondo(q, R * 0.5, 2.4 * s, R * 0.6, R * 0.42, C.pelle, b, sp * 0.8)
      poligono(q, [[R * 0.55, 2.9 * s], [R * 0.85, 2.85 * s], [R * 0.75, 1.5 * s]], C.zanne, b, sp * 0.7)
    } else if (dir === 'su') {
      corna(-1); corna(1)
      tondo(q, 0, -0.2 * s, R * 0.98, R * 1.02, C.ferro, b, sp)
      q.rett(-R * 0.9, 0.6 * s, R * 1.8, 1.8 * s, C.ferroS)
      q.linea([{ x: 0, y: -R * 1.05 }, { x: 0, y: 1 * s }], C.ferroL, 0.9 * s)
    } else {
      corna(-1); corna(1)
      tondo(q, 0, -0.2 * s, R * 0.98, R * 1.05, C.ferro, b, sp)
      q.rett(-R * 0.78, -0.6 * s, R * 1.56, 1.6 * s, '#141824')       // la feritoia
      if (stato === 'ko') occhi(q, s, 1.9, 0.2, 0.7, stato, '#6a6274')
      else for (const v of [-1, 1]) {
        tondo(q, v * 1.9 * s, 0.2 * s, 0.8 * s, 0.55 * s, '#ffd24a')
        tondo(q, v * 1.9 * s, 0.2 * s, 0.36 * s, 0.3 * s, '#fff6cf')
      }
      q.rett(-0.6 * s, -R * 0.95, 1.2 * s, R * 1.15, C.ferroL)        // nasale
      // mascella verde con le due zanne
      poligono(q, [[-R * 0.72, 1.2 * s], [R * 0.72, 1.2 * s], [R * 0.6, 3.4 * s],
                   [-R * 0.6, 3.4 * s]], C.pelle, b, sp * 0.8)
      for (const v of [-1, 1])
        poligono(q, [[v * 1.7 * s, 3.2 * s], [v * 2.7 * s, 3 * s], [v * 2.2 * s, 1.5 * s]],
                 C.zanne, b, sp * 0.7)
    }
  },
  arma(q, s, C, dir, sw, mani) {
    const b = C.bordo, sp = 0.8 * s
    /* la scure sta *verso il corpo*: portata in fuori usciva dalla
       cella e sul telefono finiva addosso al vicino di casella */
    q.in(mani.dx.x + 0.2 * s, mani.dx.y + 0.6 * s, r => {
      capsula(r, 0, -5 * s, 0.85 * s, 7 * s, 0.7 * s, '#7a5433', b, sp)
      const c = r.ctx
      c.beginPath()
      c.moveTo(0, -13.4 * s)
      c.quadraticCurveTo(-5 * s, -11.8 * s, -4.4 * s, -8 * s)
      c.quadraticCurveTo(-3.8 * s, -6.2 * s, 0, -7.6 * s)
      c.closePath()
      c.fillStyle = C.ferroL; c.fill(); c.strokeStyle = b; c.lineWidth = sp; c.stroke()
      c.beginPath()
      c.moveTo(-0.6 * s, -12.8 * s)
      c.quadraticCurveTo(-3 * s, -11.4 * s, -2.8 * s, -8.6 * s)
      c.quadraticCurveTo(-2.2 * s, -7.8 * s, -0.6 * s, -8.4 * s)
      c.closePath(); c.fillStyle = C.ferroS; c.fill()
    }, dir === 'dx' ? -0.12 : -0.08)
  },
}
