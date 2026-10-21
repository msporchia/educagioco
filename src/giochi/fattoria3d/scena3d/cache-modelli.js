// Il costo di un modello si paga una volta per tipo, non per istanza: un `crea…()` costruisce (e fonde) il modello la prima volta, poi
// consegna un clone che CONDIVIDE geometrie e materiali con l'originale. N campi, N aiuole, N recinti = N gruppi di mesh ma una sola
// geometria in GPU, e niente fusione dalla seconda in poi. Vedi docs/fattoria3d/scena.md, «Qualità e peso».
//
// Le regole per chi scrive un modello che passa di qui:
//  - `userData` può tenere numeri, vettori, oggetti semplici, liste, riferimenti a nodi DEL MODELLO e funzioni; i riferimenti a nodi
//    vengono ricollegati al clone (`gira`, `volo`, `gambe`…), i vettori ricopiati.
//  - una funzione NON deve catturare nodi del modello (un clone animerebbe l'originale e basta): `anima` è un metodo che legge i nodi
//    da `this` (`userData.anima(dt)` la chiama con `this === userData`), non una freccia sulle variabili del costruttore.
//  - geometrie e materiali sono condivisi: chi vuole cambiarne uno per istanza lo clona (come `fantasma`), non lo tocca.
//  - ciò che deve essere diverso a ogni istanza (un numero a caso) si rifà nel ritocco `dopo`.
import * as THREE from 'three'
import { FONDI } from './fondi.js'

/** L'interruttore per i confronti prima/dopo (misure, catalogo): spento, ogni `crea…()` costruisce da capo come una volta. */
export const CACHE_MODELLI = { acceso: true }

const BASI = new Map()                 // chiave → il modello originale, mai consegnato a nessuno
export const statoCache = () => ({ basi: BASI.size })
export function svuotaCache () { BASI.clear() }

const VUOTO = Object.freeze({})
const semplice = v => v && Object.getPrototypeOf(v) === Object.prototype

/** Copia un valore di `userData` ricollegando i nodi al clone: `mappa` va dai nodi dell'originale a quelli del clone. Geometrie, materiali
    e trame restano gli stessi (si condividono); ciò che ha un `clone()` (vettori, colori) si ricopia. */
function copiaDato (v, mappa, giro = 0) {
  if (v === null || typeof v !== 'object' || giro > 5) return v
  if (v.isObject3D) return mappa.get(v) ?? v
  if (v.isMaterial || v.isBufferGeometry || v.isTexture) return v
  if (Array.isArray(v)) return v.map(x => copiaDato(x, mappa, giro + 1))
  if (semplice(v)) { const o = {}; for (const k in v) o[k] = copiaDato(v[k], mappa, giro + 1); return o }
  return typeof v.clone === 'function' ? v.clone() : v
}

function nodoNuovo (s) {
  let c
  if (s.isMesh && !s.isInstancedMesh && !s.isSkinnedMesh) c = new THREE.Mesh(s.geometry, s.material)
  else if (s.isMesh || s.isLight || s.isPoints || s.isLine || s.isSprite) { const u = s.userData; s.userData = VUOTO; c = s.clone(false); s.userData = u }   // i rari: la copia di three
  else c = s.type === 'Group' ? new THREE.Group() : new THREE.Object3D()
  c.name = s.name; c.visible = s.visible; c.matrixAutoUpdate = s.matrixAutoUpdate
  c.position.copy(s.position); c.rotation.copy(s.rotation); c.scale.copy(s.scale)
  c.renderOrder = s.renderOrder; c.frustumCulled = s.frustumCulled
  if (s.isMesh) { c.castShadow = s.castShadow; c.receiveShadow = s.receiveShadow }
  c.layers.mask = s.layers.mask
  return c
}

/** Un clone dell'albero di `base` che condivide geometrie e materiali (`Object3D.clone` non va bene: copia `userData` passando da JSON,
    e coi riferimenti a nodi sarebbe una serializzazione di mezzo modello). */
export function clonaModello (base) {
  const mappa = new Map()
  const rifai = (s) => { const c = nodoNuovo(s); mappa.set(s, c); for (const f of s.children) c.add(rifai(f)); return c }
  const radice = rifai(base)
  for (const [s, c] of mappa) {
    const u = s.userData; let n = 0
    for (const k in u) { n++; break }
    if (n) { const o = {}; for (const k in u) o[k] = copiaDato(u[k], mappa); c.userData = o }
  }
  return radice
}

/** Dà a un costruttore la cache: `memoModello('mulino', costruisciMulino)` torna un `crea…()` che costruisce la prima volta e poi clona.
    `chiave(...argomenti)` distingue le varianti (il colore di un mantello, l'aspetto); `dopo(clone, ...argomenti)` rifà ciò che deve
    essere diverso a ogni istanza. */
export function memoModello (nome, costruisci, { chiave = null, dopo = null } = {}) {
  return (...argomenti) => {
    if (!CACHE_MODELLI.acceso) { const g = costruisci(...argomenti); if (dopo) dopo(g, ...argomenti); return g }
    const k = nome + (chiave ? ':' + chiave(...argomenti) : '') + (FONDI.acceso ? '' : '!')
    let base = BASI.get(k)
    if (!base) { base = costruisci(...argomenti); BASI.set(k, base) }
    const g = clonaModello(base)
    if (dopo) dopo(g, ...argomenti)
    return g
  }
}
