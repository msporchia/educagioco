// La pietra: lastroni, mattoni, i muri che ne vengono. Vedi docs/core/grafica.md.
import { mescola, dado, rett } from '../comune.js'
import { lastra, concio, crepa } from './semina.js'

// il pavimento a lastroni: lastre più grosse dei conci (0,34 contro 0,26), ma non a strisce come prima
export function lastre(c, reg, A, lato, tinte, scoperto, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 29
  const perde = modo === 'rotto' ? 0.78 : modo === 'consumato' ? 0.96 : 2
  const h = lato * 0.34, g = lato * 0.028   // il passo non deve mai tornare esatto sulla cella, o rispunta la griglia
  for (let k = Math.floor(reg.y0 / h) - 1; k < Math.ceil(reg.y1 / h); k++) {
    // ogni corso comincia spostato di suo: senza, i giunti verticali si
    // incolonnano ogni tanto e la griglia rispunta
    let x = Math.floor(reg.x0 / lato) * lato - lato * (1 + dado(k, 7, 60))
    while (x < reg.x1 + lato) {
      const chiave = Math.round(x / 3)
      const r = m => dado(chiave, k, 10 + m + sm)
      const w = lato * (0.45 + r(1) * 0.48)
      if (x + w > reg.x0 - lato && (!scoperto || scoperto(x, k * h, w, h))) {
        if (r(8) > perde) {
          rett(c, x + g, k * h + g, w - g * 2, h - g * 2,
               mescola(tinte[1], '#100e10', 0.55))
          x += w; continue
        }
        let col = mescola(tinte[0], tinte[1], r(2))
        col = mescola(col, r(6) > 0.5 ? '#ffffff' : '#000000',
                      Math.abs(r(7) - 0.5) * 0.22)
        lastra(c, x + g, k * h + g, w - g * 2, h - g * 2,
               col, mescola(col, '#ffffff', 0.15), mescola(col, '#000000', 0.16),
               m => dado(chiave + m, k, 30))
        if (r(3) > 0.9) crepa(c, x + w * 0.2, k * h + h * 0.3, w * 0.6,
                              mescola(col, '#000000', 0.3), m => dado(chiave, k, 40 + m))
      }
      x += w
    }
  }
}
lastre.modi = ['normale', 'consumato', 'rotto']

// mattoni del pavimento più piccoli dei conci del muro (mattonelle vs volta);
// niente frazione tonda della cella, o il reticolo ridisegna la griglia in piccolo
export function mattoniPosa(c, reg, A, lato, tinte, scoperto, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 31
  const perde = modo === 'rotto' ? 0.86 : modo === 'consumato' ? 0.97 : 2
  const sogliaCrepa = modo === 'consumato' ? 0.8 : 0.93
  const h = lato * 0.34, w = lato * 0.57, g = h * 0.12
  const vuoto = mescola(tinte[1], '#0b0a0c', 0.55)
  for (let k = Math.floor(reg.y0 / h); k < Math.ceil(reg.y1 / h); k++) {
    const off = (k % 2) * w * 0.5
    for (let i = Math.floor((reg.x0 - off) / w); i < Math.ceil((reg.x1 - off) / w); i++) {
      const r = m => dado(i, k, 100 + m + sm)
      const x = i * w + off, y = k * h
      if (scoperto && !scoperto(x, y, w, h)) continue
      if (r(6) > perde) {
        rett(c, x + g, y + g, w - g * 2, h - g * 2, vuoto)
        rett(c, x + g, y + g, w - g * 2, (h - g * 2) * 0.3, mescola(vuoto, '#000000', 0.5))
        continue
      }
      let col = mescola(tinte[0], tinte[1], r(1))
      rett(c, x + g, y + g, w - g * 2, h - g * 2, col)
      rett(c, x + g, y + g, w - g * 2, (h - g * 2) * 0.28, mescola(col, '#ffffff', 0.14))
      rett(c, x + g, y + h - g - (h - g * 2) * 0.22, w - g * 2, (h - g * 2) * 0.22,
           mescola(col, '#000000', 0.14))
      if (modo === 'consumato' && r(7) > 0.4)
        rett(c, x + g, y + g, w - g * 2, h - g * 2, mescola(col, '#ffffff', 0.05 + r(8) * 0.08))
      if (r(2) > sogliaCrepa) crepa(c, x + w * 0.2, y + h * 0.3, w * 0.6,
                             mescola(col, '#000000', 0.35), m => dado(i, k, 130 + m + sm))
    }
  }
}
mattoniPosa.modi = ['normale', 'consumato', 'rotto']

