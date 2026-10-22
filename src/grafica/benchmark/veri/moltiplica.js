// Le leve dei colli di bottiglia sulla scena vera (docs/core/vecchio-telefono-veri.md): la stessa scena con k volte i triangoli
// (ogni triangolo diviso in k, piatto: la forma e le chiamate restano quelle) o con k volte le chiamate (ogni mesh spezzata in k
// gruppi dello stesso materiale: i triangoli restano quelli). Si toglie tutto con `ripristina`.
import { BufferAttribute } from 'three'

const ATTR_INTERI = new Set([Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array])

/** Una geometria con ogni triangolo diviso in `volte` (2, 4 o 8) triangoli, piatti; null se non si può (morph, pelle). */
export function dividi(geo, volte) {
  if (!geo || !geo.attributes.position || Object.keys(geo.morphAttributes || {}).length || geo.attributes.skinIndex) return null
  const n0 = geo.attributes.position.count
  const nomi = Object.keys(geo.attributes)
  const sorgenti = nomi.map(k => geo.attributes[k])
  // le colonne dei valori, in array normali che crescono: prima i vertici di partenza
  const dati = sorgenti.map(a => {
    const v = new Array(n0 * a.itemSize)
    for (let i = 0; i < n0; i++) for (let c = 0; c < a.itemSize; c++) v[i * a.itemSize + c] = a.getComponent(i, c)
    return v
  })
  let n = n0
  const indice = geo.index ? Array.from(geo.index.array) : Array.from({ length: n0 }, (_, i) => i)
  const iNormale = nomi.indexOf('normal')
  const medi = new Map()
  const medio = (a, b) => {
    const k = a < b ? a * 4294967296 + b : b * 4294967296 + a
    let m = medi.get(k)
    if (m !== undefined) return m
    m = n++
    sorgenti.forEach((s, j) => {
      const d = dati[j], z = s.itemSize
      for (let c = 0; c < z; c++) d[m * z + c] = (d[a * z + c] + d[b * z + c]) / 2
      if (j === iNormale) { const l = Math.hypot(d[m * 3], d[m * 3 + 1], d[m * 3 + 2]) || 1; for (let c = 0; c < 3; c++) d[m * 3 + c] /= l }
    })
    medi.set(k, m)
    return m
  }
  const due = tri => { const o = []; for (let i = 0; i < tri.length; i += 3) { const [a, b, c] = [tri[i], tri[i + 1], tri[i + 2]], m = medio(a, b); o.push(a, m, c, m, b, c) } return o }
  const quattro = tri => {
    const o = []
    for (let i = 0; i < tri.length; i += 3) {
      const [a, b, c] = [tri[i], tri[i + 1], tri[i + 2]], ab = medio(a, b), bc = medio(b, c), ca = medio(c, a)
      o.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca)
    }
    return o
  }
  let tri = indice
  if (volte === 2) tri = due(tri)
  else if (volte === 4) tri = quattro(tri)
  else if (volte === 8) tri = due(quattro(tri))
  else return null
  const g = geo.clone()
  sorgenti.forEach((s, j) => {
    // `getComponent` dà i normalizzati già in 0..1: tornano float; gli interi veri (un indice) restano interi
    const intero = !s.normalized && s.array && ATTR_INTERI.has(s.array.constructor)
    const Tipo = intero ? s.array.constructor : Float32Array
    const arr = new Tipo(n * s.itemSize)
    const d = dati[j]
    for (let i = 0; i < arr.length; i++) arr[i] = intero ? Math.round(d[i]) : d[i]
    g.setAttribute(nomi[j], new BufferAttribute(arr, s.itemSize, false))
  })
  g.setIndex(n > 65535 ? new BufferAttribute(new Uint32Array(tri), 1) : new BufferAttribute(new Uint16Array(tri), 1))
  // ogni triangolo diventa `volte` triangoli di fila: i gruppi e il tratto disegnato si allungano allo stesso modo
  g.groups = geo.groups.map(x => ({ ...x, start: x.start * volte, count: x.count * volte }))
  if (Number.isFinite(geo.drawRange.count)) g.setDrawRange(geo.drawRange.start * volte, geo.drawRange.count * volte)
  if (geo.boundingSphere) g.boundingSphere = geo.boundingSphere.clone()
  if (geo.boundingBox) g.boundingBox = geo.boundingBox.clone()
  return g
}

const adatta = o => o.isMesh && !o.isSkinnedMesh && o.geometry && o.geometry.attributes.position && !Array.isArray(o.material)

/** Le leve su una scena: `triangoli(k)` e `chiamate(k)` (1 = com'era); `ripristina()` rimette le geometrie e i materiali di prima. */
export function leve(scena) {
  const prima = new Map()          // mesh → { geo, mat }
  const gruppi = new Map()         // geometria → i suoi gruppi di prima (una geometria può stare in più mesh)
  const derivate = new Map()       // `uuid|k` → geometria divisa (condivisa fra le mesh che condividevano l'originale)
  const ricorda = o => {
    if (!prima.has(o)) prima.set(o, { geo: o.geometry, mat: o.material })
    if (!gruppi.has(o.geometry)) gruppi.set(o.geometry, o.geometry.groups.slice())
  }
  function ripristina() {
    for (const [o, p] of prima) { o.geometry = p.geo; o.material = p.mat }
    for (const [g, l] of gruppi) g.groups = l.slice()
    prima.clear(); gruppi.clear()
    for (const g of derivate.values()) g.dispose()
    derivate.clear()
  }
  return {
    ripristina,
    /** Tutte le mesh della scena con i triangoli × k; torna quanti triangoli c'erano e quanti ce ne sono (nelle geometrie). */
    triangoli(k) {
      ripristina()
      if (k <= 1) return
      scena.traverse(o => {
        if (!adatta(o)) return
        const chiave = `${o.geometry.uuid}|${k}`
        let g = derivate.get(chiave)
        if (g === undefined) { try { g = dividi(o.geometry, k) } catch (e) { g = null } derivate.set(chiave, g) }
        if (!g) return
        ricorda(o); o.geometry = g
      })
    },
    /** Tutte le mesh con un materiale solo spezzate in k gruppi: k chiamate per mesh invece di una, stessi triangoli. */
    chiamate(k) {
      ripristina()
      if (k <= 1) return
      scena.traverse(o => {
        if (!adatta(o)) return
        const g = o.geometry, tot = g.index ? g.index.count : g.attributes.position.count
        const tri = Math.floor(tot / 3)
        if (tri < k) return
        ricorda(o)
        g.clearGroups()
        for (let i = 0; i < k; i++) { const da = Math.floor(tri * i / k) * 3, a = Math.floor(tri * (i + 1) / k) * 3; g.addGroup(da, a - da, i) }
        o.material = Array.from({ length: k }, () => prima.get(o).mat)
      })
    },
  }
}
