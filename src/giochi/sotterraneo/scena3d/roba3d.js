// La roba in 3D (docs/sotterraneo/roba-3d.md): un oggetto → la sua figura dei fogli → il modello del modulo della sua famiglia
// (roba3d/: lame, bastoni, scudi, vesti, gioielli, quelli che `npm run promuovi3d` ha trovato pronti), con l'alone della rarità e
// dell'elemento. Dove il modulo manca, la figura non è coperta o il modello si rompe, il ripiego è il modello della base nella
// collezione (MODELLO_DI); senza nemmeno quello null, e la vista tiene lo sprite.
import { Matrix4, Color, Mesh, Group, MeshStandardMaterial, Float32BufferAttribute, AdditiveBlending } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { creaDaId, perId } from './eroi3d/collezione.js'
import { MODULI } from './roba3d/moduli.js'
import { aggiungiAlone } from './roba3d/aloni.js'
import { FIGURE3D } from '../dati/figure3d.js'
import { pezzo3dDi, consumabile3dDi } from './anteprime3d-pura.js'
import { lookDi } from './roba3d-pura.js'
import { ACCESI } from './costanti.js'

export { MODULI }
const rotte = new Set()                  // le figure il cui modello s'è rotto una volta: non si riprovano
const avvisa = (cosa, e) => { if (typeof console !== 'undefined') console.warn(`roba 3D: ${cosa} non si costruisce, ripiego`, e && e.message) }

/** Il record della figura come lo vogliono i moduli (quello di roba.json: `{ id, cosa, elemento, materia, … }`), o null. */
export const recordDi = figura => (FIGURE3D[figura] ? { id: figura, ...FIGURE3D[figura] } : null)

/** Il modulo che disegna la figura, se c'è (`moduli` per le prove): `crea(figura)`, o `vesti(eroe, figura)` per le vesti. */
export function moduloDi(figura, moduli = MODULI) {
  const f = FIGURE3D[figura]
  const m = f && moduli[f.famiglia]
  return m && (typeof m.crea === 'function' || typeof m.vesti === 'function') ? m : null
}

/** Il modello della figura dal suo modulo, o null (modulo che manca, figura che non copre, guasto). */
export function creaFigura(figura, moduli = MODULI) {
  const m = moduloDi(figura, moduli)
  if (!m || typeof m.crea !== 'function' || rotte.has(figura)) return null
  try {
    const g = m.crea(recordDi(figura))
    if (g && g.isObject3D) return g
  } catch (e) { avvisa(figura, e) }
  rotte.add(figura)
  return null
}

/** Il modello di un consumabile (una pozione, la torcia, la chiave, la pergamena) dal modulo `pozioni`, o null. */
export function creaConsumabile(chiave, moduli = MODULI) {
  const m = moduli.pozioni
  if (!m || typeof m.crea !== 'function' || (Array.isArray(m.CHIAVI) && !m.CHIAVI.includes(chiave)) || rotte.has(`usa:${chiave}`)) return null
  try {
    const g = m.crea(chiave)
    if (g && g.isObject3D) return g
  } catch (e) { avvisa(chiave, e) }
  rotte.add(`usa:${chiave}`)
  return null
}

// l'arma semplice (`ACCESI.armiSemplici`, la fascia bassa: docs/sotterraneo/prestazioni-3d.md): il modello nuovo della figura con tutti i
// pezzi fermi fusi in una geometria, il colore di ogni materiale nei vertici e un materiale solo per tutte (saldato all'eroe, una chiamata);
// via aloni, fiamme, punti e trasparenze. Non il ripiego della collezione: quello viene dal disegno 2D e non somiglia al modello nuovo
let materialeSemplice = null
export function appiattisci(g) {
  if (g.userData.anima) g.userData.anima(0.5)   // fiamme e bagliori nascono enormi: li mette a misura l'animazione
  g.updateMatrixWorld(true)
  const inv = new Matrix4().copy(g.matrixWorld).invert(), parti = [], m4 = new Matrix4()
  const tinta = m => {
    const c = (m && m.color ? m.color.clone() : new Color(1, 1, 1)).multiplyScalar(1 - 0.45 * ((m && m.metalness) || 0))   // il metallo senza riflessi è più scuro
    if (m && m.emissive && m.emissiveIntensity) c.add(m.emissive.clone().multiplyScalar(Math.min(1, m.emissiveIntensity) * 0.25))
    return c
  }
  const fuori = m => !m || m.blending === AdditiveBlending || (m.transparent && m.opacity < 0.6)
  g.traverse(o => {
    if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || !o.visible) return
    const mats = Array.isArray(o.material) ? o.material : [o.material]
    if (mats.every(fuori)) return
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()
    for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal') geo.deleteAttribute(k)
    if (!geo.attributes.normal) geo.computeVertexNormals()
    geo.applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld))
    const n = geo.attributes.position.count, col = new Float32Array(n * 3)
    const tratti = Array.isArray(o.material) && geo.groups.length ? geo.groups : [{ start: 0, count: n, materialIndex: 0 }]
    for (const t of tratti) {
      const c = tinta(mats[t.materialIndex || 0])
      for (let i = t.start; i < Math.min(n, t.start + t.count); i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b }
    }
    geo.clearGroups()
    geo.setAttribute('color', new Float32BufferAttribute(col, 3))
    parti.push(geo)
  })
  if (!parti.length) return g
  const unita = mergeGeometries(parti)
  parti.forEach(p => p.dispose())
  if (!unita) return g
  materialeSemplice = materialeSemplice || new MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0 })
  const r = new Group()
  r.add(new Mesh(unita, materialeSemplice))
  r.position.copy(g.position); r.quaternion.copy(g.quaternion); r.scale.copy(g.scale)
  r.userData = { ...g.userData, anima: undefined, animaAlone: undefined, semplice: true }
  return r
}

