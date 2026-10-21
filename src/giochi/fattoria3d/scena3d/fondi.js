// Fonde le mesh statiche di un modello in poche: una per «tipo di materiale». Un edificio di 30 mesh è 30 draw call (60 con l'ombra) e
// il JS di `render()` è ciò che strozza i PC deboli e i telefoni; fuso, sono 4–8. Si chiama alla fine di ogni `crea…()` (i modelli, le
// anteprime e il catalogo la ricevono da soli). Vedi docs/fattoria3d/scena.md, «Qualità e peso».
//
// Il colore passa nei vertici: due mesh con materiali che differiscono solo per il colore (stessa ruvidità, metallo, luce propria, lato)
// diventano una mesh sola con un materiale `vertexColors` condiviso, e il colore (già lineare, come lo vuole il vertice) va in
// `color`. Il risultato a schermo è identico. Restano separati: ciò che si muove (`escludi`), i materiali con trame, trasparenti o
// strani, le `InstancedMesh`, le mesh invisibili e quelle con `userData` (un riferimento che qualcuno usa).
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { OMBRA_MIN } from './ottimizza.js'

const BIANCO = [1, 1, 1]
const _m = new THREE.Matrix4(), _inv = new THREE.Matrix4(), _sfera = new THREE.Sphere()
const MATERIALI = new Map()      // firma → il materiale fuso, uno per tutto il gioco

/** L'interruttore per i confronti prima/dopo (misure, catalogo): spento, i creatori tornano i modelli sciolti di una volta. */
export const FONDI = { acceso: true }
const conta = radice => { let mesh = 0, tri = 0; radice.traverse(o => { if (o.isMesh && o.geometry) { mesh++; tri += contaTri(o.geometry) * (o.isInstancedMesh ? o.count : 1) } }); return { mesh, tri: Math.round(tri) } }

export const contaTri = g => g.index ? g.index.count / 3 : g.attributes.position.count / 3

/** Unisce delle geometrie (già nello stesso spazio) in una: tiene solo gli attributi che hanno tutte (`position`, `normal`, `uv`),
    riempie di bianco `color` dove manca a qualcuna, e dà un indice sequenziale a chi non ce l'ha. Le geometrie in ingresso non si toccano. */
export function fondiGeometrie (lista) {
  if (!lista.length) return null
  const nomi = ['position', 'normal', 'uv'].filter(n => lista.every(g => g.attributes[n]))
  const conColore = lista.some(g => g.attributes.color)
  const pezzi = lista.map(g => {
    const c = new THREE.BufferGeometry()
    for (const n of nomi) c.setAttribute(n, g.attributes[n])
    if (conColore) {
      if (g.attributes.color) c.setAttribute('color', g.attributes.color)
      else { const k = g.attributes.position.count, a = new Float32Array(k * 3); for (let i = 0; i < k; i++) a.set(BIANCO, i * 3); c.setAttribute('color', new THREE.BufferAttribute(a, 3)) }
    }
    if (g.index) c.setIndex(g.index)
    else { const k = g.attributes.position.count, ix = new Uint32Array(k); for (let i = 0; i < k; i++) ix[i] = i; c.setIndex(new THREE.BufferAttribute(ix, 1)) }
    return c
  })
  return mergeGeometries(pezzi)
}

/** Il materiale è uno che si può fondere? Standard, opaco, senza trame, senza ordine di disegno speciale. */
function fondibile (mt) {
  return !!mt && !Array.isArray(mt) && mt.type === 'MeshStandardMaterial' && !mt.transparent && mt.opacity === 1 && mt.depthWrite && mt.depthTest &&
    !mt.vertexColors && !mt.map && !mt.alphaMap && !mt.normalMap && !mt.emissiveMap && !mt.roughnessMap && !mt.metalnessMap && !mt.envMap && !mt.aoMap && mt.alphaTest === 0
}
const firmaDi = mt => [mt.roughness, mt.metalness, mt.emissive.getHex(), mt.emissiveIntensity, mt.flatShading ? 1 : 0, mt.side, mt.envMapIntensity].join('|')
function materialeFuso (mt, firma) {
  if (!MATERIALI.has(firma)) {
    MATERIALI.set(firma, new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: mt.roughness, metalness: mt.metalness, emissive: mt.emissive.clone(), emissiveIntensity: mt.emissiveIntensity,
      flatShading: mt.flatShading, side: mt.side, envMapIntensity: mt.envMapIntensity,
    }))
  }
  return MATERIALI.get(firma)
}

/** Fonde le mesh statiche di `radice` per materiale, in `radice` stessa (ne conserva `userData` e posizione).
    `escludi`: oggetti (gruppi o mesh) che si muovono: lui e tutto ciò che c'è sotto restano com'erano; chi si muove per intero (una pala, un
    manichino) si può fondere a parte chiamando la funzione su di lui. Un pezzo piccolo (raggio sotto `soglia`) non proietta ombra, come
    prima; se dello stesso materiale c'è anche un pezzo grande finisce nella sua mesh (che proietta), e così non si spezza in due.
    Torna `{ prima: { mesh, tri }, dopo: { mesh, tri } }`. */
