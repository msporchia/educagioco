/* La strada dell'eroe sulla griglia: Dijkstra a otto direzioni, senza tagliare gli angoli, e le strade costano meno
   (si preferisce passare di lì). Puro: `libera(i, j)` e `costoStrada(i, j)` si passano da fuori. */
import { I0, J0, GW, GH, idx } from '../dati/mondo.js'

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
export const SCONTO_STRADA = 0.55

export function distanze(libera, eStrada, i0, j0) {
  const dist = new Float32Array(GW * GH).fill(Infinity), prev = new Int32Array(GW * GH).fill(-1)
  dist[idx(i0, j0)] = 0
  const aperti = [idx(i0, j0)]
  while (aperti.length) {
    let m = 0
    for (let n = 1; n < aperti.length; n++) if (dist[aperti[n]] < dist[aperti[m]]) m = n
    const cur = aperti.splice(m, 1)[0]
    const ci = cur % GW + I0, cj = Math.floor(cur / GW) + J0
    for (const [di, dj] of DIRS) {
      const ni = ci + di, nj = cj + dj
      if (!libera(ni, nj)) continue
      if (di && dj && (!libera(ci + di, cj) || !libera(ci, cj + dj))) continue
      const k = idx(ni, nj), c = dist[cur] + (di && dj ? 1.414 : 1) * (eStrada(ni, nj) ? SCONTO_STRADA : 1)
      if (c < dist[k]) { if (dist[k] === Infinity) aperti.push(k); dist[k] = c; prev[k] = cur }
    }
  }
  return { dist, prev }
}

/** Il percorso (celle [i, j]) dalla cella di partenza alla più vicina fra `mete`, o null se nessuna si raggiunge. */
export function percorso(libera, eStrada, da, mete) {
  const { dist, prev } = distanze(libera, eStrada, da[0], da[1])
  let meglio = -1
  for (const [i, j] of mete) { const k = idx(i, j); if (dist[k] < Infinity && (meglio < 0 || dist[k] < dist[meglio])) meglio = k }
  if (meglio < 0) return null
  const via = []
  for (let k = meglio; k >= 0 && k !== idx(da[0], da[1]); k = prev[k]) via.push([k % GW + I0, Math.floor(k / GW) + J0])
  return via.reverse()
}