/**
 * Il modello di un pezzo 3D (`pezzo3dDi`: { figura, id, rarita, elemento }): la figura, se no il ripiego della collezione, se no null.
 * `alone` (sì di difetto) mette l'alone della rarità e dell'elemento ai pezzi non comuni, coi punti grandi `scalaAlone`; l'eroe lo
 * muove con `userData.animaAlone`.
 */
export function creaPezzo(p, { moduli = MODULI, alone = true, scalaAlone = 1, semplice = false } = {}) {
  if (!p) return null
  let g = p.figura ? creaFigura(p.figura, moduli) : p.consumabile ? creaConsumabile(p.consumabile, moduli) : null
  if (g && semplice) { try { g = appiattisci(g) } catch (e) { avvisa(`la versione semplice di ${p.figura}`, e) } return g }
  if (g) g.userData.daFigura = true
  else if (p.id && perId(p.id)) {
    try { g = creaDaId(p.id) } catch (e) { avvisa(p.id, e); g = null }
  }
  if (!g) return null
  if (alone && ACCESI.aloni && p.rarita && p.rarita !== 'comune') {
    try { if (g.userData.anima) g.userData.anima(0.5); aggiungiAlone(g, { rarita: p.rarita, elemento: p.elemento, scala: scalaAlone }) } catch (e) { avvisa(`l'alone di ${p.figura || p.id}`, e) }
  }
  return g
}

/**
 * Dalla chiave di un oggetto (anche composta, `spada@7.m.fuoco`) quello che serve per disegnarlo:
 * { figura, famiglia, modulo (la famiglia se il suo modulo c'è, se no null: si ripiega), ripiego (l'id della collezione o null),
 *   crea() → Group|null, look: { rarita, elemento, materia, pregio } }, o null se l'oggetto non ha né figura né ripiego.
 */
export function modelloDiRoba(chiave, { moduli = MODULI } = {}) {
  const u = consumabile3dDi(chiave)
  if (u) {
    return { figura: null, famiglia: 'pozioni', modulo: moduli.pozioni ? 'pozioni' : null, ripiego: null, consumabile: u.consumabile,
             crea: () => creaPezzo(u, { moduli }), look: { rarita: u.rarita, elemento: 'nessuno', materia: null, pregio: u.rarita === 'comune' ? 1 : 3 } }
  }
  const p = pezzo3dDi(chiave)
  if (!p) return null
  const f = p.figura ? FIGURE3D[p.figura] : null
  return {
    figura: p.figura, famiglia: f ? f.famiglia : null, modulo: p.figura && moduloDi(p.figura, moduli) ? f.famiglia : null, ripiego: p.id,
    crea: () => creaPezzo(p, { moduli }), look: lookDi(chiave),
  }
}

/** La veste del modulo `vesti` sull'eroe (`vesti(eroe, figura)`), o null se il modulo o la figura non c'è: si ripiega su armature.js. */
export function vestiFigura(eroe, figura, moduli = MODULI) {
  const m = moduli.vesti
  if (!m || typeof m.vesti !== 'function' || !FIGURE3D[figura] || FIGURE3D[figura].famiglia !== 'vesti' || rotte.has(`veste:${figura}`)) return null
  try {
    const togli = m.vesti(eroe, recordDi(figura))
    if (typeof togli === 'function') return togli
  } catch (e) { avvisa(figura, e) }
  rotte.add(`veste:${figura}`)
  return null
}

/** La collana del modulo `gioielli` al collo dell'eroe, senza alone (la catena allungata lo spargeva su tutto l'eroe); → `togli()` (con `.gruppo`), o null. */
export function indossaGioiello(eroe, p, moduli = MODULI) {
  const m = moduli.gioielli
  if (!p || !p.figura || !m || typeof m.indossa !== 'function' || rotte.has(p.figura)) return null
  try {
    const togli = m.indossa(eroe, recordDi(p.figura))
    if (typeof togli !== 'function') return null
    return togli
  } catch (e) { avvisa(p.figura, e); rotte.add(p.figura) }
  return null
}
