/* ═════ IL CAPITANO ═════
   La guardia che comanda le altre. Stessa razza, stessa corazza,
   stessa larghezza — e tre cose che dicono «questo è il capo» senza
   una parola scritta: **l'elmo d'oro** con la cresta di crine
   attraverso (non le corna: quelle ce le hanno tutti), il **mantello
   rosso** che nessun altro porta, e lo spadone al posto della scure.

   Il ferro è più scuro di quello della guardia apposta: da lontano il
   capitano è un blocco nero con un lampo giallo in cima, la guardia un
   blocco grigio con due corna chiare. Non si confondono. */
import { capsula, poligono, tondo } from '../comune.js'
import { occhi } from '../segni.js'

export const CAPITANO = {
  spalle: 7.2, taglia: 1.12,
  col: {
    pelle: '#5d9c45', pelleS: '#42722f',
    manica: '#5d9c45', manicaS: '#42722f',
    gambe: '#3a3f4c', gambeS: '#2c303b',
    scarpe: '#2f333d', scarpeS: '#242830',
    ferro: '#454c5c', ferroS: '#313743', ferroL: '#6c7484',
    oro: '#f0c53f', oroS: '#b08a1e', oroL: '#ffe9a0',
    mantello: '#b8332c', mantelloS: '#832019',
    zanne: '#f7f4ea', bordo: '#14171f',
  },
  dietro(q, s, C, dir, sw) {
    const b = C.bordo, sp = 0.85 * s
    // il mantello: lungo fino ai polpacci e mosso dal passo. Di fronte
    // se ne vedono solo i due lembi, se no copriva la corazza
    const onda = Math.sin((sw + 2) * 1.3) * 1.6 * s
    if (dir === 'su') {
      poligono(q, [[-6 * s, -13.2 * s], [6 * s, -13.2 * s], [7.6 * s, -3 * s],
                   [onda, -1 * s], [-7.6 * s, -3 * s]], C.mantello, b, sp)
      poligono(q, [[-6 * s, -13.2 * s], [0, -13.2 * s], [onda * 0.5, -1 * s], [-7.6 * s, -3 * s]],
               C.mantelloS)
    } else if (dir === 'dx') {
      poligono(q, [[-1.4 * s, -13.2 * s], [-5.6 * s, -12.6 * s], [-8 * s + onda, -3.4 * s],
                   [-4 * s, -2.6 * s], [-1.4 * s, -5.6 * s]], C.mantelloS, b, sp)
    } else {
      for (const v of [-1, 1])
        poligono(q, [[v * 3.6 * s, -13 * s], [v * 7 * s, -11.6 * s], [v * (7.8 * s + onda * v), -3 * s],
                     [v * 4 * s, -3.8 * s]], C.mantelloS, b, sp)
    }
  },
  tronco(q, s, C, dir) {
    const b = C.bordo, sp = 0.85 * s
    const w = dir === 'dx' ? 4.5 : 6.4
    poligono(q, [[-w * s, -13 * s], [w * s, -13 * s], [w * 1.06 * s, -6.4 * s],
                 [w * 0.8 * s, -4.6 * s], [-w * 0.8 * s, -4.6 * s], [-w * 1.06 * s, -6.4 * s]],
             C.ferro, b, sp)
    if (dir !== 'su') {
      // il pettorale dorato: una lastra sola, grande, non dieci borchie
      poligono(q, [[-w * 0.62 * s, -12.4 * s], [w * 0.62 * s, -12.4 * s], [w * 0.5 * s, -7.4 * s],
                   [0, -6 * s], [-w * 0.5 * s, -7.4 * s]], C.oro, b, sp * 0.9)
      poligono(q, [[-w * 0.62 * s, -12.4 * s], [0, -12.4 * s], [0, -6 * s], [-w * 0.5 * s, -7.4 * s]],
               C.oroS)
      tondo(q, 0, -10.4 * s, 1.3 * s, 1.3 * s, C.oroL, C.oroS, sp * 0.7)
    } else {
      q.rett(-w * 0.9 * s, -11.6 * s, w * 1.8 * s, 1.1 * s, C.oro)
    }
    q.rett(-w * 0.95 * s, -6 * s, w * 1.9 * s, 1.7 * s, C.oroS)      // il cinturone
    q.rett(-1.5 * s, -6.1 * s, 3 * s, 1.9 * s, C.oro)
    const spallaccio = (x, v) => {
      poligono(q, [[x - 3 * s * v, -13.8 * s], [x + 2.6 * s * v, -13.6 * s],
                   [x + 3.4 * s * v, -10.8 * s], [x - 2.6 * s * v, -11 * s]], C.oro, b, sp)
      poligono(q, [[x - 3 * s * v, -13.8 * s], [x + 2.6 * s * v, -13.6 * s],
                   [x + 2.7 * s * v, -12.6 * s], [x - 2.9 * s * v, -12.8 * s]], C.oroL)
    }
    if (dir === 'dx') spallaccio(1.2 * s, 1)
    else { spallaccio(-w * 0.95 * s, -1); spallaccio(w * 0.95 * s, 1) }
  },
  testa(q, s, C, dir, stato) {
    const b = C.bordo, sp = 0.85 * s, R = 5 * s
    q.rett(-2.2 * s, 1.4 * s, 4.4 * s, 2.6 * s, C.pelleS)
    /* la cresta: di crine, **di traverso** sulla testa. Di faccia si
       vede come una spazzola larga da orecchio a orecchio, di profilo
       come una riga alta e stretta: è il contrario del pennacchio del
       cavaliere, che di faccia è stretto e di profilo lungo. Due eroi
       col ciuffo non si confondono se il ciuffo è girato. */
    const cresta = () => {
      if (dir === 'dx') {
        capsula(q, 0, -R * 1.12, 1.5 * s, 1.6 * s, 1.1 * s, '#efe6d4', b, sp * 0.8)
        tondo(q, -0.4 * s, -R * 1.3, 0.8 * s, 0.6 * s, '#ffffff')
      } else {
        poligono(q, [[-R * 1.15, -R * 0.5], [-R * 0.95, -R * 1.05], [0, -R * 1.25],
                     [R * 0.95, -R * 1.05], [R * 1.15, -R * 0.5], [R * 0.75, -R * 0.62],
                     [0, -R * 0.78], [-R * 0.75, -R * 0.62]], '#efe6d4', b, sp * 0.85)
        poligono(q, [[-R * 0.95, -R * 1.05], [0, -R * 1.25], [0, -R * 0.78], [-R * 0.75, -R * 0.62]],
                 '#ffffff')
      }
    }
    if (dir === 'dx') {
      cresta()
      poligono(q, [[-R * 0.95, -R * 0.2], [-R * 0.3, -R * 1.1], [R * 0.75, -R * 0.8],
                   [R * 0.95, 0.6 * s], [R * 0.4, 1.6 * s], [-R * 0.85, 1.4 * s]], C.oro, b, sp)
      poligono(q, [[-R * 0.95, -R * 0.2], [-R * 0.3, -R * 1.1], [R * 0.2, -R * 0.95],
                   [-R * 0.5, 0.9 * s]], C.oroL)
      q.rett(R * 0.05, -0.6 * s, R * 0.95, 1.5 * s, '#141824')
      tondo(q, R * 0.62, 0.2 * s, 0.6 * s, 0.55 * s, stato === 'ko' ? '#6a6274' : '#ffd24a')
      tondo(q, R * 0.5, 2.4 * s, R * 0.6, R * 0.42, C.pelle, b, sp * 0.8)
      poligono(q, [[R * 0.55, 2.9 * s], [R * 0.85, 2.85 * s], [R * 0.75, 1.5 * s]], C.zanne, b, sp * 0.7)
    } else if (dir === 'su') {
      cresta()
      tondo(q, 0, -0.2 * s, R * 0.98, R * 1.02, C.oro, b, sp)
      tondo(q, -R * 0.3, -R * 0.4, R * 0.45, R * 0.3, C.oroL)
      q.rett(-R * 0.9, 0.6 * s, R * 1.8, 1.8 * s, C.oroS)
    } else {
      cresta()
      tondo(q, 0, -0.2 * s, R * 0.98, R * 1.05, C.oro, b, sp)
      poligono(q, [[-R * 0.98, -R * 0.2], [-R * 0.2, -R * 0.9], [-R * 0.1, R * 0.9],
                   [-R * 0.8, R * 0.6]], C.oroL)
      q.rett(-R * 0.78, -0.6 * s, R * 1.56, 1.6 * s, '#141824')
      if (stato === 'ko') occhi(q, s, 1.9, 0.2, 0.7, stato, '#6a6274')
      else for (const v of [-1, 1]) {
        tondo(q, v * 1.9 * s, 0.2 * s, 0.8 * s, 0.55 * s, '#ffd24a')
        tondo(q, v * 1.9 * s, 0.2 * s, 0.36 * s, 0.3 * s, '#fff6cf')
      }
      q.rett(-0.6 * s, -R * 0.95, 1.2 * s, R * 1.15, C.oroS)
      poligono(q, [[-R * 0.72, 1.2 * s], [R * 0.72, 1.2 * s], [R * 0.6, 3.4 * s],
                   [-R * 0.6, 3.4 * s]], C.pelle, b, sp * 0.8)
      for (const v of [-1, 1])
        poligono(q, [[v * 1.7 * s, 3.2 * s], [v * 2.7 * s, 3 * s], [v * 2.2 * s, 1.5 * s]],
                 C.zanne, b, sp * 0.7)
    }
  },
  arma(q, s, C, dir, sw, mani) {
    const b = C.bordo, sp = 0.8 * s
    // lo spadone, tenuto in verticale come chi sta sull'attenti
    q.in(mani.dx.x + 0.4 * s, mani.dx.y + 1 * s, r => {
      poligono(r, [[-1.1 * s, -3 * s], [1.1 * s, -3 * s], [1.1 * s, -13.4 * s], [0, -15.4 * s],
                   [-1.1 * s, -13.4 * s]], C.ferroL, b, sp)
      r.rett(-0.4 * s, -13.2 * s, 0.8 * s, 9.6 * s, '#ffffff77')
      capsula(r, 0, -3 * s, 3.4 * s, 0.8 * s, 0.6 * s, C.oro, b, sp)
      capsula(r, 0, -0.8 * s, 0.8 * s, 2 * s, 0.7 * s, '#4a3a2a', b, sp)
      tondo(r, 0, 1.6 * s, 1.1 * s, 1.1 * s, C.oro, b, sp)
    }, dir === 'dx' ? 0.16 : 0.1)
  },
}
