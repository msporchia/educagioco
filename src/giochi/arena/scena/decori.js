// I decori del terreno, disegnati in unità del mondo su una tela a grana grossa (scena/terreno.js ne taglia poi i bordi morbidi).
// Ogni figura ha il piede in (x, y). Luce da in alto a sinistra: il chiaro a sinistra, l'ombra lunga a destra.
const casuale = d => { let s = Math.floor(d.h * 1e7) | 1; return () => { s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff; return s / 0x7fffffff } }

export const ALTEZZA = { albero: 30, palma: 34, obelisco: 38, colonna: 26, guglia: 34, cristalli: 26, morto: 30, spuntone: 26, stendardo: 30, braciere: 14 }

function disco(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill() }
function poli(c, col, ...p) {
  c.fillStyle = col; c.beginPath(); c.moveTo(p[0], p[1])
  for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1])
  c.closePath(); c.fill()
}
function linea(c, col, w, ...p) {
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(p[0], p[1])
  for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1])
  c.stroke()
}

/* l'ombra lunga di un decoro alto */
export function ombraDecoro(c, d) {
  const alto = ALTEZZA[d.nome] || 10, lungo = alto * 0.75
  c.fillStyle = 'rgba(8,4,20,.34)'
  c.beginPath(); c.ellipse(d.x + lungo * 0.55, d.y + lungo * 0.16, lungo * 0.72, Math.max(3, alto * 0.14), 0.26, 0, 7); c.fill()
}

