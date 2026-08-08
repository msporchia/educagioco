/* ═════ L'ELFO ═════
   Il tiratore. Tutto il contrario del cavaliere: niente ferro, niente
   spalle: **magro** (`arti: 0.82`), alto, e di tinte fredde e chiare —
   verde acqua, argento, capelli quasi bianchi. La sagoma che si legge
   da lontano è **l'arco**, una C grande quanto lui che nessun altro
   personaggio ha: a 36 px il cavaliere è un blocco azzurro, l'elfo una
   virgola chiara con una parentesi accanto. */
import { capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const ELFO = {
  spalle: 4.4, taglia: 1.02, arti: 0.82,
  col: {
    pelle: '#f7e2c8', pelleS: '#dcc3a4',
    manica: '#9fd4c6', manicaS: '#78ada2',
    gambe: '#cdd8e2', gambeS: '#a4b1c0',
    scarpe: '#5f6f68', scarpeS: '#48564f',
    veste: '#d6efe6', vesteS: '#a5cec3',
    foglia: '#7fc98f', capelli: '#f4eed6', capelliS: '#d3caab',
    argento: '#e2ebf3', argentoS: '#aebbc8',
    legno: '#a8794a', legnoS: '#7d5733',
    bordo: '#28323c',
  },
  dietro(q, s, C, dir) {
    const b = C.bordo, sp = 0.7 * s
    // la faretra: di spalle si vede tutta con le sue tre cocche, di
    // fronte spunta appena da sopra una spalla — è il dettaglio che
    // dice «tiratore» anche quando l'arco è nascosto dal corpo
    const x = dir === 'su' ? 2.6 * s : (dir === 'dx' ? -3 * s : -4.4 * s)
    q.in(x, -9 * s, r => {
      capsula(r, 0, 0, 1.5 * s, 3.6 * s, 1 * s, C.legnoS, b, sp)
      for (const d of [-1, 0, 1]) {
        r.ctx.strokeStyle = C.legno; r.ctx.lineWidth = 0.5 * s; r.ctx.lineCap = 'round'
        r.ctx.beginPath()
        r.ctx.moveTo(d * 0.8 * s, -3 * s); r.ctx.lineTo(d * 1.3 * s, -5.6 * s); r.ctx.stroke()
        poligono(r, [[d * 1.3 * s, -5.4 * s], [d * 1.3 * s + 0.9 * s, -6.4 * s],
                     [d * 1.3 * s - 0.6 * s, -6.6 * s]], C.veste)
      }
    }, dir === 'su' ? 0.24 : -0.24)
    // la mantellina corta, appena accennata: non deve fare massa
    if (dir === 'su')
      poligono(q, [[-4.6 * s, -12.4 * s], [4.6 * s, -12.4 * s], [5.2 * s, -6 * s],
                   [-5.2 * s, -6 * s]], C.veste, b, sp)
  },
  tronco(q, s, C, dir) {
    const b = C.bordo, sp = 0.7 * s
    const w = dir === 'dx' ? 3 : 4
    // tunica lunga e stretta in vita: la clessidra fa «snello» come la
    // pancia dell'orco fa «pesante»
    poligono(q, [[-w * s, -12.6 * s], [w * s, -12.6 * s], [w * 0.82 * s, -8.4 * s],
                 [w * 1.15 * s, -4 * s], [-w * 1.15 * s, -4 * s], [-w * 0.82 * s, -8.4 * s]],
             C.veste, b, sp)
    if (dir !== 'su') {
      poligono(q, [[0, -12.6 * s], [w * 0.5 * s, -12.4 * s], [0, -6.4 * s], [-w * 0.5 * s, -12.4 * s]],
               C.manica)
      tondo(q, 0, -11.6 * s, 1.1 * s, 1.1 * s, C.foglia, b, sp * 0.8)      // la spilla a foglia
    }
    q.rett(-w * 0.95 * s, -8.6 * s, w * 1.9 * s, 1.1 * s, C.argentoS)      // cintura d'argento
    q.rett(-0.8 * s, -8.7 * s, 1.6 * s, 1.3 * s, C.argento)
  },
  testa(q, s, C, dir, stato) {
    const b = C.bordo, sp = 0.7 * s, R = 4.2 * s
    q.rett(-1.3 * s, 2 * s, 2.6 * s, 2.2 * s, C.pelleS)
    // le orecchie a punta all'insù: piccole ma nette, e in tutte e tre
    // le viste — è quello che lo fa elfo e non ragazzo biondo
    const orecchio = v => poligono(q, [[v * R * 0.7, -0.4 * s], [v * R * 1.35, -R * 0.95],
                                       [v * R * 0.8, 0.9 * s]], C.pelle, b, sp * 0.8)
    if (dir === 'dx') {
      orecchio(-1)
      tondo(q, 0.2 * s, 0.3 * s, R * 0.82, R * 0.92, C.pelle, b, sp)
      // i capelli lunghi che coprono la nuca e ricadono sulla spalla
      poligono(q, [[R * 0.35, -R * 1.05], [-R * 0.9, -R * 0.75], [-R * 1.15, R * 0.9],
                   [-R * 0.65, 4.4 * s], [-R * 0.1, 4.2 * s], [-R * 0.35, R * 0.2],
                   [R * 0.3, -R * 0.45]], C.capelli, b, sp)
      tondo(q, R * 0.55, 0.4 * s, 0.7 * s, 0.8 * s, '#ffffff')
      tondo(q, R * 0.65, 0.5 * s, 0.34 * s, 0.46 * s, '#3a5a4a')
      poligono(q, [[R * 0.85, 0.5 * s], [R * 1.2, 1.2 * s], [R * 0.8, 1.4 * s]], C.pelle)
      q.rett(-R * 0.5, -R * 0.72, R * 1.35, 0.55 * s, C.argento)            // il cerchietto
    } else if (dir === 'su') {
      orecchio(-1); orecchio(1)
      tondo(q, 0, 0, R * 0.92, R, C.capelli, b, sp)
      poligono(q, [[-R * 0.92, 0], [R * 0.92, 0], [R * 0.7, 4.6 * s], [-R * 0.7, 4.6 * s]],
               C.capelli, b, sp)
      q.linea([{ x: 0, y: -R * 0.6 }, { x: 0, y: 4 * s }], C.capelliS, 0.7 * s)
      q.rett(-R * 0.95, -R * 0.55, R * 1.9, 0.55 * s, C.argento)
    } else {
      orecchio(-1); orecchio(1)
      tondo(q, 0, 0.4 * s, R * 0.82, R * 0.92, C.pelle, b, sp)
      // i capelli: calotta più due ciocche lunghe ai lati del viso
      poligono(q, [[-R * 0.9, R * 0.35], [-R * 0.82, -R * 0.7], [0, -R * 1.1],
                   [R * 0.82, -R * 0.7], [R * 0.9, R * 0.35], [R * 0.55, -R * 0.15],
                   [0, -R * 0.42], [-R * 0.55, -R * 0.15]], C.capelli, b, sp)
      for (const v of [-1, 1])
        poligono(q, [[v * R * 0.88, -R * 0.3], [v * R * 1.05, 4.6 * s], [v * R * 0.5, 4.4 * s],
                     [v * R * 0.6, -R * 0.2]], C.capelli, b, sp)
      occhi(q, s, 1.5, 0.6, 0.72, stato, '#3a5a4a')
      poligono(q, [[0, 1.3 * s], [0.6 * s, 2.2 * s], [-0.6 * s, 2.2 * s]], C.pelleS)
      q.ctx.strokeStyle = '#b07a58'; q.ctx.lineWidth = 0.55 * s; q.ctx.lineCap = 'round'
      q.ctx.beginPath(); q.ctx.moveTo(-0.9 * s, 3 * s); q.ctx.quadraticCurveTo(0, 3.6 * s, 0.9 * s, 3 * s)
      q.ctx.stroke()
      q.rett(-R * 0.78, -R * 0.62, R * 1.56, 0.55 * s, C.argento)
      tondo(q, 0, -R * 0.35, 0.7 * s, 0.7 * s, C.foglia, b, sp * 0.7)       // la gemma in fronte
    }
  },
  arma(q, s, C, dir, sw, mani) {
    const b = C.bordo, sp = 0.65 * s
    /* l'arco: due curve di legno e la corda tesa. Di profilo sta
       davanti al corpo e si vede intero; di faccia è di taglio, quindi
       si stringe — se restasse largo sembrerebbe una ruota. */
    const stretto = dir === 'dx' ? 1 : 0.42
    q.in(mani.dx.x + (dir === 'dx' ? 1.4 : 0.6) * s, mani.dx.y - 0.6 * s, r => {
      const c = r.ctx
      c.beginPath()
      c.moveTo(0, -8.6 * s)
      c.quadraticCurveTo(5.4 * s * stretto, -4.6 * s, 4.6 * s * stretto, 0)
      c.quadraticCurveTo(5.4 * s * stretto, 4.6 * s, 0, 8.6 * s)
      c.strokeStyle = b; c.lineWidth = 1.7 * s; c.lineCap = 'round'; c.stroke()
      c.strokeStyle = C.legno; c.lineWidth = 1 * s; c.stroke()
      // la corda, tesa fra le due punte
      c.beginPath(); c.moveTo(0, -8.6 * s); c.lineTo(0, 8.6 * s)
      c.strokeStyle = '#efe9d8cc'; c.lineWidth = 0.35 * s; c.stroke()
      for (const v of [-1, 1])
        tondo(r, 0, v * 8.6 * s, 0.55 * s, 0.55 * s, C.argento, b, sp * 0.7)
    }, dir === 'dx' ? 0.12 : -0.1)
  },
}
