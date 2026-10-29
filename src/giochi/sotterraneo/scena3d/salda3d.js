// Saldare i pezzi fermi di un modello 3D dei prototipi (docs/sotterraneo/mostri-3d.md, «Quanto costa»): un mostro in codice è fatto di
// decine di mesh piccole (uno scheletro 155), e ognuna è una chiamata di disegno. Le mesh che non si muovono mai rispetto al loro perno,
// con lo stesso materiale, diventano una sola. Quali si muovono non lo dice nessuno: si chiede al modello, facendogli fare l'idle per
// un po' di secondi e l'attacco intero, e si guarda chi cambia (posizione, rotazione, scala, visibilità, forma). Il risultato vale per
// tutte le istanze dello stesso modello (la struttura è la stessa): si calcola una volta per id.
// Un perno che non si muove mai (come un osso dello scheletro fermo rispetto al busto) non separa niente: una mesh si salda col
// primo antenato che si muove (l'«ancora»), portandosi dietro le trasformazioni dei perni fermi di mezzo; uno scheletro passa da
// ~80 a ~45 chiamate (docs/sotterraneo/prestazioni-3d.md). Un perno nascosto o con un suo renderOrder fa da ancora.
// Dopo la saldatura, la pelle (`pelle`): quello che resta, anche quello che si muove, diventa una SkinnedMesh per materiale con le mesh
// stesse per ossa (docs/sotterraneo/prestazioni-3d.md, «Meno chiamate»).
import { Mesh, Matrix4, SkinnedMesh, Skeleton, BufferAttribute, Uint16BufferAttribute, Float32BufferAttribute, Vector2, Vector3, Vector4 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

const PROVE_IDLE = 64, PASSO_IDLE = 0.31, PROVE_ATTACCO = 12

function elenco(g) { const l = []; g.traverse(o => l.push(o)); return l }
function firma(o) {
  const g = o.isMesh && o.geometry, p = g && g.attributes.position
  return `${o.position.x},${o.position.y},${o.position.z},${o.quaternion.x},${o.quaternion.y},${o.quaternion.z},${o.quaternion.w},${o.scale.x},${o.scale.y},${o.scale.z},${o.visible}` +
    (g ? `|${g.uuid}|${p ? p.version : 0}|${o.material && o.material.uuid}` : '')
}
// per la pelle conta il resto: chi si accende e si spegne, chi cambia forma, materiale o genitore (muoversi va bene: lo fa l'osso)
function firmaPelle(o) {
  const g = o.isMesh && o.geometry, a = g && g.attributes
  return `${o.visible}|${o.parent && o.parent.uuid}` + (g ? `|${g.uuid}|${a.position ? a.position.version : 0}|${a.normal ? a.normal.version : 0}|${g.drawRange.start},${g.drawRange.count}|${o.material && o.material.uuid}` : '')
}
const colore = c => (c && c.isColor ? c.getHexString() : '')
// quello che di un materiale si anima (il respiro che pulsa, gli occhi che si accendono): chi cambia non si fonde coi colori
const firmaMateriale = m => `${colore(m.color)}|${colore(m.emissive)}|${m.emissiveIntensity}|${m.opacity}|${m.transparent}|${m.visible}|${m.map && m.map.uuid}|${m.depthWrite}|${m.side}`

/** Lo studio di un modello: chi `u` (`anima(t)`, `attacca(p)`; di difetto il modello) muove, accende o cambia. → { ferme (le coppie
 *  mesh-ancora di `salda`), instabili (gli indici di chi si accende, si spegne o cambia forma o materiale), vivi (gli indici della
 *  prima mesh di ogni materiale che si anima) }, tutto negli indici di traverse del modello non saldato. */
export function studia(g, u = g.userData, { prove = PROVE_IDLE, passo = PASSO_IDLE } = {}) {
  const ogg = elenco(g), prima = ogg.map(firma), primaP = ogg.map(firmaPelle), mosse = new Set(), instabili = new Set()
  const mats = new Map()   // materiale → indice della prima mesh che lo porta
  ogg.forEach((o, i) => { if (o.isMesh && o.material && !Array.isArray(o.material) && !mats.has(o.material)) mats.set(o.material, i) })
  const primaM = new Map([...mats.keys()].map(m => [m, firmaMateriale(m)])), vivi = new Set()
  const guarda = () => {
    ogg.forEach((o, i) => {
      if (!mosse.has(i) && firma(o) !== prima[i]) mosse.add(i)
      if (!instabili.has(i) && firmaPelle(o) !== primaP[i]) instabili.add(i)
    })
    for (const [m, i] of mats) if (!vivi.has(i) && firmaMateriale(m) !== primaM.get(m)) vivi.add(i)
  }
  for (let i = 0; i < prove; i++) { u.anima(i * passo); guarda() }
  if (u.attacca) for (let i = 0; i <= PROVE_ATTACCO; i++) { u.anima(1.7); u.attacca(i / PROVE_ATTACCO); guarda() }
  // l'attacco anche sopra i gesti dell'idle (una mano che si muove solo se attacca durante un gesto): un istante qualunque, un p qualunque
  if (u.attacca) for (let i = 0; i < prove; i++) { u.anima(i * passo + passo / 2); u.attacca(((i * 5) % (PROVE_ATTACCO + 1)) / PROVE_ATTACCO); guarda() }
  u.anima(0)
  const indice = new Map(ogg.map((o, i) => [o, i]))
  const ancora = o => { let a = o.parent; while (a !== g && !mosse.has(indice.get(a)) && a.visible && !a.renderOrder) a = a.parent; return indice.get(a) }
  const ferme = ogg.map((o, i) => i).filter(i => {
    const o = ogg[i]
    return !mosse.has(i) && o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && !o.isPoints && !o.isLine && !o.isSprite && o.children.length === 0 &&
      !Array.isArray(o.material) && !o.morphTargetInfluences && o.visible && o.geometry && o.geometry.attributes.position
  }).map(i => [i, ancora(ogg[i])])
  return { ferme, instabili, vivi }
}

/** Le mesh che si possono saldare (ferme, foglie, un materiale solo), come coppie di indici nell'ordine di traverse: la mesh e la
 *  sua ancora. `u`: chi le muove (`anima(t)`, `attacca(p)`), di difetto il modello; l'eroe passa le sue pose, e più prove. */
export const ferme = (g, u, opz) => studia(g, u, opz).ferme

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

/* ── la pelle ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   Le mesh che non si accendono e non si spengono, non cambiano forma, materiale o genitore diventano una SkinnedMesh per materiale:
   le ossa sono le mesh stesse (restano dove sono, chi le anima le muove come prima, ma non si disegnano più: `layers` vuoti), ogni
   vertice pesa 1 sulla sua. Con `fondi` anche i materiali che differiscono solo in quello che un vertice può portare diventano uno
   (`userData.fusa`): il colore nei vertici; per gli Standard anche ruvidezza, metallo ed emissivo (attributi `aMat`, `aEmis`, letti
   dallo shader al posto delle uniform). Chi lampeggia o tinge un fuso passa da `copiaMateriale`, `tingiFusa`, `lampoFuso`. Restano a
   sé i trasparenti non additivi (l'ordine fra i pezzi conta), i materiali con lo shader riscritto, quelli che si animano (`vivi`: tenuti
   per istanza, non fusi), e chi ha trame non si fonde. */
const TRAME = ['map', 'normalMap', 'bumpMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap', 'alphaMap', 'lightMap', 'displacementMap', 'specularMap']
const FONDIBILI = new Set(['MeshStandardMaterial', 'MeshLambertMaterial', 'MeshPhongMaterial', 'MeshBasicMaterial'])
const conTrame = m => TRAME.some(k => m[k])
const riscritto = m => m.isShaderMaterial || Object.prototype.hasOwnProperty.call(m, 'onBeforeCompile')
const fondibile = m => FONDIBILI.has(m.type) && !conTrame(m) && !riscritto(m) && !m.transparent && !m.envMap
const largo = m => m.type === 'MeshStandardMaterial'
// tutto del materiale tranne quello che va nei vertici: il colore sempre, per gli Standard anche ruvidezza, metallo, emissivo
const chiaveFusa = m => [m.type, ...(largo(m) ? [] : [colore(m.emissive), m.emissiveIntensity, m.shininess, colore(m.specular)]), m.side,
  m.flatShading, m.opacity, m.depthWrite, m.depthTest, m.alphaTest, m.fog, m.wireframe, m.toneMapped, m.blending, m.polygonOffset,
  m.polygonOffsetFactor, m.polygonOffsetUnits, m.colorWrite, m.dithering, m.visible].join('|')
const disegnabile = o => o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && !o.morphTargetInfluences && o.geometry && o.geometry.attributes.position &&
  o.material && !Array.isArray(o.material) && !o.userData.osso

/** È un osso della pelle (non si disegna più: lo disegna la SkinnedMesh)? */
export const osso = o => !!(o.userData && o.userData.osso)

// la geometria di `o` nello spazio di `g`, con gli attributi che il materiale legge, l'osso, e quello che va nei vertici se si fonde
function geometriaPelle(o, inv, nOsso, fusa) {
  const c = o.geometry.clone()
  for (const n of Object.keys(c.morphAttributes || {})) delete c.morphAttributes[n]
  const m = o.material, tieni = new Set(['position', 'normal'])
  if (conTrame(m)) { tieni.add('uv'); tieni.add('uv1'); tieni.add('tangent') }
  if (m.vertexColors) tieni.add('color')
  for (const a of Object.keys(c.attributes)) if (!tieni.has(a)) c.deleteAttribute(a)
  c.applyMatrix4(_m.multiplyMatrices(inv, o.matrixWorld))
  const n = c.attributes.position.count
  if (fusa) {
    const vecchio = m.vertexColors && c.attributes.color, col = new Float32Array(n * 3), cc = m.color
    for (let i = 0; i < n; i++) {
      const k = vecchio ? [vecchio.getX(i), vecchio.getY(i), vecchio.getZ(i)] : [1, 1, 1]
      col[i * 3] = cc.r * k[0]; col[i * 3 + 1] = cc.g * k[1]; col[i * 3 + 2] = cc.b * k[2]
    }
    c.setAttribute('color', new BufferAttribute(col, 3))
    if (largo(m)) {
      const ma = new Float32Array(n * 3), em = new Float32Array(n * 3), e = m.emissive
      for (let i = 0; i < n; i++) { ma[i * 3] = m.roughness; ma[i * 3 + 1] = m.metalness; ma[i * 3 + 2] = m.emissiveIntensity; em[i * 3] = e.r; em[i * 3 + 1] = e.g; em[i * 3 + 2] = e.b }
      c.setAttribute('aMat', new BufferAttribute(ma, 3)); c.setAttribute('aEmis', new BufferAttribute(em, 3))
    }
  }
  const ii = new Uint16Array(n * 4), pp = new Float32Array(n * 4)
  for (let i = 0; i < n; i++) { ii[i * 4] = nOsso; pp[i * 4] = 1 }
  c.setAttribute('skinIndex', new Uint16BufferAttribute(ii, 4)); c.setAttribute('skinWeight', new Float32BufferAttribute(pp, 4))
  return c
}
// un indice per chi non ce l'ha, se si unisce con chi ce l'ha (mergeGeometries li vuole tutti o nessuno)
function indicizza(c) { const n = c.attributes.position.count, a = n > 65535 ? new Uint32Array(n) : new Uint16Array(n); for (let i = 0; i < n; i++) a[i] = i; c.setIndex(new BufferAttribute(a, 1)) }

// Lo shader dei fusi: la tinta (il colore del vertice mescolato a `uTinta`, come `color.lerp` sui materiali di sempre) e, per gli
// Standard, ruvidezza, metallo ed emissivo dai vertici, col lampo (`uLampo`: verso che colore e quanto; `uLampoK`: l'intensità
// diventa intensità × x + y, come `emissive.lerp` ed `emissiveIntensity = …` sui materiali di sempre). Una chiave per tipo: un
// programma per tutti i modelli. Chi accende l'emissivo dei materiali senza sapere della pelle (le mosse dei prototipi) trova
// `materiale.lampo(colore, quanto, x, y)`.
const UNIFORMI = new WeakMap()
// il contorno caldo che stacca eroe e mostri dal pavimento (lo scontro delle discese lo accende: indice.js), uno per tutti i fusi; i Basic
// non hanno luce né normali e restano senza
export const CONTORNO_PELLE = { value: 0 }
const CONTORNO = 'outgoingLight += vec3(1.0, 0.82, 0.6) * pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.0) * uContorno * (0.35 + diffuseColor.rgb);\n\t#include <opaque_fragment>'
const TINTA = '#include <color_fragment>\n\tdiffuseColor.rgb = mix(diffuseColor.rgb, uTinta.rgb, uTinta.a);'
function preparaFusa(c, tipo) {
  const u = { uTinta: { value: new Vector4(1, 1, 1, 0) }, uLampo: { value: new Vector4(0, 0, 0, 0) }, uLampoK: { value: new Vector2(1, 0) } }
  UNIFORMI.set(c, u)
  c.userData.fusa = tipo
  c.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u)
    let f = 'uniform vec4 uTinta;\n' + sh.fragmentShader.replace('#include <color_fragment>', TINTA)
    if (!c.isMeshBasicMaterial) { sh.uniforms.uContorno = CONTORNO_PELLE; f = 'uniform float uContorno;\n' + f.replace('#include <opaque_fragment>', CONTORNO) }
    if (tipo === 'larga') {
      sh.vertexShader = 'attribute vec3 aMat;\nattribute vec3 aEmis;\nvarying vec3 vMat;\nvarying vec3 vEmis;\n' +
        sh.vertexShader.replace('#include <color_vertex>', '#include <color_vertex>\n\tvMat = aMat;\n\tvEmis = aEmis;')
      f = 'uniform vec4 uLampo;\nuniform vec2 uLampoK;\nvarying vec3 vMat;\nvarying vec3 vEmis;\n' + f
        .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = vMat.x;')
        .replace('#include <metalnessmap_fragment>', 'float metalnessFactor = vMat.y;')
        .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance = mix(vEmis, uLampo.rgb, uLampo.a) * (vMat.z * uLampoK.x + uLampoK.y);')
    }
    sh.fragmentShader = f
  }
  c.customProgramCacheKey = () => `pelle-${tipo}-c`
  if (tipo === 'larga') c.lampo = (col, quanto, x = 1, y = 0) => lampoFuso(c, col, quanto, x, y)
  return c
}
/** Il materiale è un fuso della pelle? 'larga' (Standard: tutto nei vertici) o 'colore' (solo il colore). */
export const tipoFuso = m => (m && m.userData && m.userData.fusa) || null
/** La copia di un materiale (per il lampo, la tinta, lo svanire di un'istanza): un fuso si porta dietro il suo shader. */
export function copiaMateriale(m) { const c = m.clone(); return tipoFuso(m) ? preparaFusa(c, tipoFuso(m)) : c }
/** La tinta di un fuso verso `col` per `forza` (0: nessuna), al posto di `color.lerp`. */
export function tingiFusa(m, col, forza) { const u = UNIFORMI.get(m); if (u) { if (col && forza > 0) u.uTinta.value.set(col.r, col.g, col.b, Math.min(1, forza)); else u.uTinta.value.w = 0 } }
/** Il lampo di un fuso largo: l'emissivo di ogni pezzo verso `col` per `quanto`, e la sua intensità × `x` + `y`. Falso se non è un
 *  fuso largo (allora si cambiano `emissive` ed `emissiveIntensity` come sempre). */
