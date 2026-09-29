// Il marmo: è il vuoto che fa sembrare prezioso un disegno. Il motivo è
// confinato a una cornice o una passatoia, il resto è tono su tono.
import { mescola, dado, rett, velo, poly } from '../comune.js'
import { lastra, crepa } from './semina.js'

export function marmoLiscio(c, reg, A, lato, tinte, scoperto, opz = {}) {
  const modo = opz.modo, sm = (opz.seme || 0) * 79
  const perde = modo === 'mancante' ? 0.9 : 2
  const h = lato * 0.53, g = lato * 0.015   // 0.53, non 0.52: vedi `lastre`
  const vuoto = mescola(tinte[1], '#0b0a0c', 0.5)
  for (let k = Math.floor(reg.y0 / h) - 1; k < Math.ceil(reg.y1 / h); k++) {
    let x = Math.floor(reg.x0 / lato) * lato - lato * (1.4 + dado(k, 21, 340 + sm))
    while (x < reg.x1 + lato) {
      const chiave = Math.round(x / 3)
      const r = m => dado(chiave, k, 350 + m + sm)
      const w = lato * (1 + r(1) * 0.9)
      if (x + w > reg.x0 - lato && (!scoperto || scoperto(x, k * h, w, h))) {
        if (r(8) > perde) {
          rett(c, x + g, k * h + g, w - g * 2, h - g * 2, vuoto)
          x += w; continue
        }
        const base = mescola(tinte[0], tinte[1], r(2) * 0.35)
        const col = mescola(base, r(2) > 0.5 ? '#ffffff' : '#000000', r(3) * 0.08)
        lastra(c, x + g, k * h + g, w - g * 2, h - g * 2, col,
               mescola(col, '#ffffff', 0.12), mescola(col, '#000000', 0.1),
               m => dado(chiave + m, k, 360 + sm))
        if (r(4) > 0.84)   // una vena, non una crepa
          velo(c, 0.3, () => crepa(c, x + w * 0.15, k * h + h * 0.4, w * 0.6,
                                   mescola(col, A.giunto, 0.4), m => dado(chiave, k, 370 + m + sm)))
      }
      x += w
    }
  }
}

// il mosaico vero, confinato a una fascia lungo i muri. L'oro torna in
// diagonale, non in colonna: una griglia dritta si rivedrebbe come «cubetti».
function cornice(c, reg, A, lato, banda, opz = {}, tinte) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 83
  // senza tavolozza propria (ambiente non di marmo, mosaico messo cella per cella), si ricava dalla posa
  const T = A.tessere || (tinte ? [tinte[0], tinte[1], '#c9b06a', mescola(tinte[1], '#4a86e8', 0.3)]
                                : ['#cdc4ad', '#8f96ad', '#c9b06a', '#8e9db4'])
  const salta = modo === 'mancante' ? 0.24 : 0
  const h = lato * 0.22, g = lato * 0.015
  for (let k = Math.floor(reg.y0 / h) - 1; k < Math.ceil(reg.y1 / h); k++) {
    const y = k * h + h / 2
    const vicinoOrizz = y - reg.y0 < banda || reg.y1 - y < banda
    let x = Math.floor(reg.x0 / lato) * lato - lato * (1 + dado(k, 33, 380 + sm))
    while (x < reg.x1 + lato) {
      const chiave = Math.round(x / 3)
      const r = m => dado(chiave, k, 390 + m + sm)
      const w = lato * (0.21 + r(1) * 0.136)
      const cx = x + w / 2
      const vicinoVert = cx - reg.x0 < banda || reg.x1 - cx < banda
      if ((vicinoOrizz || vicinoVert) && x + w > reg.x0 - lato) {
        if (salta && r(9) < salta) { x += w; continue }
        let base = T[0]
        if (Math.abs((chiave + k * 3) % 11) < 2) base = T[2]
        else if (r(2) > 0.985) base = T[3]
        let col = mescola(mescola(base, T[0], 0.3),
                          r(3) > 0.5 ? '#ffffff' : '#000000', r(4) * 0.05)
        if (modo === 'consumato') col = mescola(col, T[0], 0.35)
        lastra(c, x + g, k * h + g, w - g * 2, h - g * 2, col,
               mescola(col, '#ffffff', 0.16), mescola(col, '#000000', 0.14),
               m => dado(chiave + m, k, 400 + sm))
      }
      x += w
    }
  }
}

export function mosaico(c, reg, A, lato, tinte, scoperto, opz = {}) {
  const modo = opz.modo || 'normale'
  marmoLiscio(c, reg, A, lato, tinte, scoperto, opz)
  cornice(c, reg, A, lato, lato * (modo === 'consumato' ? 0.85 : 1.15), opz, tinte)
}
mosaico.modi = ['normale', 'consumato', 'mancante']

