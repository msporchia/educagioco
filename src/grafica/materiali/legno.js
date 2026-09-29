// Legno e terra (miniera): la terra battuta (nessuna posa, solo chiazze), i binari, i muri di travi.
import { mescola, dado, rett, ell, velo } from '../comune.js'
import { semina, crepa } from './semina.js'

// `tinte` arriva per la firma comune ma non si usa: il colore della terra è A.terra, un tono solo
export function terra(c, reg, A, lato, tinte, scoperto, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 41
  const tono = modo === 'fangosa' ? mescola(A.terra, '#2a3020', 0.4)
             : modo === 'arida' ? mescola(A.terra, '#c9a04a', 0.3) : A.terra
  // approssimato per blocchi (non il contorno vero della chiazza): basta a non sforare la fetta
  const dentro = scoperto ? (x, y) => scoperto(x - lato, y - lato, lato * 2, lato * 2) : null
  semina(reg, lato * 0.95, 21 + sm, 1, dentro, (x, y, r) => {
    const rx = lato * (0.16 + r(1) * 0.42) * (modo === 'fangosa' ? 1.3 : 1)
    velo(c, (0.1 + r(2) * 0.1) * (modo === 'fangosa' ? 1.6 : 1), () =>
      ell(c, x, y, rx, rx * (0.4 + r(3) * 0.35),
          r(4) > 0.5 ? mescola(tono, '#ffffff', 0.16) : mescola(tono, '#000000', 0.22)))
  })
  semina(reg, lato * 3.4, 23 + sm, 1, dentro, (x, y, r) => {
    if (r(1) < 0.72) return
    velo(c, 0.2, () => {
      c.strokeStyle = mescola(tono, '#000000', 0.35)
      c.lineWidth = lato * 0.03; c.lineCap = 'round'
      c.beginPath()
      c.moveTo(x - lato * 1.2, y)
      c.quadraticCurveTo(x, y + lato * (r(2) - 0.5) * 0.5, x + lato * 1.2, y)
      c.stroke()
    })
  })
  if (modo === 'arida')
    semina(reg, lato * 1.6, 43 + sm, 1, dentro, (x, y, r) => {
      if (r(1) < 0.5) return
      velo(c, 0.3, () => crepa(c, x, y, lato * (0.35 + r(2) * 0.5), mescola(tono, '#000000', 0.3), r))
    })
}
terra.modi = ['normale', 'fangosa', 'arida']

// i binari corrono per tutta la stanza: un binario a pezzi non porta da nessuna parte
export function binari(c, reg, A, lato, tinte, scoperto, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 59
  terra(c, reg, A, lato, tinte, scoperto, opz)
  const passo = lato * 6.5                        // ogni quante celle un binario
  const manca = modo === 'smontati' ? 0.22 : 0
  const railCol = modo === 'arrugginiti' ? '#7a4f3c' : '#5c6470'
  const railChiara = modo === 'arrugginiti' ? '#c98b52' : '#8f9aa8'
  for (let f = Math.floor(reg.y0 / passo); f < Math.ceil(reg.y1 / passo); f++) {
    const y = f * passo + passo * 0.42
    if (y < reg.y0 - lato || y > reg.y1 + lato) continue
    for (let x = Math.floor(reg.x0 / (lato * 0.5)) * lato * 0.5; x < reg.x1 + lato; x += lato * 0.5) {
      const r = m => dado(Math.round(x), f, 1100 + m + sm)
      if (manca && r(9) < manca) continue
      const col = mescola(modo === 'arrugginiti' ? '#8a5a34' : '#6a4a2c',
                          modo === 'arrugginiti' ? '#5c3018' : '#3f2a16', r(1))
      rett(c, x, y - lato * 0.32, lato * 0.34, lato * 0.64, col)
      rett(c, x, y - lato * 0.32, lato * 0.34, lato * 0.12, mescola(col, '#ffffff', 0.14))
    }
    for (const d of [-1, 1]) {
      let x = Math.floor(reg.x0 / (lato * 0.5)) * lato * 0.5
      const ry = y + d * lato * 0.24 - lato * 0.05
      while (x < reg.x1 + lato) {
        const r = m => dado(Math.round(x) + d * 3, f, 1150 + m + sm)
        if (!(manca && r(1) < manca)) {
          rett(c, x, ry, lato * 0.5, lato * 0.1, railCol)
          rett(c, x, ry, lato * 0.5, lato * 0.035, railChiara)
        }
        x += lato * 0.5
      }
    }
  }
}
binari.modi = ['normale', 'arrugginiti', 'smontati']

