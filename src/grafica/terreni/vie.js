/* ═══════════════════════════════════════════════════════════════════
   LE VIE — i tre modi in cui è fatta la strada

   La strada del castello non è una decorazione: è il tracciato su cui
   camminano i nemici, e chi gioca deve leggerlo in un colpo d'occhio
   anche quando il fondo è scuro. Quindi tre tecniche sole, ognuna con
   un carattere netto:

     `battuto`      terra pestata e ghiaia — il bosco. Bordi morbidi,
                    ciottoli sparsi sul ciglio, nessuna linea dritta.
     `acciottolato` ciottoli bagnati posati a corsi — il sotterraneo.
                    Sopra ci corre un filo di riflesso: sotto terra
                    l'acqua c'è sempre.
     `lastricato`   lastre squadrate messe **di traverso** più un
                    cordolo — le mura. È l'unica via costruita, e si
                    vede che qualcuno l'ha misurata.

   Sono qui e non dentro ai terreni perché sono tre tecniche, non tre
   posti: `bosco.js` dice *con che colori*, questo file dice *come*.
   Stessa divisione che c'è fra `grafica/ambienti/` e
   `grafica/materiali/` per le stanze del Generale.

   Tutte e tre prendono il pennello di `tela.js` e disegnano sul suo
   contesto: girano dentro `dipingiFondale`, cioè una volta sola per
   tappa, su una tela di scorta.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, poly, ell, velo } from '../comune.js'

/* La mezza larghezza della strada, in unità. Non è una scelta di
   gusto: le postazioni stanno a 34 unità dal centro (lo decide
   `motore/battaglia.js`) e la piazzola ne è larga 15, quindi una via
   più larga di 17 se le mangia. */
export const MEZZA = 17

/* l'ombra portata: la stessa per tutte e tre, perché è quella che
   stacca la via dal terreno prima ancora del colore */
function ombra(p, via, quanto = 3) {
  const { ctx, S } = p
  ctx.save(); ctx.translate(0, quanto * S)
  p.linea(via.punti, '#00000022', (MEZZA * 2 + 2) * S)
  ctx.restore()
}

/* le fasce concentriche, dalla scarpata al battuto: è il modo più
   corto di dare spessore a una linea */
function fasce(p, via, strati) {
  for (const [larg, col] of strati) p.linea(via.punti, col, larg * p.S)
}

/* ═════ IL BATTUTO — terra pestata ═════ */
export function battuto(p, via, pal, caso) {
  const { ctx, S } = p
  const V = pal.via
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ombra(p, via)
  fasce(p, via, [[MEZZA * 2 + 2, V.scarpata], [MEZZA * 2 - 2, V.corpo], [MEZZA * 2 - 8, V.battuto]])
  // ghiaia sul battuto e ciottoli sul ciglio: il caso è quello della
  // tappa, quindi la stessa strada esce identica a ogni ridisegno
  for (let d = 0; d < via.lunghezza; d += 3 * S) {
    const a = via.puntoA(d), n = via.normaleA(d)
    for (let k = 0; k < 2; k++) {
      const o = (caso() * 2 - 1) * 10 * S
      velo(ctx, 0.10 + caso() * 0.16, () =>
        ell(ctx, a.x + n.x * o, a.y + n.y * o, (1 + caso() * 2.2) * S, (0.8 + caso() * 1.5) * S,
            caso() > 0.5 ? V.ghiaiaS : V.ghiaiaC))
    }
    if (caso() > 0.82) for (const lato of [-1, 1]) {
      const o = lato * (13 + caso() * 2) * S
      const x = a.x + n.x * o, y = a.y + n.y * o
      const rx = (2.2 + caso() * 1.4) * S, ry = (1.7 + caso()) * S
      ell(ctx, x, y + S, rx, ry, V.ciottoloOmbra)
      ell(ctx, x, y, rx, ry, caso() > 0.5 ? V.ciottoloC : V.ciottoloS)
    }
  }
}

/* ═════ L'ACCIOTTOLATO — ciottoli bagnati ═════
   I ciottoli si posano **lungo** la strada e non a griglia: una
   griglia in mezzo a una curva si vede subito che è finta. Ogni
   ciottolo sta dove dice il caso della tappa, dentro la sua maglia. */