// unico pavimento del gioco con una direzione: la passatoia dice dove andare senza una freccia
export function tappeto(c, reg, A, lato, tinte, scoperto, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 89
  marmoLiscio(c, reg, A, lato, tinte, scoperto, opz)
  const cx = (reg.x0 + reg.x1) / 2, w = lato * 1.6
  const [base0, scuro0] = A.tappeto || ['#a8322f', '#7a2220']
  const base = modo === 'logoro' ? mescola(base0, '#8a7a5e', 0.3) : base0
  const scuro = modo === 'logoro' ? mescola(scuro0, '#8a7a5e', 0.3) : scuro0
  const h = lato * 0.53   // a pezzi, un permesso per corso: mai una striscia intera che ignora `scoperto`
  for (let k = Math.floor(reg.y0 / h) - 1; k < Math.ceil(reg.y1 / h); k++) {
    const y = k * h
    if (scoperto && !scoperto(cx - w, y, w * 2, h)) continue
    rett(c, cx - w, y, w * 2, h, base)
    velo(c, 0.5, () => {
      rett(c, cx - w, y, lato * 0.16, h, scuro)
      rett(c, cx + w - lato * 0.16, y, lato * 0.16, h, scuro)
    })
    for (const d of [-1, 1]) {
      rett(c, cx + d * w * 0.82 - lato * 0.05, y, lato * 0.1, h, A.oro || '#e8c569')
      rett(c, cx + d * w * 0.7 - lato * 0.03, y, lato * 0.06, h, scuro)
    }
  }
  for (let k = Math.floor(reg.y0 / (lato * 2)); k < Math.ceil(reg.y1 / (lato * 2)); k++) {
    if (modo === 'strappato' && dado(k, 7, 900 + sm) > 0.75) continue
    const y = k * lato * 2 + lato
    if (scoperto && !scoperto(cx - lato * 0.34, y - lato * 0.44, lato * 0.68, lato * 0.88)) continue
    poly(c, [[cx, y - lato * 0.44], [cx + lato * 0.34, y], [cx, y + lato * 0.44],
             [cx - lato * 0.34, y]], scuro)
    poly(c, [[cx, y - lato * 0.24], [cx + lato * 0.18, y], [cx, y + lato * 0.24],
             [cx - lato * 0.18, y]], mescola(base, A.oro || '#e8c569', 0.35))
  }
}
tappeto.modi = ['normale', 'logoro', 'strappato']

// la fascia d'oro non è legata ai blocchi: corre come un cornicione, a un'altezza fissa
export function marmo(c, reg, A, lato, tinte, dentro, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 97
  const h = lato * 0.26, g = lato * 0.018
  for (let k = Math.floor(reg.y0 / h) - 1; k < Math.ceil(reg.y1 / h); k++) {
    let x = Math.floor(reg.x0 / lato) * lato - lato * (1 + dado(k, 11, 710 + sm))
    while (x < reg.x1 + lato) {
      const r = m => dado(Math.round(x / 3), k, 720 + m + sm)
      const w = lato * (0.65 + r(1) * 0.5)
      if (x + w > reg.x0 - lato && (!dentro || dentro(x, k * h, w, h))) {
        const col = mescola(tinte[0], tinte[1], r(2) * 0.7)
        rett(c, x + g, k * h + g, w - g * 2, h - g * 2, col)
        rett(c, x + g, k * h + g, w - g * 2, (h - g * 2) * 0.22, mescola(col, '#ffffff', 0.3))
        const quante = modo === 'venato' ? 2 : 1
        for (let v = 0; v < quante; v++) {
          const rv = m => dado(Math.round(x / 3) + v * 5, k, 725 + m + sm)
          if (rv(1) > (modo === 'venato' ? 0.3 : 0.55))
            velo(c, modo === 'venato' ? 0.42 : 0.32, () => {
              c.strokeStyle = mescola(col, '#7a6a52', 0.8); c.lineWidth = lato * 0.012
              c.beginPath()
              c.moveTo(x + g, k * h + h * (0.3 + rv(2) * 0.4))
              c.quadraticCurveTo(x + w * 0.5, k * h + h * (0.1 + rv(3) * 0.8),
                                 x + w - g, k * h + h * (0.3 + rv(4) * 0.4))
              c.stroke()
            })
        }
        if (modo === 'crepata' && r(9) > 0.55)
          crepa(c, x + w * 0.15, k * h + h * 0.35, w * 0.7, mescola(col, '#000000', 0.4),
                m => dado(Math.round(x / 3), k, 760 + m + sm))
      }
      x += w
    }
  }
  const passo = lato * 1.35
  for (let f = Math.floor(reg.y0 / passo) - 1; f < Math.ceil(reg.y1 / passo); f++) {
    if (modo === 'crepata' && dado(f, 3, 770 + sm) > 0.82) continue
    const y = f * passo + passo * 0.58
    const oro = A.oro || '#e8c569'   // ripiego se l'ambiente non ha l'oro
    rett(c, reg.x0, y, reg.x1 - reg.x0, lato * 0.1, oro)
    rett(c, reg.x0, y, reg.x1 - reg.x0, lato * 0.035, mescola(oro, '#ffffff', 0.45))
  }
}
marmo.modi = ['normale', 'venato', 'crepata']
