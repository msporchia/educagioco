/* ═════ IL MAGO ═════
   Il solo che non cammina su due gambe che si vedono: la veste scende
   fino a terra e le copre, e quello che resta è **una campana blu
   notte** con sopra un cappello a tesa larga e una barba bianca. È la
   sagoma più diversa di tutte, e serve così — perché il colore è a un
   passo da quello della ladra, e a 36 px sono la forma e il bianco
   della barba a tenerli separati, non la tinta.

   Ha una posa in più, `stato: 'lancia'`: le braccia si alzano (ci
   pensa `corpo.js`), il bastone sale con la mano e sopra la punta si
   accende la sfera. Serve ai livelli che ancora non ci sono. */
import { capsula, poligono, tondo } from '../comune.js'
import { occhi, scintilla } from '../segni.js'

/* una stellina a cinque punte: sul mantello e in cima al cappello.
   Piccola apposta — a 36 px deve restare un puntino d'oro. */
function stella(q, x, y, r, col) {
  const p = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5
    const rr = i % 2 ? r * 0.44 : r
    p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr])
  }
  poligono(q, p, col)
}

export const MAGO = {
  /* DI CHE COSA È FATTO. Il mago è il caso dove la materia si vede
     più che su chiunque altro, e per una ragione sola: **è quasi
     tutto stoffa**. Il cavaliere ha la veste coperta dalla corazza e
     resta poco panno in vista; qui la tonaca è due terzi della
     figura, e sotto una tinta piatta era il pezzo più grande e più
     morto del disegno. Il bastone resta legno liscio, la gemma pure:
     una gemma con una trama non sarebbe più una gemma. */
  materie: { manica: 'stoffa', gambe: 'stoffa', scarpe: 'cuoio' },
  spalle: 4.6, taglia: 1.05, arti: 0.9,
  col: {
    pelle: '#f2c9a0', pelleS: '#d9a97f',
    manica: '#3b3f8c', manicaS: '#2a2d66',
    gambe: '#2a2d66', gambeS: '#22254f',
    scarpe: '#5a4630', scarpeS: '#42331f',
    veste: '#3b3f8c', vesteS: '#2a2d66', vesteC: '#5257ad',
    barba: '#f2eee2', barbaS: '#cdc7b6',
    oro: '#f2c94c', gemma: '#7fe0ff', gemmaS: '#3aa8d8',
    legno: '#8a6136', legnoS: '#684322',
    bordo: '#171730',
  },
  tronco(q, s, C, dir) {
    const b = C.bordo, sp = 0.75 * s
    const w = dir === 'dx' ? 3.6 : 4.6
    /* la campana: dalle spalle ai piedi, larga in basso. Disegnata qui
       e non in `dietro` apposta — `corpo.js` mette le gambe prima del
       tronco, quindi è la veste che se le mangia, ed è tutto quello che
       serve per farlo «scivolare» invece che camminare. */
    poligono(q, [[-w * s, -12.4 * s], [w * s, -12.4 * s], [w * 1.5 * s, -3 * s],
                 [w * 1.75 * s, 0.6 * s], [-w * 1.75 * s, 0.6 * s], [-w * 1.5 * s, -3 * s]],
             C.veste, b, sp, 'stoffa')
    // l'orlo dorato e le due pieghe: senza, la campana era una macchia
    q.rett(-w * 1.72 * s, -0.9 * s, w * 3.44 * s, 1.1 * s, C.oro)
    q.ctx.strokeStyle = C.vesteS; q.ctx.lineWidth = 0.7 * s
    for (const v of [-1, 1]) {
      q.ctx.beginPath()
      q.ctx.moveTo(v * w * 0.45 * s, -11 * s)
      q.ctx.quadraticCurveTo(v * w * 0.8 * s, -5 * s, v * w * 1.1 * s, -1.2 * s)
      q.ctx.stroke()
    }
    if (dir !== 'su') {
      // le stelle: tre, piccole, e mai in fila — è il segno «mago» che
      // si legge anche quando la faccia non si vede
      for (const [sx, sy, r] of [[-2.6, -9.6, 1], [2.9, -7.4, 0.8], [-1.4, -4.6, 0.7]])
        stella(q, sx * s, sy * s, r * 1.5 * s, C.oro)
    }
    capsula(q, 0, -12.4 * s, (dir === 'dx' ? 3.2 : 4.2) * s, 1.3 * s, 1.1 * s, C.vesteC, b, sp, 'stoffa')
  },
  testa(q, s, C, dir, stato) {
    const b = C.bordo, sp = 0.75 * s, R = 4.3 * s
    if (dir !== 'su') {
      tondo(q, dir === 'dx' ? 0.4 * s : 0, 0.6 * s, R * 0.8, R * 0.88, C.pelle, b, sp)
      /* la barba: un cuneo bianco che scende sul petto. È l'unica cosa
         chiara di tutto il personaggio, e a 36 px è quella che si
         vede — il cappello si perde nel fondo scuro, la barba no. */
      poligono(q, dir === 'dx'
        ? [[-R * 0.5, 0.4 * s], [R * 0.9, 0.6 * s], [R * 0.55, 4.4 * s], [0, 7.4 * s],
           [-R * 0.55, 4.6 * s]]
        : [[-R * 0.8, 0.4 * s], [R * 0.8, 0.4 * s], [R * 0.6, 4.4 * s], [0, 7.6 * s],
           [-R * 0.6, 4.4 * s]], C.barba, b, sp)
      poligono(q, dir === 'dx'
        ? [[0, 1 * s], [R * 0.9, 0.8 * s], [R * 0.5, 4.2 * s], [0.2 * s, 6.2 * s]]
        : [[0, 1 * s], [R * 0.8, 0.6 * s], [R * 0.55, 4.2 * s], [0, 6.4 * s]], C.barbaS)
    }
    if (dir === 'dx') {
      tondo(q, R * 0.62, 0.1 * s, 0.62 * s, 0.72 * s, '#ffffff')
      tondo(q, R * 0.72, 0.15 * s, 0.32 * s, 0.42 * s, '#20182e')
      poligono(q, [[R * 0.85, 0.5 * s], [R * 1.3, 1.3 * s], [R * 0.8, 1.5 * s]], C.pelleS)
      // il sopracciglio folto: da solo fa la faccia di un vecchio
      q.ctx.strokeStyle = C.barba; q.ctx.lineWidth = 0.9 * s; q.ctx.lineCap = 'round'
      q.ctx.beginPath(); q.ctx.moveTo(R * 0.1, -1.4 * s); q.ctx.lineTo(R * 0.95, -0.9 * s); q.ctx.stroke()
    } else if (dir === 'giu') {
      occhi(q, s, 1.5, -0.3, 0.68, stato)
      q.ctx.strokeStyle = C.barba; q.ctx.lineWidth = 0.9 * s; q.ctx.lineCap = 'round'
      q.ctx.beginPath()
      q.ctx.moveTo(-2.7 * s, -1.6 * s); q.ctx.lineTo(-0.7 * s, -1.1 * s)
      q.ctx.moveTo(2.7 * s, -1.6 * s); q.ctx.lineTo(0.7 * s, -1.1 * s)
      q.ctx.stroke()
      tondo(q, 0, 1 * s, 0.9 * s, 0.75 * s, C.pelleS)                      // il naso
    }
    // il cappello: tesa larga e cono storto. La tesa è la cosa che lo
    // separa dal cappuccio della ladra, che tesa non ha.
    const tesa = dir === 'dx' ? R * 1.35 : R * 1.55
    const cy = dir === 'su' ? -R * 0.5 : -R * 0.62
    const punta = dir === 'dx' ? [-R * 1.5, cy - R * 2.5] : [R * 0.55, cy - R * 2.7]
    poligono(q, [[-tesa, cy], [-R * 0.55, cy - R * 0.5], [R * 0.55, cy - R * 0.5], [tesa, cy],
                 [tesa * 0.75, cy + R * 0.42], [-tesa * 0.75, cy + R * 0.42]], C.veste, b, sp)
    poligono(q, [[-R * 0.95, cy - R * 0.2], [R * 0.95, cy - R * 0.2], punta], C.veste, b, sp, 'stoffa')
    poligono(q, [[-R * 0.2, cy - R * 0.3], [R * 0.95, cy - R * 0.2], punta], C.vesteS)
    q.rett(-tesa * 0.8, cy - R * 0.28, tesa * 1.6, 0.8 * s, C.oro)          // il nastro
    // la punta ricade, e in cima ci sta una stellina: è il tocco che
    // toglie il severo e mette il buffo
    stella(q, punta[0], punta[1], 1.5 * s, C.gemma)
  },
  arma(q, s, C, dir, sw, mani, stato) {
    const b = C.bordo, sp = 0.7 * s
    const lancia = stato === 'lancia'
    const m = mani.dx
    q.in(m.x + (dir === 'dx' ? 1.2 : 0.6) * s, m.y + (lancia ? 2 * s : 1.4 * s), r => {
      // il bastone: nodoso, non un tubo — tre nodi bastano
      capsula(r, 0, -6 * s, 0.8 * s, 9.6 * s, 0.7 * s, C.legno, b, sp)
      for (const dy of [-11, -6.4, -1.6])
        tondo(r, 0.55 * s, dy * s, 0.5 * s, 0.35 * s, C.legnoS)
      // il ramo che regge la gemma
      poligono(r, [[-1.4 * s, -14.4 * s], [1.4 * s, -14.4 * s], [2.2 * s, -16.2 * s],
                   [0, -17.2 * s], [-2.2 * s, -16.2 * s]], C.legnoS, b, sp)
      tondo(r, 0, -17.4 * s, 1.9 * s, 1.9 * s, C.gemma, b, sp)
      tondo(r, -0.6 * s, -18 * s, 0.7 * s, 0.5 * s, '#ffffff')
    }, lancia ? (dir === 'dx' ? 0.5 : 0.2) : (dir === 'dx' ? 0.22 : 0.1))
  },
  /* l'incantesimo: quello che si vede quando il gioco dirà
     `stato: 'lancia'`. Un anello di rune che gira sopra la testa e tre
     scintille che salgono — niente fulmini, niente rosso: chi guarda
     ha sei anni e deve capire «sta facendo una magia», non «sta per
     succedere una disgrazia». */
  incanto(q, s, C, dir, mani, t) {
    const cx = mani.dx.x + (dir === 'dx' ? 2.6 : 1.4) * s
    const cy = mani.dx.y - 12.4 * s
    q.velo(0.5 + 0.3 * Math.sin(t * 6), () => {
      const g = q.ctx.createRadialGradient(cx, cy, 0.5 * s, cx, cy, 6.5 * s)
      g.addColorStop(0, '#eaffff'); g.addColorStop(0.4, C.gemma + 'aa'); g.addColorStop(1, C.gemma + '00')
      q.ctx.fillStyle = g
      q.ctx.beginPath(); q.ctx.arc(cx, cy, 6.5 * s, 0, 6.29); q.ctx.fill()
    })
    // l'anello di rune, schiacciato: gira intorno alla gemma
    q.ctx.save()
    q.ctx.translate(cx, cy); q.ctx.scale(1, 0.38)
    q.ctx.strokeStyle = C.gemma + 'cc'; q.ctx.lineWidth = 0.55 * s
    q.ctx.beginPath(); q.ctx.arc(0, 0, 6.2 * s, 0, 6.29); q.ctx.stroke()
    for (let i = 0; i < 6; i++) {
      const a = t * 1.6 + i / 6 * 6.29
      tondo(q, Math.cos(a) * 6.2 * s, Math.sin(a) * 6.2 * s, 0.8 * s, 0.8 * s, '#ffffff')
    }
    q.ctx.restore()
    for (let i = 0; i < 3; i++)
      scintilla(q, cx + Math.cos(i * 2.1 + t) * 5 * s, cy - 3 * s - ((t * 0.7 + i * 0.33) % 1) * 6 * s,
                1.6 * s, (t * 0.7 + i * 0.33) % 1)
  },
}