export function lampoFuso(m, col, quanto, x = 1, y = 0) {
  const u = tipoFuso(m) === 'larga' && UNIFORMI.get(m)
  if (!u) return false
  u.uLampo.value.set(col ? col.r : 0, col ? col.g : 0, col ? col.b : 0, col ? quanto : 0); u.uLampoK.value.set(x, y)
  return true
}
/** Il lampo di adesso di un fuso (`da`) sulla sua copia (`a`). */
export function copiaLampo(da, a) { const u = UNIFORMI.get(da), v = UNIFORMI.get(a); if (u && v) { v.uLampo.value.copy(u.uLampo.value); v.uLampoK.value.copy(u.uLampoK.value) } }

// un materiale fuso per chiave e per modello: chi anima i materiali di un'istanza (le mosse accendono l'emissivo) non tocca le altre
function materialeFuso(m, fusi) {
  const k = chiaveFusa(m)
  if (!fusi.has(k)) {
    const f = m.clone(); f.color.setRGB(1, 1, 1); f.vertexColors = true; f.name = 'fuso'; f.userData = {}
    if (largo(m)) { f.emissive.setRGB(0, 0, 0); f.emissiveIntensity = 1; f.roughness = 1; f.metalness = 0 }   // li leggono i vertici
    fusi.set(k, preparaFusa(f, largo(m) ? 'larga' : 'colore'))
  }
  return fusi.get(k)
}

