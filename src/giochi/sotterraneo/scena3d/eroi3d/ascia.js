// Copia di poc/eroi-3d/ e poc/armi-3d/ (i prototipi restano accanto, autonomi): i quattro eroi e le armi in 3D, in prova (eroe3d.js).
// L'ascia del nano (e del cavaliere, se la vuole): stesso contratto di `creaArma` di armi.js.
// Origine nel pugno, il manico lungo +y (~0.7), la lama di profilo nel piano x-y con il filo verso +x (di fronte si vede
// la faccia larga). Un solo grado, 'medio'. Autonoma: solo three.
import * as THREE from 'three'

const cache = new Map()
const M = (colore, o = {}) => {
  const k = colore + JSON.stringify(o)
  if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial({ color: colore, roughness: 0.85, metalness: 0, flatShading: true, ...o }))
  return cache.get(k)
}
const pezzo = (g, geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o }

/** Un profilo piatto (punti x,y) estruso di `spessore` in z, centrato. */
function sagoma (punti, spessore) {
  const s = new THREE.Shape(); punti.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y))
  const g = new THREE.ExtrudeGeometry(s, { depth: spessore, bevelEnabled: false }); g.translate(0, 0, -spessore / 2); return g
}

export function creaAscia (grado = 'medio') {
  const g = new THREE.Group()
  const legno = M(0x7a4a26), legnoC = M(0x9a6a36), cuoio = M(0x4f2f1c)
  const ferro = M(0x8a9098, { metalness: 0.4, roughness: 0.4 }), ferroS = M(0x5d6166, { metalness: 0.4, roughness: 0.45 })
  const filo = M(0xf2f7fb, { metalness: 0.5, roughness: 0.3 }), rame = M(0xc27a3e, { metalness: 0.4, roughness: 0.45 })
  // il manico, leggermente più grosso in basso, con la presa di cuoio
  pezzo(g, new THREE.CylinderGeometry(0.024, 0.03, 0.78, 7), legno, 0, 0.26, 0)
  for (const y of [-0.08, -0.03, 0.02, 0.07]) pezzo(g, new THREE.CylinderGeometry(0.034, 0.034, 0.02, 7), cuoio, 0, y, 0)
  pezzo(g, new THREE.SphereGeometry(0.045, 7, 5), rame, 0, -0.14, 0).scale.set(1, 0.8, 1)                 // il pomo di rame
  // la testa: una mezzaluna larga con la barba (la punta bassa) e il dorso a martello
  const lama = sagoma([[0.02, 0.27], [0.1, 0.24], [0.2, 0.14], [0.235, 0.2], [0.245, 0.36], [0.235, 0.52], [0.2, 0.58], [0.1, 0.5], [0.02, 0.46]], 0.045)
  pezzo(g, lama, ferro)
  const bordo = sagoma([[0.215, 0.16], [0.25, 0.2], [0.26, 0.36], [0.25, 0.52], [0.215, 0.56], [0.225, 0.36]], 0.03)
  pezzo(g, bordo, filo)                                                                                    // il filo
  pezzo(g, new THREE.BoxGeometry(0.1, 0.24, 0.07), ferroS, -0.03, 0.36, 0)                                // il collare che regge la testa
  pezzo(g, new THREE.BoxGeometry(0.1, 0.12, 0.08), rame, -0.1, 0.36, 0)                                    // il dorso a martello
  const punta = pezzo(g, new THREE.ConeGeometry(0.045, 0.13, 5), ferro, -0.19, 0.36, 0); punta.rotation.z = Math.PI / 2
  for (const y of [0.3, 0.42]) pezzo(g, new THREE.SphereGeometry(0.014, 5, 4), rame, 0.0, y, 0.045)     // due borchie
  pezzo(g, new THREE.TorusGeometry(0.03, 0.01, 4, 8), rame, 0, 0.7, 0)                                     // l'anello di cuoio in cima
  let tri = 0
  g.traverse(o => { if (o.isMesh) tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 })
  g.userData = { famiglia: 'ascia', grado, triangoli: Math.round(tri), anima: null }
  return g
}

/** Come `equipaggia` di armi.js, ma per l'ascia: la monta nel pugno di `bracci[1]` (o `[0]`). Torna `togli()`. */
export function montaAscia (eroe, lato = 1) {
  const p = new THREE.Group(); p.position.set(0, -0.29, 0); p.rotation.set(0.35, 0, -0.55)
  p.add(creaAscia('medio')); eroe.userData.bracci[lato].add(p)
  eroe.userData.perniArmi = eroe.userData.perniArmi || {}
  eroe.userData.perniArmi[lato ? 'destra' : 'sinistra'] = p
  return () => p.parent && p.parent.remove(p)
}
