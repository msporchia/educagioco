/* ═════ IL TROLL ═════
   Il capo di piano che si incontra più spesso, e deve reggere il
   confronto col guardiano senza rubargli la scena: enorme, spalle
   altissime, testa piccola incassata fra le due. La proporzione è
   tutta lì — testa piccola su spalle larghe vuol dire forza bruta,
   testa grossa vuol dire pupazzo.

   Grigioverde e non verde: il verde è dell'orco, e due nemici dello
   stesso colore nella stessa discesa si confondono. */
import { mescola, capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const TROLL = {
  spalle: 8.4, taglia: 1.22, arti: 1.35,
  col: {
    pelle: '#7d8f70', pelleS: '#5d6d54',
    manica: '#74856a', manicaS: '#586552',
    gambe: '#6a7a60', gambeS: '#4e5c48',
    scarpe: '#3f3328', scarpeS: '#31281f',
    panno: '#8a6a3e', unghie: '#e8e0c8', bordo: '#1f2a1b',
  },
  tronco(q, s, C) {
    const b = C.bordo, sp = 0.9 * s
    // il torace: larghissimo in alto, stretto ai fianchi. È il
    // contrario dell'orco, che è panciuto, e serve a non farli sembrare
    // parenti stretti
    poligono(q, [[-8 * s, -13.4 * s], [8 * s, -13.4 * s], [5.4 * s, -5 * s], [-5.4 * s, -5 * s]],
             C.pelle, b, sp)
    for (const v of [-1, 1])                                          // i pettorali
      tondo(q, v * 3.4 * s, -10.6 * s, 3 * s, 2.4 * s, mescola(C.pelle, '#ffffff', 0.12))
    q.rett(-5.6 * s, -6.6 * s, 11.2 * s, 2.4 * s, C.panno)            // il perizoma di cuoio
    // le cicatrici: due righe chiare sul petto, che raccontano che le
    // ha già prese e che è ancora qui
    q.ctx.strokeStyle = mescola(C.pelle, '#ffffff', 0.4); q.ctx.lineWidth = 0.55 * s
    q.ctx.beginPath()
    q.ctx.moveTo(-1.4 * s, -12.4 * s); q.ctx.lineTo(2.6 * s, -8.4 * s)
    q.ctx.moveTo(0.6 * s, -12.6 * s); q.ctx.lineTo(4 * s, -9.4 * s)
    q.ctx.stroke()
  },
  testa(q, s, C, dir, stato) {
    const b = C.bordo, sp = 0.85 * s, R = 4.2 * s
    tondo(q, 0, 0.6 * s, R, R * 0.92, C.pelle, b, sp)
    // la fronte sporgente sopra gli occhi: una visiera d'osso. È lei a
    // fare la faccia arrabbiata, più di qualunque sopracciglio
    poligono(q, [[-R, -0.8 * s], [R, -0.8 * s], [R * 0.8, -2.6 * s], [-R * 0.8, -2.6 * s]],
             C.pelleS, b, sp * 0.9)
    occhi(q, s, 1.8, 0.4, 0.8, stato)
    tondo(q, 0, 2 * s, 1.2 * s, 0.9 * s, C.pelleS)                    // il naso schiacciato
    if (stato !== 'ko') {                                              // la dentatura sotto
      q.ctx.strokeStyle = b; q.ctx.lineWidth = 0.8 * s; q.ctx.lineCap = 'round'
      q.ctx.beginPath(); q.ctx.moveTo(-2.4 * s, 3.4 * s); q.ctx.lineTo(2.4 * s, 3.4 * s); q.ctx.stroke()
      for (const v of [-1, 1])
        poligono(q, [[v * 1.2 * s, 3.4 * s], [v * 2.2 * s, 3.4 * s], [v * 1.7 * s, 1.8 * s]],
                 C.unghie, b, sp * 0.6)
    }
    for (const v of [-1, 1])                                           // le orecchie a foglia
      poligono(q, [[v * R * 0.9, -0.6 * s], [v * R * 1.7, -2.4 * s], [v * R * 1.1, 1.8 * s]],
               C.pelleS, b, sp * 0.8)
  },
  arma(q, s, C, dir, sw, mani) {
    // un tronco d'albero tenuto per il manico: niente lame, niente
    // punte di ferro — un troll non forgia, raccoglie
    const b = C.bordo
    q.in(mani.dx.x + 1.2 * s, mani.dx.y + 1 * s, r => {
      capsula(r, 0, -2 * s, 1.1 * s, 3.4 * s, 0.9 * s, '#6b4c2c', b, 0.75 * s)
      capsula(r, 0, -8.4 * s, 2.8 * s, 4.4 * s, 2 * s, '#8a6136', b, 0.8 * s)
      for (const [dx, dy] of [[-1.4, -9.6], [1.5, -7.4], [0.2, -11.2]])
        tondo(r, dx * s, dy * s, 0.7 * s, 0.6 * s, '#5c3f22')
    }, 0.3)
  },
}
