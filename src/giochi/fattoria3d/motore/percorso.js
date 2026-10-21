/* La strada dell'eroe sulla griglia: Dijkstra a otto direzioni, senza tagliare gli angoli, e le strade costano meno
   (si preferisce passare di lì). Puro: `libera(i, j)` e `eStrada(i, j)` si passano da fuori. Il mondo non ha confini ma si
   cammina solo nel terreno proprio (`libera` è falso fuori), quindi la ricerca vede un insieme finito; si ferma alla prima
   meta estratta, che è la più vicina. Le celle sono chiavi intere (dati/mondo.js). */
import { chiave, cellaDa } from '../dati/mondo.js'

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
export const SCONTO_STRADA = 0.55

class Mucchio {                                  // un mucchio binario di [costo, chiave]
  constructor() { this.v = [] }
  get lungo() { return this.v.length }
  metti(c, k) {
    const v = this.v; v.push([c, k]); let n = v.length - 1
    while (n > 0) { const p = (n - 1) >> 1; if (v[p][0] <= v[n][0]) break;[v[p], v[n]] = [v[n], v[p]]; n = p }
  }
  togli() {
    const v = this.v, cima = v[0], ultimo = v.pop()
    if (v.length) {
      v[0] = ultimo; let n = 0
      for (;;) { const a = 2 * n + 1, b = a + 1; let m = n; if (a < v.length && v[a][0] < v[m][0]) m = a; if (b < v.length && v[b][0] < v[m][0]) m = b; if (m === n) break;[v[m], v[n]] = [v[n], v[m]]; n = m }
    }
    return cima
  }
}

/** Il percorso (celle [i, j]) dalla cella di partenza alla più vicina fra `mete`, o null se nessuna si raggiunge. */
export function percorso(libera, eStrada, da, mete) {
  const sono = new Set(mete.map(([i, j]) => chiave(i, j)))
  const k0 = chiave(da[0], da[1])
  const dist = new Map([[k0, 0]]), prev = new Map(), fatti = new Set(), aperti = new Mucchio()
  aperti.metti(0, k0)
  let meta = -1
  while (aperti.lungo) {
    const [d, cur] = aperti.togli()
    if (fatti.has(cur)) continue
    fatti.add(cur)
    if (sono.has(cur)) { meta = cur; break }
    const [ci, cj] = cellaDa(cur)
    for (const [di, dj] of DIRS) {
      const ni = ci + di, nj = cj + dj
      if (!libera(ni, nj)) continue
      if (di && dj && (!libera(ci + di, cj) || !libera(ci, cj + dj))) continue
      const k = chiave(ni, nj), c = d + (di && dj ? 1.414 : 1) * (eStrada(ni, nj) ? SCONTO_STRADA : 1)
      if (c < (dist.has(k) ? dist.get(k) : Infinity)) { dist.set(k, c); prev.set(k, cur); aperti.metti(c, k) }
    }
  }
  if (meta < 0) return null
  const via = []
  for (let k = meta; k !== k0; k = prev.get(k)) via.push(cellaDa(k))
  return via.reverse()
}