/**
 * La pelle di `g` (dopo `salda`): `instabili`, `vivi` sono gli oggetti e i materiali di `studia` (non gli indici: la saldatura li ha
 * spostati, vedi `saldaTutto`). `ombre` come `salda`; `fondi` i colori nei vertici. Torna quante chiamate ha tolto.
 */
export function pelle(g, { instabili = new Set(), vivi = new Set(), ombre = false, fondi = true } = {}) {
  g.updateMatrixWorld(true)
  const inv = new Matrix4().copy(g.matrixWorld).invert()
  const spento = o => { for (let x = o; x && x !== g.parent; x = x.parent) if (!x.visible || instabili.has(x)) return true; return false }
  const gruppi = new Map()
  g.traverse(o => {
    if (!disegnabile(o) || spento(o) || (o.layers.mask & 1) === 0) return
    // un osso schiacciato a zero adesso (una foglia che cade e rinasce) non ha l'inversa: resta a sé
    if (Math.abs(_m.multiplyMatrices(inv, o.matrixWorld).determinant()) < 1e-12) return
    const m = o.material
    if (riscritto(m)) return
    if (m.transparent && !(m.blending === 2 && !m.depthWrite)) return   // gli additivi sì: non conta l'ordine
    const fusa = fondi && fondibile(m) && !vivi.has(m)
    const s = `${o.geometry.index ? 'i' : 'n'}`
    // l'ombra fatta no: l'eroe e i mostri non ne fanno (eroe3d.js, mostro3d.js la spengono dopo); quella presa sì
    const k = (fusa ? `F|${chiaveFusa(m)}` : `M|${m.uuid}`) + `|${o.renderOrder}` + (ombre ? `|${o.receiveShadow}` : '')
    if (!gruppi.has(k)) gruppi.set(k, { fusa, lista: [], s: new Set() })
    const q = gruppi.get(k); q.lista.push(o); q.s.add(s)
  })
  const ossa = [], pelli = [], fusi = new Map()
  let tolte = 0
  for (const { fusa, lista } of gruppi.values()) {
    if (lista.length < 2) continue
    const geo = lista.map(o => { const c = geometriaPelle(o, inv, ossa.length, fusa); ossa.push(o); return c })
    // attributi uguali per tutti: quelli che non tutti hanno se ne vanno (uv senza trama, la tangente), l'indice a chi manca
    // con le facce piatte le normali non servono (lo shader le fa da sé): chi non le ha si unisce lo stesso
    const piatte = lista[0].material.flatShading
    const comuni = Object.keys(geo[0].attributes).filter(a => !(piatte && a === 'normal') && geo.every(c => c.attributes[a] && c.attributes[a].itemSize === geo[0].attributes[a].itemSize))
    if (!piatte && !comuni.includes('normal')) { for (const c of geo) c.dispose(); ossa.length -= lista.length; continue }
    for (const c of geo) for (const a of Object.keys(c.attributes)) if (!comuni.includes(a)) c.deleteAttribute(a)
    if (geo.some(c => c.index)) for (const c of geo) if (!c.index) indicizza(c)
    const unita = mergeGeometries(geo, false)
    for (const c of geo) c.dispose()
    if (!unita) { ossa.length -= lista.length; continue }
    const ms = new SkinnedMesh(unita, fusa ? materialeFuso(lista[0].material, fusi) : lista[0].material)
    ms.renderOrder = lista[0].renderOrder; ms.frustumCulled = false; ms.name = 'pelle'
    if (ombre) { ms.castShadow = lista.some(o => o.castShadow); ms.receiveShadow = lista[0].receiveShadow }
    ms.userData.saldata = true
    pelli.push(ms)
    tolte += lista.length - 1
  }
  if (!pelli.length) return 0
  const scheletro = new Skeleton(ossa)              // le inverse dalla posa di adesso
  const legame = g.matrixWorld.clone()
  for (const ms of pelli) { g.add(ms); ms.bind(scheletro, legame) }
  for (const o of ossa) { o.layers.disableAll(); o.userData.osso = true }
  g.userData.scheletro = scheletro
  return tolte
}

