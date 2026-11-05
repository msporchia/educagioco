// L'aria del posto, sopra il terreno dipinto: le ombre delle nuvole, i riflessi dell'acqua, foglie, sabbia, scintille e braci.
// Costa poco (poche decine di tocchi a fotogramma) e va col tempo, non coi fotogrammi. Non sa niente della partita.
import { CAMPO } from '../dati/regole.js'

const MEZZO = (CAMPO.fiume.alto + CAMPO.fiume.basso) / 2

function chiazza(colore) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128
  const c = cv.getContext('2d'), g = c.createRadialGradient(64, 64, 8, 64, 64, 64)
  g.addColorStop(0, colore); g.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = g; c.fillRect(0, 0, 128, 128)
  return cv
}

export class Atmosfera {
  constructor(a) {
    this.a = a
    this.nuvola = null
    // ogni granello è un numero fisso: dove sta si calcola dal tempo, quindi niente da aggiornare
    this.granelli = Array.from({ length: a.particelle.n }, (_, i) => ({ u: (i * 0.618) % 1, v: (i * 0.371 + 0.2) % 1, f: (i * 0.137) % 1, colore: a.particelle.colori[i % a.particelle.colori.length] }))
    this.riflessi = Array.from({ length: 44 }, (_, i) => ({ u: (i * 0.618) % 1, v: (i * 0.757) % 1, f: i * 0.9 }))
  }

  /* sotto gli edifici: le nuvole passano sul campo e l'acqua luccica */
  sotto(c, W, H, s, X, Y, ora) {
    this.nuvola ||= chiazza(this.a.nuvole)
    for (let i = 0; i < 2; i++) {
      const larga = (240 + i * 70) * s, giro = W + larga * 2
      const x = ((ora * (5 + i * 2) * s + i * giro * 0.37) % giro) - larga, y = H * (0.2 + i * 0.3) + Math.sin(ora * 0.05 + i) * 30 * s
      c.drawImage(this.nuvola, x, y - larga * 0.3, larga * 1.6, larga * 0.7)
    }
    const y0 = Y(MEZZO - 24), alto = 48 * s
    c.fillStyle = this.a.riflesso
    for (const r of this.riflessi) {
      const b = Math.sin(ora * 1.6 + r.f)
      if (b < 0.25) continue
      const lungo = (3 + r.v * 7) * s
      c.globalAlpha = (b - 0.25) * (this.a.fiume === 'baratro' ? 0.5 : 0.6)
      c.fillRect((r.u * W + ora * 3 * s * (r.v - 0.5)) % W, y0 + r.v * alto, lungo, Math.max(1, s * 0.8))
    }
    c.globalAlpha = 1
    if (this.a.fiume === 'brace') {     // il fossato respira
      c.fillStyle = `rgba(255,120,30,${0.06 + 0.05 * Math.sin(ora * 0.9)})`
      c.fillRect(0, y0 - 6 * s, W, alto + 12 * s)
    }
  }

  /* sopra tutto: quello che vola */
  sopra(c, W, H, s, ora) {
    const tipo = this.a.particelle.tipo
    for (const g of this.granelli) {
      c.fillStyle = g.colore
      if (tipo === 'foglie') {
        const x = ((g.u * W + ora * (16 + g.f * 14) * s) % (W + 20)) - 10, y = ((g.v * H + ora * (9 + g.f * 9) * s) % (H + 20)) - 10
        const giro = Math.sin(ora * 2.4 + g.f * 9)
        c.globalAlpha = 0.85; c.fillRect(x + Math.sin(ora + g.f * 7) * 8 * s, y, 2.6 * s * Math.abs(giro) + s * 0.6, 1.5 * s)
      } else if (tipo === 'sabbia') {
        const x = ((g.u * W + ora * (70 + g.f * 90) * s) % (W + 60)) - 30, y = (g.v * H + Math.sin(ora * 0.8 + g.f * 6) * 10 * s)
        c.globalAlpha = 0.28; c.fillRect(x, y, (10 + g.f * 18) * s, Math.max(1, s * 0.7))
      } else if (tipo === 'scintille') {
        const y = H - ((g.v * H + ora * (5 + g.f * 8) * s) % H), b = Math.sin(ora * 2.2 + g.f * 13)
        if (b < 0) continue
        c.globalAlpha = b * 0.9; const r = (0.8 + b * 1.2) * s
        const x = g.u * W; c.fillRect(x - r, y - r * 0.25, r * 2, r * 0.5); c.fillRect(x - r * 0.25, y - r, r * 0.5, r * 2)
      } else {
        const y = H - ((g.v * H + ora * (22 + g.f * 34) * s) % H), x = g.u * W + Math.sin(ora * 1.3 + g.f * 11) * 14 * s
        c.globalAlpha = 0.5 + 0.5 * Math.sin(ora * 5 + g.f * 21); c.fillRect(x, y, 1.6 * s, 1.6 * s)
      }
    }
    c.globalAlpha = 1
  }
}
