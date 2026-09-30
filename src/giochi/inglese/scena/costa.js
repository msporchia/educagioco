// Le coste delle isole della mappa del tesoro: un campo, una soglia, un
// contorno. Puro, senza canvas, gira in Node (test/unita/inglese-isole).
// Il perché della forma sta in docs/lingue/mondi-vista.md («Le isole»).
import { dado } from '../../../grafica/comune.js'

/* ── il rumore: a valori, con seme, liscio; in [-1, 1] ── */
function rumore(seme) {
  const v = (i, j) => dado(i, j, seme) * 2 - 1
  const f = t => t * t * t * (t * (t * 6 - 15) + 10)
  return (x, y) => {
    const i = Math.floor(x), j = Math.floor(y), u = f(x - i), w = f(y - j)
    const a = v(i, j), b = v(i + 1, j), c = v(i, j + 1), d = v(i + 1, j + 1)
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w
  }
}

// due voci: la larga (golfi e promontori) e la fine (la costa frastagliata)
export function rumori(seme, scala = 95) {
  const r1 = rumore(seme * 7 + 1), r2 = rumore(seme * 7 + 2), r3 = rumore(seme * 7 + 3), r4 = rumore(seme * 7 + 4)
  const s2 = scala * 0.44
  return {
    largo: (x, y) => Math.max(-1, Math.min(1, (r1(x / scala, y / scala) + 0.55 * r2(x / s2, y / s2)) / 1.1)),
    fine: (x, y) => r3(x / 13, y / 13) * 0.65 + r4(x / 6, y / 6) * 0.35,
  }
}

/* ── le forme: distanza con segno (negativa dentro) ── */
export const tondo = (x, y, r) => ({ tipo: 'tondo', x, y, r })
export const tratto = (ax, ay, bx, by, r) => ({ tipo: 'tratto', ax, ay, bx, by, r })
export const riquadro = (x, y, w2, h2) => ({ tipo: 'riquadro', x, y, w2, h2 })

export function distanza(f, x, y) {
  if (f.tipo === 'tondo') return Math.hypot(x - f.x, y - f.y) - f.r
  if (f.tipo === 'tratto') {
    const dx = f.bx - f.ax, dy = f.by - f.ay
    const l2 = dx * dx + dy * dy || 1
    const t = Math.max(0, Math.min(1, ((x - f.ax) * dx + (y - f.ay) * dy) / l2))
    return Math.hypot(x - f.ax - t * dx, y - f.ay - t * dy) - f.r
  }
  const qx = Math.abs(x - f.x) - f.w2, qy = Math.abs(y - f.y) - f.h2
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0)
}

// l'unione morbida: raccorda gli angoli rientranti, e aggiunge solo terra
function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - h * h * k / 4
}
export function unione(forme, x, y, k = 0) {
  let d = Infinity
  for (const f of forme) {
    const v = distanza(f, x, y)
    d = k && d !== Infinity ? smin(d, v, k) : Math.min(d, v)
  }
  return d
}

// la scatola che contiene tutte le forme
export function scatola(forme) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const f of forme) {
    const [a, b, c, d] = f.tipo === 'tondo' ? [f.x - f.r, f.y - f.r, f.x + f.r, f.y + f.r]
      : f.tipo === 'tratto' ? [Math.min(f.ax, f.bx) - f.r, Math.min(f.ay, f.by) - f.r,
                               Math.max(f.ax, f.bx) + f.r, Math.max(f.ay, f.by) + f.r]
      : [f.x - f.w2, f.y - f.h2, f.x + f.w2, f.y + f.h2]
    x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, c); y1 = Math.max(y1, d)
  }
  return { x0, y0, x1, y1 }
}

/* ── la griglia di un campo, e la lettura in un punto qualunque ── */
export function griglia(x0, y0, x1, y1, passo, fn) {
  const nx = Math.ceil((x1 - x0) / passo) + 1, ny = Math.ceil((y1 - y0) / passo) + 1
  const v = new Float32Array(nx * ny)
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) v[j * nx + i] = fn(x0 + i * passo, y0 + j * passo, i, j)
  return { x0, y0, passo, nx, ny, v }
}

// bilineare; fuori dalla griglia torna `fuori`
export function leggi(g, x, y, fuori = Infinity) {
  const fx = (x - g.x0) / g.passo, fy = (y - g.y0) / g.passo
  if (fx < 0 || fy < 0 || fx > g.nx - 1 || fy > g.ny - 1) return fuori
  const i = Math.min(g.nx - 2, Math.floor(fx)), j = Math.min(g.ny - 2, Math.floor(fy))
  const u = fx - i, w = fy - j, k = j * g.nx + i
  const a = g.v[k], b = g.v[k + 1], c = g.v[k + g.nx], d = g.v[k + g.nx + 1]
  return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w
}