/** Saldatura e pelle insieme, con lo studio di `studia` (fatto sul modello non saldato: i suoi indici valgono per ogni istanza). */
export function saldaTutto(g, studio, { ombre = false, pelle: conPelle = true, fondi = true } = {}) {
  const ogg = elenco(g)
  const instabili = new Set([...studio.instabili].map(i => ogg[i]).filter(Boolean))
  const vivi = new Set([...studio.vivi].map(i => ogg[i] && ogg[i].material).filter(Boolean))
  let tolte = salda(g, studio.ferme, { ombre })
  if (conPelle) tolte += pelle(g, { instabili, vivi, ombre, fondi })
  return tolte
}

/** Le mesh che si disegnano davvero (né spente, né ossa della pelle). */
export function disegnate(g, fn) {
  g.traverseVisible(o => { if ((o.isMesh || o.isPoints || o.isLine || o.isSprite) && (o.layers.mask & 1)) fn(o) })
}

const _v = new Vector3()
/** Ogni vertice disegnato di `g` nel mondo, pelle compresa (per i test: saldare non deve spostare niente). */
export function vertici(g, fn) {
  g.updateMatrixWorld(true)
  if (g.userData.scheletro) g.userData.scheletro.update()
  disegnate(g, o => {
    if (!o.isMesh) return
    const p = o.geometry.attributes.position
    for (let i = 0; i < p.count; i++) {
      if (o.isSkinnedMesh) o.getVertexPosition(i, _v); else _v.fromBufferAttribute(p, i)
      fn(_v.applyMatrix4(o.matrixWorld))
    }
  })
}
