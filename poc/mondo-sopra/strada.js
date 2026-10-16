// La strada sulla griglia: A* a otto direzioni (in diagonale solo se le due celle di lato sono libere, come la terra vera),
// col costo di ogni cella dato da chi chiama (il generatore lo usa per tracciare le strade, l'eroe per camminare), poi
// lisciata dove si vede dritto. Puro, gira anche in Node.
const DIR = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [-1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, -1, Math.SQRT2]]

// `costo(k)`: Infinity = non si passa. Torna l'elenco di celle {x, y} dalla partenza all'arrivo, o null
export function cerca (W, H, costo, da, a, { diagonali = true } = {}) {
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
  const quanteDir = diagonali ? 8 : 4
  while (heap.length) {
    const k = heap[0]; const ult = heap.pop(); if (heap.length) { heap[0] = ult; giu(0) }
    if (chiuso[k]) continue
    chiuso[k] = 1
    if (k === k1) break
    const x = k % W, y = (k / W) | 0
    for (let d = 0; d < quanteDir; d++) {
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

// si vede dritto da una cella all'altra (passi di un terzo di cella, e mai a cavallo di uno spigolo)
export function dritto (W, libera, a, b) {
  const ax = a.x + 0.5, ay = a.y + 0.5, dx = b.x - a.x, dy = b.y - a.y
  const n = Math.ceil(Math.hypot(dx, dy) * 3)
  for (let i = 1; i < n; i++) {
    const t = i / n, x = ax + dx * t, y = ay + dy * t
    for (const [ox, oy] of [[0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]]) if (!libera(Math.floor(x + ox), Math.floor(y + oy))) return false
  }
  return true
}
export function liscia (W, libera, via) {
  if (!via || via.length < 3) return via
  const fuori = [via[0]]
  let i = 0
  while (i < via.length - 1) {
    let j = via.length - 1
    while (j > i + 1 && !dritto(W, libera, via[i], via[j])) j--
    fuori.push(via[j]); i = j
  }
  return fuori
}

// tutte le celle raggiungibili da una (quattro direzioni bastano a dire «si arriva»)
export function raggiungibili (W, H, libera, da) {
  const visto = new Uint8Array(W * H), q = [da.y * W + da.x]
  visto[q[0]] = 1
  for (let i = 0; i < q.length; i++) {
    const k = q[i], x = k % W, y = (k / W) | 0
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, nk = ny * W + nx
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || visto[nk] || !libera(nx, ny)) continue
      visto[nk] = 1; q.push(nk)
    }
  }
  return visto
}