// il muro «da castello»: corsi bassi, larghezza ampia apposta (un corso in più moltiplica le colonne)
export function pietra(c, reg, A, lato, tinte, dentro, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 47
  const perde = modo === 'rotto' ? 0.87 : 2
  const g = lato * (modo === 'vecchio' ? 0.03 : 0.018)
  const h = lato * 0.19
  const vuoto = mescola(tinte[1], '#0b0a0c', 0.6)
  for (let k = Math.floor(reg.y0 / h); k < Math.ceil(reg.y1 / h); k++) {
    let x = Math.floor(reg.x0 / lato) * lato - lato
    while (x < reg.x1 + lato) {
      const r = m => dado(Math.round(x / 3), k, 400 + m + sm)
      const w = lato * (0.3 + r(1) * 0.32)
      if (x + w > reg.x0 - lato && (!dentro || dentro(x, k * h, w, h))) {
        if (r(5) > perde) {
          rett(c, x + g, k * h + g, w - g * 2, h - g * 2, vuoto)
          rett(c, x + g, k * h + g, w - g * 2, (h - g * 2) * 0.3, mescola(vuoto, '#000000', 0.5))
          x += w; continue
        }
        let col = mescola(tinte[0], tinte[1], r(2))
        if (modo === 'vecchio') col = mescola(col, '#8f897c', 0.22)
        concio(c, x + g, k * h + g, w - g * 2, h - g * 2, col,
               m => dado(Math.round(x / 3) + m, k, 420 + sm),
               r(3) > (modo === 'vecchio' ? 0.72 : 0.9))
      }
      x += w
    }
  }
}
pietra.modi = ['normale', 'vecchio', 'rotto']

export function mattoni(c, reg, A, lato, tinte, dentro, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 37
  const g0 = modo === 'vecchio' ? 0.2 : 0.13
  const perde = modo === 'rotto' ? 0.76 : modo === 'vecchio' ? 0.955 : 2
  const h = lato * 0.18, w = lato * 0.44, g = h * g0
  const vuoto = mescola(tinte[1], '#0b0a0c', 0.62)
  for (let k = Math.floor(reg.y0 / h); k < Math.ceil(reg.y1 / h); k++) {
    const off = (k % 2) * w * 0.5
    for (let i = Math.floor((reg.x0 - off) / w) - 1; i < Math.ceil((reg.x1 - off) / w); i++) {
      const r = m => dado(i, k, 500 + m + sm)
      const x = i * w + off, y = k * h
      if (dentro && !dentro(x, y, w, h)) continue
      if (r(4) > perde) {
        rett(c, x + g, y + g, w - g * 2, h - g * 2, vuoto)
        rett(c, x + g, y + g, w - g * 2, (h - g * 2) * 0.34, mescola(vuoto, '#000000', 0.5))
        continue
      }
      const fuori = r(5) > 0.92   // un mattone su dodici è di recupero: più rosso o chiaro, un muro vecchio è fatto di quello che c'era
      let col = mescola(tinte[0], tinte[1], r(1))
      if (fuori) col = mescola(col, r(6) > 0.5 ? '#c98b52' : '#6d6360', 0.3)
      const bx = x + g, by = y + g, bw = w - g * 2, bh = h - g * 2
      rett(c, bx, by, bw, bh, col)
      rett(c, bx, by, bw, bh * 0.3, mescola(col, '#ffffff', 0.18))
      rett(c, bx, by + bh - bh * 0.24, bw, bh * 0.24, mescola(col, '#000000', 0.16))

      if (r(7) > 0.5) {   // faccia non liscia: metà dei mattoni, se fossero tutti tornerebbe un motivo
        const q = 2 + Math.floor(r(8) * 2)
        for (let m = 0; m < q; m++) {
          const d = z => dado(i * 7 + m, k * 5, 560 + z + sm)
          const cw = bw * (0.14 + d(1) * 0.22), ch = bh * (0.22 + d(2) * 0.3)
          rett(c, bx + bw * d(3) * 0.8, by + bh * d(4) * 0.6, cw, ch,
               mescola(col, d(5) > 0.45 ? '#000000' : '#ffffff', 0.07 + d(6) * 0.07))
        }
      }
      if (r(9) > 0.84) {   // spigolo scheggiato, sempre lo stesso angolo per lo stesso mattone
        const sw = bw * (0.14 + r(10) * 0.16), sh = bh * 0.45
        rett(c, r(11) > 0.5 ? bx : bx + bw - sw, r(12) > 0.5 ? by : by + bh - sh,
             sw, sh, mescola(A.giunto || '#241a14', col, 0.25))
      }
      const soglia = modo === 'normale' ? 0.96 : 0.88
      if (r(2) > soglia) crepa(c, x + w * 0.1, y + h * 0.4, w * 0.9,
                               mescola(col, '#000000', 0.4), m => dado(i, k, 520 + m + sm))
    }
  }
}
mattoni.modi = ['normale', 'vecchio', 'rotto']