export function acciottolato(p, via, pal, caso) {
  const { ctx, S } = p
  const V = pal.via
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ombra(p, via, 2)
  fasce(p, via, [[MEZZA * 2 + 2, V.scarpata], [MEZZA * 2 - 1, V.corpo]])
  const passo = 5 * S
  for (let d = 0; d < via.lunghezza; d += passo) {
    const a = via.puntoA(d), n = via.normaleA(d)
    for (let k = -3; k <= 3; k++) {
      const o = (k + (caso() - 0.5) * 0.7) * 4.4 * S
      if (Math.abs(o) > (MEZZA - 2) * S) continue
      const x = a.x + n.x * o + (caso() - 0.5) * 2 * S
      const y = a.y + n.y * o + (caso() - 0.5) * 2 * S
      const r = (1.8 + caso() * 1.1) * S
      ell(ctx, x, y + r * 0.4, r, r * 0.7, V.giunto)
      const col = mescola(V.ciottoloS, V.ciottoloC, caso())
      ell(ctx, x, y, r, r * 0.72, col)
      velo(ctx, 0.45, () => ell(ctx, x - r * 0.25, y - r * 0.25, r * 0.42, r * 0.28,
                                mescola(col, '#ffffff', 0.4)))
    }
  }
  /* il filo d'acqua nel mezzo: sotto terra la via è sempre un canale, e
     un riflesso lungo è quello che lo dice senza disegnare una pozza */
  velo(ctx, 0.28, () => p.linea(via.punti, V.acqua, 7 * S))
  velo(ctx, 0.22, () => p.linea(via.punti, '#ffffff', 2 * S))
}

/* ═════ IL LASTRICATO — lastre squadrate ═════
   Le lastre stanno **due o tre per fila**, non una sola larga quanto
   la strada: una lastra intera per fila, con il suo giunto davanti e
   dietro, esce una scala a pioli — l'ho disegnata così la prima volta
   e le mura sembravano una ferrovia. A file sfalsate, invece, i giunti
   non si allineano mai e la via legge come un selciato.

   Il cordolo ai lati è la firma: senza, resta una strada grigia. */
export function lastricato(p, via, pal, caso) {
  const { ctx, S } = p
  const V = pal.via
  ctx.lineCap = 'butt'; ctx.lineJoin = 'round'
  ombra(p, via, 2)
  fasce(p, via, [[MEZZA * 2 + 4, V.cordoloS], [MEZZA * 2 + 1, V.cordolo],
                 [MEZZA * 2 - 4, V.giunto]])
  const passo = 11 * S, mezza = (MEZZA - 3) * S
  for (let d = 0, fila = 0; d < via.lunghezza - passo; d += passo, fila++) {
    const g = 1.2 * S                        // il giunto fra una fila e l'altra
    const a = via.puntoA(d + g), b = via.puntoA(d + passo - g)
    const na = via.normaleA(d + g), nb = via.normaleA(d + passo - g)
    /* i tagli in senso trasversale: due nelle file pari, tre nelle
       dispari. È l'unica cosa che serve perché il selciato non abbia
       un motivo che si vede. */
    const tagli = fila % 2 ? [-1, -0.2, 0.45, 1] : [-1, 0.15, 1]
    for (let k = 0; k < tagli.length - 1; k++) {
      const u0 = tagli[k] * mezza + 0.7 * S, u1 = tagli[k + 1] * mezza - 0.7 * S
      const col = mescola(V.lastraS, V.lastraC, caso())
      const q = [[a.x + na.x * u0, a.y + na.y * u0], [b.x + nb.x * u0, b.y + nb.y * u0],
                 [b.x + nb.x * u1, b.y + nb.y * u1], [a.x + na.x * u1, a.y + na.y * u1]]
      poly(ctx, q, col)
      // il filo di luce sul bordo che guarda l'ingresso, non a metà
      // lastra: a metà tornava una fascia, e la fascia è il piolo
      velo(ctx, 0.45, () => {
        ctx.strokeStyle = mescola(col, '#ffffff', 0.45); ctx.lineWidth = 1.1 * S
        ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); ctx.lineTo(q[3][0], q[3][1]); ctx.stroke()
      })
      if (caso() > 0.9)                      // qualche lastra scheggiata
        velo(ctx, 0.3, () => ell(ctx, (q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2,
                                 2.4 * S, 1.6 * S, V.giunto))
    }
  }
}

export const VIE = { battuto, acciottolato, lastricato }
