// Saldare i pezzi fermi di un modello 3D dei prototipi (docs/sotterraneo/mostri-3d.md, «Quanto costa»): un mostro in codice è fatto di
// decine di mesh piccole (uno scheletro 155), e ognuna è una chiamata di disegno. Le mesh che non si muovono mai rispetto al loro perno,
// con lo stesso materiale, diventano una sola. Quali si muovono non lo dice nessuno: si chiede al modello, facendogli fare l'idle per
// un po' di secondi e l'attacco intero, e si guarda chi cambia (posizione, rotazione, scala, visibilità, forma). Il risultato vale per
// tutte le istanze dello stesso modello (la struttura è la stessa): si calcola una volta per id.
import { Mesh } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

const PROVE_IDLE = 64, PASSO_IDLE = 0.31, PROVE_ATTACCO = 12

function elenco(g) { const l = []; g.traverse(o => l.push(o)); return l }
function firma(o) {
  const g = o.isMesh && o.geometry, p = g && g.attributes.position
  return `${o.position.x},${o.position.y},${o.position.z},${o.quaternion.x},${o.quaternion.y},${o.quaternion.z},${o.quaternion.w},${o.scale.x},${o.scale.y},${o.scale.z},${o.visible}` +
    (g ? `|${g.uuid}|${p ? p.version : 0}|${o.material && o.material.uuid}` : '')
}

/** Gli indici (nell'ordine di traverse) delle mesh che si possono saldare: ferme, foglie, un materiale solo. */
export function ferme(g) {
  const u = g.userData, ogg = elenco(g), prima = ogg.map(firma), mosse = new Set()
  const guarda = () => ogg.forEach((o, i) => { if (!mosse.has(i) && firma(o) !== prima[i]) mosse.add(i) })
  for (let i = 0; i < PROVE_IDLE; i++) { u.anima(i * PASSO_IDLE); guarda() }
  if (u.attacca) for (let i = 0; i <= PROVE_ATTACCO; i++) { u.anima(1.7); u.attacca(i / PROVE_ATTACCO); guarda() }
  u.anima(0)
  return ogg.map((o, i) => i).filter(i => {
    const o = ogg[i]
    return !mosse.has(i) && o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && !o.isPoints && !o.isLine && !o.isSprite && o.children.length === 0 &&
      !Array.isArray(o.material) && !o.morphTargetInfluences && o.visible && o.geometry && o.geometry.attributes.position
  })
}

const segnoGeo = g => `${g.index ? 'i' : 'n'}:${Object.keys(g.attributes).sort().map(k => `${k}${g.attributes[k].itemSize}`).join(',')}`

/** Salda in `g` le mesh di `indici` (da `ferme`) con lo stesso perno e lo stesso materiale. Torna quante mesh ha tolto. */
export function salda(g, indici) {
  const ogg = elenco(g), gruppi = new Map()
  for (const i of indici) {
    const o = ogg[i]
    if (!o || !o.parent) continue
    const k = `${o.parent.uuid}|${o.material.uuid}|${segnoGeo(o.geometry)}|${o.renderOrder}`
    if (!gruppi.has(k)) gruppi.set(k, [])
    gruppi.get(k).push(o)
  }
  let tolte = 0
  for (const lista of gruppi.values()) {
    if (lista.length < 2) continue
    const geo = lista.map(o => { o.updateMatrix(); const c = o.geometry.clone(); c.applyMatrix4(o.matrix); for (const n of Object.keys(c.morphAttributes || {})) delete c.morphAttributes[n]; return c })
    const unita = mergeGeometries(geo, false)
    for (const c of geo) c.dispose()
    if (!unita) continue
    const m = new Mesh(unita, lista[0].material)
    m.renderOrder = lista[0].renderOrder; m.frustumCulled = lista[0].frustumCulled
    lista[0].parent.add(m)
    for (const o of lista) o.parent.remove(o)
    tolte += lista.length - 1
  }
  return tolte
}