export function fondiPerMateriale (radice, { escludi = [], soglia = OMBRA_MIN } = {}) {
  if (!FONDI.acceso) { const c = conta(radice); return { prima: c, dopo: c } }
  const fuori = new Set(escludi)
  const prima = conta(radice)
  radice.updateMatrixWorld(true)
  _inv.copy(radice.matrixWorld).invert()

  const gruppi = new Map()       // firma + flag → { mt, firma, voci: [{ o, geo, raggio }] }
  const cerca = (o, sotto) => {
    for (const f of o.children) {
      if (fuori.has(f)) continue
      const fermo = f.visible && Object.keys(f.userData).length === 0
      if (f.isMesh && !f.isInstancedMesh && !f.isSkinnedMesh && fermo && f.geometry && f.geometry.attributes.position && fondibile(f.material) && f.renderOrder === 0 && sotto) {
        const firma = firmaDi(f.material), chiave = firma + '#' + (f.receiveShadow ? 1 : 0) + (f.castShadow ? 1 : 0)
        if (!gruppi.has(chiave)) gruppi.set(chiave, { mt: f.material, firma, cast: f.castShadow, receive: f.receiveShadow, voci: [] })
        gruppi.get(chiave).voci.push(f)
      } else if (!f.isMesh && !f.isLight && fermo && f.children.length && !f.isInstancedMesh) cerca(f, sotto)
      else if (!f.isMesh && f.children.length) { /* un gruppo con userData (o nascosto): non si tocca */ }
    }
  }
  cerca(radice, true)

  // i gruppi con una mesh sola non guadagnano niente: restano come sono
  const daFondere = [...gruppi.values()].filter(g => g.voci.length > 1)
  // il pezzo piccolo si unisce alla mesh grande dello stesso materiale (e flag di ricezione) se c'è, altrimenti resta fra i piccoli
  const unificati = new Map()
  for (const g of daFondere) {
    const k = g.firma + '#' + (g.receive ? 1 : 0)
    if (!unificati.has(k)) unificati.set(k, { mt: g.mt, firma: g.firma, receive: g.receive, grandi: [], piccoli: [], castOrig: false })
    const u = unificati.get(k)
    for (const o of g.voci) {
      if (!o.castShadow) { u.piccoli.push(o); continue }
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere()
      _m.copy(_inv).multiply(o.matrixWorld); _sfera.copy(o.geometry.boundingSphere).applyMatrix4(_m)
      ;(_sfera.radius < soglia ? u.piccoli : u.grandi).push(o)
      if (_sfera.radius >= soglia) u.castOrig = true
    }
  }
  const nuove = []
  for (const u of unificati.values()) {
    // quelli che già non proiettavano restano in una mesh a parte da quelli che proiettano
    const proietta = u.grandi.length ? [...u.grandi, ...u.piccoli.filter(o => o.castShadow)] : []
    const senza = u.grandi.length ? u.piccoli.filter(o => !o.castShadow) : u.piccoli
    for (const [voci, cast] of [[proietta, true], [senza, false]]) {
      if (!voci.length) continue
      if (voci.length === 1) continue
      const geos = voci.map(o => {
        const g = o.geometry.clone()
        for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n)
        _m.copy(_inv).multiply(o.matrixWorld); g.applyMatrix4(_m)
        if (_m.determinant() < 0 && g.index) { const ix = g.index; for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a) } }
        else if (_m.determinant() < 0) { const p = g.attributes.position; for (let i = 0; i < p.count; i += 3) { const x = p.getX(i + 1), y = p.getY(i + 1), z = p.getZ(i + 1); p.setXYZ(i + 1, p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2)); p.setXYZ(i + 2, x, y, z) } }
        if (!g.attributes.normal) g.computeVertexNormals()
        const k = g.attributes.position.count, c = o.material.color, a = new Float32Array(k * 3)
        for (let i = 0; i < k; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b }
        g.setAttribute('color', new THREE.BufferAttribute(a, 3))
        return g
      })
      const fusa = fondiGeometrie(geos); for (const g of geos) g.dispose()
      const m = new THREE.Mesh(fusa, materialeFuso(u.mt, u.firma))
      m.castShadow = cast; m.receiveShadow = u.receive
      nuove.push({ m, voci })
    }
  }
  for (const { m, voci } of nuove) {
    for (const o of voci) { o.parent.remove(o) }          // le geometrie condivise non si buttano: le tengono altri modelli
    radice.add(m)
  }
  // i gruppi rimasti vuoti (le falde dei tetti, i recinti di pezzi) non servono più
  const spazza = o => { for (const f of [...o.children]) { if (fuori.has(f) || f.isMesh) continue; spazza(f); if (!f.children.length && Object.keys(f.userData).length === 0 && !f.isLight) o.remove(f) } }
  spazza(radice)
  return { prima, dopo: conta(radice) }
}
