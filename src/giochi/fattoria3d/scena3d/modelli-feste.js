// I pezzi delle feste: le zucche di Halloween (si comprano solo a Halloween, e comprate restano). Origine al centro dell'impronta, davanti
// verso +z come tutti i modelli; poche mesh (peso: docs/fattoria3d/scena.md «Qualità e peso»). Vedi docs/fattoria3d/stagioni.md.
import * as THREE from 'three'
import { mat } from './modelli.js'
import { fondiPerMateriale } from './fondi.js'
import { memoModello } from './cache-modelli.js'

function pronto (m) { m.castShadow = true; m.receiveShadow = true; return m }

/** Una zucca di raggio r in (x, z): spicchio schiacciato, picciolo e foglia; se `intagliata` ha occhi e bocca accesi sul davanti (+z). */
function zucca (g, r, x, z, intagliata, tinta = 0xe8741c) {
  const corpo = pronto(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 7), mat(tinta)))
  corpo.scale.set(1.12, 0.84, 1.12); corpo.position.set(x, r * 0.84, z); g.add(corpo)
  const picciolo = pronto(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.11, r * 0.16, r * 0.34, 5), mat(0x4a7a2a)))
  picciolo.position.set(x, r * 1.66, z); picciolo.rotation.z = 0.2; g.add(picciolo)
  if (!intagliata) return
  const luce = new THREE.MeshBasicMaterial({ color: 0xffd23a })
  for (const s of [-1, 1]) {
    const occhio = new THREE.Mesh(new THREE.ConeGeometry(r * 0.17, r * 0.26, 3), luce)       // un triangolo che guarda in su
    occhio.position.set(x + s * r * 0.34, r * 0.98, z + r * 1.0); occhio.rotation.x = Math.PI / 2; g.add(occhio)
  }
  const bocca = new THREE.Mesh(new THREE.BoxGeometry(r * 0.78, r * 0.2, r * 0.1), luce)
  bocca.position.set(x, r * 0.5, z + r * 1.05); g.add(bocca)
}

function costruisciZucca () {
  const g = new THREE.Group()
  zucca(g, 0.38, 0, 0, true)
  g.userData.altezza = 1.0
  fondiPerMateriale(g)
  return g
}
function costruisciZucche () {
  const g = new THREE.Group()
  zucca(g, 0.4, -0.45, 0.02, true)
  zucca(g, 0.3, 0.42, -0.04, false, 0xd8641a)
  zucca(g, 0.18, 0.12, 0.3, false, 0xf08a2c)
  g.userData.altezza = 1.0
  fondiPerMateriale(g)
  return g
}
export const creaZucca = memoModello('zucca', costruisciZucca)
export const creaZucche = memoModello('zucche', costruisciZucche)
