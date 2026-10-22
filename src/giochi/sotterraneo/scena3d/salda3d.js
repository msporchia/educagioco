// Saldare i pezzi fermi di un modello 3D dei prototipi (docs/sotterraneo/mostri-3d.md, «Quanto costa»): un mostro in codice è fatto di
// decine di mesh piccole (uno scheletro 155), e ognuna è una chiamata di disegno. Le mesh che non si muovono mai rispetto al loro perno,
// con lo stesso materiale, diventano una sola. Quali si muovono non lo dice nessuno: si chiede al modello, facendogli fare l'idle per
// un po' di secondi e l'attacco intero, e si guarda chi cambia (posizione, rotazione, scala, visibilità, forma). Il risultato vale per
// tutte le istanze dello stesso modello (la struttura è la stessa): si calcola una volta per id.
// Un perno che non si muove mai (come un osso dello scheletro fermo rispetto al busto) non separa niente: una mesh si salda col
// primo antenato che si muove (l'«ancora»), portandosi dietro le trasformazioni dei perni fermi di mezzo; uno scheletro passa da
// ~80 a ~45 chiamate (docs/sotterraneo/prestazioni-3d.md). Un perno nascosto o con un suo renderOrder fa da ancora.
import { Mesh, Matrix4 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

const PROVE_IDLE = 64, PASSO_IDLE = 0.31, PROVE_ATTACCO = 12

function elenco(g) { const l = []; g.traverse(o => l.push(o)); return l }
function firma(o) {
  const g = o.isMesh && o.geometry, p = g && g.attributes.position
  return `${o.position.x},${o.position.y},${o.position.z},${o.quaternion.x},${o.quaternion.y},${o.quaternion.z},${o.quaternion.w},${o.scale.x},${o.scale.y},${o.scale.z},${o.visible}` +
    (g ? `|${g.uuid}|${p ? p.version : 0}|${o.material && o.material.uuid}` : '')
}

/** Le mesh che si possono saldare (ferme, foglie, un materiale solo), come coppie di indici nell'ordine di traverse: la mesh e la
 *  sua ancora. `u`: chi le muove (`anima(t)`, `attacca(p)`), di difetto il modello; l'eroe passa le sue pose, e più prove. */
export function ferme(g, u = g.userData, { prove = PROVE_IDLE, passo = PASSO_IDLE } = {}) {
  const ogg = elenco(g), prima = ogg.map(firma), mosse = new Set()
  const guarda = () => ogg.forEach((o, i) => { if (!mosse.has(i) && firma(o) !== prima[i]) mosse.add(i) })
  for (let i = 0; i < prove; i++) { u.anima(i * passo); guarda() }
  if (u.attacca) for (let i = 0; i <= PROVE_ATTACCO; i++) { u.anima(1.7); u.attacca(i / PROVE_ATTACCO); guarda() }
  // l'attacco anche sopra i gesti dell'idle (una mano che si muove solo se attacca durante un gesto): un istante qualunque, un p qualunque
  if (u.attacca) for (let i = 0; i < prove; i++) { u.anima(i * passo + passo / 2); u.attacca(((i * 5) % (PROVE_ATTACCO + 1)) / PROVE_ATTACCO); guarda() }
  u.anima(0)
  const indice = new Map(ogg.map((o, i) => [o, i]))
  const ancora = o => { let a = o.parent; while (a !== g && !mosse.has(indice.get(a)) && a.visible && !a.renderOrder) a = a.parent; return indice.get(a) }
  return ogg.map((o, i) => i).filter(i => {
    const o = ogg[i]
    return !mosse.has(i) && o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && !o.isPoints && !o.isLine && !o.isSprite && o.children.length === 0 &&
      !Array.isArray(o.material) && !o.morphTargetInfluences && o.visible && o.geometry && o.geometry.attributes.position
  }).map(i => [i, ancora(ogg[i])])
}

const _m = new Matrix4()
// dove sta la mesh nello spazio della sua ancora: la sua matrice e quelle dei perni fermi fino all'ancora
function rispettoA(o, a, fuori) {
  if (o.matrixAutoUpdate) o.updateMatrix()
  fuori.copy(o.matrix)
  for (let p = o.parent; p && p !== a; p = p.parent) { if (p.matrixAutoUpdate) p.updateMatrix(); fuori.premultiply(p.matrix) }
  return fuori
}

const segnoGeo = g => `${g.index ? 'i' : 'n'}:${Object.keys(g.attributes).sort().map(k => `${k}${g.attributes[k].itemSize}`).join(',')}`

/** Salda in `g` le mesh di `indici` (da `ferme`) con la stessa ancora e lo stesso materiale. Torna quante mesh ha tolto. `ombre`: la
 *  saldata fa e prende l'ombra come i pezzi (l'eroe); senza, come sempre per i mostri, né l'una né l'altra. */
export function salda(g, indici, { ombre = false } = {}) {
  const ogg = elenco(g), gruppi = new Map()
  for (const x of indici) {
    const [i, ia] = Array.isArray(x) ? x : [x, -1]
    const o = ogg[i], a = ia >= 0 ? ogg[ia] : o && o.parent
    if (!o || !o.parent || !a) continue
    const k = `${a.uuid}|${o.material.uuid}|${segnoGeo(o.geometry)}|${o.renderOrder}` + (ombre ? `|${o.castShadow}|${o.receiveShadow}` : '')
    if (!gruppi.has(k)) gruppi.set(k, { a, lista: [] })
    gruppi.get(k).lista.push(o)
  }
  let tolte = 0
  for (const { a, lista } of gruppi.values()) {
    if (lista.length < 2) continue
    const geo = lista.map(o => { const c = o.geometry.clone(); c.applyMatrix4(rispettoA(o, a, _m)); for (const n of Object.keys(c.morphAttributes || {})) delete c.morphAttributes[n]; return c })
    const unita = mergeGeometries(geo, false)
    for (const c of geo) c.dispose()
    if (!unita) continue
    const m = new Mesh(unita, lista[0].material)
    m.renderOrder = lista[0].renderOrder; m.frustumCulled = lista[0].frustumCulled
    if (ombre) { m.castShadow = lista[0].castShadow; m.receiveShadow = lista[0].receiveShadow }
    m.userData.saldata = true   // la geometria è sua: chi butta il modello la libera (eroe3d.js)
    a.add(m)
    for (const o of lista) o.parent.remove(o)
    tolte += lista.length - 1
  }
  return tolte
}
