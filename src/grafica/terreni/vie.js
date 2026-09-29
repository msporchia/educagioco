// Le vie: i tre modi in cui è fatta la strada (battuto, acciottolato, lastricato).
// Vedi docs/core/grafica.md.
import { mescola, poly, ell, velo } from '../comune.js'

// mezza larghezza della strada, in unità: non un gusto, le piazzole (larghe 15,
// a 34 unità dal centro) se la mangerebbero se la via fosse più larga di questo
export const MEZZA = 17

function ombra(p, via, quanto = 3) {
  const { ctx, S } = p
  ctx.save(); ctx.translate(0, quanto * S)
  p.linea(via.punti, '#00000022', (MEZZA * 2 + 2) * S)
  ctx.restore()
}

function fasce(p, via, strati) {
  for (const [larg, col] of strati) p.linea(via.punti, col, larg * p.S)
}

export function battuto(p, via, pal, caso) {
  const { ctx, S } = p
  const V = pal.via
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ombra(p, via)
  fasce(p, via, [[MEZZA * 2 + 2, V.scarpata], [MEZZA * 2 - 2, V.corpo], [MEZZA * 2 - 8, V.battuto]])
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

// i ciottoli si posano lungo la strada e non a griglia (che in una curva si vede finta)
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
  velo(ctx, 0.28, () => p.linea(via.punti, V.acqua, 7 * S))
  velo(ctx, 0.22, () => p.linea(via.punti, '#ffffff', 2 * S))
}

// le lastre stanno due o tre per fila: una sola per fila esce una scala a pioli
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
    // tagli diversi per fila pari/dispari: basta perché il selciato non abbia un motivo
    const tagli = fila % 2 ? [-1, -0.2, 0.45, 1] : [-1, 0.15, 1]
    for (let k = 0; k < tagli.length - 1; k++) {
      const u0 = tagli[k] * mezza + 0.7 * S, u1 = tagli[k + 1] * mezza - 0.7 * S
      const col = mescola(V.lastraS, V.lastraC, caso())
      const q = [[a.x + na.x * u0, a.y + na.y * u0], [b.x + nb.x * u0, b.y + nb.y * u0],
                 [b.x + nb.x * u1, b.y + nb.y * u1], [a.x + na.x * u1, a.y + na.y * u1]]
      poly(ctx, q, col)
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
