// Ritingere un pezzo in 3D (docs/sotterraneo/tintore.md). I materiali e le geometrie di eroi3d/ e roba3d/ stanno in cache condivisa e non si
// toccano mai: qui si fanno copie tinte, a loro volta in cache (stesso originale, stessa tinta, stessa copia), così la saldatura
// (salda3d.js) continua a trovare un materiale solo per colore. I colori cromatici prendono la tinta (restando chiari o scuri come erano),
// i grigi del metallo ne prendono un velo, gli emissivi e gli aloni additivi restano; nero e bianco di contorno non si toccano.
// Le armi hanno il colore nei vertici (`vertexColors`): lì si ritinge una copia della geometria, non il materiale.
import { Color, AdditiveBlending, BufferAttribute } from 'three'
import { TINTA_DI } from './tinte.js'

const VELO_SUI_GRIGI = 0.45    // quanto la tinta arriva sui grigi (il metallo resta metallo)
const FORZA_SUI_COLORI = 0.88  // quanto un colore cromatico va verso la tinta
const smussa = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

// la tinta come moltiplicatore con il canale più forte a 1: { r, g, b }
const normalizzate = new Map()
function tintaNormale(id) {
  if (!normalizzate.has(id)) {
    const t = TINTA_DI[id]
    if (!t) return null
    const c = new Color(t.colore), m = Math.max(c.r, c.g, c.b) || 1
    normalizzate.set(id, { r: c.r / m, g: c.g / m, b: c.b / m })
  }
  return normalizzate.get(id)
}

/** Il colore (r, g, b lineari) ritinto di `id`: { r, g, b }, o lo stesso se non c'è la tinta o è un nero/bianco di contorno. */
export function spostaColore(r, g, b, id) {
  const T = tintaNormale(id)
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  if (!T || mx < 0.012 || mn > 0.8) return { r, g, b }
  const sat = (mx - mn) / mx
  const k = smussa(0.08, 0.32, sat)
  const grigio = [r * (1 - VELO_SUI_GRIGI + VELO_SUI_GRIGI * T.r), g * (1 - VELO_SUI_GRIGI + VELO_SUI_GRIGI * T.g), b * (1 - VELO_SUI_GRIGI + VELO_SUI_GRIGI * T.b)]
  const w = FORZA_SUI_COLORI
  const colore = [mx * (1 - w + w * T.r), mx * (1 - w + w * T.g), mx * (1 - w + w * T.b)]
  return { r: grigio[0] + (colore[0] - grigio[0]) * k, g: grigio[1] + (colore[1] - grigio[1]) * k, b: grigio[2] + (colore[2] - grigio[2]) * k }
}

const materiali = new WeakMap()   // materiale originale → Map(tinta → copia)
const geometrie = new WeakMap()   // geometria originale → Map(tinta → copia)
const dellaCache = (cache, o, id, fai) => {
  if (!cache.has(o)) cache.set(o, new Map())
  const m = cache.get(o)
  if (!m.has(id)) m.set(id, fai())
  return m.get(id)
}

function materialeTinto(m, id) {
  if (!m || !m.color || m.blending === AdditiveBlending) return m
  return dellaCache(materiali, m, id, () => {
    const c = m.clone()
    if (!m.vertexColors) { const x = spostaColore(m.color.r, m.color.g, m.color.b, id); c.color.setRGB(x.r, x.g, x.b) }
    return c
  })
}

function geometriaTinta(geo, id) {
  const col = geo && geo.attributes && geo.attributes.color
  if (!col) return geo
  return dellaCache(geometrie, geo, id, () => {
    const g = geo.clone()
    const n = col.itemSize, a = new Float32Array(col.count * n)
    for (let i = 0; i < col.count; i++) {
      const x = spostaColore(col.getX(i), col.getY(i), col.getZ(i), id)
      a[i * n] = x.r; a[i * n + 1] = x.g; a[i * n + 2] = x.b
      if (n > 3) a[i * n + 3] = col.getW(i)
    }
    g.setAttribute('color', new BufferAttribute(a, n))
    return g
  })
}

/** Ritinge in loco le mesh di `lista` (con le copie in cache: i materiali e le geometrie di serie restano come sono). */
export function tingiMesh(lista, id) {
  if (!id || !TINTA_DI[id]) return
  for (const o of lista) {
    if (!o.isMesh || o.userData.nonTingere) continue
    if (Array.isArray(o.material)) o.material = o.material.map(m => materialeTinto(m, id))
    else {
      if (o.material && o.material.vertexColors) o.geometry = geometriaTinta(o.geometry, id)
      o.material = materialeTinto(o.material, id)
    }
  }
}

/** Tutte le mesh sotto `radice` (un gruppo di un'arma, di uno scudo). */
export function tingiGruppo(radice, id) {
  if (!radice || !id) return
  const l = []
  radice.traverse(o => { if (o.isMesh) l.push(o) })
  tingiMesh(l, id)
}

const meshDi = radice => { const s = new Set(); radice.traverse(o => { if (o.isMesh) s.add(o) }); return s }

/**
 * Ritinge solo quello che `fai()` aggiunge a `radice` (la veste o il copricapo messi sopra l'eroe: il corpo e la testa restano
 * come sono). Torna quello che torna `fai()`.
 */
export function tingiAggiunte(radice, id, fai) {
  if (!id) return fai()
  const prima = meshDi(radice)
  const r = fai()
  const nuove = []
  radice.traverse(o => { if (o.isMesh && !prima.has(o)) nuove.push(o) })
  tingiMesh(nuove, id)
  return r
}