/* ── marching squares: le curve dove il campo vale `livello` ──
   Dentro è sotto il livello. Il bordo della griglia deve stare fuori, così
   ogni curva si chiude. Torna anelli [[x, y], …] senza ripetere il primo. */
export function contorni(g, livello = 0) {
  const { nx, ny, v, x0, y0, passo } = g
  const dentro = (i, j) => v[j * nx + i] < livello
  const punto = new Map()      // chiave del lato → [x, y]
  const vicini = new Map()     // chiave del lato → chiavi collegate
  const lato = (tipo, i, j) => {
    const k = tipo + i + ',' + j
    if (!punto.has(k)) {
      const [a, b] = tipo === 'h' ? [[i, j], [i + 1, j]] : [[i, j], [i, j + 1]]
      const va = v[a[1] * nx + a[0]], vb = v[b[1] * nx + b[0]]
      const t = Math.max(0, Math.min(1, (livello - va) / ((vb - va) || 1e-9)))
      punto.set(k, [x0 + (a[0] + (b[0] - a[0]) * t) * passo, y0 + (a[1] + (b[1] - a[1]) * t) * passo])
    }
    return k
  }
  const unisci = (a, b) => {
    if (!vicini.has(a)) vicini.set(a, [])
    if (!vicini.has(b)) vicini.set(b, [])
    vicini.get(a).push(b); vicini.get(b).push(a)
  }
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const caso = (dentro(i, j) ? 8 : 0) | (dentro(i + 1, j) ? 4 : 0) | (dentro(i + 1, j + 1) ? 2 : 0) | (dentro(i, j + 1) ? 1 : 0)
    if (caso === 0 || caso === 15) continue
    const su = () => lato('h', i, j), giu = () => lato('h', i, j + 1)
    const sx = () => lato('v', i, j), dx = () => lato('v', i + 1, j)
    const centro = (v[j * nx + i] + v[j * nx + i + 1] + v[(j + 1) * nx + i] + v[(j + 1) * nx + i + 1]) / 4 < livello
    switch (caso) {
      case 1: case 14: unisci(sx(), giu()); break
      case 2: case 13: unisci(giu(), dx()); break
      case 3: case 12: unisci(sx(), dx()); break
      case 4: case 11: unisci(su(), dx()); break
      case 6: case 9: unisci(su(), giu()); break
      case 7: case 8: unisci(su(), sx()); break
      case 5: if (centro) { unisci(su(), sx()); unisci(dx(), giu()) } else { unisci(su(), dx()); unisci(sx(), giu()) } break
      case 10: if (centro) { unisci(su(), dx()); unisci(sx(), giu()) } else { unisci(su(), sx()); unisci(dx(), giu()) } break
    }
  }
  const visti = new Set(), anelli = []
  for (const inizio of vicini.keys()) {
    if (visti.has(inizio)) continue
    const anello = []
    let prima = null, ora = inizio
    while (ora && !visti.has(ora)) {
      visti.add(ora); anello.push(punto.get(ora))
      const dopo = vicini.get(ora).find(k => k !== prima && !visti.has(k))
      prima = ora; ora = dopo
    }
    if (anello.length > 2) anelli.push(anello)
  }
  return anelli
}

export function area(anello) {
  let a = 0
  for (let i = 0, n = anello.length; i < n; i++) {
    const [x1, y1] = anello[i], [x2, y2] = anello[(i + 1) % n]
    a += x1 * y2 - x2 * y1
  }
  return a / 2
}

export function dentroAnello(anello, x, y) {
  let s = false
  for (let i = 0, j = anello.length - 1; i < anello.length; j = i++) {
    const [xi, yi] = anello[i], [xj, yj] = anello[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) s = !s
  }
  return s
}

// lisciata leggera (senza stringere: un passo avanti e uno indietro) e poi
// sfoltita: il tracciato resta dove l'ha messo il campo, meno i gradini
export function liscia(anello, giri = 2, minimo = 2.2) {
  let a = anello
  for (let g = 0; g < giri; g++) {
    for (const q of [0.5, -0.52]) {
      a = a.map(([x, y], i) => {
        const [px, py] = a[(i - 1 + a.length) % a.length], [nx, ny] = a[(i + 1) % a.length]
        return [x + q * ((px + nx) / 2 - x), y + q * ((py + ny) / 2 - y)]
      })
    }
  }
  const out = [a[0]]
  for (const p of a) {
    const u = out[out.length - 1]
    if (Math.hypot(p[0] - u[0], p[1] - u[1]) >= minimo) out.push(p)
  }
  return out.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10])
}
