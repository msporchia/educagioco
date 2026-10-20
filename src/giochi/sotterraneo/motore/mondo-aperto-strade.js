// La strada sulla griglia del mondo di sopra, per il generatore (motore/mondo-percorso.js): A* col costo di ogni cella (le strade si
// tracciano dove costa meno, e quelle già tracciate costano poco: così si uniscono in una rete), le celle raggiungibili e i
// passi da una cella a tutte. Dal prototipo (poc/mondo-sopra/strada.js); il cammino dell'eroe resta motore/terra.js. Pura.
const DIR = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [-1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, -1, Math.SQRT2]]
const QUATTRO = [[1, 0], [-1, 0], [0, 1], [0, -1]]

// `costo(k)`: Infinity = non si passa. In diagonale solo se le due celle di lato si passano. Torna le celle {x, y} dalla
// partenza all'arrivo, o null
export function cerca(W, H, costo, da, a, { diagonali = true } = {}) {
  const N = W * H, g = new Float32Array(N).fill(Infinity), da0 = new Int32Array(N).fill(-1), chiuso = new Uint8Array(N)
  const k0 = da.y * W + da.x, k1 = a.y * W + a.x
  if (!(costo(k1) < Infinity)) return null
  const heap = [], f = new Float32Array(N)
  const h = k => { const dx = Math.abs(k % W - a.x), dy = Math.abs(((k / W) | 0) - a.y); return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy) }
  const su = i => { while (i > 0) { const p = (i - 1) >> 1; if (f[heap[p]] <= f[heap[i]]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p } }
  const giu = i => {
    for (;;) {
      const l = i * 2 + 1, r = l + 1; let m = i
      if (l < heap.length && f[heap[l]] < f[heap[m]]) m = l
      if (r < heap.length && f[heap[r]] < f[heap[m]]) m = r
      if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m
    }
  }
  g[k0] = 0; f[k0] = h(k0); heap.push(k0)
  const quante = diagonali ? 8 : 4
  while (heap.length) {
    const k = heap[0]; const ult = heap.pop(); if (heap.length) { heap[0] = ult; giu(0) }
    if (chiuso[k]) continue
    chiuso[k] = 1
    if (k === k1) break
    const x = k % W, y = (k / W) | 0
    for (let d = 0; d < quante; d++) {
      const [dx, dy, l] = DIR[d], nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
      const nk = ny * W + nx
      if (chiuso[nk]) continue
      const c = costo(nk); if (!(c < Infinity)) continue
      if (dx && dy && (!(costo(y * W + nx) < Infinity) || !(costo(ny * W + x) < Infinity))) continue
      const ng = g[k] + l * c
      if (ng < g[nk]) { g[nk] = ng; da0[nk] = k; f[nk] = ng + h(nk); heap.push(nk); su(heap.length - 1) }
    }
  }
  if (da0[k1] < 0 && k1 !== k0) return null
  const via = []
  for (let k = k1; k !== -1; k = k === k0 ? -1 : da0[k]) via.push({ x: k % W, y: (k / W) | 0 })
  return via.reverse()
}

// i passi (quattro direzioni) da una cella a tutte le altre: −1 dove non si arriva
export function passiDa(W, H, libera, da) {
  const d = new Int32Array(W * H).fill(-1), q = [da.y * W + da.x]
  if (!libera(da.x, da.y)) return d
  d[q[0]] = 0
  for (let i = 0; i < q.length; i++) {
    const k = q[i], x = k % W, y = (k / W) | 0
    for (const [dx, dy] of QUATTRO) {
      const nx = x + dx, ny = y + dy, nk = ny * W + nx
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || d[nk] >= 0 || !libera(nx, ny)) continue
      d[nk] = d[k] + 1; q.push(nk)
    }
  }
  return d
}