const FIGURE = {
  albero(c, d, a, r) {
    const [scuro, medio, chiaro] = a.chioma[Math.floor(r() * a.chioma.length)], k = 0.85 + r() * 0.5
    poli(c, a.tronco, d.x - 2 * k, d.y, d.x + 2 * k, d.y, d.x + 1.4 * k, d.y - 12 * k, d.x - 1.4 * k, d.y - 12 * k)
    const y = d.y - 19 * k
    for (let i = 0; i < 7; i++) disco(c, d.x + (r() - 0.5) * 17 * k, y + (r() - 0.5) * 13 * k, (6 + r() * 3) * k, scuro)
    for (let i = 0; i < 6; i++) disco(c, d.x - 1.5 * k + (r() - 0.5) * 13 * k, y - 2 * k + (r() - 0.5) * 9 * k, (4 + r() * 2.5) * k, medio)
    for (let i = 0; i < 6; i++) disco(c, d.x - 4 * k + (r() - 0.5) * 8 * k, y - 4.5 * k + (r() - 0.5) * 6 * k, (1.3 + r() * 1.6) * k, chiaro)
  },
  cespuglio(c, d, a, r) {
    const [scuro, medio, chiaro] = a.chioma[Math.floor(r() * a.chioma.length)]
    for (let i = 0; i < 4; i++) disco(c, d.x + (r() - 0.5) * 12, d.y - 4 + (r() - 0.5) * 4, 4 + r() * 2, scuro)
    for (let i = 0; i < 3; i++) disco(c, d.x - 1 + (r() - 0.5) * 8, d.y - 6 + (r() - 0.5) * 3, 2.4 + r(), medio)
    disco(c, d.x - 3, d.y - 7, 1.3, chiaro)
  },
  masso(c, d, a, r) {
    const [s, m, l] = a.sasso, w = 7 + r() * 5, h = 6 + r() * 5
    poli(c, s, d.x - w, d.y, d.x - w * 0.7, d.y - h * 0.8, d.x, d.y - h, d.x + w * 0.8, d.y - h * 0.6, d.x + w, d.y)
    poli(c, m, d.x - w, d.y, d.x - w * 0.7, d.y - h * 0.8, d.x, d.y - h, d.x + w * 0.1, d.y - h * 0.2, d.x - w * 0.2, d.y)
    poli(c, l, d.x - w * 0.6, d.y - h * 0.7, d.x - w * 0.05, d.y - h * 0.92, d.x - w * 0.15, d.y - h * 0.5)
  },
  palma(c, d, a, r) {
    const [scuro, medio, chiaro] = a.chioma[0], k = 0.9 + r() * 0.4, verso = r() < 0.5 ? -1 : 1
    const cima = [d.x + verso * 6 * k, d.y - 30 * k]
    linea(c, a.tronco, 3 * k, d.x, d.y, d.x + verso * 1 * k, d.y - 11 * k, d.x + verso * 3 * k, d.y - 21 * k, ...cima)
    linea(c, '#8a6238', 1 * k, d.x - 1, d.y - 2, d.x + verso * 1 * k - 1, d.y - 12 * k, d.x + verso * 3 * k - 1, d.y - 21 * k)
    for (let i = 0; i < 7; i++) {
      const an = -Math.PI * (0.04 + 0.92 * i / 6), l = (13 + r() * 5) * k, mx = cima[0] + Math.cos(an) * l * 0.55, my = cima[1] + Math.sin(an) * l * 0.5 - 3 * k
      const ex = cima[0] + Math.cos(an) * l, ey = cima[1] + Math.sin(an) * l * 0.4 + 7 * k
      linea(c, scuro, 3.2 * k, ...cima, mx, my, ex, ey)
      linea(c, i % 2 ? chiaro : medio, 1.5 * k, ...cima, mx, my - 0.6, ex, ey - 1)
    }
  },
  obelisco(c, d, a, r) {
    const [s, m, l] = a.sasso, k = 0.85 + r() * 0.4, w = 6 * k, h = 36 * k
    poli(c, s, d.x + w, d.y, d.x + w * 0.5, d.y - h, d.x, d.y - h - 5 * k, d.x, d.y)
    poli(c, m, d.x - w, d.y, d.x - w * 0.5, d.y - h, d.x, d.y - h - 5 * k, d.x, d.y)
    poli(c, l, d.x - w * 0.5, d.y - h, d.x, d.y - h - 5 * k, d.x - 0.5, d.y - h + 2)
    c.fillStyle = s
    for (let i = 1; i < 6; i++) c.fillRect(d.x - w * 0.5, d.y - h * i / 6, w * 0.34, 1.6)
  },
  colonna(c, d, a, r) {
    const [s, m, l] = a.sasso, k = 0.85 + r() * 0.35, w = 5 * k, h = (16 + r() * 12) * k
    poli(c, s, d.x - w - 2, d.y, d.x + w + 2, d.y, d.x + w + 1, d.y - 3, d.x - w - 1, d.y - 3)
    poli(c, m, d.x - w, d.y - 3, d.x + w, d.y - 3, d.x + w, d.y - h + 3, d.x + 1, d.y - h, d.x - w, d.y - h - 3)
    poli(c, l, d.x - w, d.y - 3, d.x - w * 0.3, d.y - 3, d.x - w * 0.3, d.y - h, d.x - w, d.y - h - 3)
    poli(c, s, d.x + w * 0.4, d.y - 3, d.x + w, d.y - 3, d.x + w, d.y - h + 3, d.x + w * 0.4, d.y - h + 1)
    poli(c, m, d.x + w + 5, d.y + 2, d.x + w + 14, d.y + 2, d.x + w + 13, d.y - 3, d.x + w + 6, d.y - 3)
  },
  blocchi(c, d, a, r) {
    const [s, m, l] = a.sasso
    for (const [dx, dy, w, h] of [[-8, 0, 9, 6], [2, 1, 11, 7], [-3, -6, 8, 5]]) {
      c.fillStyle = s; c.fillRect(d.x + dx, d.y + dy - h, w, h)
      c.fillStyle = m; c.fillRect(d.x + dx, d.y + dy - h, w - 2, h - 1.5)
      c.fillStyle = l; c.fillRect(d.x + dx, d.y + dy - h, w - 2, 1.4)
    }
  },
  guglia(c, d, a, r) {
    const [s, m, l] = a.sasso, k = 0.85 + r() * 0.45, w = 9 * k, h = 34 * k
    poli(c, s, d.x - w, d.y, d.x - w * 0.5, d.y - h * 0.5, d.x - w * 0.1, d.y - h * 0.62, d.x + w * 0.12, d.y - h, d.x + w * 0.4, d.y - h * 0.55, d.x + w, d.y)
    poli(c, m, d.x - w, d.y, d.x - w * 0.5, d.y - h * 0.5, d.x - w * 0.1, d.y - h * 0.62, d.x + w * 0.12, d.y - h, d.x, d.y - h * 0.4, d.x - w * 0.15, d.y)
    linea(c, l, 0.9, d.x - w * 0.5, d.y - h * 0.5, d.x - w * 0.1, d.y - h * 0.62)
    for (const [dx, sc] of [[w * 0.8, 0.5], [-w * 1.1, 0.42]]) FIGURE.scheggia(c, d.x + dx, d.y + 1, 9 * sc * 2, a, r)
  },
  scheggia(c, x, y, h, a, r) {
    const [s, m, l] = a.cristallo[Math.floor(r() * a.cristallo.length)], w = h * 0.26, pende = (r() - 0.5) * h * 0.5
    poli(c, s, x - w, y, x + w, y, x + w * 0.8 + pende, y - h * 0.8, x + pende, y - h)
    poli(c, m, x - w, y, x, y, x + pende * 0.9, y - h * 0.9, x + pende, y - h, x - w * 0.8 + pende, y - h * 0.8)
    poli(c, l, x - w * 0.55, y - h * 0.2, x - w * 0.15, y - h * 0.2, x + pende * 0.9, y - h * 0.86, x - w * 0.5 + pende, y - h * 0.76)
  },
  cristalli(c, d, a, r) {
    const n = 3 + Math.floor(r() * 3)
    for (let i = 0; i < n; i++) FIGURE.scheggia(c, d.x + (i - (n - 1) / 2) * 5.5 + (r() - 0.5) * 2, d.y + r() * 2, 11 + r() * 16, a, r)
  },
  morto(c, d, a, r) {
    const k = 0.9 + r() * 0.4
    const ramo = (x, y, an, l, w, n) => {
      const ex = x + Math.cos(an) * l, ey = y + Math.sin(an) * l
      linea(c, a.tronco, w, x, y, ex, ey)
      if (n <= 0) return
      ramo(ex, ey, an - 0.35 - r() * 0.5, l * 0.72, w * 0.62, n - 1)
      ramo(ex, ey, an + 0.3 + r() * 0.55, l * 0.68, w * 0.62, n - 1)
    }
    ramo(d.x, d.y, -Math.PI / 2 + (r() - 0.5) * 0.3, 11 * k, 3.4 * k, 3)
    linea(c, a.sasso[1], 0.8, d.x - 1, d.y - 1, d.x - 1, d.y - 9 * k)
  },
  spuntone(c, d, a, r) {
    const [s, m, l] = a.sasso, k = 0.85 + r() * 0.4
    for (const [dx, w, h, p] of [[-6, 5, 18, -3], [3, 6, 28, 2], [10, 4, 13, 3]]) {
      poli(c, s, d.x + dx - w * k, d.y, d.x + dx + w * k, d.y, d.x + dx + p, d.y - h * k)
      poli(c, m, d.x + dx - w * k, d.y, d.x + dx, d.y, d.x + dx + p, d.y - h * k)
      linea(c, l, 0.7, d.x + dx - w * k * 0.6, d.y - h * k * 0.3, d.x + dx + p, d.y - h * k)
    }
  },
  stendardo(c, d, a, r) {
    const [s, m] = a.sasso
    linea(c, s, 1.8, d.x, d.y, d.x, d.y - 30)
    linea(c, m, 0.8, d.x - 0.5, d.y - 1, d.x - 0.5, d.y - 30)
    poli(c, '#4a1414', d.x, d.y - 29, d.x + 13, d.y - 27, d.x + 11, d.y - 22, d.x + 13, d.y - 17, d.x + 7, d.y - 19, d.x + 5, d.y - 13, d.x, d.y - 15)
    poli(c, '#7a1e1a', d.x, d.y - 29, d.x + 9, d.y - 27.6, d.x + 7, d.y - 21, d.x, d.y - 19)
  },
  braciere(c, d, a) {
    const [s, m] = a.sasso
    linea(c, s, 1.6, d.x - 4, d.y, d.x + 3, d.y - 8)
    linea(c, s, 1.6, d.x + 4, d.y, d.x - 3, d.y - 8)
    poli(c, m, d.x - 6, d.y - 9, d.x + 6, d.y - 9, d.x + 4, d.y - 13, d.x - 4, d.y - 13)
  },
  ciuffo(c, d, a, r) {
    for (let i = 0; i < 4; i++) { const x = d.x + (r() - 0.5) * 7; linea(c, a.ciuffo, 0.8, x, d.y, x + (r() - 0.5) * 3, d.y - 3 - r() * 3) }
  },
  foglie(c, d, a, r) {
    for (let i = 0; i < 6; i++) { c.fillStyle = a.chioma[0][Math.floor(r() * 3)]; c.fillRect(d.x + (r() - 0.5) * 12, d.y + (r() - 0.5) * 7, 1.5, 1) }
  },
  sassi(c, d, a, r) {
    for (let i = 0; i < 3; i++) {
      const x = d.x + (r() - 0.5) * 11, y = d.y + (r() - 0.5) * 6, w = 1.5 + r() * 2
      c.fillStyle = a.sasso[0]; c.fillRect(x, y, w + 0.5, w * 0.7 + 0.5)
      c.fillStyle = a.sasso[2]; c.fillRect(x, y, w * 0.6, w * 0.35)
    }
  },
  ossa(c, d, a, r) {
    const chiaro = '#e0d6bc'
    linea(c, chiaro, 1, d.x - 4, d.y + r() * 2, d.x + 4, d.y - 1)
    disco(c, d.x + 6, d.y - 3, 2, chiaro)
    c.fillStyle = '#332b30'; c.fillRect(d.x + 5, d.y - 3.5, 0.9, 0.9); c.fillRect(d.x + 6.5, d.y - 3.5, 0.9, 0.9)
  },
  schegge(c, d, a, r) { for (let i = 0; i < 3; i++) FIGURE.scheggia(c, d.x + (i - 1) * 3.5, d.y, 3.5 + r() * 4, a, r) },
  spada(c, d, a, r) {
    const pende = (r() - 0.5) * 4
    linea(c, '#8c8a90', 1.4, d.x, d.y, d.x + pende, d.y - 12)
    linea(c, '#5a4030', 1.2, d.x + pende - 3.4, d.y - 10, d.x + pende + 3.4, d.y - 10.6)
  },
}

export function disegnaDecori(c, lista, a) {
  for (const d of lista) {
    const f = FIGURE[d.nome]
    if (f && d.nome !== 'scheggia') f(c, d, a, casuale(d))
  }
}