export function legno(c, reg, A, lato, tinte, dentro, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 61
  const perde = modo === 'marcio' ? 0.85 : 2
  const h = lato * 0.26, g = lato * 0.02
  const vuoto = mescola(tinte[1], '#0b0a0c', 0.6)
  for (let k = Math.floor(reg.y0 / h) - 1; k < Math.ceil(reg.y1 / h); k++)
    for (let i = Math.floor(reg.x0 / (lato * 0.9)) - 1; i < Math.ceil(reg.x1 / (lato * 0.9)); i++) {
      const r = m => dado(i, k, 1400 + m + sm)
      const x = i * lato * 0.9, w = lato * 0.9
      if (dentro && !dentro(x, k * h, w, h)) continue
      if (r(6) > perde) {
        rett(c, x + g, k * h + g, w - g * 2, h - g * 2, vuoto)
        rett(c, x + g, k * h + g, w - g * 2, (h - g * 2) * 0.3, mescola(vuoto, '#000000', 0.5))
        continue
      }
      let col = mescola(tinte[0], tinte[1], r(1))
      if (modo === 'marcio') col = mescola(col, '#3a4a2c', 0.35)
      if (modo === 'bruciato') col = mescola(col, '#100c0a', 0.55 + r(7) * 0.2)
      rett(c, x + g, k * h + g, w - g * 2, h - g * 2, col)
      rett(c, x + g, k * h + g, w - g * 2, (h - g * 2) * 0.26, mescola(col, '#ffffff', modo === 'bruciato' ? 0.05 : 0.16))
      rett(c, x + g, k * h + h - g - (h - g * 2) * 0.2, w - g * 2, (h - g * 2) * 0.2,
           mescola(col, '#000000', 0.24))
      if (r(2) > 0.5) {
        velo(c, 0.3, () => {
          c.strokeStyle = mescola(col, '#000000', 0.5); c.lineWidth = lato * 0.012
          c.beginPath()
          c.moveTo(x + g, k * h + h * (0.35 + r(3) * 0.3))
          c.lineTo(x + w - g, k * h + h * (0.35 + r(4) * 0.3))
          c.stroke()
        })
      }
      if (modo === 'marcio' && r(8) > 0.55)
        velo(c, 0.4, () => ell(c, x + w * r(9), k * h + h * 0.5, w * 0.16, h * 0.3, '#5a7a4a'))
      if (modo === 'bruciato' && r(10) > 0.5)
        crepa(c, x + w * 0.15, k * h + h * 0.4, w * 0.7, '#000000', m => dado(i, k, 1450 + m + sm))
    }
  const passo = lato * 1.8   // i montanti, a pezzi come le assi: mai una colonna intera senza chiedere `dentro`
  for (let i = Math.floor(reg.x0 / passo) - 1; i < Math.ceil(reg.x1 / passo); i++) {
    const x = i * passo + passo * 0.5
    let col = mescola(tinte[0], '#000000', 0.22)
    if (modo === 'bruciato') col = mescola(col, '#000000', 0.5)
    for (let k = Math.floor(reg.y0 / h) - 1; k < Math.ceil(reg.y1 / h); k++) {
      const y = k * h
      if (dentro && !dentro(x - lato * 0.11, y, lato * 0.22, h)) continue
      rett(c, x - lato * 0.11, y, lato * 0.22, h, col)
      rett(c, x - lato * 0.11, y, lato * 0.07, h, mescola(col, '#ffffff', modo === 'bruciato' ? 0.04 : 0.16))
    }
    for (let k = Math.floor(reg.y0 / (lato * 0.52)); k < Math.ceil(reg.y1 / (lato * 0.52)); k++) {
      const cy = k * lato * 0.52 + lato * 0.26
      if (dentro && !dentro(x - lato * 0.03, cy - lato * 0.03, lato * 0.06, lato * 0.06)) continue
      ell(c, x, cy, lato * 0.03, lato * 0.03, modo === 'marcio' ? '#5a4a30' : '#3f4550')
    }
  }
}
legno.modi = ['normale', 'marcio', 'bruciato']
